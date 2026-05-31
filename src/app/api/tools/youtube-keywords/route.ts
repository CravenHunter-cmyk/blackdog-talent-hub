import { NextResponse } from "next/server";
import { runAIGatewayTask } from "@/lib/ai/aiGateway";
import { dedupeKeywords } from "@/lib/tools/keywordUtils";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";
import { buildRuleKeywordsForGroup } from "@/lib/tools/youtubeKeywordMaps";
import {
  buildKeywordGroupKey,
  domainOptions,
  languageOptions,
  normalizeSearchTargets,
  type YoutubeKeyword,
  type YoutubeKeywordGroup,
} from "@/lib/tools/youtubeTypes";

type KeywordRequest = {
  languages?: string[];
  domains?: string[];
  language?: string;
  domain?: string;
  searchTargets?: string[];
  speechType?: string;
  useAI?: boolean;
};

export const runtime = "nodejs";

function normalizeMultiSelect(input: unknown, fallback: unknown, options: readonly string[]) {
  const raw = Array.isArray(input) ? input : fallback ? [fallback] : [];
  return raw
    .flatMap((item) => {
      const value = String(item || "").trim();
      if (!value) return [];
      if (options.includes(value)) return [value];
      return value.split(",").map((part) => part.trim()).filter(Boolean);
    })
    .filter(Boolean);
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export async function POST(request: Request) {
  try {
    await getRequiredYoutubeUser(request);
    const body = await request.json() as KeywordRequest;
    const languages = unique(normalizeMultiSelect(body.languages, body.language, languageOptions));
    const domains = unique(normalizeMultiSelect(body.domains, body.domain, domainOptions));
    const searchTargets = normalizeSearchTargets(body.searchTargets, body.speechType);
    const useAI = body.useAI !== false;

    if (languages.length === 0 || domains.length === 0 || searchTargets.length === 0) {
      return NextResponse.json({ error: "At least one language, domain, and search target are required." }, { status: 400 });
    }

    const keywordGroups = languages.flatMap((language) => domains.flatMap((domain) => searchTargets.map((searchTarget) => {
      const groupKey = buildKeywordGroupKey(language, domain, searchTarget);
      const ruleKeywords = dedupeKeywords(buildRuleKeywordsForGroup(language, domain, searchTarget));
      return {
        groupKey,
        language,
        domain,
        searchTarget,
        ruleKeywords,
        aiKeywords: [] as YoutubeKeyword[],
        finalKeywords: ruleKeywords,
      };
    })));

    const ruleKeywords = keywordGroups.flatMap((group) => group.ruleKeywords);
    let aiKeywords: YoutubeKeyword[] = [];
    let warning = "";

    if (useAI) {
      const result = await runAIGatewayTask({
        task: "generate_youtube_keywords",
        input: {
          language: languages.join(", "),
          domain: domains.join(", "),
          searchTargets,
          keywordGroups: keywordGroups.map((group) => ({
            groupKey: group.groupKey,
            language: group.language,
            domain: group.domain,
            searchTarget: group.searchTarget,
            existingKeywords: group.ruleKeywords.map((item) => item.keyword),
          })),
          existingKeywords: ruleKeywords.map((item) => item.keyword),
        },
        options: {
          provider: "deepseek",
        },
      });

      if (result.ok && "result" in result && Array.isArray(result.result)) {
        const groupMap = new Map(keywordGroups.map((group) => [group.groupKey, group]));
        const aiCandidates = result.result.flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const keyword = String((item as { keyword?: unknown }).keyword || "").trim();
          const language = String((item as { language?: unknown }).language || "").trim();
          const domain = String((item as { domain?: unknown }).domain || "").trim();
          const searchTarget = String((item as { searchTarget?: unknown }).searchTarget || "").trim();
          const groupKey = String((item as { groupKey?: unknown }).groupKey || buildKeywordGroupKey(language, domain, searchTarget)).trim();
          const group = groupMap.get(groupKey);
          if (!keyword || !group) return [];
          return [{
            keyword,
            source: "AI" as const,
            language: group.language,
            domain: group.domain,
            searchTarget: group.searchTarget,
            groupKey: group.groupKey,
          }];
        });
        const combinedKeywords = dedupeKeywords([...ruleKeywords, ...aiCandidates]);
        aiKeywords = combinedKeywords.filter((item) => item.source === "AI");
      } else {
        warning = "AI keyword expansion is not available. Rule-based keywords were generated successfully.";
      }
    }

    const finalKeywords = dedupeKeywords([...ruleKeywords, ...aiKeywords]);
    const groupedResponse: YoutubeKeywordGroup[] = keywordGroups.map((group) => {
      const groupAiKeywords = aiKeywords.filter((item) => item.groupKey === group.groupKey);
      return {
        ...group,
        aiKeywords: groupAiKeywords,
        finalKeywords: finalKeywords.filter((item) => item.groupKey === group.groupKey),
      };
    });

    return NextResponse.json({
      keywordGroups: groupedResponse,
      ruleKeywords,
      aiKeywords,
      finalKeywords,
      warning,
    });
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to generate keywords.", 500);
  }
}
