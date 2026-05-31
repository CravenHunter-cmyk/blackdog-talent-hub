import { NextResponse } from "next/server";
import { updateYoutubeResultPrimaryUnitForActor } from "@/lib/tools/youtubeTaskService";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ resultId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = await getRequiredYoutubeUser(request);
    const { resultId } = await context.params;
    const body = await request.json();
    const result = await updateYoutubeResultPrimaryUnitForActor(resultId, String(body.primaryUnitId || ""), actor);
    return NextResponse.json({ result });
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to update primary unit.", 400);
  }
}
