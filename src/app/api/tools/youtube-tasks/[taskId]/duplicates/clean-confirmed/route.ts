import { NextResponse } from "next/server";
import { cleanConfirmedYoutubeDuplicates } from "@/lib/tools/youtubeTaskService";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = await getRequiredYoutubeUser(request);
    const { taskId } = await context.params;
    const result = await cleanConfirmedYoutubeDuplicates(taskId, actor);
    return NextResponse.json(result);
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to clean confirmed duplicates.", 400);
  }
}
