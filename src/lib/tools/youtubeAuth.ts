import type { YoutubeUserRole } from "@/db/schema";
import { requireToolAccess, type BlackDogUser } from "@/lib/auth/blackdogAuth";
import { YOUTUBE_SPEECH_LINK_COLLECTOR_TOOL_ID } from "@/lib/tools/toolRegistry";
import { NextResponse } from "next/server";

export type YoutubeActor = {
  id: string;
  email: string;
  role: YoutubeUserRole;
  toolPermissions?: Record<string, boolean>;
};

const DEV_ACTOR: YoutubeActor = {
  id: "dev-user",
  email: "dev@blackdog.local",
  role: "admin",
  toolPermissions: { [YOUTUBE_SPEECH_LINK_COLLECTOR_TOOL_ID]: true },
};

export class YoutubeAuthError extends Error {
  status = 401;
}

export class YoutubePermissionError extends Error {
  status = 403;
}

function normalizeRole(value: string | null | undefined): YoutubeUserRole {
  if (value === "admin" || value === "reviewer" || value === "member") return value;
  return "member";
}

function mapBlackDogUserToYoutubeActor(user: BlackDogUser): YoutubeActor {
  return {
    id: user.id,
    email: user.email,
    role: normalizeRole(user.role),
    toolPermissions: user.toolPermissions,
  };
}

export async function getCurrentYoutubeUser(request?: Request): Promise<YoutubeActor> {
  if (!request && process.env.NODE_ENV === "development") return DEV_ACTOR;
  if (!request) throw new YoutubeAuthError("Sign in required to use this tool.");

  try {
    const user = await requireToolAccess(request, YOUTUBE_SPEECH_LINK_COLLECTOR_TOOL_ID);
    return mapBlackDogUserToYoutubeActor(user);
  } catch (error) {
    if (error instanceof Error && error.message === "Sign in required.") {
      throw new YoutubeAuthError("Sign in required to use this tool.");
    }
    if (error instanceof Error && error.message === "You do not have access to this tool.") {
      throw new YoutubePermissionError(error.message);
    }
    throw error;
  }
}

export async function getRequiredYoutubeUser(request?: Request): Promise<YoutubeActor> {
  return getCurrentYoutubeUser(request);
}

export function youtubeApiErrorResponse(error: unknown, fallbackMessage: string, fallbackStatus = 400) {
  if (error instanceof YoutubeAuthError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof YoutubePermissionError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  return NextResponse.json({ error: error instanceof Error ? error.message : fallbackMessage }, { status: fallbackStatus });
}

export function isYoutubeAdmin(actor: YoutubeActor) {
  return actor.role === "admin";
}

export function hasYoutubeToolAccess(actor: YoutubeActor) {
  if (isYoutubeAdmin(actor)) return true;
  return Boolean(actor.toolPermissions?.[YOUTUBE_SPEECH_LINK_COLLECTOR_TOOL_ID]);
}

export function isYoutubeReviewer(actor: YoutubeActor) {
  return actor.role === "admin" || actor.role === "reviewer";
}

export function isYoutubeTaskOwner(task: { ownerId?: string | null; createdBy?: string | null }, actor: YoutubeActor) {
  return Boolean(actor.id && (task.ownerId === actor.id || task.createdBy === actor.id));
}

export function canViewYoutubeTask(task: { ownerId?: string | null; createdBy?: string | null; visibility?: string | null }, actor: YoutubeActor) {
  if (isYoutubeAdmin(actor)) return true;
  if (isYoutubeTaskOwner(task, actor)) return true;
  return task.visibility === "team" && actor.role === "reviewer";
}

export function canMutateYoutubeTask(task: { ownerId?: string | null; createdBy?: string | null }, actor: YoutubeActor) {
  return isYoutubeAdmin(actor) || isYoutubeTaskOwner(task, actor);
}

export function canReviewYoutubeDuplicates(actor: YoutubeActor) {
  return isYoutubeReviewer(actor);
}
