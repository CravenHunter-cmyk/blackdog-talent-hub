import { NextResponse } from "next/server";
import { rebalanceYoutubePrimaryUnitsForActor } from "@/lib/tools/youtubeTaskService";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = await getRequiredYoutubeUser(request);
    const { taskId } = await context.params;
    const result = await rebalanceYoutubePrimaryUnitsForActor(taskId, actor);
    return NextResponse.json(result);
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to rebalance primary units.", 400);
  }
}
