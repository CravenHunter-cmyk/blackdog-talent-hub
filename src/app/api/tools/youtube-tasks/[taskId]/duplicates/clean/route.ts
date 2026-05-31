import { NextResponse } from "next/server";
import { cleanConfirmedYoutubeDuplicates, getYoutubeDuplicateGroups } from "@/lib/tools/youtubeTaskService";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = getRequiredYoutubeUser(request);
    const { taskId } = await context.params;
    const [result, cleanResult] = await Promise.all([
      getYoutubeDuplicateGroups(taskId, actor),
      cleanConfirmedYoutubeDuplicates(taskId, actor),
    ]);
    return NextResponse.json({
      reviewed: true,
      summary: result.summary,
      ...cleanResult,
    });
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to review duplicate groups.", 400);
  }
}
