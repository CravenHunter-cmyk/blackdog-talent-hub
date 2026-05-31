import type { KeywordSource, YoutubeKeyword, YoutubeSpeechResult } from "./youtubeTypes";

type UnknownRecord = Record<string, unknown>;

export function toApifyYoutubePayload(keyword: string, maxResults: number) {
  return {
    searchQueries: [keyword],
    maxResults,
    maxResultsShorts: 0,
    maxResultStreams: 0,
    downloadSubtitles: false,
  };
}

function textValue(item: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = item[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
  }
  return "";
}

function stringArrayValue(item: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = item[key];
    if (Array.isArray(value)) return value.map((entry) => String(entry || "").trim()).filter(Boolean);
    if (typeof value === "string" && value.trim()) {
      return value.split(/[,\s]+/).map((entry) => entry.trim()).filter((entry) => entry.startsWith("#") || entry.length > 1);
    }
  }
  return [];
}

function extractHashtags(item: UnknownRecord) {
  const explicit = stringArrayValue(item, ["hashtags", "hashTags"]);
  const text = [textValue(item, ["title", "name"]), textValue(item, ["description", "text"])]
    .filter(Boolean)
    .join(" ");
  const matches = Array.from(text.matchAll(/#[\p{L}\p{N}_-]+/gu)).map((match) => match[0]);
  return Array.from(new Set([...explicit, ...matches]));
}

function videoUrlFrom(item: UnknownRecord) {
  const direct = textValue(item, ["url", "videoUrl", "link"]);
  if (direct) return direct;
  const id = textValue(item, ["id", "videoId"]);
  return id ? `https://www.youtube.com/watch?v=${id}` : "";
}

export function normalizeApifyYoutubeItems(
  items: UnknownRecord[],
  context: {
    language: string;
    domain: string;
    searchTargets: string[];
    keyword: string;
    keywordSource: KeywordSource;
  },
): YoutubeSpeechResult[] {
  const now = new Date().toISOString();
  return items.map((item, index) => {
    const channelUrl = textValue(item, ["channelUrl", "channelURL", "channelLink"]);
    const videoUrl = videoUrlFrom(item);
    return {
      id: `yt-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      language: context.language,
      domain: context.domain,
      searchTargets: context.searchTargets,
      speechType: context.searchTargets[0] || "",
      searchKeyword: context.keyword,
      keywordSource: context.keywordSource,
      title: textValue(item, ["title", "name"]),
      videoUrl,
      channelName: textValue(item, ["channelName", "channelTitle", "channel"]),
      channelUrl,
      duration: textValue(item, ["duration", "durationText", "lengthText"]),
      viewCount: textValue(item, ["viewCount", "views", "viewCountText"]),
      likeCount: textValue(item, ["likeCount", "likes", "likesCount"]),
      commentCount: textValue(item, ["commentCount", "commentsCount", "comments"]),
      publishedDate: textValue(item, ["publishedAt", "publishedDate", "date", "publishedTimeText"]),
      videoType: textValue(item, ["type", "videoType"]),
      description: textValue(item, ["description", "text"]),
      category: textValue(item, ["category", "categoryName"]),
      youtubeTags: stringArrayValue(item, ["tags", "keywords"]),
      hashtags: extractHashtags(item),
      thumbnailUrl: textValue(item, ["thumbnailUrl", "thumbnail", "image"]),
      status: "Pending",
      notes: "",
      deleted: false,
      createdAt: now,
      updatedAt: now,
    };
  });
}

export async function runApifyYoutubeSearch(args: {
  token: string;
  actorId: string;
  language: string;
  domain: string;
  searchTargets: string[];
  keywords: YoutubeKeyword[];
  maxResultsPerKeyword: number;
  dedupeResults?: boolean;
  onRunStarted?: (runId: string, keyword: YoutubeKeyword) => Promise<void> | void;
}) {
  const actorPath = args.actorId.replace(/\//g, "~");
  const results: YoutubeSpeechResult[] = [];

  for (const keyword of args.keywords) {
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorPath}/runs?token=${encodeURIComponent(args.token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toApifyYoutubePayload(keyword.keyword, args.maxResultsPerKeyword)),
    });

    if (!runResponse.ok) {
      throw new Error(`Apify search failed for keyword: ${keyword.keyword}`);
    }

    const runPayload = await runResponse.json() as { data?: { id?: string; defaultDatasetId?: string } };
    const runId = runPayload.data?.id || "";
    let datasetId = runPayload.data?.defaultDatasetId || "";
    if (!runId) throw new Error(`Apify did not return a run id for keyword: ${keyword.keyword}`);
    await args.onRunStarted?.(runId, keyword);

    const finishedRun = await waitForApifyRun({ token: args.token, runId, initialDatasetId: datasetId });
    datasetId = finishedRun.defaultDatasetId || datasetId;
    if (finishedRun.status === "ABORTED") {
      throw new Error(`Apify run was cancelled for keyword: ${keyword.keyword}`);
    }
    if (finishedRun.status !== "SUCCEEDED") {
      throw new Error(`Apify search failed for keyword: ${keyword.keyword}`);
    }
    if (!datasetId) throw new Error(`Apify did not return a dataset id for keyword: ${keyword.keyword}`);

    const itemsResponse = await fetch(`https://api.apify.com/v2/datasets/${encodeURIComponent(datasetId)}/items?clean=true&token=${encodeURIComponent(args.token)}`);
    if (!itemsResponse.ok) {
      throw new Error(`Unable to read Apify results for keyword: ${keyword.keyword}`);
    }

    const payload = await itemsResponse.json() as unknown;
    const items = Array.isArray(payload) ? payload : [];
    results.push(...normalizeApifyYoutubeItems(items as UnknownRecord[], {
      language: keyword.language || args.language,
      domain: keyword.domain || args.domain,
      searchTargets: keyword.searchTarget ? [keyword.searchTarget] : args.searchTargets,
      keyword: keyword.keyword,
      keywordSource: keyword.source,
    }));
  }

  if (args.dedupeResults === false) {
    return results;
  }

  const seen = new Set<string>();
  return results.filter((item) => {
    const key = item.videoUrl || item.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function waitForApifyRun(args: { token: string; runId: string; initialDatasetId?: string }) {
  const terminalStatuses = new Set(["SUCCEEDED", "FAILED", "TIMED-OUT", "ABORTED"]);
  const deadline = Date.now() + 10 * 60 * 1000;
  let status = "";
  let defaultDatasetId = args.initialDatasetId || "";

  while (Date.now() < deadline) {
    const response = await fetch(`https://api.apify.com/v2/actor-runs/${encodeURIComponent(args.runId)}?token=${encodeURIComponent(args.token)}`);
    if (!response.ok) throw new Error("Unable to read Apify run status.");
    const payload = await response.json() as { data?: { status?: string; defaultDatasetId?: string } };
    status = payload.data?.status || status;
    defaultDatasetId = payload.data?.defaultDatasetId || defaultDatasetId;
    if (terminalStatuses.has(status)) return { status, defaultDatasetId };
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return { status: status || "TIMED-OUT", defaultDatasetId };
}
