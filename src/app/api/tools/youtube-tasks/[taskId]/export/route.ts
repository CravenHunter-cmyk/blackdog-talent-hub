import { NextResponse } from "next/server";
import { exportYoutubeTaskCsv } from "@/lib/tools/youtubeTaskService";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const actor = getRequiredYoutubeUser(request);
    const { taskId } = await context.params;
    const { searchParams } = new URL(request.url);
    const { csv, task } = await exportYoutubeTaskCsv(taskId, {
      status: searchParams.get("status") || undefined,
      q: searchParams.get("q") || undefined,
      preferredVideoQuality: searchParams.get("preferredVideoQuality") || undefined,
    }, actor);

    const date = new Date().toISOString().slice(0, 10);
    const safeName = task.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "youtube-task";

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeName}-${date}.csv"`,
      },
    });
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to export YouTube task results.", 400);
  }
}
