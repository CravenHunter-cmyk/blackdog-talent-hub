import type { YoutubeUserRole } from "@/db/schema";
import { NextResponse } from "next/server";

export type YoutubeActor = {
  id: string;
  email: string;
  role: YoutubeUserRole;
};

const DEV_ACTOR: YoutubeActor = {
  id: "dev-user",
  email: "dev@blackdog.local",
  role: "admin",
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

export function getCurrentYoutubeUser(request?: Request): YoutubeActor {
  const headers = request?.headers;
  const id = headers?.get("x-blackdog-user-id")?.trim();
  const email = headers?.get("x-blackdog-user-email")?.trim();
  const roleHeader = headers?.get("x-blackdog-user-role");

  if (id && email) {
    return {
      id,
      email,
      role: normalizeRole(roleHeader),
    };
  }

  if (process.env.NODE_ENV === "development") return DEV_ACTOR;

  throw new YoutubeAuthError("Sign in required to use this tool.");
}

export function getRequiredYoutubeUser(request?: Request): YoutubeActor {
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
