import { NextResponse } from "next/server";
import { runApifyYoutubeSearch } from "@/lib/tools/apifyYoutubeAdapter";
import { dedupeKeywords } from "@/lib/tools/keywordUtils";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";
import { normalizeSearchTargets, type YoutubeKeyword } from "@/lib/tools/youtubeTypes";

type SearchRequest = {
  language?: string;
  domain?: string;
  searchTargets?: string[];
  speechType?: string;
  keywords?: YoutubeKeyword[];
  maxResultsPerKeyword?: number;
};

export async function POST(request: Request) {
  try {
    await getRequiredYoutubeUser(request);
    const body = await request.json() as SearchRequest;
    const language = String(body.language || "").trim();
    const domain = String(body.domain || "").trim();
    const searchTargets = normalizeSearchTargets(body.searchTargets, body.speechType);
    const keywords = dedupeKeywords(Array.isArray(body.keywords) ? body.keywords : []).slice(0, 20);
    const maxResultsPerKeyword = Math.min(Math.max(Number(body.maxResultsPerKeyword || 10), 1), 50);

    if (!language || !domain || searchTargets.length === 0 || keywords.length === 0) {
      return NextResponse.json({ error: "Language, domain, at least one search target, and at least one keyword are required." }, { status: 400 });
    }

    const token = process.env.APIFY_API_TOKEN;
    const actorId = process.env.APIFY_YOUTUBE_ACTOR_ID || "streamers/youtube-scraper";

    if (!token) {
      return NextResponse.json({
        results: [],
        warning: "Apify YouTube search is not configured. Add APIFY_API_TOKEN to enable live search.",
      });
    }

    const results = await runApifyYoutubeSearch({
      token,
      actorId,
      language,
      domain,
      searchTargets,
      keywords,
      maxResultsPerKeyword,
    });

    return NextResponse.json({ results, warning: "" });
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to search YouTube links. Please check the scraper configuration and try again.", 500);
  }
}
