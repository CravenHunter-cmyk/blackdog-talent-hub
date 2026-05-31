import type { YoutubeUserRole } from "@/db/schema";
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

function parseToolAccessHeader(value: string | null | undefined): Record<string, boolean> {
  if (!value) return {};
  const trimmed = value.trim();
  if (!trimmed) return {};

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>)
          .map(([toolId, enabled]) => [toolId.trim(), Boolean(enabled)] as const)
          .filter(([toolId]) => Boolean(toolId)),
      );
    }
  } catch {
    // Fall back to comma-separated tool ids.
  }

  return Object.fromEntries(
    trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((toolId) => [toolId, true] as const),
  );
}

export function getCurrentYoutubeUser(request?: Request): YoutubeActor {
  const headers = request?.headers;
  const id = headers?.get("x-blackdog-user-id")?.trim();
  const email = headers?.get("x-blackdog-user-email")?.trim();
  const roleHeader = headers?.get("x-blackdog-user-role");
  const toolPermissions = {
    ...parseToolAccessHeader(headers?.get("x-blackdog-tool-access")),
    ...parseToolAccessHeader(headers?.get("x-blackdog-tool-permissions")),
  };

  if (id && email) {
    return {
      id,
      email,
      role: normalizeRole(roleHeader),
      toolPermissions,
    };
  }

  if (process.env.NODE_ENV === "development") return DEV_ACTOR;

  throw new YoutubeAuthError("Sign in required to use this tool.");
}

export function getRequiredYoutubeUser(request?: Request): YoutubeActor {
  const actor = getCurrentYoutubeUser(request);
  if (!hasYoutubeToolAccess(actor)) {
    throw new YoutubePermissionError("You do not have access to this tool.");
  }
  return actor;
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
