import { NextResponse } from "next/server";
import { cancelYoutubeSearchBatch } from "@/lib/tools/youtubeTaskService";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ batchId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = await getRequiredYoutubeUser(request);
    const { batchId } = await context.params;
    const batch = await cancelYoutubeSearchBatch(batchId, actor);
    return NextResponse.json({ batch });
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to cancel YouTube search batch.", 400);
  }
}
