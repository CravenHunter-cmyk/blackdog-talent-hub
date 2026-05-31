import { NextResponse } from "next/server";
import { markYoutubeDuplicateGroupReviewed } from "@/lib/tools/youtubeTaskService";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = getRequiredYoutubeUser(request);
    const { taskId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const result = await markYoutubeDuplicateGroupReviewed(taskId, String(body.groupId || ""), "keep-separate", actor);
    return NextResponse.json(result);
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to mark duplicate group as separate.", 400);
  }
}
