import { NextResponse } from "next/server";
import { resetStaleYoutubeTaskRun } from "@/lib/tools/youtubeTaskService";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = getRequiredYoutubeUser(request);
    const { taskId } = await context.params;
    const result = await resetStaleYoutubeTaskRun(taskId, actor);
    return NextResponse.json(result);
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to reset stale YouTube task run.", 400);
  }
}
