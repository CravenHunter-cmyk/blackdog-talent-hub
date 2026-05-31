import { NextResponse } from "next/server";
import { acquireYoutubeTaskEditLock, releaseYoutubeTaskEditLock } from "@/lib/tools/youtubeTaskService";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = getRequiredYoutubeUser(request);
    const { taskId } = await context.params;
    const task = await acquireYoutubeTaskEditLock(taskId, actor);
    return NextResponse.json({ task });
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to acquire edit lock.", 400);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const actor = getRequiredYoutubeUser(request);
    const { taskId } = await context.params;
    const { searchParams } = new URL(request.url);
    const task = await releaseYoutubeTaskEditLock(taskId, actor, searchParams.get("force") === "true");
    return NextResponse.json({ task });
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to release edit lock.", 400);
  }
}
