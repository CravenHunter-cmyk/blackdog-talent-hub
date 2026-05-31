import { eq } from "drizzle-orm";
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

async function requireAdmin(request: Request) {
  const actor = await getRequiredBlackDogUser(request);
  if (!isBlackDogAdmin(actor)) {
    return { actor, error: NextResponse.json({ error: "Only admins can manage accounts." }, { status: 403 }) };
  }
  return { actor, error: null };
}

async function serializeAccount(account: typeof blackDogAccounts.$inferSelect) {
  const permissions = await db.select().from(blackDogToolPermissions).where(eq(blackDogToolPermissions.accountId, account.id));
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
  const { error } = await requireAdmin(request);
  if (error) return error;
  const accounts = await db.select().from(blackDogAccounts);
  return NextResponse.json({ accounts: await Promise.all(accounts.map(serializeAccount)) });
}

export async function POST(request: Request) {
  const { actor, error } = await requireAdmin(request);
  if (error) return error;
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const loginAccount = String(body.loginAccount || email).trim().toLowerCase();
  const name = String(body.name || body.displayName || email).trim();
  const password = String(body.password || "").trim();
  if (!email || !name || !password) return NextResponse.json({ error: "Email, name, and password are required." }, { status: 400 });

  const [account] = await db.insert(blackDogAccounts).values({
    email,
    loginAccount,
    name,
    role: toDbRole(String(body.role || "member")),
    status: body.status === "Locked" || body.status === "Invited" ? body.status : "Active",
    passwordHash: hashPassword(password),
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
  return NextResponse.json({ account: await serializeAccount(account) });
}
