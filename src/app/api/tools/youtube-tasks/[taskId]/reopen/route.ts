import { NextResponse } from "next/server";
import { reopenYoutubeTask } from "@/lib/tools/youtubeTaskService";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = getRequiredYoutubeUser(request);
    const { taskId } = await context.params;
    const task = await reopenYoutubeTask(taskId, actor);
    return NextResponse.json({ task });
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to reopen YouTube task.", 400);
  }
}
