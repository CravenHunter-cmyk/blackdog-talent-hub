import { NextResponse } from "next/server";
import { completeYoutubeTask } from "@/lib/tools/youtubeTaskService";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = getRequiredYoutubeUser(request);
    const { taskId } = await context.params;
    const task = await completeYoutubeTask(taskId, actor);
    return NextResponse.json({ task });
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to complete YouTube task.", 400);
  }
}
