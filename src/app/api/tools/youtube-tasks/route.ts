import { NextResponse } from "next/server";
import { createYoutubeTask, getYoutubeTasks } from "@/lib/tools/youtubeTaskService";
import { getRequiredYoutubeUser, youtubeApiErrorResponse } from "@/lib/tools/youtubeAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const actor = await getRequiredYoutubeUser(request);
    const { searchParams } = new URL(request.url);
    const tasks = await getYoutubeTasks({
      status: searchParams.get("status") || undefined,
      language: searchParams.get("language") || undefined,
      domain: searchParams.get("domain") || undefined,
      q: searchParams.get("q") || undefined,
      limit: Number(searchParams.get("limit") || 20),
      offset: Number(searchParams.get("offset") || 0),
    }, actor);
    return NextResponse.json(tasks);
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to load YouTube tasks.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getRequiredYoutubeUser(request);
    const body = await request.json();
    const task = await createYoutubeTask({
      name: body.name,
      language: body.language,
      domain: body.domain,
      searchTargets: body.searchTargets,
      targetUniqueResults: body.targetUniqueResults ?? null,
      publishedWithinMonths: body.publishedWithinMonths ?? null,
      publishedDateRangeLabel: body.publishedDateRangeLabel ?? null,
      units: Array.isArray(body.units) ? body.units : [],
      notes: body.notes ?? null,
      createdBy: body.createdBy ?? null,
    }, actor);
    return NextResponse.json({ task });
  } catch (error) {
    return youtubeApiErrorResponse(error, "Unable to create YouTube task.", 400);
  }
}
