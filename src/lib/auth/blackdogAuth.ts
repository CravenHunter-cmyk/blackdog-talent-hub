import { createHash, randomBytes } from "crypto";
import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { blackDogAccounts, blackDogSessions, blackDogToolPermissions, type BlackDogAccountRole } from "@/db/schema";

export const BLACKDOG_SESSION_COOKIE = "blackdog_session";

export type BlackDogUser = {
  id: string;
  email: string;
  loginAccount: string;
  name: string;
  role: BlackDogAccountRole;
  status: string;
  toolPermissions: Record<string, boolean>;
};

export class BlackDogAuthError extends Error {
  status = 401;
}

export class BlackDogPermissionError extends Error {
  status = 403;
}

export function isDevelopmentAuthMode() {
  return process.env.NODE_ENV === "development";
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

function parseCookieHeader(cookieHeader: string | null | undefined) {
  return Object.fromEntries(
    String(cookieHeader || "")
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const index = item.indexOf("=");
        if (index < 0) return [item, ""];
        return [item.slice(0, index), decodeURIComponent(item.slice(index + 1))];
      }),
  );
}

function normalizeRole(value: string | null | undefined): BlackDogAccountRole {
  if (value === "admin" || value === "reviewer" || value === "member") return value;
  if (value === "super_admin" || value === "root_owner") return "admin";
  if (value === "hr" || value === "hr_user") return "member";
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
          .map(([toolId, granted]) => [toolId.trim(), Boolean(granted)] as const)
          .filter(([toolId]) => Boolean(toolId)),
      );
    }
  } catch {
    // Comma-separated ids are supported for local smoke testing.
  }

  return Object.fromEntries(trimmed.split(",").map((item) => item.trim()).filter(Boolean).map((toolId) => [toolId, true] as const));
}

function buildUser(account: typeof blackDogAccounts.$inferSelect, permissions: Array<typeof blackDogToolPermissions.$inferSelect>): BlackDogUser {
  return {
    id: account.id,
    email: account.email,
    loginAccount: account.loginAccount || account.email,
    name: account.name || account.email,
    role: account.role,
    status: account.status,
    toolPermissions: Object.fromEntries(permissions.filter((permission) => permission.granted).map((permission) => [permission.toolId, true])),
  };
}

export async function getCurrentBlackDogUser(request?: Request): Promise<BlackDogUser | null> {
  const cookieHeader = request?.headers.get("cookie");
  const sessionToken = parseCookieHeader(cookieHeader)[BLACKDOG_SESSION_COOKIE];

  if (sessionToken) {
    const tokenHash = hashSessionToken(sessionToken);
    const [session] = await db
      .select()
      .from(blackDogSessions)
      .where(and(eq(blackDogSessions.sessionTokenHash, tokenHash), isNull(blackDogSessions.revokedAt), gt(blackDogSessions.expiresAt, new Date())))
      .limit(1);

    if (session) {
      const [account] = await db.select().from(blackDogAccounts).where(eq(blackDogAccounts.id, session.accountId)).limit(1);
      if (account?.status === "Active") {
        const permissions = await db.select().from(blackDogToolPermissions).where(eq(blackDogToolPermissions.accountId, account.id));
        await db.update(blackDogSessions).set({ lastSeenAt: new Date() }).where(eq(blackDogSessions.id, session.id));
        return buildUser(account, permissions);
      }
    }
  }

  if (isDevelopmentAuthMode() && request) {
    const id = request.headers.get("x-blackdog-user-id")?.trim();
    const email = request.headers.get("x-blackdog-user-email")?.trim();
    if (id && email) {
      return {
        id,
        email,
        loginAccount: email,
        name: email,
        role: normalizeRole(request.headers.get("x-blackdog-user-role")),
        status: "Active",
        toolPermissions: {
          ...parseToolAccessHeader(request.headers.get("x-blackdog-tool-access")),
          ...parseToolAccessHeader(request.headers.get("x-blackdog-tool-permissions")),
        },
      };
    }
  }

  return null;
}

export async function getRequiredBlackDogUser(request?: Request) {
  const user = await getCurrentBlackDogUser(request);
  if (!user) throw new BlackDogAuthError("Sign in required.");
  return user;
}

export function isBlackDogAdmin(user: BlackDogUser | null) {
  return user?.role === "admin";
}

export function hasToolAccess(user: BlackDogUser | null, toolId: string) {
  if (!user || user.status !== "Active") return false;
  if (isBlackDogAdmin(user)) return true;
  return Boolean(user.toolPermissions[toolId]);
}

export async function requireToolAccess(request: Request, toolId: string) {
  const user = await getRequiredBlackDogUser(request);
  if (!hasToolAccess(user, toolId)) {
    throw new BlackDogPermissionError("You do not have access to this tool.");
  }
  return user;
}

export function blackDogAuthErrorResponse(error: unknown, fallbackMessage = "Request failed.") {
  if (error instanceof BlackDogAuthError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof BlackDogPermissionError) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ error: error instanceof Error ? error.message : fallbackMessage }, { status: 500 });
}

export async function findBlackDogAccountByLogin(loginAccountOrEmail: string) {
  const login = loginAccountOrEmail.trim().toLowerCase();
  if (!login) return null;
  const [account] = await db
    .select()
    .from(blackDogAccounts)
    .where(or(sql`lower(${blackDogAccounts.email}) = ${login}`, sql`lower(${blackDogAccounts.loginAccount}) = ${login}`))
    .limit(1);
  return account || null;
}
