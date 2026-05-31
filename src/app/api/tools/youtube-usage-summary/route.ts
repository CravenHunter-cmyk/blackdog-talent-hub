import { NextResponse } from "next/server";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";
import { getYoutubeUsageSummary } from "@/lib/tools/youtubeTaskService";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const actor = await getRequiredYoutubeUser(request);
    const { searchParams } = new URL(request.url);
    const summary = await getYoutubeUsageSummary(searchParams.get("taskId"), actor);
    return NextResponse.json(summary);
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to load YouTube usage summary.", 400);
  }
}
