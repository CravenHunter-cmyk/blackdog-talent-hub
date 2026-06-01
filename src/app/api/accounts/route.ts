import { eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { blackDogAccounts, blackDogAuditLogs, blackDogToolPermissions, type BlackDogAccountRole } from "@/db/schema";
import { getRequiredBlackDogUser, isBlackDogAdmin } from "@/lib/auth/blackdogAuth";
import { hashPassword } from "@/lib/auth/password";

export const runtime = "nodejs";

function toDbRole(role: string): BlackDogAccountRole {
  if (role === "super_admin" || role === "admin") return "admin";
  if (role === "hr_user" || role === "reviewer") return "reviewer";
  return "member";
}

function toUiRole(role: string) {
  if (role === "admin") return "super_admin";
  if (role === "reviewer") return "hr_user";
  return "talent";
}

type AccountListRow = Pick<
  typeof blackDogAccounts.$inferSelect,
  "id" | "email" | "loginAccount" | "name" | "role" | "status" | "createdAt" | "updatedAt"
>;
type ToolPermissionRow = typeof blackDogToolPermissions.$inferSelect;

async function requireAdmin(request: Request) {
  const actor = await getRequiredBlackDogUser(request);
  if (!isBlackDogAdmin(actor)) {
    return { actor, error: NextResponse.json({ error: "Only admins can manage accounts." }, { status: 403 }) };
  }
  return { actor, error: null };
}

function serializeAccount(account: AccountListRow, permissions: ToolPermissionRow[] = []) {
  return {
    accountId: account.id,
    loginAccount: account.loginAccount || account.email,
    name: account.name || account.email,
    role: toUiRole(account.role),
    status: account.status,
    password: "",
    email: account.email,
    permissions: {},
    toolPermissions: Object.fromEntries(permissions.filter((permission) => permission.granted).map((permission) => [permission.toolId, true])),
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
    assignedTeams: [],
  };
}

function normalizeLogin(value: string) {
  return value.trim().toLowerCase();
}

async function upsertToolPermissions(accountId: string, toolPermissions: Record<string, boolean>, actorId: string, actorEmail: string) {
  const existing = await db.select().from(blackDogToolPermissions).where(eq(blackDogToolPermissions.accountId, accountId));
  const existingMap = new Map(existing.map((permission) => [permission.toolId, permission]));

  for (const [toolId, granted] of Object.entries(toolPermissions)) {
    const current = existingMap.get(toolId);
    if (current) {
      await db.update(blackDogToolPermissions).set({ granted, updatedAt: new Date(), grantedBy: granted ? actorId : current.grantedBy }).where(eq(blackDogToolPermissions.id, current.id));
      if (current.granted !== granted) {
        await db.insert(blackDogAuditLogs).values({
          action: granted ? "tool_access_granted" : "tool_access_revoked",
          actorId,
          actorEmail,
          targetAccountId: accountId,
          toolId,
          before: { granted: current.granted },
          after: { granted },
        });
      }
    } else {
      await db.insert(blackDogToolPermissions).values({ accountId, toolId, granted, grantedBy: granted ? actorId : null });
      if (granted) {
        await db.insert(blackDogAuditLogs).values({
          action: "tool_access_granted",
          actorId,
          actorEmail,
          targetAccountId: accountId,
          toolId,
          before: { granted: false },
          after: { granted: true },
        });
      }
    }
  }
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  const authStartedAt = Date.now();
  const { error } = await requireAdmin(request);
  if (error) return error;
  const authMs = Date.now() - authStartedAt;

  const dbStartedAt = Date.now();
  const [accounts, permissions] = await Promise.all([
    db
      .select({
        id: blackDogAccounts.id,
        email: blackDogAccounts.email,
        loginAccount: blackDogAccounts.loginAccount,
        name: blackDogAccounts.name,
        role: blackDogAccounts.role,
        status: blackDogAccounts.status,
        createdAt: blackDogAccounts.createdAt,
        updatedAt: blackDogAccounts.updatedAt,
      })
      .from(blackDogAccounts)
      .where(ne(blackDogAccounts.status, "Deleted")),
    db.select().from(blackDogToolPermissions),
  ]);
  const dbMs = Date.now() - dbStartedAt;

  const permissionsByAccountId = new Map<string, ToolPermissionRow[]>();
  permissions.forEach((permission) => {
    const existing = permissionsByAccountId.get(permission.accountId) || [];
    existing.push(permission);
    permissionsByAccountId.set(permission.accountId, existing);
  });

  console.info("[accounts] list timing", {
    authMs,
    dbMs,
    totalMs: Date.now() - startedAt,
    accountsCount: accounts.length,
  });

  return NextResponse.json({
    accounts: accounts.map((account) => serializeAccount(account, permissionsByAccountId.get(account.id) || [])),
  });
}

export async function POST(request: Request) {
  const { actor, error } = await requireAdmin(request);
  if (error) return error;
  const body = await request.json();
  const loginAccount = normalizeLogin(String(body.loginAccount || body.email || ""));
  const email = normalizeLogin(String(body.email || loginAccount));
  const name = String(body.name || body.displayName || loginAccount).trim();
  const password = String(body.password || "").trim();
  if (!loginAccount || !name || !password) return NextResponse.json({ error: "Login account, name, and password are required." }, { status: 400 });

  const [account] = await db.insert(blackDogAccounts).values({
    email,
    loginAccount,
    name,
    role: toDbRole(String(body.role || "member")),
    status: body.status === "Locked" || body.status === "Invited" ? body.status : "Active",
    passwordHash: hashPassword(password),
    passwordUpdatedAt: new Date(),
  }).returning();
  await upsertToolPermissions(account.id, body.toolPermissions || {}, actor.id, actor.email);
  await db.insert(blackDogAuditLogs).values({
    action: "account_created",
    actorId: actor.id,
    actorEmail: actor.email,
    targetAccountId: account.id,
    targetEmail: account.email,
    after: { role: account.role, status: account.status },
  });
  return NextResponse.json({ account: serializeAccount(account, await db.select().from(blackDogToolPermissions).where(eq(blackDogToolPermissions.accountId, account.id))) });
}
