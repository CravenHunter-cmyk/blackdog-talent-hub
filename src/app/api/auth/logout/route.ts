import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { blackDogSessions } from "@/db/schema";
import { BLACKDOG_SESSION_COOKIE, hashSessionToken } from "@/lib/auth/blackdogAuth";

export const runtime = "nodejs";

function getCookie(request: Request, name: string) {
  const cookies = request.headers.get("cookie") || "";
  const match = cookies.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

export async function POST(request: Request) {
  const token = getCookie(request, BLACKDOG_SESSION_COOKIE);
  if (token) {
    await db.update(blackDogSessions).set({ revokedAt: new Date() }).where(eq(blackDogSessions.sessionTokenHash, hashSessionToken(token)));
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(BLACKDOG_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV !== "development",
    path: "/",
    expires: new Date(0),
  });
  return response;
}
