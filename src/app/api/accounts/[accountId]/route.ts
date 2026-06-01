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

export async function PATCH(request: Request, context: { params: Promise<{ accountId: string }> }) {
  const actor = await getRequiredBlackDogUser(request);
  if (!isBlackDogAdmin(actor)) return NextResponse.json({ error: "Only admins can manage accounts." }, { status: 403 });
  const { accountId } = await context.params;
  const body = await request.json();
  const [before] = await db.select().from(blackDogAccounts).where(eq(blackDogAccounts.id, accountId)).limit(1);
  if (!before) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const nextValues: Partial<typeof blackDogAccounts.$inferInsert> = {
    loginAccount: String(body.loginAccount || before.loginAccount || before.email).trim().toLowerCase(),
    email: String(body.email || body.loginAccount || before.email).trim().toLowerCase(),
    name: String(body.name || body.displayName || before.name || before.email).trim(),
    role: toDbRole(String(body.role || before.role)),
    status: body.status === "Locked" || body.status === "Invited" || body.status === "Active" ? body.status : before.status,
    updatedAt: new Date(),
  };
  const password = String(body.password || "").trim();
  if (password) {
    nextValues.passwordHash = hashPassword(password);
    nextValues.passwordUpdatedAt = new Date();
  }

  const [updated] = await db.update(blackDogAccounts).set(nextValues).where(eq(blackDogAccounts.id, accountId)).returning();
  const existing = await db.select().from(blackDogToolPermissions).where(eq(blackDogToolPermissions.accountId, accountId));
  const existingMap = new Map(existing.map((permission) => [permission.toolId, permission]));
  for (const [toolId, granted] of Object.entries((body.toolPermissions || {}) as Record<string, boolean>)) {
    const current = existingMap.get(toolId);
    if (current) {
      await db.update(blackDogToolPermissions).set({ granted, updatedAt: new Date(), grantedBy: granted ? actor.id : current.grantedBy }).where(eq(blackDogToolPermissions.id, current.id));
      if (current.granted !== granted) {
        await db.insert(blackDogAuditLogs).values({
          action: granted ? "tool_access_granted" : "tool_access_revoked",
          actorId: actor.id,
          actorEmail: actor.email,
          targetAccountId: accountId,
          targetEmail: updated.email,
          toolId,
          before: { granted: current.granted },
          after: { granted },
        });
      }
    } else {
      await db.insert(blackDogToolPermissions).values({ accountId, toolId, granted, grantedBy: granted ? actor.id : null });
    }
  }
  await db.insert(blackDogAuditLogs).values({
    action: "account_updated",
    actorId: actor.id,
    actorEmail: actor.email,
    targetAccountId: accountId,
    targetEmail: updated.email,
    before: { role: before.role, status: before.status },
    after: { role: updated.role, status: updated.status },
  });
  if (password) {
    await db.insert(blackDogAuditLogs).values({
      action: "password_reset",
      actorId: actor.id,
      actorEmail: actor.email,
      targetAccountId: accountId,
      targetEmail: updated.email,
      before: { passwordSet: Boolean(before.passwordHash) },
      after: { passwordSet: true },
    });
  }
  return NextResponse.json({ account: await serializeAccount(updated) });
}
