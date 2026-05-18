export type AppRole = "root_owner" | "super_admin" | "executive" | "hr" | "viewer" | "talent" | "client"

export type AppUser = {
  id: string
  name: string
  role: AppRole
  permissions: string[]
}

export type LoggedInSession = {
  loginAccount: string
  name: string
  role: string
  status: "Invited" | "Active" | "Locked"
  linkedTalentProfileId?: string
  avatarUrl?: string
  loggedInAt: string
}

export const DEFAULT_CURRENT_USER: AppUser = {
  id: "mock-hr-julie",
  name: "Julie Zhu",
  role: "hr",
  permissions: [],
}

type StoredUserSession = Partial<LoggedInSession> & Partial<AppUser>

function normalizeList(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item || "").trim()).filter(Boolean) : []
}

function normalizeRole(value: unknown): AppRole {
  const input = String(value || "").trim().toLowerCase()
  if (input === "root_owner" || input === "root owner") return "root_owner"
  if (input === "super_admin" || input === "super admin") return "super_admin"
  if (input === "executive") return "executive"
  if (input === "hr" || input === "hr user" || input === "hr_user") return "hr"
  if (input === "talent") return "talent"
  if (input === "client") return "client"
  return "viewer"
}

function readSessionObject(): StoredUserSession | null {
  if (typeof window === "undefined") return null

  const candidates = [
    window.localStorage.getItem("blackdog_current_user"),
    window.localStorage.getItem("blackdogCurrentUser"),
    window.localStorage.getItem("blackdogCurrentUserV1"),
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate as string) as StoredUserSession
      if (parsed && typeof parsed === "object") {
        return parsed
      }
    } catch {
      continue
    }
  }

  const globalUser = (window as Window & { __BLACKDOG_CURRENT_USER__?: StoredUserSession }).__BLACKDOG_CURRENT_USER__
  return globalUser || null
}

export function normalizeCurrentUser(raw: Partial<AppUser> | null | undefined): AppUser {
  const permissions = normalizeList(raw?.permissions)
  const role = normalizeRole(raw?.role)
  return {
    id: String(raw?.id || DEFAULT_CURRENT_USER.id).trim() || DEFAULT_CURRENT_USER.id,
    name: String(raw?.name || DEFAULT_CURRENT_USER.name).trim() || DEFAULT_CURRENT_USER.name,
    role,
    permissions,
  }
}

export function canManageTalentLibrary(user: Partial<AppUser> | null | undefined = DEFAULT_CURRENT_USER) {
  const normalized = normalizeCurrentUser(user)
  return (
    normalized.role === "root_owner" ||
    normalized.role === "super_admin" ||
    normalized.role === "hr" ||
    normalized.permissions.includes("talent_library:manage") ||
    normalized.permissions.includes("talentLibrary.manage")
  )
}

export function readCurrentUser(): AppUser {
  if (typeof window === "undefined") return DEFAULT_CURRENT_USER

  const session = readSessionObject()
  if (session) {
    return normalizeCurrentUser({
      id: String(session.id || session.loginAccount || DEFAULT_CURRENT_USER.id),
      name: String(session.name || DEFAULT_CURRENT_USER.name),
      role: normalizeRole(session.role),
      permissions: normalizeList(session.permissions),
    })
  }

  return DEFAULT_CURRENT_USER
}

export function readLoggedInSession(): LoggedInSession | null {
  const session = readSessionObject()
  if (!session) return null

  const loginAccount = String(session.loginAccount || session.id || "").trim()
  const name = String(session.name || "").trim()
  const roleValue = String(session.role || "").trim()
  const statusValue = String(session.status || "").trim()
  const validStatus = statusValue === "Invited" || statusValue === "Active" || statusValue === "Locked" ? statusValue : "Active"
  if (!loginAccount || !name || !roleValue) return null

  return {
    loginAccount,
    name,
    role: roleValue,
    status: validStatus,
    linkedTalentProfileId: String(session.linkedTalentProfileId || "").trim() || undefined,
    avatarUrl: String(session.avatarUrl || "").trim() || undefined,
    loggedInAt: String(session.loggedInAt || "").trim() || new Date().toISOString(),
  }
}
