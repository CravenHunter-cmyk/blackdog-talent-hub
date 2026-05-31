import { NextResponse } from "next/server";
import { runAIGatewayTask } from "@/lib/ai/aiGateway";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";
import {
  defaultPublishedDateRange,
  domainOptions,
  getPublishedDateRangeFromOption,
  languageOptions,
  preferredVideoQualityOptions,
  searchTargetOptions,
  type PublishedDateRange,
  type PreferredVideoQuality,
} from "@/lib/tools/youtubeTypes";
import type { ParseYoutubeTaskBriefResult } from "@/lib/ai/types";

export const runtime = "nodejs";

function normalizeAllowedList(input: unknown, options: readonly string[]) {
  if (!Array.isArray(input)) return [];
  return Array.from(new Set(input.map((item) => String(item || "").trim()).filter((item) => options.includes(item))));
}

function normalizePositiveInteger(input: unknown, fallback: number) {
  const parsed = Number(String(input || "").replace(/[^\d]/g, ""));
  if (!Number.isFinite(parsed) || parsed < 10) return fallback;
  return Math.round(parsed);
}

function normalizeBatchTarget(targetUniqueResults: number, input: unknown) {
  const fallback = targetUniqueResults <= 500 ? 100 : targetUniqueResults <= 2000 ? 500 : 1000;
  return normalizePositiveInteger(input, fallback);
}

function parseHoursFromBrief(brief: string) {
  const totalMatch = brief.match(/(\d+(?:\.\d+)?)\s*(?:h|hours?|小时)/i);
  return totalMatch ? Number(totalMatch[1]) : null;
}

function parseHourRangeFromBrief(brief: string) {
  const rangeMatch = brief.match(/(\d+(?:\.\d+)?)\s*[-~到至]\s*(\d+(?:\.\d+)?)\s*(?:h|hours?|小时)/i);
  if (!rangeMatch) return null;
  const min = Number(rangeMatch[1]);
  const max = Number(rangeMatch[2]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return {
    min,
    max,
    suggested: Number(((min + max) / 2).toFixed(2)),
  };
}

function parseCategoryCountFromBrief(brief: string) {
  const match = brief.match(/(\d+)\s*(?:categories|domains|领域|类|个领域)/i);
  if (!match) return null;
  const count = Number(match[1]);
  return Number.isFinite(count) && count > 0 ? count : null;
}

function parseAllocationRatiosFromBrief(brief: string) {
  const ratios: Record<string, number> = {};
  const normalized = brief.toLowerCase();
  const singleMatch = normalized.match(/(\d+(?:\.\d+)?)\s*%\s*(?:singles?|single speaker|solo|monologue|单人)/);
  const dialogueMatch = normalized.match(/(\d+(?:\.\d+)?)\s*%\s*(?:multiplayer|multi[-\s]?speaker|dialogue|conversation|多人|对话)/);

  if (singleMatch) {
    const value = Number(singleMatch[1]);
    if (Number.isFinite(value) && value > 0) ratios["Single Speaker"] = Number((value / 100).toFixed(4));
  }

  if (dialogueMatch) {
    const value = Number(dialogueMatch[1]);
    if (Number.isFinite(value) && value > 0) ratios.Dialogue = Number((value / 100).toFixed(4));
  }

  return ratios;
}

function normalizeAllocationRatios(input: unknown, brief: string) {
  const output: Record<string, number> = {};
  if (input && typeof input === "object" && !Array.isArray(input)) {
    Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
      if (!(searchTargetOptions as readonly string[]).includes(key)) return;
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) output[key] = parsed > 1 ? Number((parsed / 100).toFixed(4)) : parsed;
    });
  }

  const parsedFromBrief = parseAllocationRatiosFromBrief(brief);
  Object.entries(parsedFromBrief).forEach(([key, value]) => {
    output[key] = value;
  });

  return output;
}

function normalizeAllocationMode(input: unknown, fallback = "Even by Unit") {
  const value = String(input || "").trim();
  return ["Even by Unit", "Even by Domain", "Custom"].includes(value) ? value : fallback;
}

function normalizeConfidence(input: unknown) {
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(1, Math.max(0, parsed));
}

function parsePublishedDateRangeFromBrief(brief: string): PublishedDateRange {
  const normalized = brief.toLowerCase();
  if (/\b(any time|all time|no date restriction|no time restriction)\b/.test(normalized)) {
    return defaultPublishedDateRange;
  }

  const monthMatch = normalized.match(/(?:past|last|within|最近|近)\s*(\d+)\s*(?:months?|个月)/);
  if (monthMatch) {
    const months = Number(monthMatch[1]);
    if (Number.isFinite(months) && months > 0) return getPublishedDateRangeFromOption("Custom months", months);
  }

  const yearMatch = normalized.match(/(?:past|last|within|最近|近)\s*(\d+)\s*(?:years?|年)/);
  if (yearMatch) {
    const years = Number(yearMatch[1]);
    if (Number.isFinite(years) && years > 0) return getPublishedDateRangeFromOption("Custom months", years * 12);
  }

  if (/\b(past|last|within)\s+(?:one|1)\s+month\b/.test(normalized) || /最近一个月|近一个月/.test(brief)) {
    return getPublishedDateRangeFromOption("Past 1 month");
  }

  return defaultPublishedDateRange;
}

function normalizePublishedDateRange(input: unknown, brief: string): PublishedDateRange {
  const parsed = input && typeof input === "object" && !Array.isArray(input) ? input as { mode?: unknown; months?: unknown; label?: unknown } : null;
  const months = parsed ? Number(parsed.months) : NaN;
  const mode = String(parsed?.mode || "").trim();
  if (mode === "any") return defaultPublishedDateRange;
  if (Number.isFinite(months) && months > 0) {
    const integerMonths = Math.floor(months);
    const presetLabel = integerMonths === 1 ? "Past 1 month"
      : integerMonths === 3 ? "Past 3 months"
        : integerMonths === 6 ? "Past 6 months"
          : integerMonths === 9 ? "Past 9 months"
            : integerMonths === 12 ? "Past 1 year"
              : integerMonths === 24 ? "Past 2 years"
                : integerMonths === 36 ? "Past 3 years"
                  : "Custom months";
    return getPublishedDateRangeFromOption(presetLabel, integerMonths);
  }
  return parsePublishedDateRangeFromBrief(brief);
}

export async function POST(request: Request) {
  try {
    getRequiredYoutubeUser(request);
    const body = await request.json() as { brief?: string };
    const brief = String(body.brief || "").trim();

    if (!brief) {
      return NextResponse.json({ error: "Enter a task brief first." }, { status: 400 });
    }

    const result = await runAIGatewayTask({
      task: "parse_youtube_task_brief",
      input: {
        brief,
        languageOptions,
        domainOptions,
        searchTargetOptions,
        preferredVideoQualityOptions,
      },
      options: {
        provider: "deepseek",
      },
    });

    if (!result.ok || !("result" in result)) {
      return NextResponse.json({ error: "AI brief analysis is unavailable. Fill the fields manually." }, { status: 503 });
    }

    const parsed = result.result as ParseYoutubeTaskBriefResult;
    const languages = normalizeAllowedList(parsed.languages, languageOptions);
    let searchTargets = normalizeAllowedList(parsed.searchTargets, searchTargetOptions);
    let domains = normalizeAllowedList(parsed.domains, domainOptions);
    if (
      domains.length > 1 &&
      domains.includes("Podcast / Interview") &&
      (searchTargets.includes("Podcast") || searchTargets.includes("Interview"))
    ) {
      domains = domains.filter((domain) => domain !== "Podcast / Interview");
    }
    const parsedHours = Number(parsed.targetHours);
    const targetHours = Number.isFinite(parsedHours) && parsedHours > 0 ? parsedHours : parseHoursFromBrief(brief);
    const targetUniqueResults = parsed.targetUniqueResults ? normalizePositiveInteger(parsed.targetUniqueResults, 0) : null;
    const batchTargetResults = normalizeBatchTarget(targetUniqueResults || 1000, parsed.batchTargetResults);
    const hourRange = parsed.unitTargetHoursHint || parseHourRangeFromBrief(brief);
    const allocationRatios = normalizeAllocationRatios(parsed.allocationRatios, brief);
    Object.keys(allocationRatios).forEach((target) => {
      if (!searchTargets.includes(target)) searchTargets = [...searchTargets, target];
    });
    const allocationMode = normalizeAllocationMode(parsed.allocationMode, hourRange ? "Even by Domain" : "Even by Unit");
    const preferredVideoQuality = preferredVideoQualityOptions.includes(parsed.preferredVideoQuality as PreferredVideoQuality)
      ? parsed.preferredVideoQuality
      : "Any";
    const publishedDateRange = normalizePublishedDateRange(parsed.publishedDateRange, brief);
    const warnings = Array.isArray(parsed.warnings) ? parsed.warnings.map((item) => String(item || "").trim()).filter(Boolean) : [];

    if (!languages.length && !warnings.includes("Language is unclear.")) warnings.push("Language is unclear.");
    if (!domains.length && !warnings.includes("Domain is unclear.")) warnings.push("Domain is unclear.");
    if (!searchTargets.length && !warnings.includes("Search target is unclear.")) warnings.push("Search target is unclear.");
    const categoryCount = parseCategoryCountFromBrief(brief);
    if (categoryCount && domains.length < categoryCount) warnings.push(`Select ${categoryCount} domains to apply this allocation.`);

    return NextResponse.json({
      taskName: String(parsed.taskName || "").trim(),
      languages,
      domains,
      searchTargets,
      targetUniqueResults,
      targetHours,
      allocationMode,
      allocationRatios,
      unitTargetHoursHint: hourRange,
      publishedDateRange,
      batchTargetResults,
      preferredVideoQuality,
      useAIKeywordExpansion: parsed.useAIKeywordExpansion !== false,
      confidence: normalizeConfidence(parsed.confidence),
      warnings,
    });
  } catch (error) {
    return youtubeApiErrorResponse(error, "Failed to analyze brief.", 500);
  }
}
