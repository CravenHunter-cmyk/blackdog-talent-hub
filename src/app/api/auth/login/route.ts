import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { blackDogAccounts, blackDogSessions } from "@/db/schema";
import { BLACKDOG_SESSION_COOKIE, createSessionToken, findBlackDogAccountByLogin, hashSessionToken } from "@/lib/auth/blackdogAuth";
import { verifyPassword } from "@/lib/auth/password";

export const runtime = "nodejs";

const SESSION_DAYS = 7;

function mapRole(role: string) {
  if (role === "admin") return "Super Admin";
  if (role === "reviewer") return "HR User";
  return "Talent";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const loginAccount = String(body.loginAccount || body.account || "").trim();
    const password = String(body.password || "");
    const account = await findBlackDogAccountByLogin(loginAccount);

    if (!account || account.status !== "Active" || !verifyPassword(password, account.passwordHash)) {
      return NextResponse.json({ error: "Account or password is incorrect." }, { status: 401 });
    }

    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    await db.insert(blackDogSessions).values({
      accountId: account.id,
      sessionTokenHash: hashSessionToken(token),
      expiresAt,
      lastSeenAt: new Date(),
    });
    await db.update(blackDogAccounts).set({ updatedAt: new Date() }).where(eq(blackDogAccounts.id, account.id));

    const response = NextResponse.json({
      user: {
        id: account.id,
        loginAccount: account.loginAccount || account.email,
        email: account.email,
        name: account.name || account.email,
        role: mapRole(account.role),
        status: account.status,
      },
    });
    response.cookies.set(BLACKDOG_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV !== "development",
      path: "/",
      expires: expiresAt,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
