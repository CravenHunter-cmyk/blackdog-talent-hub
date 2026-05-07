export type AppRole = "super_admin" | "hr" | "viewer" | "talent"

export type AppUser = {
  id: string
  name: string
  role: AppRole
  permissions: string[]
}

export type LoggedInSession = {
  loginAccount: string
  name: string
  role: "Super Admin" | "HR User" | "Talent"
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

function normalizeList(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item || "").trim()).filter(Boolean) : []
}

function normalizeRole(value: unknown): AppRole {
  const input = String(value || "").trim().toLowerCase()
  if (input === "super_admin" || input === "super admin") return "super_admin"
  if (input === "hr" || input === "hr user" || input === "hr_user") return "hr"
  if (input === "talent") return "talent"
  return "viewer"
}

function readSessionObject(): Partial<LoggedInSession & AppUser> | null {
  if (typeof window === "undefined") return null

  const candidates = [
    window.localStorage.getItem("blackdog_current_user"),
    window.localStorage.getItem("blackdogCurrentUser"),
    window.localStorage.getItem("blackdogCurrentUserV1"),
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate as string) as Partial<LoggedInSession & AppUser>
      if (parsed && typeof parsed === "object") {
        return parsed
      }
    } catch {
      continue
    }
  }

  const globalUser = (window as Window & { __BLACKDOG_CURRENT_USER__?: Partial<LoggedInSession & AppUser> }).__BLACKDOG_CURRENT_USER__
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
  return normalized.role === "super_admin" || normalized.permissions.includes("talent_library:manage")
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

  const validRole = roleValue === "Super Admin" || roleValue === "HR User" || roleValue === "Talent" ? roleValue : "HR User"
  return {
    loginAccount,
    name,
    role: validRole,
    status: validStatus,
    linkedTalentProfileId: String(session.linkedTalentProfileId || "").trim() || undefined,
    avatarUrl: String(session.avatarUrl || "").trim() || undefined,
    loggedInAt: String(session.loggedInAt || "").trim() || new Date().toISOString(),
  }
}
