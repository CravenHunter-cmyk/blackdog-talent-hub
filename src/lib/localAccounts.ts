// Legacy/development compatibility layer for local account demos.
// New authentication, session, and permission work should use the DB-backed
// auth path in src/lib/auth/blackdogAuth.ts plus /api/auth/me, /api/auth/logout,
// and page-level AccessGate. Do not build new production authorization on this file.

export type LocalAccountRole = "super_admin" | "hr_user" | "talent"

export type LocalAccountStatus = "Invited" | "Active" | "Locked"

export type LocalAccount = {
  accountId: string
  loginAccount: string
  name: string
  role: LocalAccountRole
  status: LocalAccountStatus
  // Mock/local-only password storage for stage 1 login. Do not use this pattern in production.
  password: string
  linkedTalentProfileId?: string
  permissions: Record<string, boolean>
  toolPermissions?: Record<string, boolean>
  createdAt: string
  updatedAt: string
  lastLogin?: string
  email?: string
  notes?: string
  assignedTeams?: string[]
  avatarUrl?: string
}

const STORAGE_KEY = "blackdog_accounts"
const AUDIT_STORAGE_KEY = "blackdog_account_audit_logs"

export type LocalAccountAuditLog = {
  id: string
  action: "account_created" | "account_updated" | "tool_access_granted" | "tool_access_revoked" | "password_reset"
  actorId?: string
  actorEmail?: string
  targetAccountId: string
  targetEmail?: string
  toolId?: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  createdAt: string
}

function normalize(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim()
}

function normalizeLogin(value = "") {
  return normalize(value).toLowerCase()
}

function nowIso() {
  return new Date().toISOString()
}

function clonePermissions(value: Record<string, boolean> | undefined) {
  return value ? { ...value } : {}
}

export const DEFAULT_LOCAL_ACCOUNTS: LocalAccount[] = [
  {
    accountId: "acc-julie",
    loginAccount: "julie",
    name: "Julie Zhu",
    role: "super_admin",
    status: "Active",
    password: "123456",
    permissions: {},
    toolPermissions: {},
    createdAt: "2026-04-12T09:10:00.000Z",
    updatedAt: "2026-04-27T10:22:00.000Z",
    lastLogin: "2026-04-27T08:15:00.000Z",
    email: "julie@blackdog.tld",
    notes: "Owner of the main recruiting workspace.",
    assignedTeams: ["Global Operations", "Platform"],
  },
  {
    accountId: "acc-olivia",
    loginAccount: "hr_japan_01",
    name: "Olivia Chen",
    role: "hr_user",
    status: "Active",
    password: "123456",
    permissions: {},
    toolPermissions: {},
    createdAt: "2026-04-16T08:30:00.000Z",
    updatedAt: "2026-04-24T14:05:00.000Z",
    lastLogin: "2026-04-26T17:32:00.000Z",
    email: "olivia@blackdog.tld",
    notes: "HR coverage for Chinese and plugin submissions.",
    assignedTeams: ["Chinese Coverage", "Plugin Workflow"],
  },
  {
    accountId: "acc-tanchanok",
    loginAccount: "tanchanok_pearl",
    name: "Tanchanok Pearl",
    role: "talent",
    status: "Active",
    password: "123456",
    linkedTalentProfileId: "tal_tanchanok-pearl_b7e9e2143200",
    permissions: {},
    toolPermissions: {},
    createdAt: "2026-04-18T10:15:00.000Z",
    updatedAt: "2026-04-27T09:30:00.000Z",
    lastLogin: "2026-04-27T09:05:00.000Z",
    notes: "Talent account linked to the Thai evaluator profile.",
    assignedTeams: ["TikTok LLM Evaluation"],
  },
  {
    accountId: "acc-nayara",
    loginAccount: "nayara_ribeiro",
    name: "Nayara Ribeiro",
    role: "talent",
    status: "Invited",
    password: "123456",
    linkedTalentProfileId: "tal_nayara-ribeiro_preview",
    permissions: {},
    toolPermissions: {},
    createdAt: "2026-04-18T12:20:00.000Z",
    updatedAt: "2026-04-27T10:22:00.000Z",
    lastLogin: "2026-04-27T10:20:00.000Z",
    notes: "Talent account linked to the Chinese evaluator profile.",
    assignedTeams: ["Native LLM Evaluator Recruitment"],
  },
  {
    accountId: "acc-locked-demo",
    loginAccount: "locked_demo",
    name: "Locked Demo",
    role: "talent",
    status: "Locked",
    password: "123456",
    permissions: {},
    toolPermissions: {},
    createdAt: "2026-04-27T10:22:00.000Z",
    updatedAt: "2026-04-27T10:22:00.000Z",
    notes: "Locked mock account for login testing.",
    assignedTeams: [],
  },
]

function isValidStatus(value: unknown): value is LocalAccountStatus {
  return value === "Invited" || value === "Active" || value === "Locked"
}

function isValidRole(value: unknown): value is LocalAccountRole {
  return value === "super_admin" || value === "hr_user" || value === "talent"
}

function normalizeStoredAccount(record: Partial<LocalAccount> & { accountId?: string; id?: string }): LocalAccount | null {
  const accountId = normalize(record.accountId || record.id || "")
  const loginAccount = normalize(record.loginAccount || "")
  const name = normalize(record.name || "")
  const role = isValidRole(record.role) ? record.role : "hr_user"
  const status = isValidStatus(record.status) ? record.status : "Invited"
  const password = normalize(record.password || "")

  if (!accountId || !loginAccount || !name || !password) return null

  return {
    accountId,
    loginAccount,
    name,
    role,
    status,
    password,
    linkedTalentProfileId: normalize(record.linkedTalentProfileId || "") || undefined,
    permissions: clonePermissions(record.permissions),
    toolPermissions: clonePermissions(record.toolPermissions),
    createdAt: normalize(record.createdAt || nowIso()) || nowIso(),
    updatedAt: normalize(record.updatedAt || nowIso()) || nowIso(),
    lastLogin: normalize(record.lastLogin || "") || undefined,
    email: normalize(record.email || "") || undefined,
    notes: normalize(record.notes || "") || undefined,
    assignedTeams: Array.isArray(record.assignedTeams)
      ? record.assignedTeams.map((item) => normalize(item)).filter(Boolean)
      : [],
    avatarUrl: normalize(record.avatarUrl || "") || undefined,
  }
}

export function initializeDefaultAccounts() {
  return DEFAULT_LOCAL_ACCOUNTS.map((account) => ({
    ...account,
    permissions: clonePermissions(account.permissions),
    toolPermissions: clonePermissions(account.toolPermissions),
  }))
}

export function getStoredAccounts(): LocalAccount[] {
  if (typeof window === "undefined") return initializeDefaultAccounts()

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const defaults = initializeDefaultAccounts()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
    return defaults
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      const defaults = initializeDefaultAccounts()
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
      return defaults
    }

    const normalized = parsed
      .map((item) => normalizeStoredAccount(item as Partial<LocalAccount>))
      .filter((item): item is LocalAccount => Boolean(item))

    if (!normalized.length) {
      const defaults = initializeDefaultAccounts()
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
      return defaults
    }

    return normalized
  } catch {
    const defaults = initializeDefaultAccounts()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
    return defaults
  }
}

export function saveStoredAccounts(accounts: LocalAccount[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
}

export function appendLocalAccountAuditLogs(logs: LocalAccountAuditLog[]) {
  if (typeof window === "undefined" || !logs.length) return
  try {
    const existing = JSON.parse(window.localStorage.getItem(AUDIT_STORAGE_KEY) || "[]") as LocalAccountAuditLog[]
    window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([...logs, ...existing].slice(0, 500)))
  } catch {
    window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs.slice(0, 500)))
  }
}

export function findAccountByLogin(loginAccount: string) {
  const normalizedLogin = normalizeLogin(loginAccount)
  return getStoredAccounts().find((account) => normalizeLogin(account.loginAccount) === normalizedLogin) || null
}

export function updateStoredAccount(accountId: string, patch: Partial<LocalAccount>) {
  const next = getStoredAccounts()
  const index = next.findIndex((item) => item.accountId === accountId)
  if (index < 0) return null

  const updated: LocalAccount = {
    ...next[index],
    ...patch,
    accountId: next[index].accountId,
    loginAccount: patch.loginAccount !== undefined ? normalize(patch.loginAccount) : next[index].loginAccount,
    name: patch.name !== undefined ? normalize(patch.name) : next[index].name,
    role: isValidRole(patch.role) ? patch.role : next[index].role,
    status: isValidStatus(patch.status) ? patch.status : next[index].status,
    password: patch.password !== undefined ? normalize(patch.password) : next[index].password,
    linkedTalentProfileId:
      patch.linkedTalentProfileId !== undefined ? normalize(patch.linkedTalentProfileId) || undefined : next[index].linkedTalentProfileId,
    permissions: patch.permissions ? clonePermissions(patch.permissions) : clonePermissions(next[index].permissions),
    toolPermissions: patch.toolPermissions ? clonePermissions(patch.toolPermissions) : clonePermissions(next[index].toolPermissions),
    createdAt: patch.createdAt !== undefined ? normalize(patch.createdAt) : next[index].createdAt,
    updatedAt: patch.updatedAt !== undefined ? normalize(patch.updatedAt) : next[index].updatedAt,
    lastLogin: patch.lastLogin !== undefined ? normalize(patch.lastLogin) || undefined : next[index].lastLogin,
    email: patch.email !== undefined ? normalize(patch.email) || undefined : next[index].email,
    notes: patch.notes !== undefined ? normalize(patch.notes) || undefined : next[index].notes,
    assignedTeams: patch.assignedTeams !== undefined
      ? patch.assignedTeams.map((item) => normalize(item)).filter(Boolean)
      : next[index].assignedTeams || [],
    avatarUrl: patch.avatarUrl !== undefined ? normalize(patch.avatarUrl) || undefined : next[index].avatarUrl,
  }

  next[index] = updated
  saveStoredAccounts(next)
  return updated
}
