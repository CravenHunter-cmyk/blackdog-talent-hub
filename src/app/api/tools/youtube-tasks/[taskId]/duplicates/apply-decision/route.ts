import { NextResponse } from "next/server";
import { applyYoutubeDuplicateDecision } from "@/lib/tools/youtubeTaskService";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = await getRequiredYoutubeUser(request);
    const { taskId } = await context.params;
    const body = await request.json();
    const result = await applyYoutubeDuplicateDecision(taskId, {
      groupId: body.groupId,
      keepResultId: body.keepResultId,
      deleteResultIds: Array.isArray(body.deleteResultIds) ? body.deleteResultIds : [],
    }, actor);
    return NextResponse.json(result);
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to apply duplicate decision.", 400);
  }
}
