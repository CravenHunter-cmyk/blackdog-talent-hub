import { NextResponse } from "next/server";
import { runYoutubeTaskBatch } from "@/lib/tools/youtubeTaskService";
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
    const result = await runYoutubeTaskBatch(taskId, {
      batchId: body.batchId,
      batchName: body.batchName,
      keywords: body.keywords,
      totalTargetResults: body.totalTargetResults,
      publishedWithinMonths: body.publishedWithinMonths,
      publishedDateRangeLabel: body.publishedDateRangeLabel,
    }, actor);
    return NextResponse.json(result);
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to run YouTube search batch.", 400);
  }
}
