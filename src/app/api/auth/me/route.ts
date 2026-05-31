import { NextResponse } from "next/server";
import { getCurrentBlackDogUser } from "@/lib/auth/blackdogAuth";

export const runtime = "nodejs";

function mapRole(role: string) {
  if (role === "admin") return "super_admin";
  if (role === "reviewer") return "hr";
  return "talent";
}

export async function GET(request: Request) {
  const user = await getCurrentBlackDogUser(request);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({
    user: {
      id: user.id,
      loginAccount: user.email,
      name: user.name,
      role: mapRole(user.role),
      platformRole: mapRole(user.role),
      status: user.status,
      permissions: user.role === "admin" ? ["platform.private.view", "platform.admin.full", "settings.view", "settings.manage"] : ["platform.private.view"],
      toolPermissions: user.toolPermissions,
    },
  });
}
