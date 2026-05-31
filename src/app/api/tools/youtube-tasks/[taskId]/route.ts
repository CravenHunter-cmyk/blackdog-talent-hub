import { NextResponse } from "next/server";
import { deleteYoutubeTask, getYoutubeTaskDetail, updateYoutubeTask } from "@/lib/tools/youtubeTaskService";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const actor = getRequiredYoutubeUser(request);
    const { taskId } = await context.params;
    const detail = await getYoutubeTaskDetail(taskId, actor, { acquireLock: true });
    return NextResponse.json(detail);
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to load YouTube task.", 404);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = getRequiredYoutubeUser(request);
    const { taskId } = await context.params;
    const body = await request.json();
    const task = await updateYoutubeTask(taskId, {
      name: body.name,
      language: body.language,
      domain: body.domain,
      searchTargets: body.searchTargets,
      notes: body.notes,
      status: body.status,
      targetUniqueResults: body.targetUniqueResults,
      publishedWithinMonths: body.publishedWithinMonths,
      publishedDateRangeLabel: body.publishedDateRangeLabel,
      units: Array.isArray(body.units) ? body.units : undefined,
    }, actor);
    return NextResponse.json({ task });
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to update YouTube task.", 400);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const actor = getRequiredYoutubeUser(request);
    const { taskId } = await context.params;
    const task = await deleteYoutubeTask(taskId, actor);
    return NextResponse.json({ task });
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to delete YouTube task.", 400);
  }
}
