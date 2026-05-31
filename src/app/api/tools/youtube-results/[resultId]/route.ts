import { NextResponse } from "next/server";
import { softDeleteYoutubeResult, updateYoutubeResult } from "@/lib/tools/youtubeTaskService";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ resultId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = getRequiredYoutubeUser(request);
    const { resultId } = await context.params;
    const body = await request.json();
    const result = await updateYoutubeResult(resultId, {
      status: body.status,
      notes: body.notes,
    }, actor);
    return NextResponse.json({ result });
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to update YouTube result.", 400);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const actor = getRequiredYoutubeUser(request);
    const { resultId } = await context.params;
    const result = await softDeleteYoutubeResult(resultId, actor);
    return NextResponse.json({ result });
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to delete YouTube result.", 400);
  }
}
