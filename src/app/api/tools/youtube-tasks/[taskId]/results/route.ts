import { NextResponse } from "next/server";
import { getYoutubeTaskResults } from "@/lib/tools/youtubeTaskService";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const actor = getRequiredYoutubeUser(request);
    const { taskId } = await context.params;
    const { searchParams } = new URL(request.url);
    const results = await getYoutubeTaskResults(taskId, {
      status: searchParams.get("status") || undefined,
      q: searchParams.get("q") || undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      offset: searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined,
      includeDeleted: searchParams.get("includeDeleted") === "true",
    }, actor);
    return NextResponse.json({ results });
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to load YouTube task results.", 500);
  }
}
