import { buildKeywordGroupKey, type YoutubeKeyword } from "./youtubeTypes";

export const languageKeywordMap: Record<string, string[]> = {
  "Portuguese - Brazil": ["Brazilian Portuguese", "Portuguese Brazil", "Português brasileiro", "Português do Brasil"],
  "Spanish - Mexico": ["Mexican Spanish", "Spanish Mexico", "Español mexicano", "Español de México"],
  "Arabic - MENA": ["Arabic", "Arabic speaking", "Arabic conversation", "اللغة العربية", "عربي"],
  "English - US": ["American English", "English US", "US English conversation", "American speaking"],
  "English - UK": ["British English", "English UK", "UK English conversation", "British speaking"],
  Japanese: ["Japanese speaking", "Japanese conversation", "日本語", "日本語 会話"],
  Korean: ["Korean speaking", "Korean conversation", "한국어", "한국어 대화"],
  Thai: ["Thai speaking", "Thai conversation", "ภาษาไทย", "พูดคุยภาษาไทย"],
  Vietnamese: ["Vietnamese speaking", "Vietnamese conversation", "Tiếng Việt", "nói chuyện tiếng Việt"],
  Indonesian: ["Indonesian speaking", "Indonesian conversation", "Bahasa Indonesia", "percakapan Indonesia"],
  Malay: ["Malay speaking", "Malay conversation", "Bahasa Melayu", "perbualan Melayu"],
  "Filipino / Tagalog": ["Filipino speaking", "Tagalog conversation", "Wikang Filipino", "Tagalog vlog"],
  Hindi: ["Hindi speaking", "Hindi conversation", "हिंदी", "हिंदी बातचीत"],
  Turkish: ["Turkish speaking", "Turkish conversation", "Türkçe", "Türkçe konuşma"],
  French: ["French speaking", "French conversation", "Français", "conversation française"],
  German: ["German speaking", "German conversation", "Deutsch", "deutsches Gespräch"],
  Italian: ["Italian speaking", "Italian conversation", "Italiano", "conversazione italiana"],
  Russian: ["Russian speaking", "Russian conversation", "Русский", "русский разговор"],
};

export const domainKeywordMap: Record<string, string[]> = {
  "General / Lifestyle": ["vlog", "daily life", "storytime", "personal experience", "talking about life"],
  "Education / Teaching": ["lesson", "tutorial", "explained", "teaching", "lecture"],
  Gaming: ["gameplay", "gaming commentary", "game review", "let's play", "reaction"],
  "Beauty / Fashion": ["beauty talk", "fashion review", "makeup tutorial", "style advice", "skincare routine"],
  "Tech / AI": ["tech review", "AI explained", "software tutorial", "product review", "technology discussion"],
  "Finance / Business": ["business talk", "finance explained", "market discussion", "entrepreneur interview", "money advice"],
  "Medical / Healthcare": ["doctor interview", "health talk", "medical advice", "clinic vlog", "patient story"],
  "Sports / Fitness": ["fitness advice", "training vlog", "sports discussion", "workout explanation", "coach talk"],
  "Food / Cooking": ["cooking vlog", "recipe explained", "food review", "kitchen talk", "restaurant review"],
  "Travel / Culture": ["travel vlog", "culture talk", "city guide", "local experience", "travel story"],
  "News / Media": ["media discussion", "current affairs discussion", "news commentary", "reporter interview"],
  "Podcast / Interview": ["podcast", "interview", "full conversation", "guest talk", "long discussion"],
  Other: ["conversation", "talking", "discussion", "personal story", "explained"],
};

export const searchTargetKeywordMap: Record<string, string[]> = {
  "Single Speaker": ["talking", "speaking", "monologue", "storytime", "personal experience"],
  Dialogue: ["conversation", "dialogue", "discussion", "talk show", "two people talking"],
  Interview: ["interview", "Q&A", "guest talk", "conversation with"],
  Podcast: ["podcast", "audio podcast", "video podcast", "episode", "full conversation"],
  Teaching: ["teaching", "lesson", "lecture", "explained", "tutorial"],
  "Review / Commentary": ["review", "commentary", "reaction", "opinion", "analysis"],
  Vlog: ["vlog", "daily vlog", "day in my life", "life update", "personal vlog"],
  Livestream: ["livestream", "live discussion", "stream replay", "live Q&A", "live conversation"],
};

export const speechTypeKeywordMap = searchTargetKeywordMap;

function compactKeywordParts(parts: string[]) {
  const accepted: string[] = [];
  const acceptedTokens = new Set<string>();

  parts.forEach((part) => {
    const normalized = part.replace(/\s+/g, " ").trim();
    if (!normalized) return;

    const tokens = normalized.toLowerCase().split(/\s+/);
    const isAlreadyCovered = tokens.every((token) => acceptedTokens.has(token));
    if (isAlreadyCovered) return;

    accepted.push(normalized);
    tokens.forEach((token) => acceptedTokens.add(token));
  });

  return accepted.join(" ");
}

export function buildRuleKeywordsForGroup(language: string, domain: string, searchTarget: string): YoutubeKeyword[] {
  const languages = languageKeywordMap[language] || [language];
  const domains = domainKeywordMap[domain] || [domain];
  const targetTerms = searchTargetKeywordMap[searchTarget] || [searchTarget];
  const groupKey = buildKeywordGroupKey(language, domain, searchTarget);
  const combinations = [
    compactKeywordParts([languages[0], domains[0], targetTerms[0]]),
    compactKeywordParts([languages[1] || languages[0], domains[1] || domains[0], targetTerms[1] || targetTerms[0]]),
    compactKeywordParts([languages[2] || languages[0], domains[2] || domains[0], targetTerms[2] || targetTerms[0]]),
    compactKeywordParts([languages[0], domains[3] || domains[0], targetTerms[3] || targetTerms[0]]),
  ];

  return combinations.map((keyword) => ({
    keyword,
    source: "Rule",
    language,
    domain,
    searchTarget,
    groupKey,
  }));
}

export function buildRuleKeywords(language: string, domain: string, searchTargets: string[]): YoutubeKeyword[] {
  const targets = searchTargets.length ? searchTargets : ["Single Speaker"];
  return targets.flatMap((target) => buildRuleKeywordsForGroup(language, domain, target)).slice(0, 8);
}
