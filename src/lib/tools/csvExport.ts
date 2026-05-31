import { getSearchTargetsLabel, type YoutubeSpeechResult } from "./youtubeTypes";

const csvFields: Array<[string, (row: YoutubeSpeechResult) => unknown]> = [
  ["Language", (row) => row.language],
  ["Domain", (row) => row.domain],
  ["Search Target", getSearchTargetsLabel],
  ["Search Keyword", (row) => row.searchKeyword],
  ["Keyword Source", (row) => row.keywordSource],
  ["Title", (row) => row.title],
  ["Video URL", (row) => row.videoUrl],
  ["Channel Name", (row) => row.channelName],
  ["Channel URL", (row) => row.channelUrl],
  ["Duration", (row) => row.duration],
  ["Video Type", (row) => row.videoType],
  ["View Count", (row) => row.viewCount],
  ["Published Date", (row) => row.publishedDate],
  ["Status", (row) => row.status],
  ["Notes", (row) => row.notes],
  ["Created At", (row) => row.createdAt],
];

export function escapeCsvValue(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function buildYoutubeResultsCsv(rows: YoutubeSpeechResult[]) {
  const header = csvFields.map(([label]) => escapeCsvValue(label)).join(",");
  const body = rows
    .filter((row) => !row.deleted)
    .map((row) => csvFields.map(([, getter]) => escapeCsvValue(getter(row))).join(","))
    .join("\n");
  return [header, body].filter(Boolean).join("\n");
}

export function downloadCsv(rows: YoutubeSpeechResult[], filenamePrefix = "youtube-speech-links") {
  if (typeof window === "undefined") return;
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([buildYoutubeResultsCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filenamePrefix}-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
