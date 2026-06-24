"use client";

import { YOUTUBE_SPEECH_LINK_COLLECTOR_TOOL_ID } from "@/lib/tools/toolRegistry";

export type PlatformRole = "root_owner" | "super_admin" | "executive" | "hr" | "talent" | "client";

export type PermissionKey =
  | "public.talentMap.view"
  | "platform.private.view"
  | "platform.admin.full"
  | "user.view"
  | "user.create"
  | "user.edit"
  | "user.disable"
  | "user.delete"
  | "user.superAdmin.create"
  | "permission.manage"
  | "settings.view"
  | "settings.manage"
  | "recruiting.view"
  | "recruiting.manage"
  | "recruiting.createTask"
  | "recruiting.editTask"
  | "talentLibrary.view"
  | "talentLibrary.manage"
  | "talentLibrary.create"
  | "talentLibrary.edit"
  | "talentLibrary.delete"
  | "talentHub.view"
  | "talentHub.task.view"
  | "talentHub.personal.viewOwn"
  | "talentHub.personal.editOwn"
  | "talentHub.communication.view"
  | "talentHub.communication.manage"
  | "workCenter.view"
  | "workCenter.admin.view"
  | "workCenter.team.view"
  | "project.create"
  | "project.configure"
  | "project.assign"
  | "project.delete"
  | "template.generate"
  | "template.apply"
  | "case.view"
  | "case.submitOwn"
  | "qc.review"
  | "recheck.review"
  | "delivery.view"
  | "delivery.sync"
  | "client.readonly"
  | "client.project.view"
  | "client.delivery.view"
  | "client.report.view"
  | "brain.view"
  | "brain.use";

export type PlatformUser = {
  id: string;
  name: string;
  role: PlatformRole;
  isRootOwner?: boolean;
  readonly?: boolean;
  teamIds?: string[];
  projectIds?: string[] | "all";
  clientId?: string;
  permissions: PermissionKey[];
  toolPermissions?: Record<string, boolean>;
};

export const MOCK_PLATFORM_USERS: Array<PlatformUser | null> = [
  null,
  {
    id: "root-craven",
    name: "Craven",
    role: "root_owner",
    isRootOwner: true,
    projectIds: "all",
    permissions: [
      "platform.private.view",
      "platform.admin.full",
      "user.view",
      "user.create",
      "user.edit",
      "user.disable",
      "user.delete",
      "user.superAdmin.create",
      "permission.manage",
      "settings.view",
      "settings.manage",
      "recruiting.view",
      "recruiting.manage",
      "talentLibrary.view",
      "talentLibrary.manage",
      "talentHub.view",
      "talentHub.communication.manage",
      "workCenter.view",
      "workCenter.admin.view",
      "workCenter.team.view",
      "project.create",
      "project.configure",
      "project.assign",
      "project.delete",
      "template.generate",
      "template.apply",
      "case.view",
      "case.submitOwn",
      "qc.review",
      "recheck.review",
      "delivery.view",
      "delivery.sync",
      "brain.view",
      "brain.use",
    ],
  },
  {
    id: "super-julie",
    name: "Julie Admin",
    role: "super_admin",
    projectIds: "all",
    permissions: [
      "platform.private.view",
      "platform.admin.full",
      "user.view",
      "user.create",
      "user.edit",
      "user.disable",
      "permission.manage",
      "settings.view",
      "settings.manage",
      "recruiting.view",
      "recruiting.manage",
      "talentLibrary.view",
      "talentLibrary.manage",
      "talentHub.view",
      "workCenter.view",
      "workCenter.admin.view",
      "workCenter.team.view",
      "project.create",
      "project.configure",
      "project.assign",
      "project.delete",
      "template.generate",
      "template.apply",
      "case.view",
      "qc.review",
      "recheck.review",
      "delivery.view",
      "delivery.sync",
      "brain.view",
      "brain.use",
    ],
  },
  {
    id: "exec-viewer",
    name: "Executive Viewer",
    role: "executive",
    readonly: true,
    projectIds: "all",
    permissions: ["platform.private.view", "recruiting.view", "talentLibrary.view", "workCenter.view", "delivery.view", "brain.view"],
  },
  {
    id: "hr-manager",
    name: "HR Manager",
    role: "hr",
    projectIds: "all",
    permissions: [
      "platform.private.view",
      "recruiting.view",
      "recruiting.manage",
      "talentLibrary.view",
      "talentLibrary.manage",
      "talentLibrary.create",
      "talentLibrary.edit",
      "talentHub.view",
      "talentHub.communication.view",
      "workCenter.view",
      "workCenter.team.view",
      "case.view",
      "brain.view",
      "brain.use",
    ],
  },
  {
    id: "talent-user",
    name: "Talent User",
    role: "talent",
    teamIds: ["Japanese LLM Team"],
    projectIds: ["p1"],
    permissions: [
      "platform.private.view",
      "talentHub.view",
      "talentHub.task.view",
      "talentHub.personal.viewOwn",
      "talentHub.personal.editOwn",
      "talentHub.communication.view",
      "workCenter.view",
      "workCenter.team.view",
      "case.view",
      "case.submitOwn",
    ],
  },
  {
    id: "client-viewer",
    name: "Client Viewer",
    role: "client",
    readonly: true,
    clientId: "client-demo",
    projectIds: "all",
    permissions: [
      "platform.private.view",
      "client.readonly",
      "client.project.view",
      "client.delivery.view",
      "client.report.view",
      "recruiting.view",
      "talentLibrary.view",
      "talentHub.view",
      "workCenter.view",
      "delivery.view",
      "brain.view",
    ],
  },
];

const CURRENT_USER_KEY = "blackdog_current_user";
const LEGACY_USER_KEY = "blackdogCurrentUser";
const LEGACY_USER_V1_KEY = "blackdogCurrentUserV1";
const LOGGED_OUT_PLATFORM_USER = null;
let cachedPlatformUserRaw: string | null = null;
let cachedPlatformUserSnapshot: PlatformUser | null = LOGGED_OUT_PLATFORM_USER;

export function hasPermission(user: PlatformUser | null, permission: PermissionKey) {
  if (!user) return permission === "public.talentMap.view";
  if (user.isRootOwner || user.permissions.includes("platform.admin.full")) return true;
  return user.permissions.includes(permission);
}

export function isPlatformAdmin(user: PlatformUser | null) {
  return Boolean(user?.isRootOwner || user?.permissions.includes("platform.admin.full") || user?.role === "root_owner" || user?.role === "super_admin");
}

export function hasBlackDogToolAccess(user: PlatformUser | null, toolId: string) {
  if (!user) return false;
  if (isPlatformAdmin(user)) return true;
  return Boolean(user.toolPermissions?.[toolId]);
}

export function isRootOwner(user: PlatformUser | null) {
  return Boolean(user?.isRootOwner || user?.role === "root_owner");
}

export function isClient(user: PlatformUser | null) {
  return user?.role === "client";
}

export function isReadOnly(user: PlatformUser | null) {
  return Boolean(user?.readonly || user?.role === "client" || user?.role === "executive");
}

export function canPerform(user: PlatformUser | null, action: PermissionKey) {
  if (!user) return false;
  if (isRootOwner(user)) return true;
  if (isClient(user)) return false;
  if (action === "user.superAdmin.create") return isRootOwner(user);
  return hasPermission(user, action) && !isReadOnly(user);
}

export function isPublicRoute(route: string) {
  const [pathname] = route.split("?");

  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/talent-map" ||
    pathname.startsWith("/talent-map/") ||
    pathname === "/blackdog-brain" ||
    pathname === "/blackdog-brain/overview"
  );
}

export function canAccessRoute(user: PlatformUser | null, route: string) {
  if (isPublicRoute(route)) return true;
  if (!user) return false;
  if (isPlatformAdmin(user)) return true;
  if (route.startsWith("/sourcing-hub")) return hasPermission(user, "recruiting.view") && user.role !== "talent";
  if (route.startsWith("/recruiting")) return hasPermission(user, "recruiting.view") && user.role !== "talent";
  if (route.startsWith("/talent-museum")) return hasPermission(user, "talentLibrary.view") && user.role !== "talent";
  if (route.startsWith("/talent-library")) return hasPermission(user, "talentLibrary.view") && user.role !== "talent";
  if (route.startsWith("/talent-hub")) return hasPermission(user, "talentHub.view");
  if (route.startsWith("/talent-messages")) return hasPermission(user, "talentHub.view");
  if (route.startsWith("/workhub")) return hasPermission(user, "platform.private.view");
  if (route.startsWith("/pm-hub")) return hasPermission(user, "platform.private.view") || hasPermission(user, "client.project.view");
  if (route.startsWith("/team-hub")) return hasPermission(user, "platform.private.view") || hasPermission(user, "client.project.view");
  if (route.startsWith("/work-center")) return hasPermission(user, "workCenter.view");
  if (route.startsWith("/blackdog-brain")) return hasPermission(user, "brain.view") && user.role !== "talent";
  if (route.startsWith("/blackdog-platform")) return hasPermission(user, "platform.private.view");
  if (route.startsWith("/blackdog-tools")) return hasPermission(user, "platform.private.view");
  if (route.startsWith("/workspace/tools/youtube-speech-link-collector")) {
    return hasPermission(user, "platform.private.view") && hasBlackDogToolAccess(user, YOUTUBE_SPEECH_LINK_COLLECTOR_TOOL_ID);
  }
  if (route.startsWith("/workspace/tools")) return hasPermission(user, "platform.private.view");
  if (route.startsWith("/command") || route.startsWith("/users-permissions") || route.startsWith("/settings")) return hasPermission(user, "settings.view");
  return hasPermission(user, "platform.private.view");
}

export function canAccessModule(user: PlatformUser | null, module: string) {
  if (!user) return false;
  if (isRootOwner(user) || user.permissions.includes("platform.admin.full")) return true;
  if (isClient(user)) {
    return !["personal-center", "communication-hub", "users", "settings", "accounts", "admins", "team-members", "ai-template-edit"].includes(module);
  }
  return true;
}

export function routeFallbackType(user: PlatformUser | null, route: string): "allowed" | "access-required" | "no-permission" {
  if (canAccessRoute(user, route)) return "allowed";
  return user ? "no-permission" : "access-required";
}

export function persistMockUser(user: PlatformUser | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
    window.localStorage.removeItem(LEGACY_USER_KEY);
    window.localStorage.removeItem(LEGACY_USER_V1_KEY);
    cachedPlatformUserRaw = null;
    cachedPlatformUserSnapshot = LOGGED_OUT_PLATFORM_USER;
    window.dispatchEvent(new Event("storage"));
    return;
  }
  const session = {
    id: user.id,
    loginAccount: user.id,
    name: user.name,
    role: user.role,
    platformRole: user.role,
    status: "Active",
    isRootOwner: user.isRootOwner,
    readonly: user.readonly,
    teamIds: user.teamIds,
    projectIds: user.projectIds,
    clientId: user.clientId,
    permissions: user.permissions,
    toolPermissions: user.toolPermissions || {},
    loggedInAt: new Date().toISOString(),
  };
  const rawSession = JSON.stringify(session);
  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
  window.localStorage.setItem(LEGACY_USER_KEY, rawSession);
  window.localStorage.setItem(LEGACY_USER_V1_KEY, rawSession);
  cachedPlatformUserRaw = rawSession;
  cachedPlatformUserSnapshot = user;
  window.dispatchEvent(new Event("storage"));
}

function normalizeRole(value: unknown): PlatformRole {
  const role = String(value || "").toLowerCase().replace(/\s+/g, "_");
  if (["root_owner", "super_admin", "executive", "hr", "talent", "client"].includes(role)) return role as PlatformRole;
  if (role === "hr_user") return "hr";
  if (role === "viewer") return "client";
  return "hr";
}

function normalizePermissions(value: unknown): PermissionKey[] {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) as PermissionKey[] : [];
}

function normalizeToolPermissions(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, enabled]) => [String(key).trim(), Boolean(enabled)] as const)
      .filter(([key]) => Boolean(key)),
  );
}

export function readPlatformUser(): PlatformUser | null {
  if (typeof window === "undefined") return LOGGED_OUT_PLATFORM_USER;
  const raw = window.localStorage.getItem(CURRENT_USER_KEY) || window.localStorage.getItem(LEGACY_USER_KEY) || window.localStorage.getItem(LEGACY_USER_V1_KEY);
  if (!raw) {
    cachedPlatformUserRaw = null;
    cachedPlatformUserSnapshot = LOGGED_OUT_PLATFORM_USER;
    return LOGGED_OUT_PLATFORM_USER;
  }
  if (raw === cachedPlatformUserRaw) return cachedPlatformUserSnapshot;
  try {
    const parsed = JSON.parse(raw) as Partial<PlatformUser> & { platformRole?: string; loginAccount?: string };
    const role = normalizeRole(parsed.platformRole || parsed.role);
    const id = String(parsed.id || parsed.loginAccount || "").trim();
    const name = String(parsed.name || "").trim();
    if (!id || !name) {
      cachedPlatformUserRaw = raw;
      cachedPlatformUserSnapshot = LOGGED_OUT_PLATFORM_USER;
      return LOGGED_OUT_PLATFORM_USER;
    }
    const matched = MOCK_PLATFORM_USERS.find((item) => item?.id === id || item?.name === name || item?.role === role);
    const nextSnapshot = {
      id,
      name,
      role,
      isRootOwner: Boolean(parsed.isRootOwner || role === "root_owner"),
      readonly: Boolean(parsed.readonly || role === "client" || role === "executive"),
      teamIds: Array.isArray(parsed.teamIds) ? parsed.teamIds : matched?.teamIds,
      projectIds: parsed.projectIds || matched?.projectIds,
      clientId: parsed.clientId || matched?.clientId,
      permissions: normalizePermissions(parsed.permissions).length ? normalizePermissions(parsed.permissions) : matched?.permissions || [],
      toolPermissions: {
        ...(matched?.toolPermissions || {}),
        ...normalizeToolPermissions(parsed.toolPermissions),
      },
    };
    cachedPlatformUserRaw = raw;
    cachedPlatformUserSnapshot = nextSnapshot;
    return cachedPlatformUserSnapshot;
  } catch {
    cachedPlatformUserRaw = raw;
    cachedPlatformUserSnapshot = LOGGED_OUT_PLATFORM_USER;
    return LOGGED_OUT_PLATFORM_USER;
  }
}

export function getServerPlatformUserSnapshot(): PlatformUser | null {
  return LOGGED_OUT_PLATFORM_USER;
}
