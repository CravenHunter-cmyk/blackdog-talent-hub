export type KeywordSource = "Rule" | "AI" | "Manual";
export type YoutubeResultStatus = "Pending" | "Useful" | "Not Useful" | "Processed";

export type YoutubeKeyword = {
  id?: string;
  unitId?: string;
  unitLabel?: string;
  keyword: string;
  source: KeywordSource;
  language?: string;
  domain?: string;
  searchTarget?: string;
  groupKey?: string;
  selected?: boolean;
};

export type YoutubeKeywordGroup = {
  groupKey: string;
  language: string;
  domain: string;
  searchTarget: string;
  ruleKeywords: YoutubeKeyword[];
  aiKeywords: YoutubeKeyword[];
  finalKeywords: YoutubeKeyword[];
};

export type YoutubeSpeechResult = {
  id: string;
  language: string;
  domain: string;
  searchTargets: string[];
  speechType?: string;
  searchKeyword: string;
  keywordSource: KeywordSource;
  title: string;
  videoUrl: string;
  channelName: string;
  channelUrl: string;
  duration: string;
  viewCount: string;
  likeCount?: string;
  commentCount?: string;
  publishedDate: string;
  videoType: string;
  description?: string;
  category?: string;
  youtubeTags?: string[];
  hashtags?: string[];
  thumbnailUrl?: string;
  status: YoutubeResultStatus;
  notes: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export const YOUTUBE_RESULT_STORAGE_KEY = "blackdog_youtube_speech_results";

export const languageOptions = [
  "Portuguese - Brazil",
  "Spanish - Mexico",
  "Arabic - MENA",
  "English - US",
  "English - UK",
  "Japanese",
  "Korean",
  "Thai",
  "Vietnamese",
  "Indonesian",
  "Malay",
  "Filipino / Tagalog",
  "Hindi",
  "Turkish",
  "French",
  "German",
  "Italian",
  "Russian",
] as const;

export const domainOptions = [
  "General / Lifestyle",
  "Education / Teaching",
  "Gaming",
  "Beauty / Fashion",
  "Tech / AI",
  "Finance / Business",
  "Medical / Healthcare",
  "Sports / Fitness",
  "Food / Cooking",
  "Travel / Culture",
  "News / Media",
  "Podcast / Interview",
  "Other",
] as const;

export const searchTargetOptions = [
  "Single Speaker",
  "Dialogue",
  "Interview",
  "Podcast",
  "Teaching",
  "Review / Commentary",
  "Vlog",
  "Livestream",
] as const;

export const speechTypeOptions = searchTargetOptions;

export const statusOptions: YoutubeResultStatus[] = ["Pending", "Useful", "Not Useful", "Processed"];
export const maxResultsOptions = [5, 10, 20, 50] as const;
export const preferredVideoQualityOptions = ["Any", "720p+", "1080p+", "2K+", "4K+"] as const;
export const publishedDateRangeOptions = [
  "Any time",
  "Past 1 month",
  "Past 3 months",
  "Past 6 months",
  "Past 9 months",
  "Past 1 year",
  "Past 2 years",
  "Past 3 years",
  "Custom months",
] as const;

export type PreferredVideoQuality = typeof preferredVideoQualityOptions[number];
export type AllocationMode = "Even by Unit" | "Even by Domain" | "Custom";
export type CollectionUnitStatus = "Pending" | "Ready" | "Running" | "Paused" | "Completed" | "Cancelled" | "Failed";
export type PublishedDateRangeMode = "any" | "preset" | "custom";

export type PublishedDateRange = {
  mode: PublishedDateRangeMode;
  months: number | null;
  label: string;
};

export const defaultPublishedDateRange: PublishedDateRange = {
  mode: "any",
  months: null,
  label: "Any time",
};

export function getPublishedDateRangeFromOption(option: string, customMonths?: number | null): PublishedDateRange {
  if (option === "Custom months") {
    const months = Number(customMonths);
    return {
      mode: "custom",
      months: Number.isFinite(months) && months > 0 ? Math.floor(months) : null,
      label: Number.isFinite(months) && months > 0 ? `Past ${Math.floor(months)} months` : "Custom months",
    };
  }

  const monthMap: Record<string, number | null> = {
    "Any time": null,
    "Past 1 month": 1,
    "Past 3 months": 3,
    "Past 6 months": 6,
    "Past 9 months": 9,
    "Past 1 year": 12,
    "Past 2 years": 24,
    "Past 3 years": 36,
  };
  const months = monthMap[option] ?? null;
  return {
    mode: months ? "preset" : "any",
    months,
    label: option in monthMap ? option : "Any time",
  };
}

export type YoutubeCollectionUnit = {
  id: string;
  taskId?: string;
  unitIndex?: number;
  language: string;
  domain: string;
  searchTarget: string;
  targetResults: number;
  targetHours?: number | null;
  status: CollectionUnitStatus;
  selected?: boolean;
  collectedResults: number;
  uniqueResults: number;
  duplicateCount: number;
  keywordCount: number;
  selectedKeywordCount?: number;
  matchedSourcesCount?: number;
  runningBy?: string | null;
  runningByEmail?: string | null;
  runningStartedAt?: string | null;
  runningExpiresAt?: string | null;
  progress: number;
  customTargetResults?: boolean;
  customTargetHours?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export function buildKeywordGroupKey(language: string, domain: string, searchTarget: string) {
  return `${language}__${domain}__${searchTarget}`;
}

export function buildUnitLabel(unit: Pick<YoutubeCollectionUnit, "language" | "domain" | "searchTarget">) {
  return `${unit.language} / ${unit.domain} / ${unit.searchTarget}`;
}

export function normalizeSearchTargets(input: unknown, fallbackSpeechType?: unknown) {
  const rawTargets = Array.isArray(input) ? input : fallbackSpeechType ? [fallbackSpeechType] : [];
  return rawTargets.map((item) => String(item || "").trim()).filter(Boolean);
}

export function getSearchTargetsLabel(row: Pick<YoutubeSpeechResult, "searchTargets" | "speechType">) {
  const targets = normalizeSearchTargets(row.searchTargets, row.speechType);
  return targets.join(", ");
}
