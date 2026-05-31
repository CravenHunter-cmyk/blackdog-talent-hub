"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { dedupeKeywords, normalizeKeyword } from "@/lib/tools/keywordUtils";
import {
  YOUTUBE_RESULT_STORAGE_KEY,
  buildUnitLabel,
  defaultPublishedDateRange,
  domainOptions,
  getPublishedDateRangeFromOption,
  languageOptions,
  normalizeSearchTargets,
  preferredVideoQualityOptions,
  publishedDateRangeOptions,
  buildKeywordGroupKey,
  searchTargetOptions,
  statusOptions,
  type AllocationMode,
  type PreferredVideoQuality,
  type PublishedDateRange,
  type YoutubeCollectionUnit,
  type YoutubeKeyword,
  type YoutubeResultStatus,
  type YoutubeSpeechResult,
} from "@/lib/tools/youtubeTypes";
import { YoutubeKeywordBuilder } from "./YoutubeKeywordBuilder";
import { YoutubeResultsTable } from "./YoutubeResultsTable";

type TabKey = "workspace" | "history";
type TaskStatus = "Draft" | "Running" | "Paused" | "Reviewing" | "Completed" | "Deleted";

type DbTask = {
  id: string;
  toolType: string;
  name: string;
  language: string;
  domain: string;
  searchTargets: string[];
  targetUniqueResults: number | null;
  publishedDateRangeLabel: string | null;
  publishedWithinMonths: number | null;
  status: TaskStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  archivedAt: string | null;
  deletedAt?: string | null;
  ownerId?: string | null;
  ownerEmail?: string | null;
  visibility?: string | null;
  editingBy?: string | null;
  editingByEmail?: string | null;
  editingExpiresAt?: string | null;
};

type DbBatch = {
  id: string;
  batchName: string | null;
  status: string;
  requestedCount: number | null;
  returnedCount: number;
  acceptedCount?: number;
  filteredByDateCount?: number;
  duplicateCount: number;
  uniqueAddedCount: number;
  unitId?: string | null;
  publishedDateRangeLabel?: string | null;
  publishedWithinMonths?: number | null;
  keywords: Array<{ keyword: string; source: string; language?: string; domain?: string; searchTarget?: string; unitId?: string; unitLabel?: string; groupKey?: string; publishedWithinMonths?: number | null; publishedDateRangeLabel?: string | null }>;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

type DbResult = {
  id: string;
  taskId: string;
  videoId: string | null;
  videoUrl: string;
  normalizedVideoUrl: string | null;
  title: string | null;
  channelName: string | null;
  channelUrl: string | null;
  duration: string | null;
  viewCount: string | null;
  likeCount?: number | null;
  commentCount?: number | null;
  publishedDate: string | null;
  videoType: string | null;
  category?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  status: YoutubeResultStatus;
  notes: string | null;
  duplicateCount: number;
  matchedKeywords: string[] | null;
  matchedBatchIds: string[] | null;
  matchedUnits?: string[];
  matchedLanguages?: string[];
  matchedDomains?: string[];
  matchedSearchTargets?: string[];
  matchedPublishedDateRanges?: string[];
  primaryUnitId?: string;
  primaryUnitLabel?: string;
  primaryLanguage?: string;
  primaryDomain?: string;
  primarySearchTarget?: string;
  primaryUnitSetBy?: "system" | "user";
  primaryUnitReason?: string;
  metadata?: {
    youtubeTags?: string[];
    hashtags?: string[];
    category?: string;
    description?: string;
    thumbnailUrl?: string;
    likeCount?: string | number | null;
    commentCount?: string | number | null;
    tagsUnavailable?: boolean;
  } | null;
  matchedSourcesCount?: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Summary = {
  totalCollected: number;
  duplicatesRemoved: number;
  uniqueResults: number;
  pendingCount: number;
  usefulCount: number;
  notUsefulCount: number;
  processedCount: number;
  deletedCount: number;
};

type TaskWithSummary = {
  task: DbTask;
  summary: Summary;
};

type DuplicateMatch = {
  matchId: string;
  unitId: string;
  unitLabel: string;
  language: string;
  domain: string;
  searchTarget: string;
  keyword: string;
  keywordSource: string;
  batchId: string;
  run: string;
  detectedAt: string;
  reason: string;
};

type DuplicateGroup = {
  groupId: string;
  groupType: "confirmed_video_duplicate" | "match_provenance";
  reason: string;
  canonicalResult: DbResult;
  duplicateCount: number;
  candidates: DbResult[];
  entries: DbResult[];
  matches: DuplicateMatch[];
  reviewed: boolean;
  provenanceOnly?: boolean;
};

type SuspectedDuplicateGroup = {
  groupId: string;
  groupType: "suspected_video_duplicate";
  reason: string;
  similarityScore: number;
  recommendedKeepResultId: string;
  candidates: DbResult[];
  results: DbResult[];
  reviewed: boolean;
};

type DuplicateSummary = {
  confirmedGroups: number;
  confirmedDuplicates: number;
  suspectedGroups: number;
  suspectedResults: number;
};

type MatchedSourcesSummary = {
  videosWithMultipleSources: number;
  totalMatchedSources: number;
};

type SuspectedDecision = {
  keepResultId: string;
  deleteResultIds: string[];
};

type ConfirmDialogState =
  | { type: "start-new" }
  | { type: "complete"; task: DbTask }
  | { type: "reopen"; task: DbTask }
  | { type: "clean-confirmed" }
  | { type: "apply-duplicate-decision"; groupId: string }
  | null;

type TabFilters = {
  status: string;
  q: string;
};

type TaskBriefAnalysis = {
  taskName: string;
  languages: string[];
  domains: string[];
  searchTargets: string[];
  targetUniqueResults: number | null;
  targetHours?: number | null;
  allocationMode?: AllocationMode;
  allocationRatios?: Record<string, number>;
  unitTargetHoursHint?: {
    min?: number | null;
    max?: number | null;
    suggested?: number | null;
  } | null;
  preferredVideoQuality: PreferredVideoQuality;
  publishedDateRange?: PublishedDateRange | null;
  useAIKeywordExpansion: boolean;
  confidence: number;
  warnings: string[];
};

const emptySummary: Summary = {
  totalCollected: 0,
  duplicatesRemoved: 0,
  uniqueResults: 0,
  pendingCount: 0,
  usefulCount: 0,
  notUsefulCount: 0,
  processedCount: 0,
  deletedCount: 0,
};

const historyStatusOptions = [
  { label: "All Active", value: "active" },
  { label: "Draft", value: "Draft" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "Completed" },
  { label: "Deleted", value: "Deleted" },
  { label: "All", value: "all" },
] as const;

function readStoredResults() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(YOUTUBE_RESULT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as YoutubeSpeechResult[];
    return Array.isArray(parsed)
      ? parsed.map((row) => ({ ...row, searchTargets: normalizeSearchTargets(row.searchTargets, row.speechType) }))
      : [];
  } catch {
    return [];
  }
}

function uniqueArray(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function splitMultiText(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function getBatchPrimaryKeyword(batch: DbBatch) {
  return Array.isArray(batch.keywords) ? batch.keywords[0] : undefined;
}

function buildDisplayUnitLabel(unit: YoutubeCollectionUnit, index: number) {
  return `Unit ${index + 1} · ${buildUnitLabel(unit)}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function statusBadgeClass(status: TaskStatus) {
  if (status === "Completed") return "border-[#bad7c6] bg-[#eef8f1] text-[#1f5c43]";
  if (status === "Running" || status === "Paused") return "border-[#bad7c6] bg-[#e8f7ed] text-[#1f5c43]";
  if (status === "Deleted") return "border-[#d7cec0] bg-[#f4f1ec] text-[#6f6256]";
  if (status === "Reviewing") return "border-[#b9d4e8] bg-[#eef7ff] text-[#245b7a]";
  return "border-[#d7cec0] bg-white text-[#6f6256]";
}

function displayTaskStatus(status: TaskStatus) {
  if (status === "Completed") return "Completed";
  if (status === "Deleted") return "Deleted";
  if (status === "Draft" || status === "Reviewing") return "Draft";
  return "In Progress";
}

function buildTaskName(languages: string[], domains: string[], targets: string[]) {
  if (!languages.length || !domains.length || !targets.length) return "";
  const more = languages.length + domains.length + targets.length > 3 ? " + More" : "";
  return `${languages[0]} - ${domains[0]} - ${targets[0]}${more} Collection`;
}

function buildCollectionUnits(args: {
  languages: string[];
  domains: string[];
  searchTargets: string[];
  targetUniqueResults: number;
  targetHours: number | null;
  allocationMode: AllocationMode;
  allocationRatios?: Record<string, number>;
  existingUnits?: YoutubeCollectionUnit[];
}) {
  const existingById = new Map((args.existingUnits || []).map((unit) => [unit.id, unit]));
  const unitCount = Math.max(args.languages.length * args.domains.length * args.searchTargets.length, 1);
  const domainCount = Math.max(args.languages.length * args.domains.length, 1);
  const targetsPerDomain = Math.max(args.searchTargets.length, 1);
  const evenResults = args.targetUniqueResults > 0 ? Math.max(1, Math.ceil(args.targetUniqueResults / unitCount)) : 0;
  const evenDomainResults = args.targetUniqueResults > 0 ? Math.max(1, Math.ceil(Math.ceil(args.targetUniqueResults / domainCount) / targetsPerDomain)) : 0;
  const evenHours = args.targetHours ? Number((args.targetHours / unitCount).toFixed(2)) : null;
  const evenDomainHours = args.targetHours ? Number(((args.targetHours / domainCount) / targetsPerDomain).toFixed(2)) : null;

  return args.languages.flatMap((language) => args.domains.flatMap((domain) => args.searchTargets.map((searchTarget) => {
    const id = buildKeywordGroupKey(language, domain, searchTarget);
    const existing = existingById.get(id);
    const ratio = args.allocationRatios?.[searchTarget];
    const targetResults = ratio
      ? args.targetUniqueResults > 0 ? Math.max(1, Math.ceil((args.targetUniqueResults / domainCount) * ratio)) : 0
      : args.allocationMode === "Even by Domain" ? evenDomainResults : evenResults;
    const targetHours = ratio && args.targetHours
      ? Number(((args.targetHours / domainCount) * ratio).toFixed(2))
      : args.allocationMode === "Even by Domain" ? evenDomainHours : evenHours;

    return {
      id,
      language,
      domain,
      searchTarget,
      targetResults: existing?.customTargetResults ? existing.targetResults : targetResults,
      targetHours: existing?.customTargetHours ? existing.targetHours : targetHours,
      status: existing?.status || "Pending",
      collectedResults: existing?.collectedResults || 0,
      uniqueResults: existing?.uniqueResults || 0,
      duplicateCount: existing?.duplicateCount || 0,
      keywordCount: existing?.keywordCount || 0,
      progress: existing?.progress || 0,
      customTargetResults: existing?.customTargetResults || false,
      customTargetHours: existing?.customTargetHours || false,
      createdAt: existing?.createdAt,
      updatedAt: existing?.updatedAt,
    } satisfies YoutubeCollectionUnit;
  })));
}

function buildUnitPlanSignature(args: {
  languages: string[];
  domains: string[];
  searchTargets: string[];
  targetUniqueResults: number;
  targetHours: number | null;
  allocationMode: AllocationMode;
  allocationRatios: Record<string, number>;
}) {
  return JSON.stringify({
    languages: args.languages,
    domains: args.domains,
    searchTargets: args.searchTargets,
    targetUniqueResults: args.targetUniqueResults,
    targetHours: args.targetHours,
    allocationMode: args.allocationMode,
    allocationRatios: args.allocationRatios,
  });
}

function normalizeDbUnit(unit: Partial<YoutubeCollectionUnit> & {
  targetResults?: number | null;
  targetHours?: number | string | null;
  primaryUniqueCount?: number;
  matchedSourcesCount?: number;
  unitIndex?: number;
  runningBy?: string | null;
  runningByEmail?: string | null;
  runningStartedAt?: string | null;
  runningExpiresAt?: string | null;
}): YoutubeCollectionUnit {
  const targetResults = Number(unit.targetResults || 0);
  const rawTargetHours = unit.targetHours as unknown;
  const targetHours = rawTargetHours === null || rawTargetHours === undefined || rawTargetHours === ""
    ? null
    : Number(rawTargetHours);
  const uniqueResults = Number(unit.primaryUniqueCount ?? unit.uniqueResults ?? 0);
  return {
    id: String(unit.id || buildKeywordGroupKey(unit.language || "", unit.domain || "", unit.searchTarget || "")),
    taskId: unit.taskId,
    unitIndex: unit.unitIndex,
    language: unit.language || "",
    domain: unit.domain || "",
    searchTarget: unit.searchTarget || "",
    targetResults: Number.isFinite(targetResults) ? targetResults : 0,
    targetHours: Number.isFinite(targetHours || 0) && targetHours ? targetHours : null,
    status: unit.status || "Pending",
    selected: Boolean(unit.selected),
    collectedResults: Number(unit.matchedSourcesCount || unit.collectedResults || 0),
    uniqueResults,
    duplicateCount: Number(unit.duplicateCount || 0),
    keywordCount: Number(unit.selectedKeywordCount ?? unit.keywordCount ?? 0),
    selectedKeywordCount: Number(unit.selectedKeywordCount ?? unit.keywordCount ?? 0),
    matchedSourcesCount: Number(unit.matchedSourcesCount || 0),
    runningBy: unit.runningBy || null,
    runningByEmail: unit.runningByEmail || null,
    runningStartedAt: unit.runningStartedAt || null,
    runningExpiresAt: unit.runningExpiresAt || null,
    progress: targetResults > 0 ? Math.min(100, Math.round((uniqueResults / targetResults) * 100)) : 0,
    customTargetResults: Boolean(unit.customTargetResults),
    customTargetHours: Boolean(unit.customTargetHours),
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
  };
}

function serializeUnitsForApi(units: YoutubeCollectionUnit[]) {
  return units.map((unit, index) => ({
    id: unit.id,
    unitIndex: unit.unitIndex ?? index,
    language: unit.language,
    domain: unit.domain,
    searchTarget: unit.searchTarget,
    targetResults: unit.targetResults || null,
    targetHours: unit.targetHours || null,
    status: unit.status,
    selected: Boolean(unit.selected),
    keywordCount: unit.keywordCount || 0,
    selectedKeywordCount: unit.selectedKeywordCount ?? unit.keywordCount ?? 0,
  }));
}

export function YoutubeSpeechLinkCollector() {
  const [activeTab, setActiveTab] = useState<TabKey>("workspace");
  const [taskName, setTaskName] = useState("");
  const [taskNameTouched, setTaskNameTouched] = useState(false);
  const [languages, setLanguages] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [searchTargets, setSearchTargets] = useState<string[]>([]);
  const [targetUniqueResults, setTargetUniqueResults] = useState(0);
  const [targetHours, setTargetHours] = useState<number | null>(null);
  const [allocationMode, setAllocationMode] = useState<AllocationMode>("Even by Unit");
  const [allocationRatios, setAllocationRatios] = useState<Record<string, number>>({});
  const [collectionUnits, setCollectionUnits] = useState<YoutubeCollectionUnit[]>([]);
  const [unitPlanStale, setUnitPlanStale] = useState(false);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [preferredVideoQuality, setPreferredVideoQuality] = useState<PreferredVideoQuality>("Any");
  const [publishedDateRangeOption, setPublishedDateRangeOption] = useState("Any time");
  const [customPublishedMonths, setCustomPublishedMonths] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(true);
  const [currentTask, setCurrentTask] = useState<DbTask | null>(null);
  const [batches, setBatches] = useState<DbBatch[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [dbResults, setDbResults] = useState<DbResult[]>([]);
  const [historyTasks, setHistoryTasks] = useState<TaskWithSummary[]>([]);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [ruleKeywords, setRuleKeywords] = useState<YoutubeKeyword[]>([]);
  const [aiKeywords, setAiKeywords] = useState<YoutubeKeyword[]>([]);
  const [finalKeywords, setFinalKeywords] = useState<YoutubeKeyword[]>([]);
  const [manualKeyword, setManualKeyword] = useState("");
  const [legacyResults, setLegacyResults] = useState<YoutubeSpeechResult[]>(readStoredResults);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [legacyExpanded, setLegacyExpanded] = useState(false);
  const [runLogsExpanded, setRunLogsExpanded] = useState(false);
  const [collectionPlanExpanded, setCollectionPlanExpanded] = useState(true);
  const [taskResultsExpanded, setTaskResultsExpanded] = useState(true);
  const [resultFilters, setResultFilters] = useState<TabFilters>({ status: "", q: "" });
  const [historyFilters, setHistoryFilters] = useState<TabFilters>({ status: "active", q: "" });
  const [message, setMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [batchNotice, setBatchNotice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DbTask | null>(null);
  const [confirmedDuplicateGroups, setConfirmedDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [suspectedDuplicateGroups, setSuspectedDuplicateGroups] = useState<SuspectedDuplicateGroup[]>([]);
  const [matchedSourcesGroups, setMatchedSourcesGroups] = useState<DuplicateGroup[]>([]);
  const [matchedSourcesSummary, setMatchedSourcesSummary] = useState<MatchedSourcesSummary>({ videosWithMultipleSources: 0, totalMatchedSources: 0 });
  const [duplicateSummary, setDuplicateSummary] = useState<DuplicateSummary>({ confirmedGroups: 0, confirmedDuplicates: 0, suspectedGroups: 0, suspectedResults: 0 });
  const [duplicateReviewExpanded, setDuplicateReviewExpanded] = useState(false);
  const [matchedSourcesExpanded, setMatchedSourcesExpanded] = useState(false);
  const [expandedDuplicateGroupId, setExpandedDuplicateGroupId] = useState<string | null>(null);
  const [reviewedDuplicateGroupIds, setReviewedDuplicateGroupIds] = useState<string[]>([]);
  const [suspectedDecisions, setSuspectedDecisions] = useState<Record<string, SuspectedDecision>>({});
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);
  const [loading, setLoading] = useState(false);
  const [runStatus, setRunStatus] = useState<"Idle" | "Running" | "Paused" | "Cancelling">("Idle");
  const [runningBatchId, setRunningBatchId] = useState<string | null>(null);
  const [runningUnitId, setRunningUnitId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefWarnings, setBriefWarnings] = useState<string[]>([]);
  const batchAbortControllerRef = useRef<AbortController | null>(null);
  const runPauseRequestedRef = useRef(false);
  const runCancelRequestedRef = useRef(false);
  const unitPlanSignatureRef = useRef("");
  const toastMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duplicateReviewRef = useRef<HTMLElement | null>(null);
  const historyRequestIdRef = useRef(0);
  const historyCacheRef = useRef<{
    key: string;
    loadedAt: number;
    tasks: TaskWithSummary[];
    hasMore: boolean;
    offset: number;
  } | null>(null);

  useEffect(() => {
    window.localStorage.setItem(YOUTUBE_RESULT_STORAGE_KEY, JSON.stringify(legacyResults));
  }, [legacyResults]);

  useEffect(() => {
    return () => {
      if (toastMessageTimerRef.current) clearTimeout(toastMessageTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const signature = buildUnitPlanSignature({
      languages,
      domains,
      searchTargets,
      targetUniqueResults,
      targetHours,
      allocationMode,
      allocationRatios,
    });

    const timer = window.setTimeout(() => {
      if (!languages.length || !domains.length || !searchTargets.length) {
        setCollectionUnits([]);
        setSelectedUnitIds([]);
        setUnitPlanStale(false);
        unitPlanSignatureRef.current = "";
        return;
      }

      if (unitPlanSignatureRef.current && unitPlanSignatureRef.current !== signature) {
        setUnitPlanStale(true);
        return;
      }

      setCollectionUnits((current) => {
        const nextUnits = buildCollectionUnits({
          languages,
          domains,
          searchTargets,
          targetUniqueResults,
          targetHours,
          allocationMode,
          allocationRatios,
          existingUnits: current,
        });
        const nextIds = new Set(nextUnits.map((unit) => unit.id));
        setSelectedUnitIds((currentIds) => currentIds.filter((id) => nextIds.has(id)));
        unitPlanSignatureRef.current = signature;
        setUnitPlanStale(false);
        return nextUnits;
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [languages, domains, searchTargets, targetUniqueResults, targetHours, allocationMode, allocationRatios]);

  const suggestedTaskName = buildTaskName(languages, domains, searchTargets);
  const visibleTaskName = taskNameTouched ? taskName : suggestedTaskName;

  const currentTaskCompleted = currentTask?.status === "Completed";
  const taskRunLocked = currentTaskCompleted;
  const taskRunLockMessage = "Reopen this task to continue running units.";
  const runInProgress = runStatus === "Running" || runStatus === "Cancelling";
  const publishedDateRange = getPublishedDateRangeFromOption(publishedDateRangeOption, customPublishedMonths);

  function switchToWorkspace() {
    setActiveTab("workspace");
  }

  function switchToHistory() {
    setActiveTab("history");
  }

  function setFriendlyError(prefix: string, error: unknown) {
    setMessage(error instanceof Error ? `${prefix} ${error.message}` : prefix);
  }

  function showTransientMessage(text: string) {
    setToastMessage(text);
    if (toastMessageTimerRef.current) clearTimeout(toastMessageTimerRef.current);
    toastMessageTimerRef.current = setTimeout(() => {
      setToastMessage((current) => (current === text ? "" : current));
      toastMessageTimerRef.current = null;
    }, 2500);
  }

  function validateTaskInputs() {
    if (!languages.length) {
      setMessage("Please select at least one language.");
      return false;
    }
    if (!domains.length) {
      setMessage("Please select at least one domain.");
      return false;
    }
    if (!searchTargets.length) {
      setMessage("Please select at least one search target.");
      return false;
    }
    if (targetUniqueResults <= 0 && !targetHours) {
      setMessage("Set target results or target hours.");
      return false;
    }
    return true;
  }

  function validateTaskDimensions() {
    if (!languages.length) {
      setMessage("Please select at least one language.");
      return false;
    }
    if (!domains.length) {
      setMessage("Please select at least one domain.");
      return false;
    }
    if (!searchTargets.length) {
      setMessage("Please select at least one search target.");
      return false;
    }
    return true;
  }

  function resetForNewTask() {
    setConfirmDialog(null);
    setCurrentTask(null);
    setBatches([]);
    setSummary(emptySummary);
    setDbResults([]);
    setSelectedIds([]);
    setRuleKeywords([]);
    setAiKeywords([]);
    setFinalKeywords([]);
    setManualKeyword("");
    setLanguages([]);
    setDomains([]);
    setSearchTargets([]);
    setCollectionUnits([]);
    setUnitPlanStale(false);
    unitPlanSignatureRef.current = "";
    setSelectedUnitIds([]);
    setTaskName("");
    setTaskNameTouched(false);
    setNotes("");
    setBriefWarnings([]);
    setTargetUniqueResults(0);
    setTargetHours(null);
    setAllocationMode("Even by Unit");
    setAllocationRatios({});
    setPreferredVideoQuality("Any");
    setPublishedDateRangeOption(defaultPublishedDateRange.label);
    setCustomPublishedMonths(null);
    setBatchNotice("");
    setTaskResultsExpanded(true);
    setCollectionPlanExpanded(true);
    setConfirmedDuplicateGroups([]);
    setSuspectedDuplicateGroups([]);
    setMatchedSourcesGroups([]);
    setMatchedSourcesSummary({ videosWithMultipleSources: 0, totalMatchedSources: 0 });
    setDuplicateSummary({ confirmedGroups: 0, confirmedDuplicates: 0, suspectedGroups: 0, suspectedResults: 0 });
    setMatchedSourcesExpanded(false);
    setExpandedDuplicateGroupId(null);
    setReviewedDuplicateGroupIds([]);
    setSuspectedDecisions({});
    setMessage("");
    setRunStatus("Idle");
    setRunningBatchId(null);
    setRunningUnitId(null);
    runPauseRequestedRef.current = false;
    runCancelRequestedRef.current = false;
    batchAbortControllerRef.current = null;
    switchToWorkspace();
    showTransientMessage("New task workspace ready.");
  }

  function requestCreateNewTask() {
    if (runInProgress || currentTask?.status === "Running") {
      setMessage("A run is currently active. Pause or cancel it before starting a new task.");
      return;
    }

    if (!currentTask || currentTask.status === "Completed") {
      resetForNewTask();
      return;
    }

    setConfirmDialog({ type: "start-new" });
  }

  async function readJson<T>(response: Response, fallbackMessage: string): Promise<T> {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) throw new Error("Sign in required to use this tool.");
      throw new Error((payload as { error?: string }).error || fallbackMessage);
    }
    return payload as T;
  }

  async function loadTaskDetail(taskId: string, filters = resultFilters) {
    const detailResponse = await fetch(`/api/tools/youtube-tasks/${taskId}`);
    const detail = await readJson<{ task: DbTask; batches: DbBatch[]; summary: Summary; results: DbResult[]; units?: YoutubeCollectionUnit[] }>(detailResponse, "Failed to load task detail.");
    const query = new URLSearchParams();
    if (filters.status) query.set("status", filters.status);
    if (filters.q.trim()) query.set("q", filters.q.trim());
    query.set("limit", "200");
    const resultsResponse = await fetch(`/api/tools/youtube-tasks/${taskId}/results?${query.toString()}`);
    const resultsPayload = await readJson<{ results: DbResult[] }>(resultsResponse, "Failed to load task results.");
    const duplicatesResponse = await fetch(`/api/tools/youtube-tasks/${taskId}/duplicates`);
    const duplicatesPayload = await readJson<{
      confirmedGroups: DuplicateGroup[];
      suspectedGroups: SuspectedDuplicateGroup[];
      matchedSourcesGroups?: DuplicateGroup[];
      matchedSourcesSummary?: MatchedSourcesSummary;
      summary: DuplicateSummary;
    }>(duplicatesResponse, "Failed to load duplicate groups.");

    setCurrentTask(detail.task);
    setBatches(detail.batches);
    setSummary(detail.summary);
    setDbResults(resultsPayload.results);
    setConfirmedDuplicateGroups(duplicatesPayload.confirmedGroups);
    setSuspectedDuplicateGroups(duplicatesPayload.suspectedGroups);
    setMatchedSourcesGroups(duplicatesPayload.matchedSourcesGroups || []);
    setMatchedSourcesSummary(duplicatesPayload.matchedSourcesSummary || { videosWithMultipleSources: 0, totalMatchedSources: 0 });
    setMatchedSourcesExpanded(false);
    setDuplicateSummary(duplicatesPayload.summary);
    setSuspectedDecisions((current) => {
      const next: Record<string, SuspectedDecision> = {};
      duplicatesPayload.confirmedGroups.filter((group) => group.groupType === "confirmed_video_duplicate" && group.candidates.length > 1).forEach((group) => {
        next[group.groupId] = current[group.groupId] || {
          keepResultId: group.canonicalResult.id,
          deleteResultIds: group.candidates.filter((row) => row.id !== group.canonicalResult.id).map((row) => row.id),
        };
      });
      duplicatesPayload.suspectedGroups.forEach((group) => {
        next[group.groupId] = current[group.groupId] || {
          keepResultId: group.recommendedKeepResultId,
          deleteResultIds: group.results.filter((row) => row.id !== group.recommendedKeepResultId).map((row) => row.id),
        };
      });
      return next;
    });
    setLanguages(splitMultiText(detail.task.language));
    setDomains(splitMultiText(detail.task.domain));
    setSearchTargets(normalizeSearchTargets(detail.task.searchTargets));
    setTaskName(detail.task.name);
    setTaskNameTouched(true);
    setTargetUniqueResults(detail.task.targetUniqueResults || 0);
    const restoredRange = detail.task.publishedDateRangeLabel || defaultPublishedDateRange.label;
    setPublishedDateRangeOption(publishedDateRangeOptions.includes(restoredRange as (typeof publishedDateRangeOptions)[number]) ? restoredRange : "Custom months");
    setCustomPublishedMonths(detail.task.publishedWithinMonths || null);
    setNotes(detail.task.notes || "");
    setBriefWarnings([]);
    const restoredUnits = Array.isArray(detail.units) ? detail.units.map(normalizeDbUnit) : [];
    if (restoredUnits.length) {
      setCollectionUnits(restoredUnits);
      setSelectedUnitIds(restoredUnits.filter((unit) => unit.selected).map((unit) => unit.id));
      unitPlanSignatureRef.current = buildUnitPlanSignature({
        languages: splitMultiText(detail.task.language),
        domains: splitMultiText(detail.task.domain),
        searchTargets: normalizeSearchTargets(detail.task.searchTargets),
        targetUniqueResults: detail.task.targetUniqueResults || 0,
        targetHours,
        allocationMode,
        allocationRatios,
      });
      setUnitPlanStale(false);
    }
    const restoredKeywords = dedupeKeywords(detail.batches.flatMap((batch) => batch.keywords.flatMap((keyword) => {
      if (!keyword.keyword) return [];
      const source: YoutubeKeyword["source"] = keyword.source === "Rule" || keyword.source === "AI" || keyword.source === "Manual" ? keyword.source : "Manual";
      return [{
        ...keyword,
        source,
        selected: true,
      }];
    })));
    setFinalKeywords(restoredKeywords);
    setRuleKeywords(restoredKeywords.filter((keyword) => keyword.source === "Rule"));
    setAiKeywords(restoredKeywords.filter((keyword) => keyword.source === "AI"));
  }

  function historyCacheKey(filters = historyFilters) {
    return JSON.stringify({ status: filters.status || "active", q: filters.q.trim() });
  }

  async function loadHistory(options: { append?: boolean; force?: boolean } = {}) {
    const key = historyCacheKey();
    const cached = historyCacheRef.current;
    if (!options.force && !options.append && cached?.key === key && Date.now() - cached.loadedAt < 30000) {
      setHistoryTasks(cached.tasks);
      setHistoryHasMore(cached.hasMore);
      setHistoryOffset(cached.offset);
      return;
    }

    const requestId = historyRequestIdRef.current + 1;
    historyRequestIdRef.current = requestId;
    setHistoryLoading(true);
    try {
      const query = new URLSearchParams();
      if (historyFilters.status) query.set("status", historyFilters.status);
      if (historyFilters.q.trim()) query.set("q", historyFilters.q.trim());
      query.set("limit", "20");
      query.set("offset", String(options.append ? historyOffset : 0));
      const response = await fetch(`/api/tools/youtube-tasks?${query.toString()}`);
      const payload = await readJson<{ tasks: TaskWithSummary[]; limit: number; offset: number; hasMore: boolean }>(response, "Failed to load task history.");
      if (historyRequestIdRef.current !== requestId) return;
      const nextTasks = options.append ? [...historyTasks, ...payload.tasks] : payload.tasks;
      const nextOffset = payload.offset + payload.tasks.length;
      setHistoryTasks(nextTasks);
      setHistoryHasMore(payload.hasMore);
      setHistoryOffset(nextOffset);
      historyCacheRef.current = {
        key,
        loadedAt: Date.now(),
        tasks: nextTasks,
        hasMore: payload.hasMore,
        offset: nextOffset,
      };
    } catch (error) {
      setFriendlyError("Failed to load task history.", error);
    } finally {
      if (historyRequestIdRef.current === requestId) setHistoryLoading(false);
    }
  }

  async function createTask() {
    if (!validateTaskInputs()) return;
    setLoading(true);
    setMessage("");
    try {
      const name = visibleTaskName.trim() || suggestedTaskName;
      const unitsForCreate = collectionUnits.length ? collectionUnits : buildCollectionUnits({
        languages,
        domains,
        searchTargets,
        targetUniqueResults,
        targetHours,
        allocationMode,
        allocationRatios,
      });
      const response = await fetch("/api/tools/youtube-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          language: languages.join(", "),
          domain: domains.join(", "),
          searchTargets,
          targetUniqueResults,
          publishedWithinMonths: publishedDateRange.months,
          publishedDateRangeLabel: publishedDateRange.label,
          units: serializeUnitsForApi(unitsForCreate),
          notes,
          createdBy: "local-user",
        }),
      });
      const payload = await readJson<{ task: DbTask }>(response, "Create task failed.");
      await loadTaskDetail(payload.task.id);
      await loadHistory({ force: true });
      switchToWorkspace();
      showTransientMessage("Task created.");
    } catch (error) {
      setFriendlyError("Create task failed.", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveTaskChanges() {
    if (!currentTask) return;
    if (!validateTaskInputs()) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/tools/youtube-tasks/${currentTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: visibleTaskName.trim() || suggestedTaskName,
          notes,
          targetUniqueResults,
          publishedWithinMonths: publishedDateRange.months,
          publishedDateRangeLabel: publishedDateRange.label,
          units: serializeUnitsForApi(collectionUnits),
          language: languages.join(", "),
          domain: domains.join(", "),
          searchTargets,
        }),
      });
      await readJson<{ task: DbTask }>(response, "Save task changes failed.");
      await loadTaskDetail(currentTask.id);
      await loadHistory({ force: true });
      showTransientMessage("Task changes saved.");
    } catch (error) {
      setFriendlyError("Save task changes failed.", error);
    } finally {
      setLoading(false);
    }
  }

  async function generateKeywords() {
    if (!validateTaskDimensions()) {
      setMessage("Please select at least one language, one domain, and one search target before generating keywords.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/tools/youtube-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languages, domains, searchTargets, useAI }),
      });
      const payload = await readJson<{ ruleKeywords?: YoutubeKeyword[]; aiKeywords?: YoutubeKeyword[]; finalKeywords?: YoutubeKeyword[]; warning?: string }>(response, "Generate keywords failed.");
      const unitByGroupKey = new Map(collectionUnits.map((unit) => [buildKeywordGroupKey(unit.language, unit.domain, unit.searchTarget), unit]));
      const unitLabelById = new Map(collectionUnits.map((unit, index) => [unit.id, buildDisplayUnitLabel(unit, index)]));
      const attachUnit = (keyword: YoutubeKeyword) => {
        const groupKey = keyword.groupKey || (keyword.language && keyword.domain && keyword.searchTarget ? buildKeywordGroupKey(keyword.language, keyword.domain, keyword.searchTarget) : undefined);
        const unit = groupKey ? unitByGroupKey.get(groupKey) : undefined;
        const unitId = unit?.id || groupKey;
        return {
          ...keyword,
          unitId,
          unitLabel: unit?.id ? unitLabelById.get(unit.id) : undefined,
          language: unit?.language || keyword.language,
          domain: unit?.domain || keyword.domain,
          searchTarget: unit?.searchTarget || keyword.searchTarget,
          groupKey: groupKey || keyword.groupKey,
        };
      };
      const nextRuleKeywords = (payload.ruleKeywords || []).map(attachUnit);
      const nextAiKeywords = (payload.aiKeywords || []).map(attachUnit);
      const nextFinalKeywords = (payload.finalKeywords || []).map(attachUnit);
      setRuleKeywords(nextRuleKeywords);
      setAiKeywords(nextAiKeywords);
      setFinalKeywords(nextFinalKeywords);
      const nextUnits = collectionUnits.map((unit) => ({
        ...unit,
        status: nextFinalKeywords.some((keyword) => keyword.unitId === unit.id) ? "Ready" : unit.status,
        keywordCount: nextFinalKeywords.filter((keyword) => keyword.unitId === unit.id && keyword.selected !== false).length,
        selectedKeywordCount: nextFinalKeywords.filter((keyword) => keyword.unitId === unit.id && keyword.selected !== false).length,
      }));
      setCollectionUnits(nextUnits);
      if (currentTask) {
        await fetch(`/api/tools/youtube-tasks/${currentTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ units: serializeUnitsForApi(nextUnits) }),
        });
      }
      if (payload.warning) {
        setMessage(payload.warning);
      } else {
        showTransientMessage("Keywords generated.");
      }
    } catch (error) {
      setFriendlyError("Generate keywords failed.", error);
    } finally {
      setLoading(false);
    }
  }

  function getUnitRunKeywords(unitId: string) {
    return finalKeywords.filter((item) => item.selected && item.unitId === unitId);
  }

  function getUnitRunName(unit: YoutubeCollectionUnit) {
    const unitRunCount = batches.filter((batch) => batch.batchName?.startsWith(buildUnitLabel(unit))).length + 1;
    return `${buildUnitLabel(unit)} - Run ${unitRunCount}`;
  }

  async function confirmRunUsage(unitsToRun: YoutubeCollectionUnit[]) {
    const requestedThisRun = unitsToRun.reduce((sum, unit) => sum + Math.max(0, Number(unit.targetResults || 0)), 0);
    try {
      const response = await fetch(`/api/tools/youtube-usage-summary${currentTask ? `?taskId=${currentTask.id}` : ""}`);
      const usage = await readJson<{
        todayRuns: number;
        todayReturned: number;
        taskReturned: number;
        taskUniqueAdded: number;
      }>(response, "Usage summary unavailable.");
      return window.confirm([
        "Start this run?",
        "",
        "This run may consume Apify usage.",
        "",
        `Requested videos for this run: ${requestedThisRun}`,
        `Selected units count: ${unitsToRun.length}`,
        `Runs today: ${usage.todayRuns}`,
        `Returned today: ${usage.todayReturned}`,
        `Returned for this task: ${usage.taskReturned}`,
        `Unique results for this task: ${summary.uniqueResults || usage.taskUniqueAdded}`,
        `Duplicates for this task: ${summary.duplicatesRemoved}`,
      ].join("\n"));
    } catch {
      return window.confirm([
        "Start this run?",
        "",
        "This run may consume Apify usage.",
        "",
        `Requested videos for this run: ${requestedThisRun}`,
        `Selected units count: ${unitsToRun.length}`,
      ].join("\n"));
    }
  }

  async function runUnits(unitIds: string[]) {
    if (!currentTask) {
      setMessage("Create a task before running units.");
      return;
    }
    if (currentTask.status === "Completed") {
      setMessage("Reopen this task before running units.");
      return;
    }
    if (!validateTaskDimensions()) return;

    const unitsToRun = collectionUnits.filter((unit) => unitIds.includes(unit.id));
    if (!unitsToRun.length) {
      setMessage("Select at least one unit.");
      return;
    }
    const allowedUnits = unitsToRun.filter((unit) => !(unit.status === "Running" && unit.runningByEmail));
    if (allowedUnits.length !== unitsToRun.length) {
      setMessage("Some units are already running and were skipped.");
    }
    if (!allowedUnits.length) return;
    if (!(await confirmRunUsage(allowedUnits))) return;

    runPauseRequestedRef.current = false;
    runCancelRequestedRef.current = false;
    setRunStatus("Running");
    setBatchNotice("Running units. This may take a few minutes.");
    setMessage("");

    try {
      for (const unit of allowedUnits) {
        if (runCancelRequestedRef.current) break;
        if (runPauseRequestedRef.current) {
          setRunStatus("Paused");
          setCollectionUnits((current) => current.map((item) => unitIds.includes(item.id) && item.status === "Running" ? { ...item, status: "Paused" } : item));
          setBatchNotice("Run paused.");
          return;
        }

        const selectedKeywords = getUnitRunKeywords(unit.id);
        if (unit.targetResults <= 0 && !unit.targetHours) {
          setCollectionUnits((current) => current.map((item) => item.id === unit.id ? { ...item, status: "Failed" } : item));
          setMessage(`Set target results or target hours for ${buildUnitLabel(unit)}.`);
          continue;
        }
        if (!selectedKeywords.length) {
          setCollectionUnits((current) => current.map((item) => item.id === unit.id ? { ...item, status: "Failed" } : item));
          setMessage(`No selected keywords for ${buildUnitLabel(unit)}.`);
          continue;
        }

        const batchId = crypto.randomUUID();
        const controller = new AbortController();
        batchAbortControllerRef.current = controller;
        setRunningBatchId(batchId);
        setRunningUnitId(unit.id);
        setCollectionUnits((current) => current.map((item) => item.id === unit.id ? { ...item, status: "Running" } : item));

        const response = await fetch(`/api/tools/youtube-tasks/${currentTask.id}/batches`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            batchId,
            batchName: getUnitRunName(unit),
            keywords: selectedKeywords,
            totalTargetResults: unit.targetResults,
            publishedWithinMonths: publishedDateRange.months,
            publishedDateRangeLabel: publishedDateRange.label,
          }),
          signal: controller.signal,
        });
        const payload = await readJson<{ summary: { returnedCount: number; acceptedCount?: number; filteredByDateCount?: number; duplicateCount: number; uniqueAddedCount: number } }>(response, "Run unit failed.");

        if (runCancelRequestedRef.current) {
          setCollectionUnits((current) => current.map((item) => item.id === unit.id ? { ...item, status: "Cancelled" } : item));
          break;
        }

        await loadTaskDetail(currentTask.id);
        await loadHistory({ force: true });
        setCollectionUnits((current) => current.map((item) => item.id === unit.id ? {
          ...item,
          status: "Completed",
          collectedResults: item.collectedResults + payload.summary.returnedCount,
          uniqueResults: item.uniqueResults + payload.summary.uniqueAddedCount,
          duplicateCount: item.duplicateCount + payload.summary.duplicateCount,
          progress: Math.min(100, Math.round(((item.uniqueResults + payload.summary.uniqueAddedCount) / Math.max(item.targetResults, 1)) * 100)),
        } : item));
        if (payload.summary.filteredByDateCount) {
          setBatchNotice(`Run completed with ${payload.summary.filteredByDateCount} videos filtered by date.`);
        }

        if (runPauseRequestedRef.current) {
          setRunStatus("Paused");
          setBatchNotice("");
          showTransientMessage("Run paused.");
          return;
        }
      }

      if (currentTask.status === "Draft") {
        await fetch(`/api/tools/youtube-tasks/${currentTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Reviewing" }),
        });
      }
      await loadTaskDetail(currentTask.id);
      await loadHistory({ force: true });
      if (runCancelRequestedRef.current) {
        setBatchNotice("Run cancelled. If an Apify request already started, usage may still be counted.");
      } else {
        setBatchNotice((current) => current.includes("filtered by date") ? current : "");
        showTransientMessage("Run completed.");
      }
    } catch (error) {
      if (runCancelRequestedRef.current) {
        showTransientMessage("Run cancelled.");
        setBatchNotice("Run cancelled. If an Apify request already started, usage may still be counted.");
        if (currentTask) {
          await loadTaskDetail(currentTask.id);
          await loadHistory({ force: true });
        }
      } else {
        setFriendlyError("Run unit failed.", error);
        setBatchNotice("");
      }
    } finally {
      if (!runPauseRequestedRef.current) setRunStatus("Idle");
      setRunningBatchId(null);
      setRunningUnitId(null);
      batchAbortControllerRef.current = null;
    }
  }

  function runSelectedUnits() {
    void runUnits(selectedUnitIds);
  }

  function runAllPendingUnits() {
    const unitIds = collectionUnits.filter((unit) => ["Pending", "Ready", "Failed"].includes(unit.status)).map((unit) => unit.id);
    void runUnits(unitIds);
  }

  function runSingleUnit(unitId: string) {
    void runUnits([unitId]);
  }

  async function pauseTaskRun(task = currentTask) {
    if (!task) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/tools/youtube-tasks/${task.id}/pause-run`, { method: "POST" });
      const payload = await readJson<{ task: DbTask; warning?: string }>(response, "Pause run failed.");
      if (currentTask?.id === task.id) {
        await loadTaskDetail(task.id);
        setRunStatus("Paused");
      }
      await loadHistory({ force: true });
      showTransientMessage("Run paused.");
      if (payload.warning) setBatchNotice(payload.warning);
    } catch (error) {
      setFriendlyError("Pause run failed.", error);
    } finally {
      setLoading(false);
    }
  }

  async function cancelTaskRun(task = currentTask, options: { confirm?: boolean } = {}) {
    if (!task) return;
    if (options.confirm !== false) {
      const confirmed = window.confirm("Cancel this run?\n\nThis will stop future scheduling and attempt to cancel the active Apify run. Already collected results will be kept.");
      if (!confirmed) return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/tools/youtube-tasks/${task.id}/cancel-run`, { method: "POST" });
      const payload = await readJson<{ task: DbTask; warning?: string }>(response, "Cancel run failed.");
      if (currentTask?.id === task.id) {
        await loadTaskDetail(task.id);
        setRunStatus("Idle");
        setRunningBatchId(null);
        setRunningUnitId(null);
      }
      await loadHistory({ force: true });
      showTransientMessage("Run cancelled.");
      setBatchNotice(payload.warning || "Run cancelled.");
    } catch (error) {
      setFriendlyError("Cancel run failed.", error);
    } finally {
      setLoading(false);
    }
  }

  async function resumeTaskRun(task = currentTask) {
    if (!task) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/tools/youtube-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Reviewing" }),
      });
      await readJson<{ task: DbTask }>(response, "Resume run failed.");
      if (currentTask?.id === task.id) {
        await loadTaskDetail(task.id);
        setRunStatus("Idle");
      }
      await loadHistory({ force: true });
      showTransientMessage("Task resumed.");
      setBatchNotice("");
    } catch (error) {
      setFriendlyError("Resume run failed.", error);
    } finally {
      setLoading(false);
    }
  }

  function pauseRun() {
    if (currentTask?.status === "Running" && runStatus !== "Running") {
      void pauseTaskRun(currentTask);
      return;
    }
    runPauseRequestedRef.current = true;
    setBatchNotice("Pausing after current request...");
  }

  function resumeRun() {
    if (currentTask?.status === "Paused" && runStatus !== "Paused") {
      void resumeTaskRun(currentTask);
      return;
    }
    const unitIds = collectionUnits.filter((unit) => ["Paused", "Pending", "Ready", "Failed"].includes(unit.status)).map((unit) => unit.id);
    void runUnits(unitIds);
  }

  async function cancelRun() {
    const confirmed = window.confirm("Cancel this run?\n\nThis will stop future scheduling and attempt to cancel the active Apify run. Already collected results will be kept.");
    if (!confirmed) return;
    runCancelRequestedRef.current = true;
    setRunStatus("Cancelling");
    if (!runningBatchId || !currentTask) {
      batchAbortControllerRef.current?.abort();
      if (currentTask?.status === "Running" || currentTask?.status === "Paused") {
        await cancelTaskRun(currentTask, { confirm: false });
        return;
      }
      setCollectionUnits((current) => current.map((unit) => runningUnitId === unit.id ? { ...unit, status: "Cancelled" } : unit));
      setRunStatus("Idle");
      setRunningUnitId(null);
      showTransientMessage("Run cancelled.");
      setBatchNotice("Run cancelled. If an Apify request already started, usage may still be counted.");
      return;
    }
    setBatchNotice("Cancelling run...");

    const cancelRequest = async () => fetch(`/api/tools/youtube-batches/${runningBatchId}/cancel`, { method: "POST" });

    try {
      let response = await cancelRequest();
      if (!response.ok) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        response = await cancelRequest();
      }
      const payload = await readJson<{ batch: DbBatch }>(response, "Cancel batch failed.");
      batchAbortControllerRef.current?.abort();
      await loadTaskDetail(currentTask.id);
      await loadHistory({ force: true });
      setRunStatus("Idle");
      setRunningBatchId(null);
      setRunningUnitId(null);
      if (payload.batch.status === "Cancelled") {
        showTransientMessage("Run cancelled.");
        setBatchNotice("Run cancelled. If an Apify request already started, usage may still be counted.");
      } else {
        showTransientMessage("Current request already finished.");
        setBatchNotice("");
      }
    } catch (error) {
      setFriendlyError("Cancel batch failed.", error);
    }
  }

  async function updateResult(id: string, patch: { status?: YoutubeResultStatus; notes?: string }) {
    if (!currentTask) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/tools/youtube-results/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      await readJson(response, "Failed to update result.");
      await loadTaskDetail(currentTask.id);
    } catch (error) {
      setFriendlyError("Failed to update result.", error);
    } finally {
      setLoading(false);
    }
  }

  async function updatePrimaryUnit(resultId: string, primaryUnitId: string) {
    if (!currentTask || !primaryUnitId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/tools/youtube-results/${resultId}/primary-unit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryUnitId, reason: "Manually assigned by user" }),
      });
      await readJson(response, "Failed to update primary unit.");
      await loadTaskDetail(currentTask.id);
      showTransientMessage("Primary unit saved.");
    } catch (error) {
      setFriendlyError("Failed to update primary unit.", error);
    } finally {
      setLoading(false);
    }
  }

  async function rebalancePrimaryUnits() {
    if (!currentTask) return;
    const confirmed = window.confirm("Rebalance primary units? Manually assigned results will not be changed.");
    if (!confirmed) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/tools/youtube-tasks/${currentTask.id}/rebalance-primary-units`, { method: "POST" });
      const payload = await readJson<{ changedCount: number }>(response, "Failed to rebalance primary units.");
      await loadTaskDetail(currentTask.id);
      showTransientMessage(`Rebalanced ${payload.changedCount} results.`);
    } catch (error) {
      setFriendlyError("Failed to rebalance primary units.", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteResult(id: string) {
    if (!currentTask) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/tools/youtube-results/${id}`, { method: "DELETE" });
      await readJson(response, "Failed to delete result.");
      setSelectedIds((current) => current.filter((item) => item !== id));
      await loadTaskDetail(currentTask.id);
    } catch (error) {
      setFriendlyError("Failed to delete result.", error);
    } finally {
      setLoading(false);
    }
  }

  async function bulkUpdate(status: YoutubeResultStatus) {
    if (!currentTask || !selectedIds.length) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => fetch(`/api/tools/youtube-results/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })));
      await loadTaskDetail(currentTask.id);
      showTransientMessage(`Selected results marked as ${status}.`);
    } catch (error) {
      setFriendlyError("Failed to update result.", error);
    } finally {
      setLoading(false);
    }
  }

  async function bulkDelete() {
    if (!currentTask || !selectedIds.length) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => fetch(`/api/tools/youtube-results/${id}`, { method: "DELETE" })));
      setSelectedIds([]);
      await loadTaskDetail(currentTask.id);
      showTransientMessage("Selected results deleted.");
    } catch (error) {
      setFriendlyError("Failed to delete result.", error);
    } finally {
      setLoading(false);
    }
  }

  async function exportTaskCsv(task = currentTask) {
    if (!task) return;
    try {
      const query = new URLSearchParams({ preferredVideoQuality });
      const response = await fetch(`/api/tools/youtube-tasks/${task.id}/export?${query.toString()}`);
      if (!response.ok) throw new Error("Failed to export CSV.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `youtube-task-${task.id}-${date}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showTransientMessage("Export completed.");
    } catch (error) {
      setFriendlyError("Failed to export CSV.", error);
    }
  }

  async function completeTask(task = currentTask) {
    if (!task) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/tools/youtube-tasks/${task.id}/complete`, { method: "POST" });
      await readJson(response, "Complete task failed.");
      await loadTaskDetail(task.id);
      await loadHistory({ force: true });
      showTransientMessage("Task completed.");
    } catch (error) {
      setFriendlyError("Complete task failed.", error);
    } finally {
      setLoading(false);
    }
  }

  async function reopenTask(task = currentTask) {
    if (!task) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/tools/youtube-tasks/${task.id}/reopen`, { method: "POST" });
      await readJson(response, "Reopen task failed.");
      await loadTaskDetail(task.id);
      await loadHistory({ force: true });
      showTransientMessage("Task reopened.");
    } catch (error) {
      setFriendlyError("Reopen task failed.", error);
    } finally {
      setLoading(false);
    }
  }

  async function confirmLifecycleAction() {
    if (!confirmDialog) return;

    if (confirmDialog.type === "start-new") {
      resetForNewTask();
      return;
    }

    const currentDialog = confirmDialog;
    setConfirmDialog(null);

    if (currentDialog.type === "complete") {
      await completeTask(currentDialog.task);
      return;
    }

    if (currentDialog.type === "clean-confirmed") {
      await cleanConfirmedDuplicates();
      return;
    }

    if (currentDialog.type === "apply-duplicate-decision") {
      await applySuspectedDuplicateDecision(currentDialog.groupId);
      return;
    }

    await reopenTask(currentDialog.task);
  }

  async function deleteTask(task = deleteTarget) {
    if (!task) return;
    if (task.status === "Running") {
      setMessage("Pause or cancel the active run before deleting this task.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/tools/youtube-tasks/${task.id}`, { method: "DELETE" });
      await readJson(response, "Delete task failed.");
      setDeleteTarget(null);
      if (currentTask?.id === task.id) {
        resetForNewTask();
        switchToHistory();
      }
      await loadHistory({ force: true });
      showTransientMessage("Task moved to Deleted.");
    } catch (error) {
      setFriendlyError("Delete task failed.", error);
    } finally {
      setLoading(false);
    }
  }

  async function cleanConfirmedDuplicates() {
    if (!currentTask) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/tools/youtube-tasks/${currentTask.id}/duplicates/clean-confirmed`, { method: "POST" });
      const payload = await readJson<{ cleanedCount: number; reviewedOnlyCount: number; warning?: string }>(response, "Failed to clean confirmed duplicates.");
      setReviewedDuplicateGroupIds((current) => uniqueArray([...current, ...confirmedDuplicateGroups.map((group) => group.groupId)]));
      showTransientMessage(payload.cleanedCount ? "Duplicates cleaned." : "Duplicate groups reviewed.");
      if (payload.warning) setBatchNotice(payload.warning);
      await loadTaskDetail(currentTask.id);
    } catch (error) {
      setFriendlyError("Failed to clean confirmed duplicates.", error);
    } finally {
      setLoading(false);
    }
  }

  async function applySuspectedDuplicateDecision(groupId: string) {
    if (!currentTask) return;
    const decision = suspectedDecisions[groupId];
    if (!decision?.keepResultId) {
      setMessage("Select one result to keep.");
      return;
    }
    const group = suspectedDuplicateGroups.find((item) => item.groupId === groupId)
      || confirmedDuplicateGroups.find((item) => item.groupId === groupId);
    const groupSize = group ? ("results" in group ? group.results.length : group.candidates.length) : 0;
    if (groupSize > 0 && groupSize - decision.deleteResultIds.length < 1) {
      setMessage("Keep at least one video in this group.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/tools/youtube-tasks/${currentTask.id}/duplicates/apply-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          keepResultId: decision.keepResultId,
          deleteResultIds: decision.deleteResultIds,
          decision: "apply",
        }),
      });
      await readJson(response, "Failed to apply duplicate decision.");
      setReviewedDuplicateGroupIds((current) => uniqueArray([...current, groupId]));
      showTransientMessage("Duplicate decision applied.");
      await loadTaskDetail(currentTask.id);
    } catch (error) {
      setFriendlyError("Failed to apply duplicate decision.", error);
    } finally {
      setLoading(false);
    }
  }

  async function reviewSuspectedGroup(groupId: string, action: "keep-separate" | "ignore") {
    if (!currentTask) return;
    setLoading(true);
    try {
      const endpoint = action === "keep-separate" ? "keep-separate" : "ignore";
      const response = await fetch(`/api/tools/youtube-tasks/${currentTask.id}/duplicates/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      const payload = await readJson<{ warning?: string }>(response, "Failed to update duplicate review.");
      setReviewedDuplicateGroupIds((current) => uniqueArray([...current, groupId]));
      showTransientMessage(action === "keep-separate" ? "Group kept separate." : "Group ignored.");
      if (payload.warning) setBatchNotice(payload.warning);
    } catch (error) {
      setFriendlyError("Failed to update duplicate review.", error);
    } finally {
      setLoading(false);
    }
  }

  function updateSuspectedDecision(groupId: string, patch: Partial<SuspectedDecision>) {
    setSuspectedDecisions((current) => {
      const existing = current[groupId] || { keepResultId: "", deleteResultIds: [] };
      const nextKeep = patch.keepResultId ?? existing.keepResultId;
      const nextDeleteIds = patch.deleteResultIds ?? existing.deleteResultIds;
      return {
        ...current,
        [groupId]: {
          keepResultId: nextKeep,
          deleteResultIds: nextDeleteIds.filter((id) => id !== nextKeep),
        },
      };
    });
  }

  function openDuplicateGroup(groupId: string) {
    setDuplicateReviewExpanded(true);
    setExpandedDuplicateGroupId(groupId);
    window.setTimeout(() => duplicateReviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function mergeKeywords(nextKeywords: YoutubeKeyword[]) {
    setFinalKeywords(dedupeKeywords(nextKeywords));
  }

  function addManualKeyword(unitId: string) {
    const keyword = normalizeKeyword(manualKeyword);
    if (!keyword) return;
    const unit = collectionUnits.find((item) => item.id === unitId);
    if (!unit) {
      setMessage("Select a unit before adding a manual keyword.");
      return;
    }
    const unitIndex = collectionUnits.findIndex((item) => item.id === unitId);
    mergeKeywords([...finalKeywords, {
      keyword,
      source: "Manual",
      unitId,
      unitLabel: buildDisplayUnitLabel(unit, unitIndex),
      language: unit.language,
      domain: unit.domain,
      searchTarget: unit.searchTarget,
      groupKey: unitId,
      selected: true,
    }]);
    setManualKeyword("");
  }

  function setNumberValue(value: string, setter: (value: number) => void) {
    const parsed = Number(value);
    setter(Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0);
  }

  function setOptionalNumberValue(value: string, setter: (value: number | null) => void) {
    const parsed = Number(value);
    setter(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
  }

  async function recalculateUnitPlan() {
    if (!validateTaskDimensions()) return;
    const hasManualTargets = collectionUnits.some((unit) => unit.customTargetResults || unit.customTargetHours);
    const overwriteManualTargets = hasManualTargets
      ? window.confirm("Recalculate unit plan? Manual unit targets may be overwritten.")
      : false;
    const nextUnits = buildCollectionUnits({
      languages,
      domains,
      searchTargets,
      targetUniqueResults,
      targetHours,
      allocationMode,
      allocationRatios,
      existingUnits: overwriteManualTargets
        ? collectionUnits.map((unit) => ({
            ...unit,
            customTargetResults: false,
            customTargetHours: false,
          }))
        : collectionUnits,
    });
    unitPlanSignatureRef.current = buildUnitPlanSignature({
      languages,
      domains,
      searchTargets,
      targetUniqueResults,
      targetHours,
      allocationMode,
      allocationRatios,
    });
    setCollectionUnits(nextUnits);
    setSelectedUnitIds(nextUnits.map((unit) => unit.id));
    setUnitPlanStale(false);
    if (currentTask) {
      await fetch(`/api/tools/youtube-tasks/${currentTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ units: serializeUnitsForApi(nextUnits) }),
      });
      await loadTaskDetail(currentTask.id);
    }
    showTransientMessage("Unit plan recalculated.");
  }

  function updateCollectionUnit(unitId: string, patch: Partial<Pick<YoutubeCollectionUnit, "targetResults" | "targetHours" | "status">>) {
    const nextUnits = collectionUnits.map((unit) => unit.id === unitId ? {
      ...unit,
      ...patch,
      customTargetResults: patch.targetResults !== undefined ? true : unit.customTargetResults,
      customTargetHours: patch.targetHours !== undefined ? true : unit.customTargetHours,
      status: patch.status || unit.status,
    } : unit);
    setCollectionUnits(nextUnits);
    if (patch.targetResults !== undefined || patch.targetHours !== undefined) {
      setAllocationMode("Custom");
    }
    if (currentTask) {
      void fetch(`/api/tools/youtube-tasks/${currentTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ units: serializeUnitsForApi(nextUnits) }),
      });
    }
  }

  async function openTask(task: DbTask) {
    try {
      await loadTaskDetail(task.id);
      switchToWorkspace();
      showTransientMessage("Task opened.");
    } catch (error) {
      setFriendlyError("Failed to load task detail.", error);
    }
  }

  function openHistoryTab() {
    switchToHistory();
    void loadHistory();
  }

  async function applyResultFilters(nextFilters = resultFilters) {
    setResultFilters(nextFilters);
    if (!currentTask) return;
    try {
      await loadTaskDetail(currentTask.id, nextFilters);
    } catch (error) {
      setFriendlyError("Failed to load task results.", error);
    }
  }

  async function analyzeBrief() {
    const brief = notes.trim();
    if (!brief) {
      setMessage("Enter a task brief first.");
      return;
    }

    setBriefLoading(true);
    setBriefWarnings([]);
    setMessage("");
    try {
      const response = await fetch("/api/tools/youtube-task-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      const payload = await readJson<TaskBriefAnalysis>(response, "Failed to analyze brief.");

      setTaskName(payload.taskName || buildTaskName(payload.languages, payload.domains, payload.searchTargets));
      setTaskNameTouched(true);
      setLanguages(payload.languages);
      setDomains(payload.domains);
      setSearchTargets(payload.searchTargets);
      setTargetUniqueResults(payload.targetUniqueResults || 0);
      setTargetHours(payload.targetHours || null);
      setAllocationMode(payload.allocationMode || "Even by Unit");
      setAllocationRatios(payload.allocationRatios || {});
      setPreferredVideoQuality(payload.preferredVideoQuality || "Any");
      const nextPublishedRange = payload.publishedDateRange || defaultPublishedDateRange;
      const matchingOption = publishedDateRangeOptions.find((option) => getPublishedDateRangeFromOption(option, nextPublishedRange.months).months === nextPublishedRange.months && option !== "Custom months");
      setPublishedDateRangeOption(nextPublishedRange.mode === "custom" ? "Custom months" : matchingOption || nextPublishedRange.label || "Any time");
      setCustomPublishedMonths(nextPublishedRange.mode === "custom" ? nextPublishedRange.months : null);
      setUseAI(payload.useAIKeywordExpansion !== false);
      setBriefWarnings(payload.warnings || []);
      showTransientMessage(payload.taskName ? "Fields updated from brief. Task name updated from brief." : "Fields updated from brief.");
    } catch {
      setMessage("AI brief analysis is unavailable. Fill the fields manually.");
    } finally {
      setBriefLoading(false);
    }
  }

  const legacyActiveResults = legacyResults.filter((row) => !row.deleted);
  const suspectedGroupByResultId = suspectedDuplicateGroups.reduce<Record<string, string>>((acc, group) => {
    if (reviewedDuplicateGroupIds.includes(group.groupId)) return acc;
    group.results.forEach((row) => {
      acc[row.id] = group.groupId;
    });
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-[#f8f5ec] pb-24 pt-6 text-[#111827]">
      <div className="page-shell space-y-6">
        <section className="rounded-2xl border border-[#d0c3b3] bg-[#fbfaf6] p-5 shadow-[0_18px_46px_rgba(31,41,51,0.10)] sm:p-6">
          <div>
            <div className="inline-flex rounded-full border border-[#d7cec0] bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#9a6a35]">BlackDog Tools</div>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-[#111827]">YouTube Speech Link Collector</h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-[#6f6256]">Collect and organize YouTube speech links.</p>
          </div>
        </section>

        <div className="inline-flex rounded-lg border border-[#d7cec0] bg-white p-1">
          <button type="button" onClick={switchToWorkspace} className={`rounded-md px-4 py-2 text-sm font-black ${activeTab === "workspace" ? "bg-[#1f5c43] text-white" : "text-[#6f6256] hover:bg-[#f4efe2]"}`}>Task Workspace</button>
          <button type="button" onClick={openHistoryTab} className={`rounded-md px-4 py-2 text-sm font-black ${activeTab === "history" ? "bg-[#1f5c43] text-white" : "text-[#6f6256] hover:bg-[#f4efe2]"}`}>Task History</button>
        </div>

        {message ? <div className="rounded-xl border border-[#d7cec0] bg-white px-4 py-3 text-sm font-bold text-[#6f6256]">{message}</div> : null}
        {batchNotice ? <div className="rounded-xl border border-[#bad7c6] bg-[#eef8f1] px-4 py-3 text-sm font-black text-[#1f5c43]">{batchNotice}</div> : null}
        {toastMessage ? (
          <div className="fixed right-6 top-6 z-50 rounded-xl border border-[#bad7c6] bg-white px-4 py-3 text-sm font-black text-[#1f5c43] shadow-[0_18px_46px_rgba(31,41,51,0.16)]">
            {toastMessage}
          </div>
        ) : null}

        {activeTab === "workspace" ? (
          <>
            <CurrentTaskPanel
              task={currentTask}
              resultCount={summary.uniqueResults}
              onCreateNew={requestCreateNewTask}
              onOpenHistory={openHistoryTab}
              onExport={() => void exportTaskCsv()}
              onComplete={() => currentTask ? setConfirmDialog({ type: "complete", task: currentTask }) : undefined}
              onReopen={() => currentTask ? setConfirmDialog({ type: "reopen", task: currentTask }) : undefined}
              onPauseRun={() => currentTask ? void pauseTaskRun(currentTask) : undefined}
              onResumeRun={() => currentTask ? void resumeTaskRun(currentTask) : undefined}
              onCancelRun={() => currentTask ? void cancelTaskRun(currentTask) : undefined}
            />
            <SummaryBar summary={summary} targetUniqueResults={targetUniqueResults} targetHours={targetHours} hasTask={Boolean(currentTask)} />

            <section className="rounded-2xl border border-[#d0c3b3] bg-white p-4 shadow-[0_14px_32px_rgba(31,41,51,0.08)] sm:p-5">
              <div className="mb-4">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Task Setup</div>
              </div>
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <TextField label="Task Name" value={visibleTaskName} onChange={(value) => { setTaskName(value); setTaskNameTouched(true); }} />
                  </div>
                  <div className="lg:col-span-4">
                    <MultiSelect label="Language" placeholder="Select languages..." options={languageOptions} selected={languages} menuKey="languages" openMenu={openMenu} setOpenMenu={setOpenMenu} onChange={setLanguages} emptyMessage="Please select at least one language." onMessage={setMessage} />
                  </div>
                  <div className="lg:col-span-4">
                    <MultiSelect label="Domain" placeholder="Select domains..." options={domainOptions} selected={domains} menuKey="domains" openMenu={openMenu} setOpenMenu={setOpenMenu} onChange={setDomains} emptyMessage="Please select at least one domain." onMessage={setMessage} />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <MultiSelect label="Search Target" placeholder="Select search targets..." options={searchTargetOptions} selected={searchTargets} menuKey="targets" openMenu={openMenu} setOpenMenu={setOpenMenu} onChange={setSearchTargets} emptyMessage="Please select at least one search target." onMessage={setMessage} />
                  </div>
                  <div className="lg:col-span-2">
                    <NumberField label="Target Unique Results" value={targetUniqueResults} onChange={(value) => setNumberValue(value, setTargetUniqueResults)} />
                  </div>
                  <div className="lg:col-span-2">
                    <OptionalNumberField label="Total Target Hours" value={targetHours} onChange={(value) => setOptionalNumberValue(value, setTargetHours)} />
                  </div>
                  <div className="lg:col-span-2">
                    <SelectField label="Allocation Mode" value={allocationMode} options={["Even by Unit", "Even by Domain", "Custom"]} onChange={(value) => setAllocationMode(value as AllocationMode)} />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <PublishedDateRangeField
                      option={publishedDateRangeOption}
                      customMonths={customPublishedMonths}
                      onOptionChange={(value) => {
                        setPublishedDateRangeOption(value);
                        if (value !== "Custom months") setCustomPublishedMonths(null);
                      }}
                      onCustomMonthsChange={(value) => setOptionalNumberValue(value, setCustomPublishedMonths)}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <SelectField label="Preferred Video Quality" value={preferredVideoQuality} options={preferredVideoQualityOptions} onChange={(value) => setPreferredVideoQuality(value as PreferredVideoQuality)} />
                  </div>
                  <div className="lg:col-span-2">
                    <FieldGroup
                      label="AI Expansion"
                      control={(
                        <label className="flex h-11 w-full items-center gap-2 rounded-md border border-transparent text-sm font-black text-[#40372f]">
                          <input type="checkbox" checked={useAI} onChange={(event) => setUseAI(event.target.checked)} className="h-4 w-4 accent-[#1f5c43]" />
                          <span>Use AI</span>
                        </label>
                      )}
                    />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-10">
                    <TaskBriefField
                      value={notes}
                      onChange={setNotes}
                      warnings={briefWarnings}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <FieldGroup
                      label="Parser"
                      control={(
                        <button type="button" onClick={() => void analyzeBrief()} disabled={taskRunLocked || briefLoading || loading || runInProgress} className="h-16 w-full rounded-md border border-[#1f5c43] bg-white px-3 text-sm font-black text-[#1f5c43] disabled:opacity-50">
                          {briefLoading ? "Analyzing..." : "Analyze Brief"}
                        </button>
                      )}
                    />
                  </div>
                </div>

              </div>
              {targetUniqueResults >= 2000 ? (
                <div className="mt-3 text-xs font-bold leading-5 text-[#9a6a35]">
                  <span>Large targets may require multiple unit runs.</span>
                </div>
              ) : null}
              <div className="mt-4 flex min-h-10 flex-wrap items-center gap-3">
                <button type="button" onClick={createTask} disabled={Boolean(currentTask) || loading || runInProgress} className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-black text-white disabled:opacity-60">Create Task</button>
                <button type="button" onClick={saveTaskChanges} disabled={taskRunLocked || !currentTask || loading || runInProgress} className="rounded-md border border-[#d7cec0] bg-white px-4 py-2 text-sm font-black text-[#1f5c43] disabled:opacity-50">Save Changes</button>
                <button type="button" onClick={generateKeywords} disabled={taskRunLocked || loading || runInProgress} className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-black text-white disabled:opacity-60">Generate Keywords</button>
                {taskRunLocked ? <div className="text-xs font-bold text-[#9a6a35]">{taskRunLockMessage}</div> : null}
              </div>
            </section>

            <CollectionUnitPlan
              units={collectionUnits}
              finalKeywords={finalKeywords}
              selectedUnitIds={selectedUnitIds}
              unitPlanStale={unitPlanStale}
              runStatus={currentTask?.status === "Running" && runStatus === "Idle" ? "Running" : currentTask?.status === "Paused" && runStatus === "Idle" ? "Paused" : runStatus}
              runningUnitId={runningUnitId}
              readOnly={taskRunLocked}
              readOnlyMessage={taskRunLockMessage}
              expanded={collectionPlanExpanded}
              onToggleExpanded={() => setCollectionPlanExpanded((value) => !value)}
              onToggleUnit={(unitId) => setSelectedUnitIds((current) => current.includes(unitId) ? current.filter((id) => id !== unitId) : [...current, unitId])}
              onSelectAll={() => setSelectedUnitIds(collectionUnits.map((unit) => unit.id))}
              onClearSelection={() => setSelectedUnitIds([])}
              onUpdateUnit={updateCollectionUnit}
              onRecalculatePlan={recalculateUnitPlan}
              onRunSelected={runSelectedUnits}
              onRunAllPending={runAllPendingUnits}
              onPauseRun={pauseRun}
              onResumeRun={resumeRun}
              onCancelRun={() => void cancelRun()}
              onRunUnit={runSingleUnit}
              onPauseUnit={(unitId) => { runPauseRequestedRef.current = true; updateCollectionUnit(unitId, { status: "Paused" }); setBatchNotice("Pausing after current request..."); }}
              onResumeUnit={(unitId) => void runUnits([unitId])}
              onCancelUnit={(unitId) => { updateCollectionUnit(unitId, { status: "Cancelled" }); if (runningUnitId === unitId) void cancelRun(); }}
            />

            <YoutubeKeywordBuilder
              ruleKeywords={ruleKeywords}
              aiKeywords={aiKeywords}
              finalKeywords={finalKeywords}
              units={collectionUnits}
              manualKeyword={manualKeyword}
              warning={message.includes("AI keyword") ? message : ""}
              onManualKeywordChange={setManualKeyword}
              onAddManualKeyword={addManualKeyword}
              onToggleKeyword={(id) => setFinalKeywords((current) => current.map((item) => item.id === id ? { ...item, selected: !item.selected } : item))}
              onUpdateKeyword={(id, value) => mergeKeywords(finalKeywords.map((item) => item.id === id ? { ...item, keyword: value } : item))}
              onDeleteKeyword={(id) => setFinalKeywords((current) => current.filter((item) => item.id !== id))}
              readOnly={taskRunLocked}
              readOnlyMessage={taskRunLockMessage}
            />

            <TaskResultsPanel
              task={currentTask}
              rows={dbResults}
              units={collectionUnits}
              filters={resultFilters}
              selectedIds={selectedIds}
              loading={loading}
              readOnly={taskRunLocked}
              readOnlyMessage={taskRunLockMessage}
              onFiltersChange={(filters) => void applyResultFilters(filters)}
              onSelectAll={setSelectedIds}
              onToggleSelected={(id) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
              onPatch={updateResult}
              onDelete={deleteResult}
              onBulkUpdate={bulkUpdate}
              onBulkDelete={bulkDelete}
              onReviewDuplicates={openDuplicateGroup}
              onPrimaryUnitChange={updatePrimaryUnit}
              onRebalancePrimaryUnits={rebalancePrimaryUnits}
              suspectedGroupByResultId={suspectedGroupByResultId}
              expanded={taskResultsExpanded}
              onToggleExpanded={() => setTaskResultsExpanded((value) => !value)}
            />
            <DuplicateReviewPanel
              refNode={duplicateReviewRef}
              confirmedGroups={confirmedDuplicateGroups}
              suspectedGroups={suspectedDuplicateGroups}
              matchedSourcesGroups={matchedSourcesGroups}
              matchedSourcesSummary={matchedSourcesSummary}
              summary={duplicateSummary}
              expanded={duplicateReviewExpanded}
              matchedSourcesExpanded={matchedSourcesExpanded}
              expandedGroupId={expandedDuplicateGroupId}
              reviewedGroupIds={reviewedDuplicateGroupIds}
              suspectedDecisions={suspectedDecisions}
              loading={loading}
              readOnly={taskRunLocked}
              readOnlyMessage={taskRunLockMessage}
              onToggle={() => setDuplicateReviewExpanded((value) => !value)}
              onToggleMatchedSources={() => setMatchedSourcesExpanded((value) => !value)}
              onToggleGroup={(groupId) => setExpandedDuplicateGroupId((current) => current === groupId ? null : groupId)}
              onCleanConfirmed={() => setConfirmDialog({ type: "clean-confirmed" })}
              onSetKeep={(groupId, keepResultId) => updateSuspectedDecision(groupId, { keepResultId })}
              onToggleDelete={(groupId, resultId) => {
                const decision = suspectedDecisions[groupId] || { keepResultId: "", deleteResultIds: [] };
                const deleteResultIds = decision.deleteResultIds.includes(resultId)
                  ? decision.deleteResultIds.filter((id) => id !== resultId)
                  : [...decision.deleteResultIds, resultId];
                updateSuspectedDecision(groupId, { deleteResultIds });
              }}
              onApplyDecision={(groupId) => setConfirmDialog({ type: "apply-duplicate-decision", groupId })}
              onKeepSeparate={(groupId) => void reviewSuspectedGroup(groupId, "keep-separate")}
              onIgnore={(groupId) => void reviewSuspectedGroup(groupId, "ignore")}
            />
            <RunLogsPanel batches={batches} expanded={runLogsExpanded} onToggle={() => setRunLogsExpanded((value) => !value)} />

            <LegacyLocalResults rows={legacyActiveResults} expanded={legacyExpanded} onToggle={() => setLegacyExpanded((value) => !value)} setRows={setLegacyResults} />
          </>
        ) : (
          <TaskHistoryPanel
            tasks={historyTasks}
            filters={historyFilters}
            hasMore={historyHasMore}
            loading={historyLoading}
            onFiltersChange={setHistoryFilters}
            onLoad={() => void loadHistory({ force: true })}
            onLoadMore={() => void loadHistory({ append: true, force: true })}
            onOpen={openTask}
            onExport={(task) => void exportTaskCsv(task)}
            onComplete={(task) => setConfirmDialog({ type: "complete", task })}
            onReopen={(task) => setConfirmDialog({ type: "reopen", task })}
            onPauseRun={(task) => void pauseTaskRun(task)}
            onResumeRun={(task) => void resumeTaskRun(task)}
            onCancelRun={(task) => void cancelTaskRun(task)}
            onDelete={(task) => {
              if (task.status === "Running") {
                setMessage("Pause or cancel the active run before deleting this task.");
                return;
              }
              setDeleteTarget(task);
            }}
          />
        )}
        <DeleteTaskDialog
          task={deleteTarget}
          loading={loading}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void deleteTask()}
        />
        <TaskLifecycleDialog
          dialog={confirmDialog}
          loading={loading}
          onCancel={() => setConfirmDialog(null)}
          onConfirm={() => void confirmLifecycleAction()}
        />
      </div>
    </main>
  );
}

function FieldGroup({ label, control, meta }: { label: string; control: ReactNode; meta?: ReactNode }) {
  return (
    <div className="grid grid-rows-[16px_minmax(44px,auto)_32px] gap-y-2">
      <div className="flex items-center text-xs font-black uppercase tracking-[0.14em] text-[#6f6256]">{label}</div>
      <div>{control}</div>
      <div className="flex h-8 min-h-8 items-center overflow-hidden">{meta}</div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <FieldGroup
      label={label}
      control={<input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-md border border-[#d7cec0] bg-white px-3 text-sm font-semibold text-[#111827] outline-none" />}
    />
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return (
    <FieldGroup
      label={label}
      control={<input type="number" min={10} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-md border border-[#d7cec0] bg-white px-3 text-sm font-semibold text-[#111827] outline-none" />}
    />
  );
}

function OptionalNumberField({ label, value, onChange }: { label: string; value: number | null; onChange: (value: string) => void }) {
  return (
    <FieldGroup
      label={label}
      control={<input type="number" min={0} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-md border border-[#d7cec0] bg-white px-3 text-sm font-semibold text-[#111827] outline-none" placeholder="Optional" />}
    />
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <FieldGroup
      label={label}
      control={(
        <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-md border border-[#d7cec0] bg-white px-3 text-sm font-semibold text-[#111827] outline-none">
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      )}
    />
  );
}

function PublishedDateRangeField({
  option,
  customMonths,
  onOptionChange,
  onCustomMonthsChange,
}: {
  option: string;
  customMonths: number | null;
  onOptionChange: (value: string) => void;
  onCustomMonthsChange: (value: string) => void;
}) {
  return (
    <FieldGroup
      label="Published Date Range"
      control={(
        <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-2">
          <select value={option} onChange={(event) => onOptionChange(event.target.value)} className="h-11 rounded-md border border-[#d7cec0] bg-white px-3 text-sm font-semibold text-[#111827] outline-none">
            {publishedDateRangeOptions.map((rangeOption) => <option key={rangeOption} value={rangeOption}>{rangeOption}</option>)}
          </select>
          <input
            type="number"
            min={1}
            step={1}
            value={customMonths ?? ""}
            onChange={(event) => onCustomMonthsChange(event.target.value)}
            disabled={option !== "Custom months"}
            placeholder="Months"
            className="h-11 rounded-md border border-[#d7cec0] bg-white px-2 text-sm font-semibold text-[#111827] outline-none disabled:bg-[#f4efe2] disabled:text-[#9a8a7a]"
          />
        </div>
      )}
    />
  );
}

function TaskBriefField({ value, onChange, warnings }: { value: string; onChange: (value: string) => void; warnings: string[] }) {
  const meta = warnings.length ? (
    <div className="truncate text-xs font-bold text-[#9a6a35]" title={warnings.join(" ")}>
      {warnings.join(" ")}
    </div>
  ) : null;

  return (
    <FieldGroup
      label="AI Task Brief"
      control={(
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-16 w-full resize-none rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-sm font-semibold leading-5 text-[#111827] outline-none"
          placeholder={'Describe what you want to collect, e.g. "Find 500 Brazilian Portuguese food and travel videos with natural speech, including single speaker and dialogue, preferred 1080p."'}
        />
      )}
      meta={meta}
    />
  );
}

function MultiSelect({
  label,
  placeholder,
  options,
  selected,
  menuKey,
  openMenu,
  setOpenMenu,
  onChange,
  emptyMessage,
  onMessage,
}: {
  label: string;
  placeholder: string;
  options: readonly string[];
  selected: string[];
  menuKey: string;
  openMenu: string | null;
  setOpenMenu: (key: string | null) => void;
  onChange: (values: string[]) => void;
  emptyMessage: string;
  onMessage: (message: string) => void;
}) {
  const visibleChips = selected.slice(0, 3);
  const hiddenCount = Math.max(selected.length - visibleChips.length, 0);

  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
      return;
    }
    onChange([...selected, option]);
  }

  function remove(option: string) {
    onChange(selected.filter((item) => item !== option));
    if (selected.length <= 1) onMessage(emptyMessage);
  }

  const control = (
    <div className="relative">
      <button type="button" onClick={() => setOpenMenu(openMenu === menuKey ? null : menuKey)} className="flex h-11 w-full items-center justify-between rounded-md border border-[#d7cec0] bg-white px-3 text-left text-sm font-semibold text-[#111827] outline-none">
        <span className={selected.length ? "text-[#111827]" : "text-[#9a8a7a]"}>{placeholder}</span>
        <span className="text-[#6f6256]">⌄</span>
      </button>
      {openMenu === menuKey ? (
        <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-[#d7cec0] bg-white p-2 shadow-[0_16px_34px_rgba(31,41,51,0.16)]">
          {options.map((option) => (
            <button key={option} type="button" onClick={() => toggle(option)} className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-bold ${selected.includes(option) ? "bg-[#eaf4ee] text-[#1f5c43]" : "text-[#40372f] hover:bg-[#f4efe2]"}`}>
              <span>{option}</span>
              <span>{selected.includes(option) ? "✓" : ""}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );

  const meta = (
    <div className="flex w-full items-center gap-2 overflow-hidden whitespace-nowrap">
      <span className="shrink-0 text-xs font-black text-[#6f6256]">Selected:</span>
      {selected.length ? visibleChips.map((item) => (
        <button key={item} type="button" onClick={() => remove(item)} className="max-w-[150px] shrink-0 truncate rounded-full border border-[#d7cec0] bg-[#fbfaf6] px-2.5 py-1 text-xs font-black text-[#40372f]">{item} ×</button>
      )) : <span className="text-xs font-bold text-[#9a8a7a]">None</span>}
      {hiddenCount ? <span className="shrink-0 rounded-full border border-[#d7cec0] bg-white px-2.5 py-1 text-xs font-black text-[#6f6256]">+{hiddenCount} more</span> : null}
    </div>
  );

  return <FieldGroup label={label} control={control} meta={meta} />;
}

function CollectionUnitPlan({
  units,
  finalKeywords,
  selectedUnitIds,
  unitPlanStale,
  runStatus,
  runningUnitId,
  readOnly,
  readOnlyMessage,
  expanded,
  onToggleExpanded,
  onToggleUnit,
  onSelectAll,
  onClearSelection,
  onUpdateUnit,
  onRecalculatePlan,
  onRunSelected,
  onRunAllPending,
  onPauseRun,
  onResumeRun,
  onCancelRun,
  onRunUnit,
  onPauseUnit,
  onResumeUnit,
  onCancelUnit,
}: {
  units: YoutubeCollectionUnit[];
  finalKeywords: YoutubeKeyword[];
  selectedUnitIds: string[];
  unitPlanStale: boolean;
  runStatus: "Idle" | "Running" | "Paused" | "Cancelling";
  runningUnitId: string | null;
  readOnly: boolean;
  readOnlyMessage: string;
  expanded: boolean;
  onToggleExpanded: () => void;
  onToggleUnit: (unitId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onUpdateUnit: (unitId: string, patch: Partial<Pick<YoutubeCollectionUnit, "targetResults" | "targetHours" | "status">>) => void;
  onRecalculatePlan: () => void;
  onRunSelected: () => void;
  onRunAllPending: () => void;
  onPauseRun: () => void;
  onResumeRun: () => void;
  onCancelRun: () => void;
  onRunUnit: (unitId: string) => void;
  onPauseUnit: (unitId: string) => void;
  onResumeUnit: (unitId: string) => void;
  onCancelUnit: (unitId: string) => void;
}) {
  const selectedCount = selectedUnitIds.length;
  const pendingCount = units.filter((unit) => ["Pending", "Ready", "Failed"].includes(unit.status)).length;
  const runBusy = runStatus === "Running" || runStatus === "Cancelling";
  const readyCount = units.filter((unit) => unit.status === "Ready").length;
  const runningCount = units.filter((unit) => unit.status === "Running").length + (runStatus === "Running" && !units.some((unit) => unit.status === "Running") ? 1 : 0);
  const completedCount = units.filter((unit) => unit.status === "Completed").length;
  const totalTargetLinks = units.reduce((sum, unit) => sum + (unit.targetResults || 0), 0);
  const totalTargetHours = units.reduce((sum, unit) => sum + (unit.targetHours || 0), 0);
  const keywordCountsByUnit = new Map<string, { selected: number; total: number }>();
  finalKeywords.forEach((keyword) => {
    if (!keyword.unitId) return;
    const current = keywordCountsByUnit.get(keyword.unitId) || { selected: 0, total: 0 };
    current.total += 1;
    if (keyword.selected !== false) current.selected += 1;
    keywordCountsByUnit.set(keyword.unitId, current);
  });

  function getKeywordCounts(unitId: string) {
    return keywordCountsByUnit.get(unitId) || { selected: 0, total: 0 };
  }

  function formatKeywordCount(counts: { selected: number; total: number }) {
    if (!counts.total) return "No keywords";
    if (counts.selected === counts.total) return `${counts.selected} selected`;
    return `${counts.selected} / ${counts.total} selected`;
  }

  function renderRunControls() {
    if (readOnly) return <div className="text-xs font-black text-[#9a6a35]">{readOnlyMessage}</div>;

    if (runStatus === "Running" || runStatus === "Cancelling") {
      return (
        <>
          <button type="button" onClick={onPauseRun} disabled={runStatus === "Cancelling"} className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-xs font-black text-[#40372f] disabled:opacity-50">Pause Run</button>
          <button type="button" onClick={onCancelRun} disabled={runStatus === "Cancelling"} className="rounded-md border border-[#f2c7c2] bg-[#fff1ef] px-3 py-2 text-xs font-black text-[#b42318] disabled:opacity-50">{runStatus === "Cancelling" ? "Cancelling..." : "Cancel Run"}</button>
        </>
      );
    }

    if (runStatus === "Paused") {
      return (
        <>
          <button type="button" onClick={onResumeRun} className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-2 text-xs font-black text-white">Resume Run</button>
          <button type="button" onClick={onCancelRun} className="rounded-md border border-[#f2c7c2] bg-[#fff1ef] px-3 py-2 text-xs font-black text-[#b42318]">Cancel Run</button>
        </>
      );
    }

    return (
      <>
        <button type="button" onClick={onRunSelected} disabled={!selectedCount || !units.length} className="rounded-md border border-[#1f5c43] bg-white px-3 py-2 text-xs font-black text-[#1f5c43] disabled:opacity-50">Run Selected Units</button>
        <button type="button" onClick={onRunAllPending} disabled={!pendingCount} className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-2 text-xs font-black text-white disabled:opacity-50">Run All Pending</button>
      </>
    );
  }

  function renderUnitActions(unit: YoutubeCollectionUnit) {
    if (readOnly) return <span className="text-xs font-bold text-[#9a6a35]">{readOnlyMessage}</span>;

    if (unit.status === "Pending" || unit.status === "Ready") {
      const counts = getKeywordCounts(unit.id);
      return (
        <div className="grid justify-items-center gap-1">
          <button type="button" onClick={() => onRunUnit(unit.id)} disabled={runBusy || counts.selected === 0} className="rounded-md border border-[#1f5c43] bg-white px-2 py-1 text-xs font-bold text-[#1f5c43] disabled:opacity-50">Run</button>
          {counts.selected === 0 ? <span className="max-w-[140px] text-center text-[10px] font-bold leading-4 text-[#9a6a35]">Generate or select keywords for this unit.</span> : null}
        </div>
      );
    }

    if (unit.status === "Running" || runningUnitId === unit.id) {
      return (
        <div className="flex flex-nowrap justify-center gap-1">
          <button type="button" onClick={() => onPauseUnit(unit.id)} disabled={runStatus === "Cancelling"} className="rounded-md border border-[#d7cec0] bg-white px-2 py-1 text-xs font-bold text-[#40372f] disabled:opacity-50">Pause</button>
          <button type="button" onClick={() => onCancelUnit(unit.id)} disabled={runStatus === "Cancelling"} className="rounded-md border border-[#f2c7c2] bg-[#fff1ef] px-2 py-1 text-xs font-bold text-[#b42318] disabled:opacity-50">Cancel</button>
        </div>
      );
    }

    if (unit.status === "Paused") {
      return (
        <div className="flex flex-nowrap justify-center gap-1">
          <button type="button" onClick={() => onResumeUnit(unit.id)} disabled={runBusy} className="rounded-md border border-[#1f5c43] bg-white px-2 py-1 text-xs font-bold text-[#1f5c43] disabled:opacity-50">Resume</button>
          <button type="button" onClick={() => onCancelUnit(unit.id)} disabled={runBusy} className="rounded-md border border-[#f2c7c2] bg-[#fff1ef] px-2 py-1 text-xs font-bold text-[#b42318] disabled:opacity-50">Cancel</button>
        </div>
      );
    }

    if (unit.status === "Completed") {
      return <button type="button" onClick={() => onRunUnit(unit.id)} disabled={runBusy} className="rounded-md border border-[#d7cec0] bg-white px-2 py-1 text-xs font-bold text-[#1f5c43] disabled:opacity-50">Rerun</button>;
    }

    if (unit.status === "Failed") {
      return (
        <div className="flex flex-nowrap justify-center gap-1">
          <button type="button" onClick={() => onRunUnit(unit.id)} disabled={runBusy} className="rounded-md border border-[#1f5c43] bg-white px-2 py-1 text-xs font-bold text-[#1f5c43] disabled:opacity-50">Retry</button>
          <button type="button" onClick={() => onCancelUnit(unit.id)} disabled={runBusy} className="rounded-md border border-[#f2c7c2] bg-[#fff1ef] px-2 py-1 text-xs font-bold text-[#b42318] disabled:opacity-50">Cancel</button>
        </div>
      );
    }

    if (unit.status === "Cancelled") {
      return <button type="button" onClick={() => onRunUnit(unit.id)} disabled={runBusy} className="rounded-md border border-[#d7cec0] bg-white px-2 py-1 text-xs font-bold text-[#1f5c43] disabled:opacity-50">Rerun</button>;
    }

    return null;
  }

  return (
    <section className="rounded-2xl border border-[#d0c3b3] bg-white p-5 shadow-[0_14px_32px_rgba(31,41,51,0.08)]">
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Collection Unit Plan</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-[#6f6256]">
            <span>{units.length} units · {selectedCount} selected · {readyCount} ready · {runningCount} running · {completedCount} completed</span>
            <span>{totalTargetLinks} links{totalTargetHours ? ` · ${Number(totalTargetHours.toFixed(2))}h` : ""}</span>
            {unitPlanStale ? <span className="rounded-full border border-[#ead6a2] bg-[#fff8e7] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#9a6a35]">Unit plan may need recalculation.</span> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={onToggleExpanded} className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-xs font-black text-[#40372f]">{expanded ? "Hide" : "Show"}</button>
          <button type="button" onClick={onRecalculatePlan} disabled={readOnly} className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-xs font-black text-[#1f5c43] disabled:opacity-50">Recalculate Plan</button>
          <button type="button" onClick={onSelectAll} disabled={readOnly || !units.length} className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-xs font-black text-[#40372f] disabled:opacity-50">Select All</button>
          <button type="button" onClick={onClearSelection} disabled={readOnly || !units.length} className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-xs font-black text-[#40372f] disabled:opacity-50">Clear</button>
          {renderRunControls()}
        </div>
      </div>
      {expanded ? <div className="overflow-x-auto rounded-xl border border-[#e2d8c8] bg-white">
        <table className="data-table min-w-[1320px] table-fixed">
          <colgroup>
            <col className="w-[56px]" />
            <col className="w-[80px]" />
            <col className="w-[170px]" />
            <col className="w-[220px]" />
            <col className="w-[190px]" />
            <col className="w-[155px]" />
            <col className="w-[125px]" />
            <col className="w-[155px]" />
            <col className="w-[105px]" />
            <col className="w-[135px]" />
          </colgroup>
          <thead>
            <tr>
              <th className="th-center">Run</th>
              <th className="th-left">Unit</th>
              <th className="th-left">Language</th>
              <th className="th-left">Domain</th>
              <th className="th-left">Search Target</th>
              <th className="th-left">Target</th>
              <th className="th-left">Keywords</th>
              <th className="th-left">Progress</th>
              <th className="th-left">Status</th>
              <th className="th-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit, index) => {
              const keywordCounts = getKeywordCounts(unit.id);
              return (
              <tr key={unit.id}>
                <td className="td-center"><input type="checkbox" checked={selectedUnitIds.includes(unit.id)} disabled={readOnly} onChange={() => onToggleUnit(unit.id)} className="accent-[#1f5c43] disabled:opacity-50" /></td>
                <td className="td-left font-black text-[#111827]">Unit {index + 1}</td>
                <td className="td-left whitespace-normal font-bold leading-5">{unit.language}</td>
                <td className="td-left whitespace-normal font-bold leading-5">{unit.domain}</td>
                <td className="td-left whitespace-normal font-bold leading-5">{unit.searchTarget}</td>
                <td className="td-left align-middle">
                  <div className="flex flex-col justify-center gap-1">
                    <label className="grid grid-cols-[48px_82px] items-center gap-2">
                      <span className="text-right text-[10px] font-black uppercase tracking-[0.08em] text-[#6f6256]">Links</span>
                      <input type="number" min={1} value={unit.targetResults} disabled={readOnly} onChange={(event) => onUpdateUnit(unit.id, { targetResults: Math.max(1, Number(event.target.value) || 1) })} className="h-8 w-[82px] rounded-md border border-[#d7cec0] bg-white px-2 text-xs font-bold text-[#40372f] outline-none disabled:opacity-60" />
                    </label>
                    <label className="grid grid-cols-[48px_82px] items-center gap-2">
                      <span className="text-right text-[10px] font-black uppercase tracking-[0.08em] text-[#6f6256]">Hours</span>
                      <input type="number" min={0} step="0.25" value={unit.targetHours ?? ""} disabled={readOnly} onChange={(event) => onUpdateUnit(unit.id, { targetHours: event.target.value ? Number(event.target.value) : null })} className="h-8 w-[82px] rounded-md border border-[#d7cec0] bg-white px-2 text-xs font-bold text-[#40372f] outline-none disabled:opacity-60" placeholder="-" />
                    </label>
                  </div>
                </td>
                <td className="td-left text-xs font-bold text-[#40372f]">{formatKeywordCount(keywordCounts)}</td>
                <td className="td-left align-middle">
                  <div className="text-xs font-black text-[#111827]">{unit.uniqueResults} / {unit.targetResults} · {unit.progress}%</div>
                  <div className="mt-1 text-[10px] font-bold text-[#6f6256]" title={`Collected ${unit.collectedResults}`}>Dup {unit.duplicateCount}</div>
                </td>
                <td className="td-left">
                  <div>{unit.status}</div>
                  {unit.status === "Running" && unit.runningByEmail ? <div className="mt-1 text-[10px] font-bold text-[#6f6256]">Running by {unit.runningByEmail}</div> : null}
                </td>
                <td className="td-actions align-middle"><div className="flex flex-wrap items-center justify-center gap-2">{renderUnitActions(unit)}</div></td>
              </tr>
              );
            })}
            {!units.length ? <tr><td colSpan={10} className="td-center py-8 text-sm font-bold text-[#6f6256]">Select language, domain, and search target to generate units.</td></tr> : null}
          </tbody>
        </table>
      </div> : null}
    </section>
  );
}

function CurrentTaskPanel({
  task,
  resultCount,
  onCreateNew,
  onOpenHistory,
  onExport,
  onComplete,
  onReopen,
  onPauseRun,
  onResumeRun,
  onCancelRun,
}: {
  task: DbTask | null;
  resultCount: number;
  onCreateNew: () => void;
  onOpenHistory: () => void;
  onExport: () => void;
  onComplete: () => void;
  onReopen: () => void;
  onPauseRun: () => void;
  onResumeRun: () => void;
  onCancelRun: () => void;
}) {
  if (!task) {
    return (
      <section className="rounded-2xl border border-dashed border-[#d0c3b3] bg-white p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Current Task</div>
            <h2 className="mt-2 text-xl font-black text-[#111827]">No active task.</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onCreateNew} className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-black text-white">Create New Task</button>
            <button type="button" onClick={onOpenHistory} className="rounded-md border border-[#d7cec0] bg-white px-4 py-2 text-sm font-black text-[#40372f]">Open Task History</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#d0c3b3] bg-white p-5 shadow-[0_10px_24px_rgba(31,41,51,0.07)]">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Current Task</div>
          <h2 className="mt-2 text-2xl font-black text-[#111827]">{task.name}</h2>
          <div className="mt-3 grid gap-x-6 gap-y-2 text-sm font-bold text-[#6f6256] md:grid-cols-2 xl:grid-cols-3">
            <span>Language: <b className="text-[#111827]">{task.language}</b></span>
            <span>Domain: <b className="text-[#111827]">{task.domain}</b></span>
            <span>Search Targets: <b className="text-[#111827]">{task.searchTargets.join(", ")}</b></span>
            <span className="flex items-center gap-2">Status: <b className={`rounded-full border px-2 py-1 text-xs font-black ${statusBadgeClass(task.status)}`}>{displayTaskStatus(task.status)}</b></span>
            {task.editingByEmail ? <span className="flex items-center gap-2">Editing by <b>{task.editingByEmail}</b></span> : null}
            <span>Created At: <b className="text-[#111827]">{formatDate(task.createdAt)}</b></span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {task.status === "Running" ? (
            <>
              <button type="button" onClick={onPauseRun} className="rounded-md border border-[#d7cec0] bg-white px-4 py-2 text-sm font-black text-[#40372f]">Pause Run</button>
              <button type="button" onClick={onCancelRun} className="rounded-md border border-[#f2c7c2] bg-[#fff1ef] px-4 py-2 text-sm font-black text-[#b42318]">Cancel Run</button>
            </>
          ) : task.status === "Paused" ? (
            <>
              <button type="button" onClick={onResumeRun} className="rounded-md border border-[#1f5c43] bg-white px-4 py-2 text-sm font-black text-[#1f5c43]">Resume Run</button>
              <button type="button" onClick={onCancelRun} className="rounded-md border border-[#f2c7c2] bg-[#fff1ef] px-4 py-2 text-sm font-black text-[#b42318]">Cancel Run</button>
            </>
          ) : task.status === "Completed" ? (
            <button type="button" onClick={onReopen} className="rounded-md border border-[#1f5c43] bg-white px-4 py-2 text-sm font-black text-[#1f5c43]">Reopen Task</button>
          ) : (
            <button type="button" onClick={onComplete} className="rounded-md border border-[#d7cec0] bg-white px-4 py-2 text-sm font-black text-[#40372f]">Complete Task</button>
          )}
          <button type="button" onClick={onExport} disabled={!resultCount} title={!resultCount ? "No results to export." : undefined} className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-black text-white disabled:opacity-50">Export CSV</button>
        </div>
      </div>
    </section>
  );
}

function SummaryBar({ summary, targetUniqueResults, targetHours, hasTask }: { summary: Summary; targetUniqueResults: number; targetHours: number | null; hasTask: boolean }) {
  const percent = targetUniqueResults ? Math.round((summary.uniqueResults / targetUniqueResults) * 100) : 0;
  const stats = [
    ["Target Results", targetUniqueResults],
    ["Target Hours", targetHours ?? "-"],
    ["Unique Results", summary.uniqueResults],
    ["Total Collected", summary.totalCollected],
    ["Duplicates Removed", summary.duplicatesRemoved],
    ["Progress", `${summary.uniqueResults} of ${targetUniqueResults} (${percent}%)`],
    ["Pending", summary.pendingCount],
    ["Useful", summary.usefulCount],
    ["Not Useful", summary.notUsefulCount],
    ["Processed", summary.processedCount],
    ["Deleted", summary.deletedCount],
  ];

  return (
    <section className="rounded-2xl border border-[#d0c3b3] bg-white p-4 shadow-[0_10px_24px_rgba(31,41,51,0.07)]">
      <div className="mb-3">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Merged Results Summary</div>
        {!hasTask ? <div className="mt-1 text-xs font-bold text-[#9a6a35]">Create a task to start.</div> : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[#e2d8c8] bg-[#fbfaf6] px-3 py-2">
            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6f6256]">{label}</div>
            <div className="mt-1 text-lg font-black text-[#111827]">{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RunLogsPanel({ batches, expanded, onToggle }: { batches: DbBatch[]; expanded: boolean; onToggle: () => void }) {
  return (
    <section className="space-y-3">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between rounded-2xl border border-[#d0c3b3] bg-white px-5 py-4 text-left shadow-[0_10px_24px_rgba(31,41,51,0.05)]">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Run Logs ({batches.length})</div>
          <div className="mt-1 text-xs font-bold text-[#9a8a7a]">Execution history for unit runs.</div>
        </div>
        <span className="text-sm font-black text-[#1f5c43]">{expanded ? "Hide" : "Show"}</span>
      </button>
      {expanded ? <div className="overflow-x-auto rounded-2xl border border-[#d0c3b3] bg-white">
        <table className="data-table min-w-[1550px]">
          <thead><tr><th className="th-left">Run</th><th className="th-left">Unit</th><th className="th-left">Language</th><th className="th-left">Domain</th><th className="th-left">Search Target</th><th className="th-left">Published Date Range</th><th className="th-left">Status</th><th className="th-left">Requested</th><th className="th-left">Returned</th><th className="th-left">Filtered by Date</th><th className="th-left">Unique Added</th><th className="th-left">Duplicates</th><th className="th-left">Started At</th><th className="th-left">Finished At</th><th className="th-left">Error</th></tr></thead>
          <tbody>
            {batches.map((batch) => {
              const primaryKeyword = getBatchPrimaryKeyword(batch);
              const unitLabel = primaryKeyword?.unitLabel || [primaryKeyword?.language, primaryKeyword?.domain, primaryKeyword?.searchTarget].filter(Boolean).join(" / ") || "-";
              return (
                <tr key={batch.id}>
                  <td className="td-left max-w-[260px] font-bold">{batch.batchName || "-"}</td>
                  <td className="td-left max-w-[260px]">{unitLabel}</td>
                  <td className="td-left">{primaryKeyword?.language || "-"}</td>
                  <td className="td-left">{primaryKeyword?.domain || "-"}</td>
                  <td className="td-left">{primaryKeyword?.searchTarget || "-"}</td>
                  <td className="td-left">{batch.publishedDateRangeLabel || primaryKeyword?.publishedDateRangeLabel || "Any time"}</td>
                  <td className="td-left">{batch.status}</td>
                  <td className="td-left">{batch.requestedCount || 0}</td>
                  <td className="td-left">{batch.returnedCount}</td>
                  <td className="td-left">{batch.filteredByDateCount || 0}</td>
                  <td className="td-left">{batch.uniqueAddedCount}</td>
                  <td className="td-left">{batch.duplicateCount}</td>
                  <td className="td-left">{formatDate(batch.startedAt)}</td>
                  <td className="td-left">{formatDate(batch.finishedAt)}</td>
                  <td className="td-left max-w-[260px] truncate text-[#b42318]">{batch.errorMessage || "-"}</td>
                </tr>
              );
            })}
            {!batches.length ? <tr><td colSpan={15} className="td-center py-8 text-sm font-bold text-[#6f6256]">No run logs yet.</td></tr> : null}
          </tbody>
        </table>
      </div> : null}
    </section>
  );
}

function TaskResultsPanel({ task, rows, units, filters, selectedIds, loading, readOnly, readOnlyMessage, suspectedGroupByResultId, expanded, onToggleExpanded, onFiltersChange, onSelectAll, onToggleSelected, onPatch, onDelete, onBulkUpdate, onBulkDelete, onReviewDuplicates, onPrimaryUnitChange, onRebalancePrimaryUnits }: { task: DbTask | null; rows: DbResult[]; units: YoutubeCollectionUnit[]; filters: TabFilters; selectedIds: string[]; loading: boolean; readOnly: boolean; readOnlyMessage: string; suspectedGroupByResultId: Record<string, string>; expanded: boolean; onToggleExpanded: () => void; onFiltersChange: (filters: TabFilters) => void; onSelectAll: (ids: string[]) => void; onToggleSelected: (id: string) => void; onPatch: (id: string, patch: { status?: YoutubeResultStatus; notes?: string }) => void; onDelete: (id: string) => void; onBulkUpdate: (status: YoutubeResultStatus) => void; onBulkDelete: () => void; onReviewDuplicates: (groupId: string) => void; onPrimaryUnitChange: (resultId: string, primaryUnitId: string) => void; onRebalancePrimaryUnits: () => void }) {
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));
  const emptyText = !task ? "No active task." : filters.status || filters.q.trim() ? "No results match the current filters." : "No results yet.";
  const usefulCount = rows.filter((row) => row.status === "Useful").length;
  const processedCount = rows.filter((row) => row.status === "Processed").length;
  const duplicateCount = rows.reduce((sum, row) => sum + (row.duplicateCount || 0), 0);

  if (!task) {
    return (
      <section className="rounded-2xl border border-[#d0c3b3] bg-white px-5 py-4">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Task Results</div>
        <div className="mt-2 text-sm font-bold text-[#6f6256]">No active task.</div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Task Results</div>
          <div className="mt-1 text-xs font-bold text-[#9a8a7a]">{rows.length} results · {duplicateCount} duplicates · {usefulCount} useful · {processedCount} processed</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onRebalancePrimaryUnits} disabled={readOnly || !rows.length || loading} title={readOnly ? readOnlyMessage : undefined} className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-xs font-black text-[#1f5c43] disabled:opacity-50">Rebalance Primary Units</button>
          <button type="button" onClick={onToggleExpanded} className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-xs font-black text-[#1f5c43]">{expanded ? "Hide" : "Show"}</button>
        </div>
      </div>
      {!expanded ? null : !rows.length && !filters.status && !filters.q.trim() ? (
        <div className="rounded-2xl border border-[#d0c3b3] bg-white py-8 text-center text-sm font-bold text-[#6f6256]">{emptyText}</div>
      ) : (
        <>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <select value={filters.status} onChange={(event) => onFiltersChange({ ...filters, status: event.target.value })} className="h-10 rounded-md border border-[#d7cec0] bg-white px-3 text-sm font-bold text-[#40372f]"><option value="">All</option>{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select>
          <input value={filters.q} onChange={(event) => onFiltersChange({ ...filters, q: event.target.value })} className="h-10 w-[240px] rounded-md border border-[#d7cec0] bg-white px-3 text-sm font-bold text-[#40372f]" placeholder="Search results" />
          <button type="button" onClick={() => onFiltersChange({ status: "", q: "" })} className="h-10 rounded-md border border-[#d7cec0] bg-white px-3 text-sm font-black text-[#40372f]">Clear Filters</button>
        </div>
      {selectedIds.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] px-3 py-2">
          <span className="mr-1 text-xs font-black uppercase tracking-[0.12em] text-[#6f6256]">{selectedIds.length} selected</span>
          {readOnly ? <span className="text-xs font-bold text-[#9a6a35]">{readOnlyMessage}</span> : null}
          <button type="button" disabled={readOnly || loading} onClick={() => onBulkUpdate("Useful")} className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-xs font-black text-[#40372f] disabled:opacity-50">Mark Useful</button>
          <button type="button" disabled={readOnly || loading} onClick={() => onBulkUpdate("Not Useful")} className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-xs font-black text-[#40372f] disabled:opacity-50">Mark Not Useful</button>
          <button type="button" disabled={readOnly || loading} onClick={() => onBulkUpdate("Processed")} className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-xs font-black text-[#40372f] disabled:opacity-50">Mark Processed</button>
          <button type="button" disabled={readOnly || loading} onClick={onBulkDelete} className="rounded-md border border-[#f2c7c2] bg-[#fff1ef] px-3 py-2 text-xs font-black text-[#b42318] disabled:opacity-50">Delete Selected</button>
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-[#d0c3b3] bg-white shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
        <table className="data-table min-w-[1850px]"><thead><tr><th className="th-center"><input type="checkbox" checked={allSelected} disabled={readOnly} onChange={() => onSelectAll(allSelected ? [] : rows.map((row) => row.id))} className="accent-[#1f5c43] disabled:opacity-50" /></th><th className="th-left">Title</th><th className="th-left">Video URL</th><th className="th-left">Channel Name</th><th className="th-left">Primary Unit</th><th className="th-left">Sources</th><th className="th-left">Published Date</th><th className="th-left">Duration</th><th className="th-left">View Count</th><th className="th-left">Status</th><th className="th-left">Notes</th><th className="th-center">Actions</th></tr></thead>
          <tbody>{rows.map((row) => {
            const suspectedGroupId = suspectedGroupByResultId[row.id];
            return (
              <tr key={row.id}><td className="td-center"><input type="checkbox" checked={selectedIds.includes(row.id)} disabled={readOnly} onChange={() => onToggleSelected(row.id)} className="accent-[#1f5c43] disabled:opacity-50" /></td><td className="td-left max-w-[320px] font-bold text-[#111827]"><div>{row.title || "Untitled"}</div><div className="mt-1 text-[11px] font-bold text-[#6f6256]">Tags: {row.metadata?.youtubeTags?.length || 0} · Hashtags: {row.metadata?.hashtags?.length || 0}{row.metadata?.category ? ` · ${row.metadata.category}` : ""}</div>{suspectedGroupId ? <button type="button" onClick={() => onReviewDuplicates(suspectedGroupId)} className="mt-2 rounded-full border border-[#f1d49a] bg-[#fff8e8] px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#9a6a35]">Suspected similar</button> : null}</td><td className="td-left max-w-[240px] truncate"><a href={row.videoUrl} target="_blank" rel="noreferrer" className="font-bold text-[#1f5c43] underline">{row.videoUrl}</a></td><td className="td-left">{row.channelName || "-"}</td><td className="td-left max-w-[340px]"><div className="font-black text-[#111827]">{row.primaryUnitLabel || "Unassigned"}</div><div className="mt-1 text-[11px] font-bold text-[#6f6256]">{row.primaryUnitReason || "No matched source metadata available"}</div><select value={row.primaryUnitId || ""} onChange={(event) => onPrimaryUnitChange(row.id, event.target.value)} disabled={readOnly || !units.length || loading} title={readOnly ? readOnlyMessage : undefined} className="mt-2 h-8 w-full rounded-md border border-[#d7cec0] bg-white px-2 text-xs font-bold text-[#40372f] disabled:opacity-50"><option value="">Select primary unit</option>{units.map((unit, index) => <option key={unit.id} value={unit.id}>Unit {index + 1} · {unit.domain} / {unit.searchTarget}</option>)}</select><div className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9a8a7a]">Set by {row.primaryUnitSetBy || "system"}</div></td><td className="td-left"><button type="button" onClick={() => onReviewDuplicates(row.videoId ? `videoId:${row.videoId}` : `url:${row.normalizedVideoUrl || row.videoUrl}`)} className="font-black text-[#1f5c43] underline">Sources: {row.matchedSourcesCount || row.duplicateCount + 1 || 1}</button></td><td className="td-left">{row.publishedDate}</td><td className="td-left">{row.duration}</td><td className="td-left">{row.viewCount}</td><td className="td-left"><select value={row.status} disabled={readOnly} onChange={(event) => onPatch(row.id, { status: event.target.value as YoutubeResultStatus })} className="rounded-md border border-[#d7cec0] bg-white px-2 py-1 text-xs font-bold text-[#40372f] disabled:opacity-60">{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select></td><td className="td-left"><input value={row.notes || ""} disabled={readOnly} onChange={(event) => onPatch(row.id, { notes: event.target.value })} className="w-[220px] rounded-md border border-[#d7cec0] bg-white px-2 py-1 text-xs font-semibold text-[#40372f] outline-none disabled:opacity-60" placeholder="Notes" /></td><td className="td-actions"><div className="flex flex-wrap gap-2"><a href={row.videoUrl} target="_blank" rel="noreferrer" className="rounded-md border border-[#d7cec0] bg-white px-2 py-1 text-xs font-bold text-[#40372f]">Open</a><button type="button" onClick={() => navigator.clipboard?.writeText(row.videoUrl)} className="rounded-md border border-[#d7cec0] bg-white px-2 py-1 text-xs font-bold text-[#40372f]">Copy URL</button><button type="button" disabled={readOnly} onClick={() => onPatch(row.id, { status: "Useful" })} className="rounded-md border border-[#d7cec0] bg-white px-2 py-1 text-xs font-bold text-[#1f5c43] disabled:opacity-50">Mark Useful</button><button type="button" disabled={readOnly} onClick={() => onPatch(row.id, { status: "Not Useful" })} className="rounded-md border border-[#d7cec0] bg-white px-2 py-1 text-xs font-bold text-[#40372f] disabled:opacity-50">Mark Not Useful</button><button type="button" disabled={readOnly} onClick={() => onPatch(row.id, { status: "Processed" })} className="rounded-md border border-[#d7cec0] bg-white px-2 py-1 text-xs font-bold text-[#40372f] disabled:opacity-50">Mark Processed</button><button type="button" disabled={readOnly} onClick={() => onDelete(row.id)} className="rounded-md border border-[#f2c7c2] bg-[#fff1ef] px-2 py-1 text-xs font-bold text-[#b42318] disabled:opacity-50">Delete</button></div></td></tr>
            );
          })}{!rows.length ? <tr><td colSpan={12} className="td-center py-10 text-sm font-bold text-[#6f6256]">{emptyText}</td></tr> : null}</tbody></table>
      </div>
      </>
      )}
    </section>
  );
}

function DuplicateReviewPanel({
  refNode,
  confirmedGroups,
  suspectedGroups,
  matchedSourcesGroups,
  matchedSourcesSummary,
  summary,
  expanded,
  matchedSourcesExpanded,
  expandedGroupId,
  reviewedGroupIds,
  suspectedDecisions,
  loading,
  readOnly,
  readOnlyMessage,
  onToggle,
  onToggleMatchedSources,
  onToggleGroup,
  onCleanConfirmed,
  onSetKeep,
  onToggleDelete,
  onApplyDecision,
  onKeepSeparate,
  onIgnore,
}: {
  refNode: RefObject<HTMLElement | null>;
  confirmedGroups: DuplicateGroup[];
  suspectedGroups: SuspectedDuplicateGroup[];
  matchedSourcesGroups: DuplicateGroup[];
  matchedSourcesSummary: MatchedSourcesSummary;
  summary: DuplicateSummary;
  expanded: boolean;
  matchedSourcesExpanded: boolean;
  expandedGroupId: string | null;
  reviewedGroupIds: string[];
  suspectedDecisions: Record<string, SuspectedDecision>;
  loading: boolean;
  readOnly: boolean;
  readOnlyMessage: string;
  onToggle: () => void;
  onToggleMatchedSources: () => void;
  onToggleGroup: (groupId: string) => void;
  onCleanConfirmed: () => void;
  onSetKeep: (groupId: string, resultId: string) => void;
  onToggleDelete: (groupId: string, resultId: string) => void;
  onApplyDecision: (groupId: string) => void;
  onKeepSeparate: (groupId: string) => void;
  onIgnore: (groupId: string) => void;
}) {
  const visibleConfirmedGroups = confirmedGroups.filter((group) => !reviewedGroupIds.includes(group.groupId) && group.groupType === "confirmed_video_duplicate" && group.candidates.length > 1);
  const visibleMatchedSourcesGroups = matchedSourcesGroups.filter((group) => !reviewedGroupIds.includes(group.groupId));
  const visibleSuspectedGroups = suspectedGroups.filter((group) => !reviewedGroupIds.includes(group.groupId));
  const totalDuplicateItems = summary.confirmedDuplicates + summary.suspectedResults;
  const hasConfirmedRows = visibleConfirmedGroups.some((group) => group.entries.length > 0);

  return (
    <section ref={refNode} className="overflow-hidden rounded-2xl border border-[#d0c3b3] bg-white shadow-[0_10px_24px_rgba(31,41,51,0.05)]">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between px-5 py-4 text-left">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Duplicate Review</div>
          <div className="mt-1 text-xs font-bold text-[#9a8a7a]">{totalDuplicateItems ? `Confirmed ${summary.confirmedGroups} · Suspected ${summary.suspectedGroups}` : "No duplicate videos found."}</div>
        </div>
        <span className="text-sm font-black text-[#1f5c43]">{expanded ? "Hide" : "Show"}</span>
      </button>
      {expanded ? (
        <div className="space-y-5 border-t border-[#e2d8c8] p-4">
          {!visibleConfirmedGroups.length && !visibleSuspectedGroups.length && !visibleMatchedSourcesGroups.length ? (
            <div className="py-8 text-center text-sm font-bold text-[#6f6256]">No duplicate videos found.</div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-[#6f6256]">Confirmed Duplicate Videos</div>
                    <div className="mt-1 text-xs font-bold text-[#9a8a7a]">{visibleConfirmedGroups.length} groups with multiple video rows</div>
                  </div>
                  {visibleConfirmedGroups.length ? (
                    <button type="button" onClick={onCleanConfirmed} disabled={readOnly || loading} title={readOnly ? readOnlyMessage : undefined} className="rounded-md border border-[#1f5c43] bg-white px-3 py-2 text-xs font-black text-[#1f5c43] disabled:opacity-50">
                      {hasConfirmedRows ? "Clean Confirmed Duplicates" : "Mark Confirmed Duplicates Reviewed"}
                    </button>
                  ) : null}
                </div>
                {!visibleConfirmedGroups.length ? <div className="rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] px-4 py-5 text-sm font-bold text-[#6f6256]">No confirmed duplicate video rows found.</div> : null}
                {visibleConfirmedGroups.map((group) => {
                  const result = group.canonicalResult;
                  const isOpen = expandedGroupId === group.groupId;
                  const decision = suspectedDecisions[group.groupId] || {
                    keepResultId: result.id,
                    deleteResultIds: group.candidates.filter((row) => row.id !== result.id).map((row) => row.id),
                  };
                  return (
                    <div key={group.groupId} className="overflow-hidden rounded-xl border border-[#e2d8c8] bg-[#fbfaf6]">
                      <button type="button" onClick={() => onToggleGroup(group.groupId)} className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left">
                        <div>
                          <a href={result.videoUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="text-sm font-black text-[#111827] underline decoration-transparent underline-offset-4 hover:text-[#1f5c43] hover:decoration-[#1f5c43]">{result.title || "Untitled video"}</a>
                          <div className="mt-1"><a href={result.videoUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="truncate text-xs font-bold text-[#1f5c43] underline">{result.videoUrl || "Open video"}</a></div>
                          <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-[#6f6256]">
                            <span className="rounded-full border border-[#d7cec0] bg-white px-2 py-1">Confirmed</span>
                            <span className="rounded-full border border-[#d7cec0] bg-white px-2 py-1">{group.reason}</span>
                            <span className="rounded-full border border-[#d7cec0] bg-white px-2 py-1">{group.candidates.length} videos</span>
                            <span className="rounded-full border border-[#d7cec0] bg-white px-2 py-1">{decision.deleteResultIds.length} marked for deletion</span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-[#1f5c43]">{isOpen ? "Collapse" : "Review"}</span>
                      </button>
                      {isOpen ? (
                        <div className="border-t border-[#e2d8c8]">
                          <DuplicateCandidatesTable
                            groupId={group.groupId}
                            rows={group.candidates}
                            reason={group.reason}
                            decision={decision}
                            loading={loading || readOnly}
                            onSetKeep={onSetKeep}
                            onToggleDelete={onToggleDelete}
                          />
                          <div className="flex flex-wrap justify-end gap-2 border-t border-[#e2d8c8] bg-white px-4 py-3">
                            <button type="button" onClick={() => onApplyDecision(group.groupId)} disabled={readOnly || loading || !decision.keepResultId || !decision.deleteResultIds.length} title={readOnly ? readOnlyMessage : undefined} className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-2 text-xs font-black text-white disabled:opacity-50">Apply Decision</button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-[#6f6256]">Suspected Similar Videos</div>
                  <div className="mt-1 text-xs font-bold text-[#9a8a7a]">{summary.suspectedGroups} groups · {summary.suspectedResults} videos to review</div>
                </div>
                {!visibleSuspectedGroups.length ? <div className="rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] px-4 py-5 text-sm font-bold text-[#6f6256]">No suspected similar videos found.</div> : null}
                {visibleSuspectedGroups.map((group, index) => {
                  const isOpen = expandedGroupId === group.groupId;
                  const decision = suspectedDecisions[group.groupId] || { keepResultId: group.recommendedKeepResultId, deleteResultIds: group.results.filter((row) => row.id !== group.recommendedKeepResultId).map((row) => row.id) };
                  return (
                    <div key={group.groupId} className="rounded-xl border border-[#e2d8c8] bg-[#fbfaf6]">
                      <button type="button" onClick={() => onToggleGroup(group.groupId)} className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left">
                        <div>
                          <div className="text-sm font-black text-[#111827]">Suspected Similar Group #{index + 1}</div>
                          <div className="mt-1 text-xs font-bold text-[#6f6256]">{group.results.length} videos · {group.reason}</div>
                          <div className="mt-2 text-[10px] font-black uppercase tracking-[0.1em] text-[#9a8a7a]">Similarity {Math.round(group.similarityScore * 100)}%</div>
                        </div>
                        <span className="text-xs font-black text-[#1f5c43]">{isOpen ? "Collapse" : "Compare"}</span>
                      </button>
                      {isOpen ? (
                        <div className="border-t border-[#e2d8c8]">
                          <div className="overflow-x-auto bg-white">
                            <table className="data-table min-w-[1500px]">
                              <thead><tr><th className="th-center">Keep</th><th className="th-center">Delete</th><th className="th-left">Title</th><th className="th-left">Video URL</th><th className="th-left">Channel</th><th className="th-left">Duration</th><th className="th-left">Published</th><th className="th-left">View Count</th><th className="th-left">Matched Units</th><th className="th-left">Matched Keywords</th><th className="th-left">Status</th></tr></thead>
                              <tbody>
                                {group.results.map((row) => {
                                  const isKept = decision.keepResultId === row.id;
                                  return (
                                    <tr key={row.id}>
                                      <td className="td-center"><input type="radio" checked={isKept} disabled={readOnly} onChange={() => onSetKeep(group.groupId, row.id)} className="accent-[#1f5c43] disabled:opacity-50" /></td>
                                      <td className="td-center"><input type="checkbox" checked={decision.deleteResultIds.includes(row.id)} disabled={readOnly || isKept} onChange={() => onToggleDelete(group.groupId, row.id)} className="accent-[#b42318] disabled:opacity-50" /></td>
                                      <td className="td-left max-w-[320px] font-bold text-[#111827]"><a href={row.videoUrl} target="_blank" rel="noreferrer" className="underline decoration-transparent underline-offset-4 hover:text-[#1f5c43] hover:decoration-[#1f5c43]">{row.title || "Untitled"}</a></td>
                                      <td className="td-left max-w-[260px] truncate"><a href={row.videoUrl} target="_blank" rel="noreferrer" className="font-bold text-[#1f5c43] underline">{row.videoUrl}</a></td>
                                      <td className="td-left">{row.channelName || "-"}</td>
                                      <td className="td-left">{row.duration || "-"}</td>
                                      <td className="td-left">{row.publishedDate || "-"}</td>
                                      <td className="td-left">{row.viewCount || "-"}</td>
                                      <td className="td-left max-w-[260px]">{row.matchedUnits?.join("; ") || "-"}</td>
                                      <td className="td-left max-w-[300px]">{row.matchedKeywords?.join("; ") || "-"}</td>
                                      <td className="td-left">{row.status}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          <div className="flex flex-wrap justify-end gap-2 border-t border-[#e2d8c8] bg-white px-4 py-3">
                            <button type="button" onClick={() => onIgnore(group.groupId)} disabled={readOnly || loading} title={readOnly ? readOnlyMessage : undefined} className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-xs font-black text-[#40372f] disabled:opacity-50">Ignore Group</button>
                            <button type="button" onClick={() => onKeepSeparate(group.groupId)} disabled={readOnly || loading} title={readOnly ? readOnlyMessage : undefined} className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-xs font-black text-[#40372f] disabled:opacity-50">Keep All as Separate Videos</button>
                            <button type="button" onClick={() => onApplyDecision(group.groupId)} disabled={readOnly || loading || !decision.keepResultId || !decision.deleteResultIds.length} title={readOnly ? readOnlyMessage : undefined} className="rounded-md border border-[#b42318] bg-white px-3 py-2 text-xs font-black text-[#b42318] disabled:opacity-50">Delete Selected Similar Videos</button>
                            <button type="button" onClick={() => onApplyDecision(group.groupId)} disabled={readOnly || loading || !decision.keepResultId || !decision.deleteResultIds.length} title={readOnly ? readOnlyMessage : undefined} className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-2 text-xs font-black text-white disabled:opacity-50">Apply Decision</button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className="space-y-3">
                <div className="flex flex-col justify-between gap-2 border-t border-[#e2d8c8] pt-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-[#6f6256]">Matched Sources</div>
                    <div className="mt-1 text-xs font-bold text-[#9a8a7a]">
                      {matchedSourcesSummary.videosWithMultipleSources || visibleMatchedSourcesGroups.length} videos found by multiple keywords or units
                    </div>
                    <div className="mt-1 text-xs font-bold leading-5 text-[#6f6256]">
                      Videos found by multiple keywords or units. Useful for search traceability, not duplicate removal.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleMatchedSources}
                    disabled={!visibleMatchedSourcesGroups.length}
                    className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-xs font-black text-[#1f5c43] disabled:opacity-50"
                  >
                    {matchedSourcesExpanded ? "Hide" : "Show"}
                  </button>
                </div>
                {!visibleMatchedSourcesGroups.length ? <div className="rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] px-4 py-4 text-sm font-bold text-[#6f6256]">No matched sources found.</div> : null}
                {matchedSourcesExpanded ? visibleMatchedSourcesGroups.map((group) => {
                  const result = group.canonicalResult;
                  const isOpen = expandedGroupId === group.groupId;
                  return (
                    <div key={group.groupId} className="overflow-hidden rounded-xl border border-[#e2d8c8] bg-[#fbfaf6]">
                      <button type="button" onClick={() => onToggleGroup(group.groupId)} className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left">
                        <div>
                          <a href={result.videoUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="text-sm font-black text-[#111827] underline decoration-transparent underline-offset-4 hover:text-[#1f5c43] hover:decoration-[#1f5c43]">{result.title || "Untitled video"}</a>
                          <div className="mt-1"><a href={result.videoUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="truncate text-xs font-bold text-[#1f5c43] underline">{result.videoUrl || "Open video"}</a></div>
                          <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-[#6f6256]">
                            <span className="rounded-full border border-[#d7cec0] bg-white px-2 py-1">Primary Unit: {result.primaryUnitLabel || "Unassigned"}</span>
                            <span className="rounded-full border border-[#d7cec0] bg-white px-2 py-1">Sources: {Math.max(group.matches.length + 1, group.duplicateCount + 1)}</span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-[#1f5c43]">{isOpen ? "Collapse" : "Details"}</span>
                      </button>
                      {isOpen ? (
                        <div className="border-t border-[#e2d8c8]">
                          <div className="bg-white px-4 py-3 text-xs font-bold text-[#6f6256]">This video was found by multiple keywords or units. This is source context, not a duplicate video group.</div>
                          <div className="overflow-x-auto bg-white">
                            <table className="data-table min-w-[1100px]">
                              <thead><tr><th className="th-left">Source Unit</th><th className="th-left">Language</th><th className="th-left">Domain</th><th className="th-left">Search Target</th><th className="th-left">Keyword</th><th className="th-left">Keyword Source</th><th className="th-left">Run / Batch</th><th className="th-left">Detected At</th></tr></thead>
                              <tbody>
                                {group.matches.map((match) => (
                                  <tr key={match.matchId}>
                                    <td className="td-left max-w-[260px]">{match.unitLabel || [match.language, match.domain, match.searchTarget].filter(Boolean).join(" / ") || "-"}</td>
                                    <td className="td-left">{match.language || "-"}</td>
                                    <td className="td-left">{match.domain || "-"}</td>
                                    <td className="td-left">{match.searchTarget || "-"}</td>
                                    <td className="td-left max-w-[260px]">{match.keyword}</td>
                                    <td className="td-left">{match.keywordSource || "-"}</td>
                                    <td className="td-left max-w-[260px]">{match.run || match.batchId}</td>
                                    <td className="td-left whitespace-nowrap">{formatDate(match.detectedAt)}</td>
                                  </tr>
                                ))}
                                {!group.matches.length ? <tr><td colSpan={8} className="td-center py-6 text-sm font-bold text-[#6f6256]">No matched sources found.</td></tr> : null}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                }) : null}
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

function DuplicateCandidatesTable({
  groupId,
  rows,
  reason,
  decision,
  loading,
  onSetKeep,
  onToggleDelete,
}: {
  groupId: string;
  rows: DbResult[];
  reason: string;
  decision: SuspectedDecision;
  loading: boolean;
  onSetKeep: (groupId: string, resultId: string) => void;
  onToggleDelete: (groupId: string, resultId: string) => void;
}) {
  return (
    <div className="overflow-x-auto bg-white">
      <table className="data-table min-w-[1500px]">
        <thead>
          <tr>
            <th className="th-center">Keep</th>
            <th className="th-center">Delete</th>
            <th className="th-left">Title</th>
            <th className="th-left">Video URL</th>
            <th className="th-left">Channel</th>
            <th className="th-left">Duration</th>
            <th className="th-left">Published</th>
            <th className="th-left">View Count</th>
            <th className="th-left">Matched Unit</th>
            <th className="th-left">Matched Keyword</th>
            <th className="th-left">Source</th>
            <th className="th-left">Reason</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isKept = decision.keepResultId === row.id;
            return (
              <tr key={row.id}>
                <td className="td-center"><input type="radio" checked={isKept} disabled={loading} onChange={() => onSetKeep(groupId, row.id)} className="accent-[#1f5c43]" /></td>
                <td className="td-center"><input type="checkbox" checked={decision.deleteResultIds.includes(row.id)} disabled={loading || isKept} onChange={() => onToggleDelete(groupId, row.id)} className="accent-[#b42318]" /></td>
                <td className="td-left max-w-[320px] font-bold text-[#111827]"><a href={row.videoUrl} target="_blank" rel="noreferrer" className="underline decoration-transparent underline-offset-4 hover:text-[#1f5c43] hover:decoration-[#1f5c43]">{row.title || "Untitled"}</a></td>
                <td className="td-left max-w-[260px] truncate">{row.videoUrl ? <a href={row.videoUrl} target="_blank" rel="noreferrer" className="font-bold text-[#1f5c43] underline">{row.videoUrl}</a> : "-"}</td>
                <td className="td-left">{row.channelName || "-"}</td>
                <td className="td-left">{row.duration || "-"}</td>
                <td className="td-left">{row.publishedDate || "-"}</td>
                <td className="td-left">{row.viewCount || "-"}</td>
                <td className="td-left max-w-[260px]">{row.matchedUnits?.join("; ") || "-"}</td>
                <td className="td-left max-w-[300px]">{row.matchedKeywords?.join("; ") || "-"}</td>
                <td className="td-left">{row.matchedKeywords?.length ? "Matched Keyword" : "-"}</td>
                <td className="td-left">{reason}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CompactListText({ value }: { value: string | string[] }) {
  const items = Array.isArray(value) ? value : splitMultiText(value);
  const visible = items.slice(0, 2);
  const hiddenCount = Math.max(items.length - visible.length, 0);
  const fullText = items.join(", ");

  if (!items.length) return <span>-</span>;

  return (
    <div className="max-w-[220px]" title={fullText}>
      <div className="line-clamp-2 text-xs font-bold leading-5 text-[#40372f]">
        {visible.join(", ")}
        {hiddenCount ? ` +${hiddenCount} more` : ""}
      </div>
    </div>
  );
}

function TaskHistoryPanel({
  tasks,
  filters,
  hasMore,
  loading,
  onFiltersChange,
  onLoad,
  onLoadMore,
  onOpen,
  onExport,
  onComplete,
  onReopen,
  onPauseRun,
  onResumeRun,
  onCancelRun,
  onDelete,
}: {
  tasks: TaskWithSummary[];
  filters: TabFilters;
  hasMore: boolean;
  loading: boolean;
  onFiltersChange: (filters: TabFilters) => void;
  onLoad: () => void;
  onLoadMore: () => void;
  onOpen: (task: DbTask) => void;
  onExport: (task: DbTask) => void;
  onComplete: (task: DbTask) => void;
  onReopen: (task: DbTask) => void;
  onPauseRun: (task: DbTask) => void;
  onResumeRun: (task: DbTask) => void;
  onCancelRun: (task: DbTask) => void;
  onDelete: (task: DbTask) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Task History</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={filters.status} onChange={(event) => onFiltersChange({ ...filters, status: event.target.value })} className="h-10 rounded-md border border-[#d7cec0] bg-white px-3 text-sm font-bold text-[#40372f]">
            {historyStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <input value={filters.q} onChange={(event) => onFiltersChange({ ...filters, q: event.target.value })} className="h-10 rounded-md border border-[#d7cec0] bg-white px-3 text-sm font-bold text-[#40372f]" placeholder="Search tasks" />
          <button type="button" onClick={onLoad} disabled={loading} className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-2 text-sm font-black text-white disabled:opacity-50">Load Tasks</button>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs font-bold text-[#6f6256]">
        <span>{loading && !tasks.length ? "Loading tasks..." : `Showing ${tasks.length} tasks`}</span>
        {hasMore ? <button type="button" onClick={onLoadMore} disabled={loading} className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-xs font-black text-[#1f5c43] disabled:opacity-50">Load More</button> : null}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-[#d0c3b3] bg-white">
        <table className="data-table min-w-[1580px]">
          <thead>
            <tr>
              <th className="th-left">Task Name</th>
              <th className="th-left">Language</th>
              <th className="th-left">Domain</th>
              <th className="th-left">Search Targets</th>
              <th className="th-left">Status</th>
              <th className="th-left">Target</th>
              <th className="th-left">Unique</th>
              <th className="th-left">Total</th>
              <th className="th-left">Duplicates</th>
              <th className="th-left">Created</th>
              <th className="th-left">Updated</th>
              <th className="th-left">Completed</th>
              <th className="th-center w-[260px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(({ task, summary }) => (
              <tr key={task.id}>
                <td className="td-left max-w-[260px] font-bold text-[#111827]"><div className="line-clamp-2">{task.name}</div></td>
                <td className="td-left"><CompactListText value={task.language} /></td>
                <td className="td-left"><CompactListText value={task.domain} /></td>
                <td className="td-left"><CompactListText value={task.searchTargets} /></td>
                <td className="td-left">
                  <span className={`rounded-full border px-2 py-1 text-xs font-black ${statusBadgeClass(task.status)}`}>{displayTaskStatus(task.status)}</span>
                </td>
                <td className="td-left">{task.targetUniqueResults || "-"}</td>
                <td className="td-left">{summary.uniqueResults}</td>
                <td className="td-left">{summary.totalCollected}</td>
                <td className="td-left">{summary.duplicatesRemoved}</td>
                <td className="td-left whitespace-nowrap">{formatDate(task.createdAt)}</td>
                <td className="td-left whitespace-nowrap">{formatDate(task.updatedAt)}</td>
                <td className="td-left whitespace-nowrap">{formatDate(task.completedAt)}</td>
                <td className="td-actions w-[260px]">
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => onOpen(task)} className="rounded-md border border-[#1f5c43] bg-white px-2 py-1 text-xs font-bold text-[#1f5c43]">Open</button>
                    <button type="button" onClick={() => onExport(task)} className="rounded-md border border-[#d7cec0] bg-white px-2 py-1 text-xs font-bold text-[#40372f]">Export</button>
                    {task.status === "Running" ? (
                      <>
                        <button type="button" onClick={() => onPauseRun(task)} className="rounded-md border border-[#d7cec0] bg-white px-2 py-1 text-xs font-bold text-[#40372f]">Pause</button>
                        <button type="button" onClick={() => onCancelRun(task)} className="rounded-md border border-[#f2c7c2] bg-[#fff1ef] px-2 py-1 text-xs font-bold text-[#b42318]">Cancel</button>
                      </>
                    ) : task.status === "Paused" ? (
                      <>
                        <button type="button" onClick={() => onResumeRun(task)} className="rounded-md border border-[#1f5c43] bg-white px-2 py-1 text-xs font-bold text-[#1f5c43]">Resume</button>
                        <button type="button" onClick={() => onCancelRun(task)} className="rounded-md border border-[#f2c7c2] bg-[#fff1ef] px-2 py-1 text-xs font-bold text-[#b42318]">Cancel</button>
                      </>
                    ) : task.status === "Completed" ? (
                      <button type="button" onClick={() => onReopen(task)} className="rounded-md border border-[#d7cec0] bg-white px-2 py-1 text-xs font-bold text-[#40372f]">Reopen</button>
                    ) : (
                      <button type="button" onClick={() => onComplete(task)} className="rounded-md border border-[#d7cec0] bg-white px-2 py-1 text-xs font-bold text-[#40372f]">Complete</button>
                    )}
                    {task.status === "Running" ? null : (
                      <button type="button" onClick={() => onDelete(task)} className="rounded-md border border-[#f2c7c2] bg-[#fff1ef] px-2 py-1 text-xs font-bold text-[#b42318]">Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!tasks.length ? <tr><td colSpan={13} className="td-center py-10 text-sm font-bold text-[#6f6256]">No historical tasks found.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DeleteTaskDialog({ task, loading, onCancel, onConfirm }: { task: DbTask | null; loading: boolean; onCancel: () => void; onConfirm: () => void }) {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#d0c3b3] bg-white p-5 shadow-[0_24px_60px_rgba(17,24,39,0.24)]">
        <h2 className="text-xl font-black text-[#111827]">Delete this task?</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-[#6f6256]">This will move the task to Deleted. Admins can restore it later.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={loading} className="rounded-md border border-[#d7cec0] bg-white px-4 py-2 text-sm font-black text-[#40372f] disabled:opacity-50">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={loading} className="rounded-md border border-[#b42318] bg-[#b42318] px-4 py-2 text-sm font-black text-white disabled:opacity-50">Delete Task</button>
        </div>
      </div>
    </div>
  );
}

function TaskLifecycleDialog({ dialog, loading, onCancel, onConfirm }: { dialog: ConfirmDialogState; loading: boolean; onCancel: () => void; onConfirm: () => void }) {
  if (!dialog) return null;

  const copy = dialog.type === "start-new" ? {
    title: "Start a new task?",
    message: "Your current task will stay in Task History. Unsaved setup changes may be lost.",
    confirm: "Start New Task",
    danger: false,
  } : dialog.type === "complete" ? {
    title: "Complete this task?",
    message: "This will mark the task as completed and keep it in Task History. You can reopen it later if needed.",
    confirm: "Complete Task",
    danger: false,
  } : dialog.type === "reopen" ? {
    title: "Reopen this task?",
    message: "This will move the task back to Reviewing so you can continue editing and running units.",
    confirm: "Reopen Task",
    danger: false,
  } : dialog.type === "clean-confirmed" ? {
    title: "Clean confirmed duplicates?",
    message: "This will keep one canonical result per video and remove duplicate entries with the same video ID or canonical URL. Suspected duplicates will not be removed.",
    confirm: "Clean Confirmed Duplicates",
    danger: true,
  } : {
    title: "Apply duplicate decision?",
    message: "This will keep the selected video and remove the videos marked for deletion from task results.",
    confirm: "Apply Decision",
    danger: true,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#d0c3b3] bg-white p-5 shadow-[0_24px_60px_rgba(17,24,39,0.24)]">
        <h2 className="text-xl font-black text-[#111827]">{copy.title}</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-[#6f6256]">{copy.message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={loading} className="rounded-md border border-[#d7cec0] bg-white px-4 py-2 text-sm font-black text-[#40372f] disabled:opacity-50">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={loading} className={`rounded-md border px-4 py-2 text-sm font-black text-white disabled:opacity-50 ${copy.danger ? "border-[#b42318] bg-[#b42318]" : "border-[#1f5c43] bg-[#1f5c43]"}`}>{copy.confirm}</button>
        </div>
      </div>
    </div>
  );
}

function LegacyLocalResults({ rows, expanded, onToggle, setRows }: { rows: YoutubeSpeechResult[]; expanded: boolean; onToggle: () => void; setRows: (rows: YoutubeSpeechResult[]) => void }) {
  if (!rows.length) return null;
  return (
    <section className="rounded-2xl border border-[#d0c3b3] bg-white p-4">
      <button type="button" onClick={onToggle} className="text-sm font-black text-[#40372f]">Legacy Local Results ({rows.length})</button>
      {expanded ? <div className="mt-4"><YoutubeResultsTable rows={rows} selectedIds={[]} onToggleSelected={() => {}} onSelectAll={() => {}} onDelete={(id) => setRows(rows.map((row) => row.id === id ? { ...row, deleted: true } : row))} onStatusChange={(id, status) => setRows(rows.map((row) => row.id === id ? { ...row, status } : row))} onNotesChange={(id, notes) => setRows(rows.map((row) => row.id === id ? { ...row, notes } : row))} /></div> : null}
    </section>
  );
}
