import { and, count, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  toolExports,
  youtubeCollectionUnits,
  youtubeDuplicateGroupItems,
  youtubeDuplicateGroups,
  youtubeAuditLogs,
  toolSearchBatches,
  toolTasks,
  youtubeResultMatches,
  youtubeResults,
  type YoutubeCollectionUnitStatus,
  type YoutubeDuplicateGroupStatus,
  type ToolSearchBatchStatus,
  type ToolTaskStatus,
  type YoutubeDbResultStatus,
} from "@/db/schema";
import { runApifyYoutubeSearch } from "./apifyYoutubeAdapter";
import { escapeCsvValue } from "./csvExport";
import { dedupeKeywords } from "./keywordUtils";
import {
  canMutateYoutubeTask,
  canReviewYoutubeDuplicates,
  canViewYoutubeTask,
  isYoutubeAdmin,
  isYoutubeTaskOwner,
  YoutubePermissionError,
  type YoutubeActor,
} from "./youtubeAuth";
import { extractYouTubeVideoId, normalizeYouTubeUrl } from "./youtubeUrlUtils";
import type { YoutubeKeyword } from "./youtubeTypes";

const TOOL_TYPE = "youtube_speech_link_collector";
const TASK_STATUSES: ToolTaskStatus[] = ["Draft", "Running", "Paused", "Reviewing", "Completed", "Archived", "Deleted"];
const ACTIVE_TASK_STATUSES: ToolTaskStatus[] = ["Draft", "Running", "Paused", "Reviewing", "Completed"];
const RESULT_STATUSES: YoutubeDbResultStatus[] = ["Pending", "Useful", "Not Useful", "Processed"];
const EDIT_LOCK_MINUTES = 10;
const UNIT_RUN_LOCK_MINUTES = 30;

export type YoutubeTaskCreateInput = {
  name?: string;
  language: string;
  domain: string;
  searchTargets: string[];
  targetUniqueResults?: number | null;
  publishedWithinMonths?: number | null;
  publishedDateRangeLabel?: string | null;
  units?: YoutubeCollectionUnitInput[];
  notes?: string | null;
  createdBy?: string | null;
};

export type YoutubeBatchCreateInput = {
  batchId?: string;
  batchName?: string | null;
  keywords: YoutubeKeyword[];
  totalTargetResults?: number;
  publishedWithinMonths?: number | null;
  publishedDateRangeLabel?: string | null;
};

export type YoutubeCollectionUnitInput = {
  id?: string;
  unitIndex?: number;
  language: string;
  domain: string;
  searchTarget: string;
  targetResults?: number | null;
  targetHours?: number | null;
  status?: YoutubeCollectionUnitStatus;
  selected?: boolean;
  keywordCount?: number;
  selectedKeywordCount?: number;
};

export type YoutubeTaskListFilters = {
  status?: string;
  language?: string;
  domain?: string;
  q?: string;
  limit?: number;
  offset?: number;
  ownerId?: string;
  includeDeleted?: boolean;
};

export type YoutubeResultFilters = {
  status?: string;
  q?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
  preferredVideoQuality?: string;
};

type YoutubeDbResult = typeof youtubeResults.$inferSelect;
type YoutubeTask = typeof toolTasks.$inferSelect;
type YoutubeCollectionUnit = typeof youtubeCollectionUnits.$inferSelect;
type YoutubeDbResultWithClassifications = YoutubeDbResult & {
  matchedUnits: string[];
  matchedLanguages: string[];
  matchedDomains: string[];
  matchedSearchTargets: string[];
  matchedPublishedDateRanges: string[];
  matchedKeywordSources: string[];
  primaryUnitId: string;
  primaryUnitLabel: string;
  primaryLanguage: string;
  primaryDomain: string;
  primarySearchTarget: string;
  primaryUnitSetBy: "system" | "user";
  primaryUnitReason: string;
  matchedSourcesCount: number;
};

type MatchSourceMetadata = {
  matchId: string;
  unitId: string;
  unitLabel: string;
  language: string;
  domain: string;
  searchTarget: string;
  groupKey: string;
  keyword: string;
  keywordSource: string;
  batchId: string;
  detectedAt: Date;
  publishedDateRangeLabel?: string;
};

function makeSourceUnitLabel(source: { unitLabel?: string; language?: string; domain?: string; searchTarget?: string }) {
  const explicit = cleanText(source.unitLabel);
  if (explicit) return explicit;
  const parts = [source.language, source.domain, source.searchTarget].map(cleanText).filter(Boolean);
  return parts.length ? parts.join(" / ") : "";
}

function makeSourceUnitId(source: { unitId?: string; groupKey?: string; unitLabel?: string; language?: string; domain?: string; searchTarget?: string }) {
  const explicit = cleanText(source.unitId) || cleanText(source.groupKey);
  if (explicit) return explicit;
  if (source.language && source.domain && source.searchTarget) {
    return `${source.language}__${source.domain}__${source.searchTarget}`;
  }
  return cleanText(source.unitLabel);
}

function now() {
  return new Date();
}

function minutesFromNow(minutes: number) {
  const date = now();
  date.setMinutes(date.getMinutes() + minutes);
  return date;
}

function publicTaskSnapshot(task: Partial<YoutubeTask> | null | undefined) {
  if (!task) return null;
  return {
    id: task.id,
    status: task.status,
    ownerId: task.ownerId,
    ownerEmail: task.ownerEmail,
    visibility: task.visibility,
    deletedAt: task.deletedAt,
    editingBy: task.editingBy,
    editingByEmail: task.editingByEmail,
    editingExpiresAt: task.editingExpiresAt,
  };
}

async function writeYoutubeAuditLog(input: {
  taskId?: string | null;
  resultId?: string | null;
  unitId?: string | null;
  action: string;
  actor?: YoutubeActor;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}) {
  await db.insert(youtubeAuditLogs).values({
    taskId: input.taskId || null,
    resultId: input.resultId || null,
    unitId: input.unitId || null,
    action: input.action,
    actorId: input.actor?.id || null,
    actorEmail: input.actor?.email || null,
    before: input.before || null,
    after: input.after || null,
  });
}

function assertTaskViewable(task: YoutubeTask, actor?: YoutubeActor) {
  if (!actor || canViewYoutubeTask(task, actor)) return;
  throw new YoutubePermissionError("You do not have permission to view this task.");
}

function assertTaskMutable(task: YoutubeTask, actor?: YoutubeActor) {
  if (!actor || canMutateYoutubeTask(task, actor)) return;
  throw new YoutubePermissionError("You do not have permission to modify this task.");
}

function assertTaskNotCompleted(task: YoutubeTask) {
  if (task.status === "Completed") throw new Error("Reopen this task to continue editing or running units.");
}

function assertEditLock(task: YoutubeTask, actor?: YoutubeActor) {
  if (!actor || isYoutubeAdmin(actor)) return;
  if (!task.editingBy || !task.editingExpiresAt || task.editingExpiresAt <= now()) return;
  if (task.editingBy === actor.id) return;
  throw new Error(`This task is being edited by ${task.editingByEmail || "another user"}.`);
}

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function cleanSearchTargets(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input.map((item) => cleanText(item)).filter(Boolean);
}

function taskNameFor(input: YoutubeTaskCreateInput) {
  const targets = input.searchTargets.join(", ");
  return cleanText(input.name) || `${input.language} / ${input.domain} / ${targets} Collection`;
}

function parsePositiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.ceil(parsed);
}

function mergeStrings(current: string[] | null, next: string) {
  return Array.from(new Set([...(Array.isArray(current) ? current : []), next].filter(Boolean)));
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function parseNullableInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : null;
}

function parseNullableNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function unitLabel(unit?: Pick<YoutubeCollectionUnit, "unitIndex" | "language" | "domain" | "searchTarget"> | null) {
  if (!unit) return "";
  return `Unit ${(unit.unitIndex || 0) + 1} · ${unit.language} / ${unit.domain} / ${unit.searchTarget}`;
}

function unitGroupKey(unit: Pick<YoutubeCollectionUnit, "language" | "domain" | "searchTarget">) {
  return `${unit.language}__${unit.domain}__${unit.searchTarget}`;
}

function normalizeUnitInput(input: YoutubeCollectionUnitInput, index: number) {
  const language = cleanText(input.language);
  const domain = cleanText(input.domain);
  const searchTarget = cleanText(input.searchTarget);
  if (!language || !domain || !searchTarget) return null;
  return {
    unitIndex: Number.isFinite(Number(input.unitIndex)) ? Number(input.unitIndex) : index,
    language,
    domain,
    searchTarget,
    targetResults: parseNullableInteger(input.targetResults),
    targetHours: parseNullableNumber(input.targetHours)?.toFixed(2) ?? null,
    status: (input.status || "Pending") as YoutubeCollectionUnitStatus,
    selected: Boolean(input.selected),
    keywordCount: Math.max(0, Number(input.keywordCount || 0)),
    selectedKeywordCount: Math.max(0, Number(input.selectedKeywordCount || 0)),
    updatedAt: now(),
  };
}

async function replaceYoutubeCollectionUnits(taskId: string, units: YoutubeCollectionUnitInput[] = []) {
  const normalizedUnits = units.map(normalizeUnitInput).filter((unit): unit is NonNullable<ReturnType<typeof normalizeUnitInput>> => Boolean(unit));
  if (!normalizedUnits.length) return [];
  const existingUnits = await getYoutubeCollectionUnits(taskId);
  const existingByDimensions = new Map(existingUnits.map((unit) => [unitGroupKey(unit), unit]));
  const activeIds: string[] = [];

  for (const unit of normalizedUnits) {
    const existing = existingByDimensions.get(unitGroupKey(unit));
    if (existing) {
      const [updated] = await db.update(youtubeCollectionUnits).set(unit).where(eq(youtubeCollectionUnits.id, existing.id)).returning();
      activeIds.push(updated.id);
    } else {
      const [inserted] = await db.insert(youtubeCollectionUnits).values({
        ...unit,
        taskId,
      }).returning();
      activeIds.push(inserted.id);
    }
  }

  const inactiveUnits = existingUnits.filter((unit) => !activeIds.includes(unit.id) && !["Completed", "Running"].includes(unit.status));
  if (inactiveUnits.length) {
    await db.update(youtubeCollectionUnits).set({
      status: "Cancelled",
      cancelledAt: now(),
      updatedAt: now(),
    }).where(inArray(youtubeCollectionUnits.id, inactiveUnits.map((unit) => unit.id)));
  }

  return getYoutubeCollectionUnits(taskId);
}

export async function getYoutubeCollectionUnits(taskId: string) {
  return db.select().from(youtubeCollectionUnits).where(eq(youtubeCollectionUnits.taskId, taskId)).orderBy(youtubeCollectionUnits.unitIndex);
}

async function refreshYoutubeCollectionUnitStats(taskId: string) {
  const units = await getYoutubeCollectionUnits(taskId);
  if (!units.length) return [];

  const [primaryCounts, matchCounts, duplicateCounts] = await Promise.all([
    db.select({
      unitId: youtubeResults.primaryUnitId,
      count: count(),
    }).from(youtubeResults)
      .where(and(eq(youtubeResults.taskId, taskId), isNull(youtubeResults.deletedAt)))
      .groupBy(youtubeResults.primaryUnitId),
    db.select({
      unitId: youtubeResultMatches.unitId,
      count: count(),
    }).from(youtubeResultMatches)
      .where(eq(youtubeResultMatches.taskId, taskId))
      .groupBy(youtubeResultMatches.unitId),
    db.select({
      unitId: toolSearchBatches.unitId,
      duplicates: sql<number>`coalesce(sum(${toolSearchBatches.duplicateCount}), 0)::int`,
    }).from(toolSearchBatches)
      .where(eq(toolSearchBatches.taskId, taskId))
      .groupBy(toolSearchBatches.unitId),
  ]);

  const primaryByUnit = new Map(primaryCounts.filter((row) => row.unitId).map((row) => [row.unitId as string, row.count]));
  const matchesByUnit = new Map(matchCounts.filter((row) => row.unitId).map((row) => [row.unitId as string, row.count]));
  const duplicatesByUnit = new Map(duplicateCounts.filter((row) => row.unitId).map((row) => [row.unitId as string, row.duplicates]));

  await Promise.all(units.map((unit) => db.update(youtubeCollectionUnits).set({
    primaryUniqueCount: primaryByUnit.get(unit.id) || 0,
    matchedSourcesCount: matchesByUnit.get(unit.id) || 0,
    duplicateCount: duplicatesByUnit.get(unit.id) || 0,
    updatedAt: now(),
  }).where(eq(youtubeCollectionUnits.id, unit.id))));

  return getYoutubeCollectionUnits(taskId);
}

async function getReviewedDuplicateGroupKeys(taskId: string) {
  const rows = await db.select({
    groupKey: youtubeDuplicateGroups.groupKey,
    status: youtubeDuplicateGroups.status,
  }).from(youtubeDuplicateGroups).where(and(
    eq(youtubeDuplicateGroups.taskId, taskId),
    inArray(youtubeDuplicateGroups.status, ["Reviewed", "Ignored", "Keep Separate", "Applied"]),
  ));
  return new Map(rows.map((row) => [row.groupKey, row.status]));
}

async function upsertDuplicateGroupReview(args: {
  taskId: string;
  groupKey: string;
  groupType: string;
  reason?: string | null;
  status: YoutubeDuplicateGroupStatus;
  decision?: string | null;
  recommendedKeepResultId?: string | null;
  keptResultId?: string | null;
  similarityScore?: number | null;
  items?: Array<{ resultId: string; action?: string | null; reason?: string | null }>;
  actor?: YoutubeActor;
}) {
  const [existing] = await db.select().from(youtubeDuplicateGroups).where(and(
    eq(youtubeDuplicateGroups.taskId, args.taskId),
    eq(youtubeDuplicateGroups.groupKey, args.groupKey),
  )).limit(1);

  const values = {
    groupType: args.groupType,
    reason: args.reason || null,
    status: args.status,
    decision: args.decision || null,
    recommendedKeepResultId: args.recommendedKeepResultId || null,
    keptResultId: args.keptResultId || null,
    similarityScore: args.similarityScore === null || args.similarityScore === undefined ? null : String(args.similarityScore),
    reviewedBy: args.actor?.id || null,
    reviewedByEmail: args.actor?.email || null,
    reviewedAt: now(),
    updatedAt: now(),
  };

  const [group] = existing
    ? await db.update(youtubeDuplicateGroups).set(values).where(eq(youtubeDuplicateGroups.id, existing.id)).returning()
    : await db.insert(youtubeDuplicateGroups).values({
      taskId: args.taskId,
      groupKey: args.groupKey,
      ...values,
    }).returning();

  if (args.items) {
    await db.delete(youtubeDuplicateGroupItems).where(eq(youtubeDuplicateGroupItems.groupId, group.id));
    if (args.items.length) {
      await db.insert(youtubeDuplicateGroupItems).values(args.items.map((item) => ({
        groupId: group.id,
        resultId: item.resultId,
        action: item.action || null,
        reason: item.reason || null,
      })));
    }
  }

  return group;
}

async function assignPrimaryUnitForResult(taskId: string, resultId: string, options: { force?: boolean; userUnitId?: string; reason?: string } = {}) {
  const [row] = await db.select().from(youtubeResults).where(and(eq(youtubeResults.taskId, taskId), eq(youtubeResults.id, resultId))).limit(1);
  if (!row) return null;
  if (row.primaryUnitSetBy === "user" && !options.force && !options.userUnitId) return row;

  const units = await getYoutubeCollectionUnits(taskId);
  const unitById = new Map(units.map((unit) => [unit.id, unit]));

  if (options.userUnitId) {
    const unit = unitById.get(options.userUnitId);
    if (!unit) throw new Error("Primary unit was not found.");
    const [updated] = await db.update(youtubeResults).set({
      primaryUnitId: unit.id,
      primaryUnitSetBy: "user",
      primaryUnitReason: options.reason || "Manually assigned by user",
      primaryUnitUpdatedAt: now(),
      updatedAt: now(),
    }).where(eq(youtubeResults.id, resultId)).returning();
    await refreshYoutubeCollectionUnitStats(taskId);
    return updated;
  }

  const matches = await db.select().from(youtubeResultMatches)
    .where(and(eq(youtubeResultMatches.taskId, taskId), eq(youtubeResultMatches.resultId, resultId)))
    .orderBy(youtubeResultMatches.matchedAt);

  const sources: MatchSourceMetadata[] = matches.flatMap((match) => {
    const unit = match.unitId ? unitById.get(match.unitId) : null;
    if (!unit) return [];
    return [{
      matchId: match.id,
      unitId: unit.id,
      unitLabel: unitLabel(unit),
      language: match.language || unit.language,
      domain: match.domain || unit.domain,
      searchTarget: match.searchTarget || unit.searchTarget,
      groupKey: unitGroupKey(unit),
      keyword: match.keyword || match.searchKeyword,
      keywordSource: match.keywordSource || "",
      batchId: match.batchId || "",
      detectedAt: match.matchedAt || match.createdAt,
    }];
  });

  if (!sources.length) return row;

  const primaryCounts = await db.select({
    unitId: youtubeResults.primaryUnitId,
    count: count(),
  }).from(youtubeResults)
    .where(and(eq(youtubeResults.taskId, taskId), isNull(youtubeResults.deletedAt)))
    .groupBy(youtubeResults.primaryUnitId);
  const unitPrimaryCounts = new Map(primaryCounts.filter((item) => item.unitId).map((item) => [item.unitId as string, item.count]));
  if (row.primaryUnitId) {
    unitPrimaryCounts.set(row.primaryUnitId, Math.max(0, (unitPrimaryCounts.get(row.primaryUnitId) || 0) - 1));
  }
  const unitTargetResults = new Map(units.map((unit) => [unit.id, unit.targetResults || 0]));
  const primary = choosePrimarySource({
    row,
    sources,
    unitPrimaryCounts,
    unitTargetResults,
  });

  if (!primary?.source.unitId) return row;

  const [updated] = await db.update(youtubeResults).set({
    primaryUnitId: primary.source.unitId,
    primaryUnitSetBy: "system",
    primaryUnitReason: primary.reason,
    primaryUnitUpdatedAt: now(),
    updatedAt: now(),
  }).where(eq(youtubeResults.id, resultId)).returning();
  await refreshYoutubeCollectionUnitStats(taskId);
  return updated;
}

export async function rebalanceYoutubePrimaryUnits(taskId: string) {
  return rebalanceYoutubePrimaryUnitsForActor(taskId);
}

export async function rebalanceYoutubePrimaryUnitsForActor(taskId: string, actor?: YoutubeActor) {
  const task = await getYoutubeTaskOrThrow(taskId, actor);
  assertTaskMutable(task, actor);
  assertTaskNotCompleted(task);
  assertEditLock(task, actor);
  const rows = await db.select({
    id: youtubeResults.id,
  }).from(youtubeResults).where(and(
    eq(youtubeResults.taskId, taskId),
    isNull(youtubeResults.deletedAt),
    sql`${youtubeResults.primaryUnitSetBy} <> 'user'`,
  ));
  let changedCount = 0;
  for (const row of rows) {
    const before = await db.select({ primaryUnitId: youtubeResults.primaryUnitId }).from(youtubeResults).where(eq(youtubeResults.id, row.id)).limit(1);
    const updated = await assignPrimaryUnitForResult(taskId, row.id, { force: true });
    if (updated && before[0]?.primaryUnitId !== updated.primaryUnitId) changedCount += 1;
  }
  await refreshYoutubeCollectionUnitStats(taskId);
  await writeYoutubeAuditLog({
    taskId,
    action: "primary_units_rebalanced",
    actor,
    after: { changedCount },
  });
  return { changedCount };
}

export async function updateYoutubeResultPrimaryUnit(resultId: string, primaryUnitId: string) {
  return updateYoutubeResultPrimaryUnitForActor(resultId, primaryUnitId);
}

export async function updateYoutubeResultPrimaryUnitForActor(resultId: string, primaryUnitId: string, actor?: YoutubeActor) {
  const [row] = await db.select().from(youtubeResults).where(eq(youtubeResults.id, resultId)).limit(1);
  if (!row) throw new Error("YouTube result was not found.");
  const task = await getYoutubeTaskOrThrow(row.taskId, actor);
  if (actor && !isYoutubeAdmin(actor) && !isYoutubeTaskOwner(task, actor)) {
    throw new Error("Only the task owner can change Primary Unit.");
  }
  assertTaskNotCompleted(task);
  assertEditLock(task, actor);
  const updated = await assignPrimaryUnitForResult(row.taskId, resultId, {
    userUnitId: primaryUnitId,
    reason: "Manually assigned by user",
  });
  await db.update(youtubeResults).set({
    primaryUnitUpdatedBy: actor?.id || null,
    primaryUnitUpdatedByEmail: actor?.email || null,
  }).where(eq(youtubeResults.id, resultId));
  await writeYoutubeAuditLog({
    taskId: row.taskId,
    resultId,
    action: "primary_unit_changed",
    actor,
    before: { primaryUnitId: row.primaryUnitId },
    after: { primaryUnitId },
  });
  return updated;
}

function canonicalDuplicateKey(row: YoutubeDbResult) {
  if (row.videoId) return `videoId:${row.videoId}`;
  const normalizedUrl = row.normalizedVideoUrl || normalizeYouTubeUrl(row.videoUrl || "");
  if (normalizedUrl) return `url:${normalizedUrl}`;
  return "";
}

function confirmedReasonFor(row: YoutubeDbResult) {
  if (row.videoId) return "same videoId";
  if (row.normalizedVideoUrl) return "same normalized URL";
  return "same canonical URL";
}

function parsePublishedDate(value: string | null) {
  const text = String(value || "").trim();
  if (!text) return null;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const relative = text.toLowerCase();
  const numberMatch = relative.match(/(\d+)/);
  const amount = numberMatch ? Number(numberMatch[1]) : 1;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const date = now();
  if (relative.includes("year")) {
    date.setMonth(date.getMonth() - amount * 12);
    return date;
  }
  if (relative.includes("month")) {
    date.setMonth(date.getMonth() - amount);
    return date;
  }
  if (relative.includes("week")) {
    date.setDate(date.getDate() - amount * 7);
    return date;
  }
  if (relative.includes("day")) {
    date.setDate(date.getDate() - amount);
    return date;
  }
  return null;
}

function filterResultsByPublishedRange<T extends { publishedDate: string }>(results: T[], publishedWithinMonths?: number | null) {
  const months = Number(publishedWithinMonths);
  if (!Number.isFinite(months) || months <= 0) {
    return { acceptedResults: results, filteredByDateCount: 0 };
  }

  const cutoff = now();
  cutoff.setMonth(cutoff.getMonth() - Math.floor(months));
  const acceptedResults: T[] = [];
  let filteredByDateCount = 0;

  results.forEach((result) => {
    const publishedDate = parsePublishedDate(result.publishedDate);
    if (publishedDate && publishedDate < cutoff) {
      filteredByDateCount += 1;
      return;
    }
    acceptedResults.push(result);
  });

  return { acceptedResults, filteredByDateCount };
}

function parseCount(value: string | null) {
  const parsed = Number(String(value || "").replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseOptionalCount(value: string | number | null | undefined) {
  const parsed = Number(String(value ?? "").replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseDurationSeconds(value: string | null) {
  const text = String(value || "").trim();
  if (!text) return 0;
  const parts = text.split(":").map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}

function normalizeTitle(value: string | null) {
  return String(value || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleTokens(value: string | null) {
  return normalizeTitle(value)
    .split(" ")
    .filter((token) => token.length > 1);
}

function titleSimilarity(a: string | null, b: string | null) {
  const aTokens = new Set(titleTokens(a));
  const bTokens = new Set(titleTokens(b));
  if (!aTokens.size || !bTokens.size) return 0;
  const intersection = Array.from(aTokens).filter((token) => bTokens.has(token)).length;
  return (2 * intersection) / (aTokens.size + bTokens.size);
}

function hasSeriesNumberConflict(a: string | null, b: string | null) {
  const pattern = /\b(lesson|episode|part|chapter|ep)\s*\.?\s*(\d+)\b/i;
  const aMatch = String(a || "").match(pattern);
  const bMatch = String(b || "").match(pattern);
  return Boolean(aMatch && bMatch && aMatch[1].toLowerCase() === bMatch[1].toLowerCase() && aMatch[2] !== bMatch[2]);
}

function closeDuration(a: string | null, b: string | null) {
  const aSeconds = parseDurationSeconds(a);
  const bSeconds = parseDurationSeconds(b);
  if (!aSeconds || !bSeconds) return false;
  const diff = Math.abs(aSeconds - bSeconds);
  return diff <= 30 || diff / Math.max(aSeconds, bSeconds) <= 0.1;
}

function statusRank(status: YoutubeDbResultStatus) {
  if (status === "Useful") return 4;
  if (status === "Processed") return 3;
  if (status === "Pending") return 2;
  return 1;
}

function chooseCanonicalResult<T extends YoutubeDbResult>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const statusDiff = statusRank(b.status) - statusRank(a.status);
    if (statusDiff) return statusDiff;
    const viewDiff = parseCount(b.viewCount) - parseCount(a.viewCount);
    if (viewDiff) return viewDiff;
    const durationDiff = parseDurationSeconds(b.duration) - parseDurationSeconds(a.duration);
    if (durationDiff) return durationDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  })[0];
}

function keywordSourceWeight(source: string) {
  if (source === "Manual") return 18;
  if (source === "AI") return 12;
  return 8;
}

function keywordMatchesUnit(source: MatchSourceMetadata) {
  const keyword = normalizeTitle(source.keyword);
  const domainWords = titleTokens(source.domain);
  const targetWords = titleTokens(source.searchTarget);
  const domainScore = domainWords.filter((word) => keyword.includes(word)).length * 2;
  const targetScore = targetWords.filter((word) => keyword.includes(word)).length * 2;
  return domainScore + targetScore;
}

function contentMatchesUnit(row: YoutubeDbResult, source: MatchSourceMetadata) {
  const content = normalizeTitle([row.title, row.videoType, row.channelName].filter(Boolean).join(" "));
  const domainScore = titleTokens(source.domain).filter((word) => content.includes(word)).length * 3;
  const targetScore = titleTokens(source.searchTarget).filter((word) => content.includes(word)).length * 3;
  return domainScore + targetScore;
}

function choosePrimarySource(args: {
  row: YoutubeDbResult;
  sources: MatchSourceMetadata[];
  unitPrimaryCounts: Map<string, number>;
  unitTargetResults: Map<string, number>;
}) {
  if (args.sources.length === 0) return null;
  if (args.sources.length === 1) {
    return {
      source: args.sources[0],
      reason: "First matched source",
    };
  }

  const scored = args.sources.map((source, index) => {
    const unitId = source.unitId || source.groupKey || source.unitLabel || `source:${index}`;
    const target = args.unitTargetResults.get(unitId) || 0;
    const current = args.unitPrimaryCounts.get(unitId) || 0;
    const remaining = target > 0 ? target - current : 0;
    const remainingScore = remaining > 0 ? Math.min(30, remaining) : -12;
    const progressRatio = target > 0 ? current / target : 0;
    const rebalanceScore = target > 0 ? Math.max(-16, Math.round((1 - progressRatio) * 20)) : 4;
    const matchQualityScore = contentMatchesUnit(args.row, source);
    const keywordScore = keywordSourceWeight(source.keywordSource) + keywordMatchesUnit(source);
    return {
      source,
      index,
      remaining,
      keywordScore,
      score: remainingScore + rebalanceScore + matchQualityScore + keywordScore,
      reasons: [
        remaining > 0 ? "Larger remaining target" : "",
        keywordScore > 12 ? "Higher keyword relevance" : "",
        rebalanceScore > 8 ? "Lower unit progress" : "",
        matchQualityScore > 0 ? "Better content match" : "",
      ].filter(Boolean),
    };
  });

  scored.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (scoreDiff) return scoreDiff;
    const remainingDiff = b.remaining - a.remaining;
    if (remainingDiff) return remainingDiff;
    const keywordDiff = b.keywordScore - a.keywordScore;
    if (keywordDiff) return keywordDiff;
    return a.index - b.index;
  });

  const winner = scored[0];
  return {
    source: winner.source,
    reason: winner.reasons.length ? winner.reasons.join(" · ") : "First matched source",
  };
}

function makeSuspectedGroupId(rows: YoutubeDbResult[]) {
  return `suspected:${rows.map((row) => row.id.slice(0, 8)).sort().join("-")}`;
}

function rowMatchesQ(row: YoutubeDbResult, q: string) {
  const query = q.toLowerCase();
  return [row.title, row.channelName, row.videoUrl, row.notes, Array.isArray(row.matchedKeywords) ? row.matchedKeywords.join(" ") : ""]
    .some((value) => String(value || "").toLowerCase().includes(query));
}

function resultWhereClauses(taskId: string, filters: YoutubeResultFilters) {
  const clauses = [eq(youtubeResults.taskId, taskId)];
  if (!filters.includeDeleted) clauses.push(isNull(youtubeResults.deletedAt));
  if (filters.status && RESULT_STATUSES.includes(filters.status as YoutubeDbResultStatus)) {
    clauses.push(eq(youtubeResults.status, filters.status as YoutubeDbResultStatus));
  }
  if (filters.q) {
    const query = `%${filters.q}%`;
    clauses.push(or(
      ilike(youtubeResults.title, query),
      ilike(youtubeResults.channelName, query),
      ilike(youtubeResults.videoUrl, query),
      ilike(youtubeResults.notes, query),
      sql`${youtubeResults.matchedKeywords}::text ilike ${query}`,
    )!);
  }
  return and(...clauses);
}

export async function createYoutubeTask(input: YoutubeTaskCreateInput, actor?: YoutubeActor) {
  const language = cleanText(input.language);
  const domain = cleanText(input.domain);
  const searchTargets = cleanSearchTargets(input.searchTargets);

  if (!language || !domain || searchTargets.length === 0) {
    throw new Error("Language, domain, and at least one search target are required.");
  }

  const [task] = await db.insert(toolTasks).values({
    toolType: TOOL_TYPE,
    name: taskNameFor({ ...input, language, domain, searchTargets }),
    language,
    domain,
    searchTargets,
    targetUniqueResults: input.targetUniqueResults ?? null,
    publishedWithinMonths: parseNullableInteger(input.publishedWithinMonths),
    publishedDateRangeLabel: cleanText(input.publishedDateRangeLabel) || "Any time",
    notes: input.notes ?? null,
    createdBy: actor?.id || input.createdBy || null,
    ownerId: actor?.id || input.createdBy || null,
    ownerEmail: actor?.email || null,
    visibility: "private",
  }).returning();

  if (input.units?.length) {
    await replaceYoutubeCollectionUnits(task.id, input.units);
  }

  await writeYoutubeAuditLog({
    taskId: task.id,
    action: "task_created",
    actor,
    after: publicTaskSnapshot(task),
  });

  return task;
}

export async function getYoutubeTaskSummary(taskId: string) {
  const [batchTotals] = await db.select({
    totalCollected: sql<number>`coalesce(sum(${toolSearchBatches.returnedCount}), 0)::int`,
    duplicatesRemoved: sql<number>`coalesce(sum(${toolSearchBatches.duplicateCount}), 0)::int`,
  }).from(toolSearchBatches).where(eq(toolSearchBatches.taskId, taskId));

  const resultCounts = await db.select({
    status: youtubeResults.status,
    deletedAt: youtubeResults.deletedAt,
    count: count(),
  }).from(youtubeResults).where(eq(youtubeResults.taskId, taskId)).groupBy(youtubeResults.status, youtubeResults.deletedAt);

  const activeCount = (status: YoutubeDbResultStatus) => resultCounts
    .filter((row) => row.status === status && !row.deletedAt)
    .reduce((sum, row) => sum + row.count, 0);

  return {
    totalCollected: batchTotals?.totalCollected || 0,
    duplicatesRemoved: batchTotals?.duplicatesRemoved || 0,
    uniqueResults: resultCounts.filter((row) => !row.deletedAt).reduce((sum, row) => sum + row.count, 0),
    pendingCount: activeCount("Pending"),
    usefulCount: activeCount("Useful"),
    notUsefulCount: activeCount("Not Useful"),
    processedCount: activeCount("Processed"),
    deletedCount: resultCounts.filter((row) => row.deletedAt).reduce((sum, row) => sum + row.count, 0),
  };
}

export async function getYoutubeTasks(filters: YoutubeTaskListFilters = {}, actor?: YoutubeActor) {
  const clauses = [eq(toolTasks.toolType, TOOL_TYPE)];
  const limit = Math.min(Math.max(parsePositiveInteger(filters.limit, 20), 1), 50);
  const offset = Math.max(Number(filters.offset || 0), 0);

  if (!filters.status || filters.status === "active") {
    clauses.push(inArray(toolTasks.status, ACTIVE_TASK_STATUSES));
    clauses.push(isNull(toolTasks.deletedAt));
  } else if (filters.status === "in_progress") {
    clauses.push(inArray(toolTasks.status, ["Running", "Paused", "Reviewing"]));
    clauses.push(isNull(toolTasks.deletedAt));
  } else if (filters.status !== "all" && TASK_STATUSES.includes(filters.status as ToolTaskStatus)) {
    if (filters.status === "Deleted" && !isYoutubeAdmin(actor || { id: "", email: "", role: "member" })) {
      return { tasks: [], limit, offset, hasMore: false };
    }
    clauses.push(eq(toolTasks.status, filters.status as ToolTaskStatus));
    if (filters.status !== "Deleted") clauses.push(isNull(toolTasks.deletedAt));
  } else if (filters.status === "all") {
    if (!isYoutubeAdmin(actor || { id: "", email: "", role: "member" })) {
      clauses.push(isNull(toolTasks.deletedAt));
      clauses.push(sql`${toolTasks.status} <> 'Deleted'`);
    }
  }

  if (actor && !isYoutubeAdmin(actor)) {
    clauses.push(or(eq(toolTasks.ownerId, actor.id), eq(toolTasks.createdBy, actor.id))!);
  } else if (filters.ownerId) {
    clauses.push(or(eq(toolTasks.ownerId, filters.ownerId), eq(toolTasks.createdBy, filters.ownerId))!);
  }

  if (filters.language) clauses.push(eq(toolTasks.language, filters.language));
  if (filters.domain) clauses.push(eq(toolTasks.domain, filters.domain));
  if (filters.q) {
    const query = `%${filters.q}%`;
    clauses.push(or(ilike(toolTasks.name, query), ilike(toolTasks.language, query), ilike(toolTasks.domain, query), ilike(toolTasks.notes, query))!);
  }

  const taskRows = await db.select()
    .from(toolTasks)
    .where(and(...clauses))
    .orderBy(desc(toolTasks.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = taskRows.length > limit;
  const tasks = taskRows.slice(0, limit);
  const taskIds = tasks.map((task) => task.id);

  if (!taskIds.length) {
    return { tasks: [], limit, offset, hasMore: false };
  }

  const [batchTotals, resultCounts] = await Promise.all([
    db.select({
      taskId: toolSearchBatches.taskId,
      totalCollected: sql<number>`coalesce(sum(${toolSearchBatches.returnedCount}), 0)::int`,
      duplicatesRemoved: sql<number>`coalesce(sum(${toolSearchBatches.duplicateCount}), 0)::int`,
    }).from(toolSearchBatches).where(inArray(toolSearchBatches.taskId, taskIds)).groupBy(toolSearchBatches.taskId),
    db.select({
      taskId: youtubeResults.taskId,
      status: youtubeResults.status,
      deletedAt: youtubeResults.deletedAt,
      count: count(),
    }).from(youtubeResults).where(inArray(youtubeResults.taskId, taskIds)).groupBy(youtubeResults.taskId, youtubeResults.status, youtubeResults.deletedAt),
  ]);

  const batchTotalsByTask = new Map(batchTotals.map((row) => [row.taskId, row]));
  const resultCountsByTask = new Map<string, typeof resultCounts>();
  resultCounts.forEach((row) => {
    const current = resultCountsByTask.get(row.taskId) || [];
    current.push(row);
    resultCountsByTask.set(row.taskId, current);
  });

  const tasksWithSummary = tasks.map((task) => {
    const batchTotal = batchTotalsByTask.get(task.id);
    const counts = resultCountsByTask.get(task.id) || [];
    const activeCount = (status: YoutubeDbResultStatus) => counts
      .filter((row) => row.status === status && !row.deletedAt)
      .reduce((sum, row) => sum + row.count, 0);

    return {
      task,
      summary: {
        totalCollected: batchTotal?.totalCollected || 0,
        duplicatesRemoved: batchTotal?.duplicatesRemoved || 0,
        uniqueResults: counts.filter((row) => !row.deletedAt).reduce((sum, row) => sum + row.count, 0),
        pendingCount: activeCount("Pending"),
        usefulCount: activeCount("Useful"),
        notUsefulCount: activeCount("Not Useful"),
        processedCount: activeCount("Processed"),
        deletedCount: counts.filter((row) => row.deletedAt).reduce((sum, row) => sum + row.count, 0),
      },
    };
  });

  return { tasks: tasksWithSummary, limit, offset, hasMore };
}

export async function getYoutubeTaskOrThrow(taskId: string, actor?: YoutubeActor) {
  const [task] = await db.select().from(toolTasks).where(and(eq(toolTasks.id, taskId), eq(toolTasks.toolType, TOOL_TYPE))).limit(1);
  if (!task) throw new Error("YouTube task was not found.");
  assertTaskViewable(task, actor);
  return task;
}

export async function getYoutubeTaskResults(taskId: string, filters: YoutubeResultFilters = {}, actor?: YoutubeActor) {
  await getYoutubeTaskOrThrow(taskId, actor);
  const limit = Math.min(parsePositiveInteger(filters.limit, 100), 500);
  const offset = Math.max(Number(filters.offset || 0), 0);

  const rows = await db.select()
    .from(youtubeResults)
    .where(resultWhereClauses(taskId, filters))
    .orderBy(desc(youtubeResults.createdAt))
    .limit(limit)
    .offset(offset);

  return enrichYoutubeResultsWithClassifications(taskId, rows);
}

async function enrichYoutubeResultsWithClassifications(taskId: string, rows: YoutubeDbResult[]): Promise<YoutubeDbResultWithClassifications[]> {
  if (!rows.length) return [];
  const resultIds = rows.map((row) => row.id);
  const [task, batches, matches, units] = await Promise.all([
    getYoutubeTaskOrThrow(taskId),
    db.select({
      id: toolSearchBatches.id,
      unitId: toolSearchBatches.unitId,
      keywords: toolSearchBatches.keywords,
    }).from(toolSearchBatches).where(eq(toolSearchBatches.taskId, taskId)),
    db.select().from(youtubeResultMatches).where(and(eq(youtubeResultMatches.taskId, taskId), inArray(youtubeResultMatches.resultId, resultIds))).orderBy(youtubeResultMatches.createdAt),
    getYoutubeCollectionUnits(taskId),
  ]);
  const unitById = new Map(units.map((unit) => [unit.id, unit]));

  const metadataByBatchKeyword = new Map<string, { unitId?: string; unitLabel?: string; language?: string; domain?: string; searchTarget?: string; groupKey?: string; publishedDateRangeLabel?: string }>();
  const metadataByKeyword = new Map<string, Array<{ unitId?: string; unitLabel?: string; language?: string; domain?: string; searchTarget?: string; groupKey?: string; publishedDateRangeLabel?: string }>>();
  batches.forEach((batch) => {
    const keywords = Array.isArray(batch.keywords) ? batch.keywords : [];
    keywords.forEach((keyword) => {
      const key = String(keyword.keyword || "").trim();
      if (!key) return;
      const metadata = {
        unitId: keyword.unitId,
        unitLabel: keyword.unitLabel,
        language: keyword.language,
        domain: keyword.domain,
        searchTarget: keyword.searchTarget,
        groupKey: keyword.groupKey,
        publishedDateRangeLabel: keyword.publishedDateRangeLabel || undefined,
      };
      metadataByBatchKeyword.set(`${batch.id}::${key}`, metadata);
      const keywordKey = key.toLowerCase();
      const current = metadataByKeyword.get(keywordKey) || [];
      current.push(metadata);
      metadataByKeyword.set(keywordKey, current);
    });
  });

  const sourcesByResultId = new Map<string, MatchSourceMetadata[]>();
  matches.forEach((match) => {
    const metadata = (match.batchId ? metadataByBatchKeyword.get(`${match.batchId}::${match.searchKeyword}`) : undefined)
      || metadataByKeyword.get(String(match.searchKeyword || "").trim().toLowerCase())?.[0]
      || {};
    const dbUnit = match.unitId ? unitById.get(match.unitId) : null;
    const unitId = makeSourceUnitId({
      unitId: match.unitId || metadata.unitId || dbUnit?.id,
      groupKey: metadata.groupKey,
      unitLabel: metadata.unitLabel,
      language: match.language || metadata.language || dbUnit?.language,
      domain: match.domain || metadata.domain || dbUnit?.domain,
      searchTarget: match.searchTarget || metadata.searchTarget || dbUnit?.searchTarget,
    });
    const source: MatchSourceMetadata = {
      matchId: match.id,
      unitId,
      unitLabel: makeSourceUnitLabel({
        unitLabel: metadata.unitLabel || (dbUnit ? unitLabel(dbUnit) : ""),
        language: match.language || metadata.language || dbUnit?.language,
        domain: match.domain || metadata.domain || dbUnit?.domain,
        searchTarget: match.searchTarget || metadata.searchTarget || dbUnit?.searchTarget,
      }),
      language: match.language || metadata.language || dbUnit?.language || "",
      domain: match.domain || metadata.domain || dbUnit?.domain || "",
      searchTarget: match.searchTarget || metadata.searchTarget || dbUnit?.searchTarget || "",
      groupKey: metadata.groupKey || "",
      keyword: match.keyword || match.searchKeyword,
      keywordSource: match.keywordSource || "",
      batchId: match.batchId || "",
      detectedAt: match.matchedAt || match.createdAt,
      publishedDateRangeLabel: metadata.publishedDateRangeLabel,
    };
    const current = sourcesByResultId.get(match.resultId) || [];
    current.push(source);
    sourcesByResultId.set(match.resultId, current);
  });

  rows.forEach((row) => {
    if (sourcesByResultId.get(row.id)?.length) return;
    const fallbackSources = (Array.isArray(row.matchedKeywords) ? row.matchedKeywords : []).flatMap((keyword, index) => {
      const metadataItems = metadataByKeyword.get(String(keyword || "").trim().toLowerCase()) || [];
      return metadataItems.map((metadata) => {
        const unitId = makeSourceUnitId({
          unitId: metadata.unitId,
          groupKey: metadata.groupKey,
          unitLabel: metadata.unitLabel,
          language: metadata.language,
          domain: metadata.domain,
          searchTarget: metadata.searchTarget,
        });
        return {
          matchId: `fallback:${row.id}:${index}:${unitId || keyword}`,
          unitId,
          unitLabel: makeSourceUnitLabel({
            unitLabel: metadata.unitLabel,
            language: metadata.language,
            domain: metadata.domain,
            searchTarget: metadata.searchTarget,
          }),
          language: metadata.language || "",
          domain: metadata.domain || "",
          searchTarget: metadata.searchTarget || "",
          groupKey: metadata.groupKey || "",
          keyword,
          keywordSource: "",
          batchId: "",
          detectedAt: row.createdAt,
          publishedDateRangeLabel: metadata.publishedDateRangeLabel,
        } satisfies MatchSourceMetadata;
      });
    });
    if (fallbackSources.length) sourcesByResultId.set(row.id, fallbackSources);
  });

  const distinctUnitIds = uniqueValues(Array.from(sourcesByResultId.values()).flat().map((source) => source.unitId));
  const fallbackTarget = task.targetUniqueResults && distinctUnitIds.length ? Math.ceil(task.targetUniqueResults / distinctUnitIds.length) : 0;
  const unitTargetResults = new Map(distinctUnitIds.map((unitId) => [unitId, unitById.get(unitId)?.targetResults || fallbackTarget]));
  const unitPrimaryCounts = new Map<string, number>();

  return rows.map((row) => {
    const sources = sourcesByResultId.get(row.id) || [];
    const computedPrimary = choosePrimarySource({
      row,
      sources,
      unitPrimaryCounts,
      unitTargetResults,
    });
    const persistedUnit = row.primaryUnitId ? unitById.get(row.primaryUnitId) : null;
    const primarySource = persistedUnit
      ? {
        source: {
          matchId: `primary:${row.id}:${persistedUnit.id}`,
          unitId: persistedUnit.id,
          unitLabel: unitLabel(persistedUnit),
          language: persistedUnit.language,
          domain: persistedUnit.domain,
          searchTarget: persistedUnit.searchTarget,
          groupKey: unitGroupKey(persistedUnit),
          keyword: "",
          keywordSource: "",
          batchId: "",
          detectedAt: row.primaryUnitUpdatedAt || row.updatedAt,
        } satisfies MatchSourceMetadata,
        reason: row.primaryUnitReason || "Persisted primary unit",
      }
      : computedPrimary;
    if (primarySource?.source.unitId) {
      unitPrimaryCounts.set(primarySource.source.unitId, (unitPrimaryCounts.get(primarySource.source.unitId) || 0) + 1);
    }

    return {
      ...row,
      matchedUnits: uniqueValues(sources.map((item) => makeSourceUnitLabel(item))),
      matchedLanguages: uniqueValues(sources.map((item) => item.language || "")),
      matchedDomains: uniqueValues(sources.map((item) => item.domain || "")),
      matchedSearchTargets: uniqueValues(sources.map((item) => item.searchTarget || "")),
      matchedPublishedDateRanges: uniqueValues(sources.map((item) => item.publishedDateRangeLabel || "")),
      matchedKeywordSources: uniqueValues(sources.map((item) => item.keywordSource || "")),
      primaryUnitId: primarySource?.source.unitId || "",
      primaryUnitLabel: primarySource ? makeSourceUnitLabel(primarySource.source) : "",
      primaryLanguage: primarySource?.source.language || "",
      primaryDomain: primarySource?.source.domain || "",
      primarySearchTarget: primarySource?.source.searchTarget || "",
      primaryUnitSetBy: row.primaryUnitSetBy || "system",
      primaryUnitReason: primarySource?.reason || "No matched source metadata available",
      matchedSourcesCount: Math.max(sources.length, row.duplicateCount + 1, sources.length ? 1 : 0),
    };
  });
}

export async function getYoutubeTaskDetail(taskId: string, actor?: YoutubeActor, options: { acquireLock?: boolean } = {}) {
  const task = await getYoutubeTaskOrThrow(taskId, actor);
  if (options.acquireLock && actor && canMutateYoutubeTask(task, actor) && task.status !== "Completed" && task.status !== "Deleted") {
    await acquireYoutubeTaskEditLock(taskId, actor);
  }
  const [batches, summary, results, units] = await Promise.all([
    db.select().from(toolSearchBatches).where(eq(toolSearchBatches.taskId, taskId)).orderBy(desc(toolSearchBatches.createdAt)),
    getYoutubeTaskSummary(taskId),
    getYoutubeTaskResults(taskId, { limit: 200 }, actor),
    refreshYoutubeCollectionUnitStats(taskId),
  ]);

  return { task, batches, summary, results, units };
}

export async function acquireYoutubeTaskEditLock(taskId: string, actor: YoutubeActor) {
  const task = await getYoutubeTaskOrThrow(taskId, actor);
  assertTaskMutable(task, actor);
  const current = now();
  if (task.editingBy && task.editingBy !== actor.id && task.editingExpiresAt && task.editingExpiresAt > current && !isYoutubeAdmin(actor)) {
    throw new Error(`This task is being edited by ${task.editingByEmail || "another user"}.`);
  }
  const [updated] = await db.update(toolTasks).set({
    editingBy: actor.id,
    editingByEmail: actor.email,
    editingStartedAt: task.editingBy === actor.id ? task.editingStartedAt || current : current,
    editingExpiresAt: minutesFromNow(EDIT_LOCK_MINUTES),
    updatedAt: current,
  }).where(eq(toolTasks.id, taskId)).returning();
  return updated;
}

export async function releaseYoutubeTaskEditLock(taskId: string, actor: YoutubeActor, force = false) {
  const task = await getYoutubeTaskOrThrow(taskId, actor);
  if (!force && !isYoutubeAdmin(actor) && task.editingBy !== actor.id) return task;
  const [updated] = await db.update(toolTasks).set({
    editingBy: null,
    editingByEmail: null,
    editingStartedAt: null,
    editingExpiresAt: null,
    updatedAt: now(),
  }).where(eq(toolTasks.id, taskId)).returning();
  return updated;
}

export async function getYoutubeDuplicateGroups(taskId: string, actor?: YoutubeActor) {
  await getYoutubeTaskOrThrow(taskId, actor);
  const reviewedGroupKeys = await getReviewedDuplicateGroupKeys(taskId);
  const activeRows = await db.select()
    .from(youtubeResults)
    .where(and(eq(youtubeResults.taskId, taskId), isNull(youtubeResults.deletedAt)))
    .orderBy(desc(youtubeResults.updatedAt));

  const [allMatches, batches] = await Promise.all([
    db.select().from(youtubeResultMatches).where(eq(youtubeResultMatches.taskId, taskId)).orderBy(youtubeResultMatches.createdAt),
    db.select({
      id: toolSearchBatches.id,
      batchName: toolSearchBatches.batchName,
      keywords: toolSearchBatches.keywords,
    }).from(toolSearchBatches).where(eq(toolSearchBatches.taskId, taskId)),
  ]);

  const batchById = new Map(batches.map((batch) => [batch.id, batch]));
  const metadataByBatchKeyword = new Map<string, { unitId?: string; unitLabel?: string; language?: string; domain?: string; searchTarget?: string; groupKey?: string }>();
  batches.forEach((batch) => {
    (Array.isArray(batch.keywords) ? batch.keywords : []).forEach((keyword) => {
      metadataByBatchKeyword.set(`${batch.id}::${keyword.keyword}`, {
        unitId: keyword.unitId,
        unitLabel: keyword.unitLabel,
        language: keyword.language,
        domain: keyword.domain,
        searchTarget: keyword.searchTarget,
        groupKey: keyword.groupKey,
      });
    });
  });

  const enrichedRows = await enrichYoutubeResultsWithClassifications(taskId, activeRows);
  const matchesByResult = new Map<string, typeof allMatches>();
  allMatches.forEach((match) => {
    const current = matchesByResult.get(match.resultId) || [];
    current.push(match);
    matchesByResult.set(match.resultId, current);
  });

  const formatMatches = (resultId: string, reason: string, skipFirst = false) => {
    const sourceMatches = matchesByResult.get(resultId) || [];
    return (skipFirst ? sourceMatches.slice(1) : sourceMatches).map((match) => {
      const metadata = match.batchId ? metadataByBatchKeyword.get(`${match.batchId}::${match.searchKeyword}`) : undefined;
      return {
        matchId: match.id,
        unitId: match.unitId || metadata?.unitId || "",
        unitLabel: metadata?.unitLabel || "",
        language: match.language || metadata?.language || "",
        domain: match.domain || metadata?.domain || "",
        searchTarget: match.searchTarget || metadata?.searchTarget || "",
        groupKey: metadata?.groupKey || "",
        keyword: match.keyword || match.searchKeyword,
        keywordSource: match.keywordSource || "",
        batchId: match.batchId || "",
        run: match.batchId ? batchById.get(match.batchId)?.batchName || "" : "",
        detectedAt: match.matchedAt || match.createdAt,
        reason: match.matchReason || reason,
      };
    });
  };

  const rowsByCanonicalKey = new Map<string, YoutubeDbResultWithClassifications[]>();
  enrichedRows.forEach((row) => {
    const key = canonicalDuplicateKey(row);
    if (!key) return;
    const current = rowsByCanonicalKey.get(key) || [];
    current.push(row);
    rowsByCanonicalKey.set(key, current);
  });

  const rowLevelDuplicateIds = new Set<string>();
  const confirmedRowGroups = Array.from(rowsByCanonicalKey.entries())
    .filter(([, rows]) => rows.length > 1)
    .filter(([groupId]) => !reviewedGroupKeys.has(groupId))
    .map(([groupId, rows]) => {
      const canonicalResult = chooseCanonicalResult(rows);
      const entries = rows.filter((row) => row.id !== canonicalResult.id);
      entries.forEach((row) => rowLevelDuplicateIds.add(row.id));
      const reason = confirmedReasonFor(canonicalResult);
      return {
        groupId,
        groupType: "confirmed_video_duplicate" as const,
        reason,
        canonicalResult,
        duplicateCount: entries.length,
        candidates: [canonicalResult, ...entries],
        entries,
        matches: rows.flatMap((row) => formatMatches(row.id, reason, row.id === canonicalResult.id)),
        reviewed: false,
        provenanceOnly: false,
      };
    });

  const confirmedProvenanceGroups = enrichedRows
    .filter((row) => row.duplicateCount > 0 && !rowLevelDuplicateIds.has(row.id) && !confirmedRowGroups.some((group) => group.canonicalResult.id === row.id))
    .map((row) => {
      const reason = confirmedReasonFor(row);
      const groupId = canonicalDuplicateKey(row) || `result:${row.id}`;
      if (reviewedGroupKeys.has(groupId)) return null;
      return {
        groupId,
        groupType: "match_provenance" as const,
        reason,
        canonicalResult: row,
        duplicateCount: row.duplicateCount,
        candidates: [row],
        entries: [],
        matches: formatMatches(row.id, reason, true),
        reviewed: false,
        provenanceOnly: true,
      };
    }).filter((group): group is NonNullable<typeof group> => Boolean(group));

  const suspectedCandidates = enrichedRows.filter((row) => !rowLevelDuplicateIds.has(row.id));
  const parent = new Map<string, string>();
  const scoreByPair = new Map<string, number>();
  suspectedCandidates.forEach((row) => parent.set(row.id, row.id));

  const find = (id: string): string => {
    const current = parent.get(id) || id;
    if (current === id) return id;
    const root = find(current);
    parent.set(id, root);
    return root;
  };
  const union = (a: string, b: string) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootB, rootA);
  };

  for (let i = 0; i < suspectedCandidates.length; i += 1) {
    for (let j = i + 1; j < suspectedCandidates.length; j += 1) {
      const a = suspectedCandidates[i];
      const b = suspectedCandidates[j];
      const sameChannel = cleanText(a.channelName).toLowerCase() && cleanText(a.channelName).toLowerCase() === cleanText(b.channelName).toLowerCase();
      if (!sameChannel || hasSeriesNumberConflict(a.title, b.title)) continue;
      const similarity = titleSimilarity(a.title, b.title);
      const durationClose = closeDuration(a.duration, b.duration);
      const sameTitle = normalizeTitle(a.title) && normalizeTitle(a.title) === normalizeTitle(b.title);
      if (sameTitle || (similarity >= 0.84 && durationClose) || similarity >= 0.92) {
        union(a.id, b.id);
        scoreByPair.set(`${a.id}:${b.id}`, similarity);
      }
    }
  }

  const suspectedRowsByRoot = new Map<string, YoutubeDbResultWithClassifications[]>();
  suspectedCandidates.forEach((row) => {
    const root = find(row.id);
    const current = suspectedRowsByRoot.get(root) || [];
    current.push(row);
    suspectedRowsByRoot.set(root, current);
  });

  const suspectedGroups = Array.from(suspectedRowsByRoot.values())
    .filter((rows) => rows.length > 1)
    .map((rows) => {
      const recommendedKeep = chooseCanonicalResult(rows);
      const scores = rows.flatMap((row, index) => rows.slice(index + 1).map((other) => scoreByPair.get(`${row.id}:${other.id}`) || scoreByPair.get(`${other.id}:${row.id}`) || 0));
      const similarityScore = scores.length ? Math.max(...scores) : 0;
      const groupId = makeSuspectedGroupId(rows);
      if (reviewedGroupKeys.has(groupId)) return null;
      return {
        groupId,
        groupType: "suspected_video_duplicate" as const,
        reason: "similar title + same channel + close duration",
        similarityScore,
        recommendedKeepResultId: recommendedKeep.id,
        candidates: rows,
        results: rows,
        reviewed: false,
      };
    }).filter((group): group is NonNullable<typeof group> => Boolean(group));

  return {
    confirmedGroups: confirmedRowGroups,
    suspectedGroups,
    matchedSourcesGroups: confirmedProvenanceGroups,
    matchedSourcesSummary: {
      videosWithMultipleSources: confirmedProvenanceGroups.length,
      totalMatchedSources: confirmedProvenanceGroups.reduce((sum, group) => sum + group.matches.length, 0),
    },
    summary: {
      confirmedGroups: confirmedRowGroups.length,
      confirmedDuplicates: confirmedRowGroups.reduce((sum, group) => sum + group.duplicateCount, 0),
      suspectedGroups: suspectedGroups.length,
      suspectedResults: suspectedGroups.reduce((sum, group) => sum + group.results.length, 0),
    },
  };
}

export async function cleanConfirmedYoutubeDuplicates(taskId: string, actor?: YoutubeActor) {
  if (!actor || !canReviewYoutubeDuplicates(actor)) throw new Error("Only admins or reviewers can review suspected similar videos.");
  const result = await getYoutubeDuplicateGroups(taskId, actor);
  const entryIds = result.confirmedGroups.flatMap((group) => group.entries.map((entry) => entry.id));

  if (entryIds.length) {
    await db.update(youtubeResults).set({
      deletedAt: now(),
      updatedAt: now(),
    }).where(and(eq(youtubeResults.taskId, taskId), inArray(youtubeResults.id, entryIds)));
  }
  await Promise.all(result.confirmedGroups.map((group) => upsertDuplicateGroupReview({
    taskId,
    groupKey: group.groupId,
    groupType: group.groupType,
    reason: group.reason,
    status: "Applied",
    decision: "clean-confirmed",
    recommendedKeepResultId: group.canonicalResult.id,
    keptResultId: group.canonicalResult.id,
    actor,
    items: group.candidates.map((row) => ({
      resultId: row.id,
      action: row.id === group.canonicalResult.id ? "keep" : "delete",
      reason: group.reason,
    })),
  })));
  await refreshYoutubeCollectionUnitStats(taskId);
  await writeYoutubeAuditLog({ taskId, action: "suspected_group_decision_applied", actor, after: { deletedCount: entryIds.length, decision: "clean-confirmed" } });

  return {
    cleanedCount: entryIds.length,
    reviewedOnlyCount: 0,
    warning: entryIds.length
      ? ""
      : "No confirmed duplicate video rows were found. Matched sources were preserved.",
  };
}

export async function applyYoutubeDuplicateDecision(taskId: string, input: { groupId: string; keepResultId: string; deleteResultIds: string[] }, actor?: YoutubeActor) {
  if (!actor || !canReviewYoutubeDuplicates(actor)) throw new Error("Only admins or reviewers can review suspected similar videos.");
  const duplicateReview = await getYoutubeDuplicateGroups(taskId, actor);
  const group = duplicateReview.suspectedGroups.find((item) => item.groupId === input.groupId)
    || duplicateReview.confirmedGroups.find((item) => item.groupId === input.groupId && item.groupType === "confirmed_video_duplicate");
  if (!group) throw new Error("Duplicate video group was not found.");

  const groupRows = "results" in group ? group.results : group.candidates;
  const groupResultIds = new Set(groupRows.map((row) => row.id));
  if (!groupResultIds.has(input.keepResultId)) throw new Error("Keep result must belong to the suspected group.");

  const deleteIds = uniqueValues(input.deleteResultIds).filter((id) => id !== input.keepResultId && groupResultIds.has(id));
  if (!deleteIds.length) {
    return { deletedCount: 0, keptResultId: input.keepResultId };
  }

  await db.update(youtubeResults).set({
    deletedAt: now(),
    updatedAt: now(),
  }).where(and(eq(youtubeResults.taskId, taskId), inArray(youtubeResults.id, deleteIds)));
  await upsertDuplicateGroupReview({
    taskId,
    groupKey: group.groupId,
    groupType: group.groupType,
    reason: group.reason,
    status: "Applied",
    decision: "apply",
    recommendedKeepResultId: "recommendedKeepResultId" in group ? group.recommendedKeepResultId : group.canonicalResult.id,
    keptResultId: input.keepResultId,
    similarityScore: "similarityScore" in group ? group.similarityScore : null,
    actor,
    items: groupRows.map((row) => ({
      resultId: row.id,
      action: row.id === input.keepResultId ? "keep" : deleteIds.includes(row.id) ? "delete" : "none",
      reason: group.reason,
    })),
  });
  await refreshYoutubeCollectionUnitStats(taskId);
  await writeYoutubeAuditLog({ taskId, action: "suspected_group_decision_applied", actor, after: { groupId: input.groupId, keepResultId: input.keepResultId, deleteResultIds: deleteIds } });

  return {
    deletedCount: deleteIds.length,
    keptResultId: input.keepResultId,
  };
}

export async function markYoutubeDuplicateGroupReviewed(taskId: string, groupId: string, decision: "keep-separate" | "ignore", actor?: YoutubeActor) {
  if (!actor || !canReviewYoutubeDuplicates(actor)) throw new Error("Only admins or reviewers can review suspected similar videos.");
  const duplicateReview = await getYoutubeDuplicateGroups(taskId, actor);
  const group = duplicateReview.suspectedGroups.find((item) => item.groupId === groupId)
    || duplicateReview.confirmedGroups.find((item) => item.groupId === groupId)
    || duplicateReview.matchedSourcesGroups.find((item) => item.groupId === groupId);
  if (!group) throw new Error("Duplicate review group was not found.");
  const groupRows = "results" in group ? group.results : group.candidates;
  await upsertDuplicateGroupReview({
    taskId,
    groupKey: group.groupId,
    groupType: group.groupType,
    reason: group.reason,
    status: decision === "ignore" ? "Ignored" : "Keep Separate",
    decision,
    recommendedKeepResultId: "recommendedKeepResultId" in group ? group.recommendedKeepResultId : group.canonicalResult.id,
    keptResultId: null,
    similarityScore: "similarityScore" in group ? group.similarityScore : null,
    actor,
    items: groupRows.map((row) => ({
      resultId: row.id,
      action: decision,
      reason: group.reason,
    })),
  });
  await writeYoutubeAuditLog({ taskId, action: decision === "ignore" ? "suspected_group_ignored" : "suspected_group_kept_separate", actor, after: { groupId, decision } });
  return {
    groupId,
    decision,
    reviewed: true,
    warning: "",
  };
}

export async function updateYoutubeTask(taskId: string, patch: {
  name?: string;
  language?: string;
  domain?: string;
  searchTargets?: string[];
  notes?: string | null;
  status?: string;
  targetUniqueResults?: number | null;
  publishedWithinMonths?: number | null;
  publishedDateRangeLabel?: string | null;
  units?: YoutubeCollectionUnitInput[];
}, actor?: YoutubeActor) {
  const existingTask = await getYoutubeTaskOrThrow(taskId, actor);
  assertTaskMutable(existingTask, actor);
  assertTaskNotCompleted(existingTask);
  assertEditLock(existingTask, actor);
  const values: Partial<typeof toolTasks.$inferInsert> = { updatedAt: now() };

  if (patch.name !== undefined) values.name = cleanText(patch.name);
  if (patch.language !== undefined) {
    const language = cleanText(patch.language);
    if (!language) throw new Error("Language is required.");
    values.language = language;
  }
  if (patch.domain !== undefined) {
    const domain = cleanText(patch.domain);
    if (!domain) throw new Error("Domain is required.");
    values.domain = domain;
  }
  if (patch.searchTargets !== undefined) {
    const searchTargets = cleanSearchTargets(patch.searchTargets);
    if (!searchTargets.length) throw new Error("At least one search target is required.");
    values.searchTargets = searchTargets;
  }
  if (patch.notes !== undefined) values.notes = patch.notes;
  if (patch.targetUniqueResults !== undefined) values.targetUniqueResults = patch.targetUniqueResults;
  if (patch.publishedWithinMonths !== undefined) values.publishedWithinMonths = parseNullableInteger(patch.publishedWithinMonths);
  if (patch.publishedDateRangeLabel !== undefined) values.publishedDateRangeLabel = cleanText(patch.publishedDateRangeLabel) || "Any time";
  if (patch.status !== undefined) {
    if (!TASK_STATUSES.includes(patch.status as ToolTaskStatus)) throw new Error("Invalid task status.");
    values.status = patch.status as ToolTaskStatus;
    if (patch.status === "Archived") {
      values.archivedAt = now();
    } else if (existingTask.archivedAt) {
      values.archivedAt = null;
    }
  }

  const [task] = await db.update(toolTasks).set(values).where(eq(toolTasks.id, taskId)).returning();
  if (patch.units?.length) {
    await replaceYoutubeCollectionUnits(taskId, patch.units);
  }
  await writeYoutubeAuditLog({
    taskId,
    action: "task_updated",
    actor,
    before: publicTaskSnapshot(existingTask),
    after: publicTaskSnapshot(task),
  });
  return task;
}

export async function completeYoutubeTask(taskId: string, actor?: YoutubeActor) {
  const existingTask = await getYoutubeTaskOrThrow(taskId, actor);
  assertTaskMutable(existingTask, actor);
  if (existingTask.status === "Running") throw new Error("Pause or cancel the active run before completing this task.");
  const [task] = await db.update(toolTasks).set({
    status: "Completed",
    completedAt: now(),
    updatedAt: now(),
  }).where(eq(toolTasks.id, taskId)).returning();
  await writeYoutubeAuditLog({ taskId, action: "task_completed", actor, before: publicTaskSnapshot(existingTask), after: publicTaskSnapshot(task) });
  return task;
}

export async function reopenYoutubeTask(taskId: string, actor?: YoutubeActor) {
  const existingTask = await getYoutubeTaskOrThrow(taskId, actor);
  assertTaskMutable(existingTask, actor);
  const [task] = await db.update(toolTasks).set({
    status: "Reviewing",
    completedAt: null,
    archivedAt: null,
    deletedAt: null,
    restoredAt: existingTask.status === "Deleted" || existingTask.deletedAt ? now() : existingTask.restoredAt,
    restoredBy: actor?.id || existingTask.restoredBy,
    updatedAt: now(),
  }).where(eq(toolTasks.id, taskId)).returning();
  await writeYoutubeAuditLog({ taskId, action: existingTask.status === "Deleted" || existingTask.deletedAt ? "task_restored" : "task_reopened", actor, before: publicTaskSnapshot(existingTask), after: publicTaskSnapshot(task) });
  return task;
}

async function getActiveSearchBatches(taskId: string) {
  return db.select()
    .from(toolSearchBatches)
    .where(and(eq(toolSearchBatches.taskId, taskId), inArray(toolSearchBatches.status, ["Pending", "Running"])))
    .orderBy(desc(toolSearchBatches.createdAt));
}

async function tryAbortApifyRun(runId: string) {
  const token = process.env.APIFY_API_TOKEN;
  if (!token || !runId) {
    return { attempted: false, succeeded: false, warning: "Run cancelled in BlackDog. If an external Apify run was already started and no run id was stored, usage may still be counted." };
  }

  try {
    const response = await fetch(`https://api.apify.com/v2/actor-runs/${encodeURIComponent(runId)}/abort?token=${encodeURIComponent(token)}`, {
      method: "POST",
    });
    if (!response.ok) {
      return { attempted: true, succeeded: false, warning: "Could not confirm Apify run cancellation. Usage may still be counted." };
    }
    return { attempted: true, succeeded: true, warning: "" };
  } catch {
    return { attempted: true, succeeded: false, warning: "Could not confirm Apify run cancellation. Usage may still be counted." };
  }
}

export async function pauseYoutubeTaskRun(taskId: string, actor?: YoutubeActor) {
  const task = await getYoutubeTaskOrThrow(taskId, actor);
  assertTaskMutable(task, actor);
  const activeBatches = await getActiveSearchBatches(taskId);

  const [updatedTask] = await db.update(toolTasks).set({
    status: "Paused",
    updatedAt: now(),
  }).where(eq(toolTasks.id, task.id)).returning();
  await db.update(youtubeCollectionUnits).set({
    status: "Paused",
    runningExpiresAt: now(),
    pausedAt: now(),
    updatedAt: now(),
  }).where(and(eq(youtubeCollectionUnits.taskId, task.id), inArray(youtubeCollectionUnits.status, ["Running"])));
  await writeYoutubeAuditLog({ taskId, action: "unit_run_paused", actor, before: publicTaskSnapshot(task), after: publicTaskSnapshot(updatedTask) });

  return {
    task: updatedTask,
    activeBatchCount: activeBatches.length,
    hasApifyRunId: activeBatches.some((batch) => Boolean(batch.apifyRunId)),
    warning: activeBatches.length
      ? "Run paused in BlackDog. The current external request may finish, but no new unit should be started until resume."
      : "No active batch was found. The task was marked Paused.",
  };
}

export async function cancelYoutubeTaskRun(taskId: string, actor?: YoutubeActor) {
  const task = await getYoutubeTaskOrThrow(taskId, actor);
  assertTaskMutable(task, actor);
  const activeBatches = await getActiveSearchBatches(taskId);
  const abortResults = await Promise.all(activeBatches
    .filter((batch) => Boolean(batch.apifyRunId))
    .map((batch) => tryAbortApifyRun(batch.apifyRunId || "")));

  if (activeBatches.length) {
    await db.update(toolSearchBatches).set({
      status: "Cancelled",
      finishedAt: now(),
      updatedAt: now(),
    }).where(and(eq(toolSearchBatches.taskId, task.id), inArray(toolSearchBatches.status, ["Pending", "Running"])));
  }
  await db.update(youtubeCollectionUnits).set({
    status: "Cancelled",
    runningExpiresAt: now(),
    cancelledAt: now(),
    updatedAt: now(),
  }).where(and(eq(youtubeCollectionUnits.taskId, task.id), inArray(youtubeCollectionUnits.status, ["Running", "Paused"])));

  const [updatedTask] = await db.update(toolTasks).set({
    status: "Reviewing",
    updatedAt: now(),
  }).where(eq(toolTasks.id, task.id)).returning();

  const abortWarning = abortResults.find((result) => result.warning)?.warning;
  const warning = abortWarning || (activeBatches.some((batch) => !batch.apifyRunId)
    ? "Run cancelled in BlackDog. If an external Apify run was already started and no run id was stored, usage may still be counted."
    : "");

  await writeYoutubeAuditLog({ taskId, action: "unit_run_cancelled", actor, before: publicTaskSnapshot(task), after: publicTaskSnapshot(updatedTask) });

  return {
    task: updatedTask,
    cancelledBatchCount: activeBatches.length,
    hasApifyRunId: activeBatches.some((batch) => Boolean(batch.apifyRunId)),
    warning,
  };
}

export async function resetStaleYoutubeTaskRun(taskId: string, actor?: YoutubeActor) {
  const task = await getYoutubeTaskOrThrow(taskId, actor);
  assertTaskMutable(task, actor);
  if (task.status !== "Running") {
    return { task, reset: false, activeBatchCount: 0, warning: "" };
  }

  const activeBatches = await getActiveSearchBatches(taskId);
  if (activeBatches.length) {
    return {
      task,
      reset: false,
      activeBatchCount: activeBatches.length,
      warning: "Active batches still exist. Pause or cancel the run instead.",
    };
  }

  const [updatedTask] = await db.update(toolTasks).set({
    status: "Reviewing",
    updatedAt: now(),
  }).where(eq(toolTasks.id, task.id)).returning();

  return {
    task: updatedTask,
    reset: true,
    activeBatchCount: 0,
    warning: "Stale Running task was reset to Reviewing.",
  };
}

export async function deleteYoutubeTask(taskId: string, actor?: YoutubeActor) {
  const task = await getYoutubeTaskOrThrow(taskId, actor);
  assertTaskMutable(task, actor);
  if (task.status === "Running") {
    throw new Error("Pause or cancel the active run before deleting this task.");
  }

  const [deletedTask] = await db.update(toolTasks).set({
    status: "Deleted",
    deletedAt: now(),
    deletedBy: actor?.id || null,
    updatedAt: now(),
  }).where(eq(toolTasks.id, task.id)).returning();
  await writeYoutubeAuditLog({ taskId, action: "task_deleted", actor, before: publicTaskSnapshot(task), after: publicTaskSnapshot(deletedTask) });

  return deletedTask;
}

export async function createYoutubeSearchBatch(task: YoutubeTask, input: YoutubeBatchCreateInput, actor?: YoutubeActor) {
  const keywords = dedupeKeywords(Array.isArray(input.keywords) ? input.keywords : []).filter((item) => item.selected !== false);
  if (keywords.length === 0) throw new Error("At least one keyword is required.");

  const requestedCount = parsePositiveInteger(input.totalTargetResults, keywords.length * 10);
  const primaryKeyword = keywords[0];
  const unitId = cleanText(primaryKeyword.unitId);
  if (unitId) {
    const [unit] = await db.select().from(youtubeCollectionUnits).where(eq(youtubeCollectionUnits.id, unitId)).limit(1);
    if (!unit) throw new Error("Collection unit was not found.");
    const lockedByOther = unit.runningBy && unit.runningBy !== actor?.id && unit.runningExpiresAt && unit.runningExpiresAt > now();
    if ((lockedByOther || unit.status === "Running") && !isYoutubeAdmin(actor || { id: "", email: "", role: "member" }) && unit.runningBy !== actor?.id) {
      throw new Error(`This unit is running by ${unit.runningByEmail || "another user"}.`);
    }
  }
  const [batch] = await db.insert(toolSearchBatches).values({
    id: input.batchId || undefined,
    taskId: task.id,
    unitId: unitId || null,
    batchName: cleanText(input.batchName) || null,
    status: "Running",
    requestedCount,
    keywords: keywords.map((item) => ({
      keyword: item.keyword,
      source: item.source,
      language: item.language,
      domain: item.domain,
      searchTarget: item.searchTarget,
      groupKey: item.groupKey,
      unitId: item.unitId,
      unitLabel: item.unitLabel,
      publishedWithinMonths: input.publishedWithinMonths ?? null,
      publishedDateRangeLabel: cleanText(input.publishedDateRangeLabel) || "Any time",
    })),
    publishedWithinMonths: parseNullableInteger(input.publishedWithinMonths),
    publishedDateRangeLabel: cleanText(input.publishedDateRangeLabel) || task.publishedDateRangeLabel || "Any time",
    startedAt: now(),
  }).returning();
  if (unitId) {
    await db.update(youtubeCollectionUnits).set({
      status: "Running",
      runningBy: actor?.id || null,
      runningByEmail: actor?.email || null,
      runningStartedAt: now(),
      runningExpiresAt: minutesFromNow(UNIT_RUN_LOCK_MINUTES),
      startedAt: now(),
      updatedAt: now(),
    }).where(eq(youtubeCollectionUnits.id, unitId));
  }
  await writeYoutubeAuditLog({ taskId: task.id, unitId: unitId || null, action: "unit_run_started", actor, after: { batchId: batch.id, requestedCount } });

  return { batch, keywords, requestedCount };
}

async function getYoutubeSearchBatchOrThrow(batchId: string) {
  const [batch] = await db.select().from(toolSearchBatches).where(eq(toolSearchBatches.id, batchId)).limit(1);
  if (!batch) throw new Error("YouTube search batch was not found.");
  return batch;
}

export async function cancelYoutubeSearchBatch(batchId: string, actor?: YoutubeActor) {
  const batch = await getYoutubeSearchBatchOrThrow(batchId);
  const task = await getYoutubeTaskOrThrow(batch.taskId, actor);
  assertTaskMutable(task, actor);
  const cancellableStatuses: ToolSearchBatchStatus[] = ["Pending", "Running"];

  if (!cancellableStatuses.includes(batch.status)) {
    return batch;
  }

  const abortResult = batch.apifyRunId ? await tryAbortApifyRun(batch.apifyRunId) : null;
  const [updatedBatch] = await db.update(toolSearchBatches).set({
    status: "Cancelled",
    errorMessage: abortResult?.warning || null,
    finishedAt: now(),
    updatedAt: now(),
  }).where(eq(toolSearchBatches.id, batchId)).returning();
  if (updatedBatch.unitId) {
    await db.update(youtubeCollectionUnits).set({
      status: "Cancelled",
      runningExpiresAt: now(),
      cancelledAt: now(),
      updatedAt: now(),
    }).where(eq(youtubeCollectionUnits.id, updatedBatch.unitId));
  }
  await writeYoutubeAuditLog({ taskId: batch.taskId, unitId: updatedBatch.unitId, action: "unit_run_cancelled", actor, after: { batchId } });

  return updatedBatch;
}

async function findExistingResult(taskId: string, videoId: string, normalizedVideoUrl: string) {
  const clauses = [eq(youtubeResults.taskId, taskId)];
  if (videoId) {
    clauses.push(eq(youtubeResults.videoId, videoId));
  } else {
    clauses.push(eq(youtubeResults.normalizedVideoUrl, normalizedVideoUrl));
  }

  const [existing] = await db.select().from(youtubeResults).where(and(...clauses)).limit(1);
  return existing;
}

export async function saveYoutubeBatchResultsWithDedup(args: {
  taskId: string;
  batchId: string;
  results: Array<{
    searchKeyword: string;
    keywordSource: string;
    title: string;
    videoUrl: string;
    channelName: string;
    channelUrl: string;
    duration: string;
    viewCount: string;
    publishedDate: string;
    videoType: string;
    description?: string;
    category?: string;
    youtubeTags?: string[];
    hashtags?: string[];
    thumbnailUrl?: string;
    likeCount?: string;
    commentCount?: string;
  }>;
}) {
  let duplicateCount = 0;
  let uniqueAddedCount = 0;
  const batch = await getYoutubeSearchBatchOrThrow(args.batchId);
  const batchKeywords = Array.isArray(batch.keywords) ? batch.keywords : [];
  const keywordMetadata = new Map(batchKeywords.map((keyword) => [keyword.keyword, keyword]));

  for (const result of args.results) {
    const latestBatch = await getYoutubeSearchBatchOrThrow(args.batchId);
    if (latestBatch.status === "Cancelled") {
      break;
    }

    const videoId = extractYouTubeVideoId(result.videoUrl);
    const normalizedVideoUrl = normalizeYouTubeUrl(result.videoUrl);
    const existing = await findExistingResult(args.taskId, videoId, normalizedVideoUrl);
    const metadata = keywordMetadata.get(result.searchKeyword);
    const unitId = metadata?.unitId || batch.unitId || null;
    const matchValues = {
      taskId: args.taskId,
      batchId: args.batchId,
      unitId,
      searchKeyword: result.searchKeyword,
      keyword: result.searchKeyword,
      keywordSource: result.keywordSource,
      language: metadata?.language || null,
      domain: metadata?.domain || null,
      searchTarget: metadata?.searchTarget || null,
      matchReason: existing ? "Existing canonical video matched by keyword" : "First matched source",
      matchedAt: now(),
    };

    if (existing) {
      duplicateCount += 1;
      const matchedKeywords = mergeStrings(existing.matchedKeywords, result.searchKeyword);
      const matchedBatchIds = mergeStrings(existing.matchedBatchIds, args.batchId);

      await db.update(youtubeResults).set({
        duplicateCount: (existing.duplicateCount || 0) + 1,
        matchedKeywords,
        matchedBatchIds,
        updatedAt: now(),
      }).where(eq(youtubeResults.id, existing.id));

      await db.insert(youtubeResultMatches).values({
        resultId: existing.id,
        ...matchValues,
      });
      await assignPrimaryUnitForResult(args.taskId, existing.id);
      continue;
    }

    const [inserted] = await db.insert(youtubeResults).values({
      taskId: args.taskId,
      primaryUnitId: unitId,
      primaryUnitSetBy: "system",
      primaryUnitReason: unitId ? "First matched source" : "No matched unit metadata available",
      primaryUnitUpdatedAt: now(),
      videoId: videoId || null,
      videoUrl: result.videoUrl,
      normalizedVideoUrl,
      title: result.title || null,
      channelName: result.channelName || null,
      channelUrl: result.channelUrl || null,
      duration: result.duration || null,
      viewCount: result.viewCount || null,
      likeCount: parseOptionalCount(result.likeCount),
      commentCount: parseOptionalCount(result.commentCount),
      publishedDate: result.publishedDate || null,
      videoType: result.videoType || null,
      category: result.category || null,
      description: result.description || null,
      thumbnailUrl: result.thumbnailUrl || null,
      metadata: {
        youtubeTags: Array.isArray(result.youtubeTags) ? result.youtubeTags : [],
        hashtags: Array.isArray(result.hashtags) ? result.hashtags : [],
        category: result.category || "",
        description: result.description || "",
        thumbnailUrl: result.thumbnailUrl || "",
        likeCount: result.likeCount || null,
        commentCount: result.commentCount || null,
        tagsUnavailable: !Array.isArray(result.youtubeTags) || result.youtubeTags.length === 0,
      },
      matchedKeywords: [result.searchKeyword],
      matchedBatchIds: [args.batchId],
    }).returning();

    uniqueAddedCount += 1;
    await db.insert(youtubeResultMatches).values({
      resultId: inserted.id,
      ...matchValues,
    });
    if (!unitId) await assignPrimaryUnitForResult(args.taskId, inserted.id);
  }

  await refreshYoutubeCollectionUnitStats(args.taskId);

  return {
    returnedCount: args.results.length,
    duplicateCount,
    uniqueAddedCount,
  };
}

export async function runYoutubeTaskBatch(taskId: string, input: YoutubeBatchCreateInput, actor?: YoutubeActor) {
  const task = await getYoutubeTaskOrThrow(taskId, actor);
  assertTaskMutable(task, actor);
  assertTaskNotCompleted(task);
  const { batch, keywords, requestedCount } = await createYoutubeSearchBatch(task, input, actor);
  const token = process.env.APIFY_API_TOKEN;
  const actorId = process.env.APIFY_YOUTUBE_ACTOR_ID || "streamers/youtube-scraper";

  if (task.status === "Draft" || task.status === "Reviewing" || task.status === "Running") {
    await db.update(toolTasks).set({ status: "Running", updatedAt: now() }).where(eq(toolTasks.id, task.id));
  }

  if (!token) {
    await db.update(toolSearchBatches).set({
      status: "Failed",
      errorMessage: "Apify YouTube search is not configured.",
      finishedAt: now(),
      updatedAt: now(),
    }).where(eq(toolSearchBatches.id, batch.id));
    await db.update(toolTasks).set({ status: "Reviewing", updatedAt: now() }).where(eq(toolTasks.id, task.id));
    throw new Error("Apify YouTube search is not configured.");
  }

  try {
    const perKeywordLimit = Math.max(1, Math.ceil(requestedCount / keywords.length));
    const results = await runApifyYoutubeSearch({
      token,
      actorId,
      language: task.language,
      domain: task.domain,
      searchTargets: task.searchTargets,
      keywords,
      maxResultsPerKeyword: perKeywordLimit,
      dedupeResults: false,
      onRunStarted: async (runId) => {
        await db.update(toolSearchBatches).set({
          apifyRunId: runId,
          updatedAt: now(),
        }).where(eq(toolSearchBatches.id, batch.id));
      },
    });

    const latestBatch = await getYoutubeSearchBatchOrThrow(batch.id);
    if (latestBatch.status === "Cancelled") {
      const summary = await getYoutubeTaskSummary(task.id);
      return {
        batch: latestBatch,
        summary: {
          requestedCount,
          returnedCount: 0,
          duplicateCount: 0,
          uniqueAddedCount: 0,
          taskUniqueResults: summary.uniqueResults,
        },
      };
    }

    const { acceptedResults, filteredByDateCount } = filterResultsByPublishedRange(results, input.publishedWithinMonths);

    const dedupStats = await saveYoutubeBatchResultsWithDedup({
      taskId: task.id,
      batchId: batch.id,
      results: acceptedResults,
    });

    const batchAfterSave = await getYoutubeSearchBatchOrThrow(batch.id);
    if (batchAfterSave.status === "Cancelled") {
      const summary = await getYoutubeTaskSummary(task.id);
      return {
        batch: batchAfterSave,
        summary: {
          requestedCount,
          returnedCount: results.length,
          acceptedCount: acceptedResults.length,
          filteredByDateCount,
          duplicateCount: 0,
          uniqueAddedCount: 0,
          taskUniqueResults: summary.uniqueResults,
        },
      };
    }

    const [updatedBatch] = await db.update(toolSearchBatches).set({
      status: "Succeeded",
      returnedCount: results.length,
      acceptedCount: acceptedResults.length,
      filteredByDateCount,
      duplicateCount: dedupStats.duplicateCount,
      uniqueAddedCount: dedupStats.uniqueAddedCount,
      finishedAt: now(),
      updatedAt: now(),
    }).where(eq(toolSearchBatches.id, batch.id)).returning();
    if (updatedBatch.unitId) {
      await db.update(youtubeCollectionUnits).set({
        status: "Completed",
        runningExpiresAt: now(),
        completedAt: now(),
        updatedAt: now(),
      }).where(eq(youtubeCollectionUnits.id, updatedBatch.unitId));
    }

    const latestTask = await getYoutubeTaskOrThrow(task.id);
    if (latestTask.status === "Draft" || latestTask.status === "Running") {
      await db.update(toolTasks).set({ status: "Reviewing", updatedAt: now() }).where(eq(toolTasks.id, task.id));
    }

    const summary = await getYoutubeTaskSummary(task.id);
    return {
      batch: updatedBatch,
      summary: {
        requestedCount,
        returnedCount: results.length,
        acceptedCount: acceptedResults.length,
        filteredByDateCount,
        duplicateCount: dedupStats.duplicateCount,
        uniqueAddedCount: dedupStats.uniqueAddedCount,
        taskUniqueResults: summary.uniqueResults,
      },
    };
  } catch (error) {
    const latestBatch = await getYoutubeSearchBatchOrThrow(batch.id);
    if (latestBatch.status !== "Cancelled") {
      await db.update(toolSearchBatches).set({
        status: "Failed",
        errorMessage: error instanceof Error ? error.message : "YouTube search failed.",
        finishedAt: now(),
        updatedAt: now(),
      }).where(eq(toolSearchBatches.id, batch.id));
    }
    const latestTask = await getYoutubeTaskOrThrow(task.id);
    if (latestTask.status === "Running") {
      await db.update(toolTasks).set({ status: "Reviewing", updatedAt: now() }).where(eq(toolTasks.id, task.id));
    }
    if (latestBatch.unitId) {
      await db.update(youtubeCollectionUnits).set({
        status: "Failed",
        runningExpiresAt: now(),
        updatedAt: now(),
      }).where(eq(youtubeCollectionUnits.id, latestBatch.unitId));
    }
    await refreshYoutubeCollectionUnitStats(task.id);
    throw new Error("Unable to run YouTube search batch.");
  }
}

export async function updateYoutubeResult(resultId: string, patch: { status?: string; notes?: string | null }, actor?: YoutubeActor) {
  const [existing] = await db.select().from(youtubeResults).where(eq(youtubeResults.id, resultId)).limit(1);
  if (!existing) throw new Error("YouTube result was not found.");
  const task = await getYoutubeTaskOrThrow(existing.taskId, actor);
  assertTaskMutable(task, actor);
  assertTaskNotCompleted(task);
  const values: Partial<typeof youtubeResults.$inferInsert> = { updatedAt: now() };

  if (patch.status !== undefined) {
    if (!RESULT_STATUSES.includes(patch.status as YoutubeDbResultStatus)) throw new Error("Invalid result status.");
    values.status = patch.status as YoutubeDbResultStatus;
  }
  if (patch.notes !== undefined) values.notes = patch.notes;

  const [result] = await db.update(youtubeResults).set(values).where(eq(youtubeResults.id, resultId)).returning();
  if (!result) throw new Error("YouTube result was not found.");
  await writeYoutubeAuditLog({
    taskId: result.taskId,
    resultId,
    action: "task_updated",
    actor,
    before: { status: existing.status, notes: existing.notes },
    after: { status: result.status, notes: result.notes },
  });
  return result;
}

export async function softDeleteYoutubeResult(resultId: string, actor?: YoutubeActor) {
  const [existing] = await db.select().from(youtubeResults).where(eq(youtubeResults.id, resultId)).limit(1);
  if (!existing) throw new Error("YouTube result was not found.");
  const task = await getYoutubeTaskOrThrow(existing.taskId, actor);
  assertTaskMutable(task, actor);
  assertTaskNotCompleted(task);
  const [result] = await db.update(youtubeResults).set({
    deletedAt: now(),
    updatedAt: now(),
  }).where(eq(youtubeResults.id, resultId)).returning();

  if (!result) throw new Error("YouTube result was not found.");
  await writeYoutubeAuditLog({
    taskId: result.taskId,
    resultId,
    action: "task_updated",
    actor,
    before: { deletedAt: existing.deletedAt },
    after: { deletedAt: result.deletedAt },
  });
  return result;
}

export async function exportYoutubeTaskCsv(taskId: string, filters: YoutubeResultFilters = {}, actor?: YoutubeActor) {
  const task = await getYoutubeTaskOrThrow(taskId, actor);
  if (actor && !isYoutubeAdmin(actor) && !isYoutubeTaskOwner(task, actor)) {
    throw new Error("You do not have permission to export this task.");
  }
  if (task.status === "Deleted" && !isYoutubeAdmin(actor || { id: "", email: "", role: "member" })) {
    throw new Error("You do not have permission to export this task.");
  }
  const rows = await getYoutubeTaskResults(taskId, { ...filters, limit: 5000, includeDeleted: false }, actor);
  const headers = [
    "Task Name",
    "Published Date Range",
    "Primary Unit",
    "Primary Language",
    "Primary Domain",
    "Primary Search Target",
    "Primary Unit Assignment Reason",
    "Primary Unit Set By",
    "Matched Source Units",
    "Matched Source Keywords",
    "Keyword Sources",
    "Matched Source Count",
    "Video URL",
    "Title",
    "Channel Name",
    "Channel URL",
    "Duration",
    "View Count",
    "Like Count",
    "Comment Count",
    "Published Date",
    "YouTube Tags",
    "Hashtags",
    "Category",
    "Description",
    "Preferred Video Quality",
    "Status",
    "Notes",
    "Duplicate Count",
    "Created At",
  ];

  const csvRows = rows.filter((row) => !filters.q || rowMatchesQ(row, filters.q)).map((row) => {
    const metadata = row.metadata || {};
    return [
      task.name,
      row.matchedPublishedDateRanges.join("; ") || task.publishedDateRangeLabel || "Any time",
      row.primaryUnitLabel,
      row.primaryLanguage,
      row.primaryDomain,
      row.primarySearchTarget,
      row.primaryUnitReason,
      row.primaryUnitSetBy,
      row.matchedUnits.join("; "),
      Array.isArray(row.matchedKeywords) ? row.matchedKeywords.join("; ") : "",
      row.matchedKeywordSources.join("; "),
      row.matchedSourcesCount,
      row.videoUrl,
      row.title,
      row.channelName,
      row.channelUrl,
      row.duration,
      row.viewCount,
      row.likeCount ?? metadata.likeCount ?? "",
      row.commentCount ?? metadata.commentCount ?? "",
      row.publishedDate,
      Array.isArray(metadata.youtubeTags) ? metadata.youtubeTags.join("; ") : "",
      Array.isArray(metadata.hashtags) ? metadata.hashtags.join("; ") : "",
      metadata.category || "",
      metadata.description || "",
      filters.preferredVideoQuality || "Any",
      row.status,
      row.notes,
      row.duplicateCount,
      row.createdAt.toISOString(),
    ];
  });

  const csv = [
    headers.map(escapeCsvValue).join(","),
    ...csvRows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");

  await db.insert(toolExports).values({
    taskId,
    exportType: filters.status || filters.q ? "csv_filtered" : "csv_all",
    rowCount: csvRows.length,
    createdBy: actor?.id || null,
  });
  await writeYoutubeAuditLog({ taskId, action: "export_created", actor, after: { rowCount: csvRows.length } });

  return { csv, rowCount: csvRows.length, task };
}

export async function getYoutubeUsageSummary(taskId?: string | null, actor?: YoutubeActor) {
  if (taskId) await getYoutubeTaskOrThrow(taskId, actor);
  const today = now();
  today.setHours(0, 0, 0, 0);
  const userClause = actor && !isYoutubeAdmin(actor)
    ? sql`${toolTasks.ownerId} = ${actor.id} or ${toolTasks.createdBy} = ${actor.id}`
    : sql`true`;

  const [todayTotals] = await db.select({
    todayRuns: count(),
    todayRequested: sql<number>`coalesce(sum(${toolSearchBatches.requestedCount}), 0)::int`,
    todayReturned: sql<number>`coalesce(sum(${toolSearchBatches.returnedCount}), 0)::int`,
    todayAccepted: sql<number>`coalesce(sum(${toolSearchBatches.acceptedCount}), 0)::int`,
    todayUniqueAdded: sql<number>`coalesce(sum(${toolSearchBatches.uniqueAddedCount}), 0)::int`,
  }).from(toolSearchBatches)
    .innerJoin(toolTasks, eq(toolSearchBatches.taskId, toolTasks.id))
    .where(and(sql`${toolSearchBatches.createdAt} >= ${today}`, userClause));

  const [taskTotals] = taskId ? await db.select({
    taskRuns: count(),
    taskRequested: sql<number>`coalesce(sum(${toolSearchBatches.requestedCount}), 0)::int`,
    taskReturned: sql<number>`coalesce(sum(${toolSearchBatches.returnedCount}), 0)::int`,
    taskAccepted: sql<number>`coalesce(sum(${toolSearchBatches.acceptedCount}), 0)::int`,
    taskUniqueAdded: sql<number>`coalesce(sum(${toolSearchBatches.uniqueAddedCount}), 0)::int`,
  }).from(toolSearchBatches).where(eq(toolSearchBatches.taskId, taskId)) : [{
    taskRuns: 0,
    taskRequested: 0,
    taskReturned: 0,
    taskAccepted: 0,
    taskUniqueAdded: 0,
  }];

  return {
    todayRuns: todayTotals?.todayRuns || 0,
    todayRequested: todayTotals?.todayRequested || 0,
    todayReturned: todayTotals?.todayReturned || 0,
    todayAccepted: todayTotals?.todayAccepted || 0,
    todayUniqueAdded: todayTotals?.todayUniqueAdded || 0,
    taskRuns: taskTotals?.taskRuns || 0,
    taskRequested: taskTotals?.taskRequested || 0,
    taskReturned: taskTotals?.taskReturned || 0,
    taskAccepted: taskTotals?.taskAccepted || 0,
    taskUniqueAdded: taskTotals?.taskUniqueAdded || 0,
  };
}

export async function getResultsByIds(ids: string[]) {
  if (!ids.length) return [];
  return db.select().from(youtubeResults).where(inArray(youtubeResults.id, ids));
}
