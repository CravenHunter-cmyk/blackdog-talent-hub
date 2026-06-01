import { NextResponse } from "next/server";
import { getCurrentBlackDogUser } from "@/lib/auth/blackdogAuth";

export const runtime = "nodejs";

function mapRole(role: string) {
  if (role === "admin") return "super_admin";
  if (role === "reviewer") return "hr";
  return "client";
}

function mapPermissions(role: string) {
  if (role === "admin") return ["platform.private.view", "platform.admin.full", "settings.view", "settings.manage"];
  if (role === "reviewer") return ["platform.private.view", "recruiting.view", "talentLibrary.view", "talentHub.view", "workCenter.view"];
  return ["platform.private.view", "recruiting.view", "talentLibrary.view", "talentHub.view", "workCenter.view"];
}

export async function GET(request: Request) {
  const user = await getCurrentBlackDogUser(request);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({
    user: {
      id: user.id,
      loginAccount: user.loginAccount,
      name: user.name,
      role: mapRole(user.role),
      platformRole: mapRole(user.role),
      status: user.status,
      permissions: mapPermissions(user.role),
      toolPermissions: user.toolPermissions,
    },
  });
}
