import type { YoutubeKeyword } from "./youtubeTypes";

export function normalizeKeyword(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function keywordSignature(value: string) {
  return normalizeKeyword(value)
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .join(" ");
}

function shortHash(value: string) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36).slice(0, 8);
}

export function createKeywordId(item: Pick<YoutubeKeyword, "keyword" | "source" | "language" | "domain" | "searchTarget" | "groupKey">, index = 0) {
  const keyword = normalizeKeyword(item.keyword || "");
  const source = String(item.source || "Keyword").toLowerCase();
  const groupKey = item.groupKey || [item.language, item.domain, item.searchTarget].map((value) => String(value || "").trim()).join("__");
  const groupHash = shortHash(groupKey);
  const keywordHash = shortHash(keywordSignature(keyword));
  const sourceHash = shortHash(source);
  return `kw_${sourceHash}_${groupHash}_${keywordHash}_${index}`;
}

export function ensureUniqueKeywordIds(keywords: YoutubeKeyword[]) {
  const seen = new Map<string, number>();
  return keywords.map((item, index) => {
    const baseId = item.id || createKeywordId(item, index);
    const count = seen.get(baseId) || 0;
    seen.set(baseId, count + 1);
    return {
      ...item,
      id: count ? `${baseId}_${count + 1}` : baseId,
    };
  });
}

export function dedupeKeywords(keywords: YoutubeKeyword[]) {
  const seen = new Set<string>();
  const output: YoutubeKeyword[] = [];

  keywords.forEach((item) => {
    const keyword = normalizeKeyword(item.keyword);
    if (!keyword) return;
    const signature = keywordSignature(keyword);
    const scopedSignature = `${item.groupKey || ""}__${signature}`;
    if (seen.has(scopedSignature)) return;
    seen.add(scopedSignature);
    output.push({
      ...item,
      id: createKeywordId({ ...item, keyword }, output.length),
      keyword,
      selected: item.selected ?? true,
    });
  });

  return ensureUniqueKeywordIds(output);
}

export function parseAiKeywordJson(raw: string) {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith("[") ? trimmed : trimmed.match(/\[[\s\S]*\]/)?.[0] || "[]";
  const parsed = JSON.parse(jsonText) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) => normalizeKeyword(String(item))).filter(Boolean);
}
