"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import {
  findAccountByLogin,
  updateStoredAccount,
} from "@/lib/localAccounts"
type MockAccountRole = "Super Admin" | "HR User" | "Talent"
type MockAccountStatus = "Invited" | "Active" | "Locked"

const STORAGE_KEYS = {
  currentUser: "blackdog_current_user",
  currentUserLegacy: "blackdogCurrentUser",
  currentUserLegacyV1: "blackdogCurrentUserV1",
}

function normalize(value = "") {
  return String(value || "").trim()
}

function randomCaptcha(length = 4) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

function roleToRedirect(role: MockAccountRole) {
  if (role === "Super Admin") return "/users-permissions"
  if (role === "HR User") return "/recruiting"
  return "/talent-messages"
}

export function LoginPage() {
  const router = useRouter()
  const [account, setAccount] = useState("")
  const [password, setPassword] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [captcha, setCaptcha] = useState(() => randomCaptcha())
  const [formError, setFormError] = useState("")
  const [loading, setLoading] = useState(false)

  function refreshCaptcha() {
    setCaptcha(randomCaptcha())
    setVerificationCode("")
  }

  function persistSession(user: {
    loginAccount: string
    name: string
    role: MockAccountRole
    status: MockAccountStatus
    linkedTalentProfileId?: string
    avatarUrl?: string
    toolPermissions?: Record<string, boolean>
  }) {
    const loggedInAt = new Date().toISOString()
    const session = {
      loginAccount: user.loginAccount,
      name: user.name,
      role: user.role,
      status: user.status,
      linkedTalentProfileId: user.linkedTalentProfileId,
      avatarUrl: user.avatarUrl,
      toolPermissions: user.toolPermissions || {},
      loggedInAt,
    }

    window.localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(session))
    window.localStorage.setItem(
      STORAGE_KEYS.currentUserLegacy,
      JSON.stringify({
        id: user.loginAccount,
        name: user.name,
        role: user.role === "Super Admin" ? "super_admin" : user.role === "HR User" ? "hr" : "talent",
        permissions: [],
        toolPermissions: user.toolPermissions || {},
      }),
    )
    window.localStorage.setItem(
      STORAGE_KEYS.currentUserLegacyV1,
      JSON.stringify({
        id: user.loginAccount,
        name: user.name,
        role: user.role === "Super Admin" ? "super_admin" : user.role === "HR User" ? "hr" : "talent",
        permissions: [],
        toolPermissions: user.toolPermissions || {},
      }),
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanedAccount = normalize(account)
    const cleanedPassword = normalize(password)
    const cleanedCode = normalize(verificationCode)

    if (!cleanedAccount) {
      setFormError("Please enter your email or login account.")
      return
    }
    if (!cleanedPassword) {
      setFormError("Please enter your password.")
      return
    }
    if (!cleanedCode) {
      setFormError("Please enter the verification code.")
      return
    }
    if (cleanedCode.toLowerCase() !== captcha.toLowerCase()) {
      setFormError("Verification code is incorrect.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginAccount: cleanedAccount, password: cleanedPassword }),
      });
      if (response.ok) {
        const payload = await response.json() as { user: { loginAccount: string; name: string; role: MockAccountRole; status: MockAccountStatus; toolPermissions?: Record<string, boolean> } };
        persistSession(payload.user);
        router.replace(roleToRedirect(payload.user.role));
        return;
      }
      if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        const payload = await response.json().catch(() => ({ error: "Account or password is incorrect." })) as { error?: string };
        setFormError(payload.error || "Account or password is incorrect.");
        setLoading(false);
        return;
      }
    } catch {
      if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        setFormError("Unable to sign in.");
        setLoading(false);
        return;
      }
    }

    const user = findAccountByLogin(cleanedAccount)
    if (!user) {
      setFormError("Account or password is incorrect.")
      setLoading(false)
      return
    }

    if (user.status === "Locked") {
      setFormError("This account is locked. Please contact an administrator.")
      setLoading(false)
      return
    }

    if (user.password !== cleanedPassword) {
      setFormError("Account or password is incorrect.")
      setLoading(false)
      return
    }

    try {
      if (user.status === "Invited") {
        updateStoredAccount(user.accountId, { status: "Active", lastLogin: new Date().toISOString() })
      } else {
        updateStoredAccount(user.accountId, { lastLogin: new Date().toISOString() })
      }

      const nextUser = {
        loginAccount: user.loginAccount,
        name: user.name,
        role: user.role === "super_admin" ? "Super Admin" : user.role === "hr_user" ? "HR User" : "Talent",
        status: user.status === "Invited" ? "Active" : user.status,
        linkedTalentProfileId: user.linkedTalentProfileId,
        avatarUrl: user.avatarUrl,
        toolPermissions: user.toolPermissions || {},
      } as {
        loginAccount: string
        name: string
        role: MockAccountRole
        status: MockAccountStatus
        linkedTalentProfileId?: string
        avatarUrl?: string
        toolPermissions?: Record<string, boolean>
      }
      persistSession(nextUser)
      router.replace(roleToRedirect(nextUser.role))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_center,rgba(31,92,67,0.08),transparent_34%),linear-gradient(180deg,#f8f3ea_0%,#efe6d8_100%)] px-6 pb-20 pt-[clamp(80px,12vh,140px)] text-[#111827]">
      <div className="mx-auto flex max-w-6xl justify-center">
        <section className="w-full max-w-xl rounded-[28px] border border-[#d7dccf] bg-white p-9 shadow-[0_24px_70px_rgba(31,41,51,0.16)]">
          <div className="text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1f5c43]">BlackDog Talent Hub</div>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Sign in</h1>
            <p className="mt-2 text-sm text-[#6f6256]">
              Sign in to manage recruiting, talent profiles, messages, and delivery tasks.
            </p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Login Account</span>
              <input
                className="mt-1 w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-3 text-sm outline-none focus:border-[#1f5c43]"
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                placeholder="Email or Login Account"
                autoComplete="username"
              />
            </label>

            <label className="block">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Password</span>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-3 text-sm outline-none focus:border-[#1f5c43]"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Verification Code</span>
                <input
                  className="mt-1 w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-3 text-sm outline-none focus:border-[#1f5c43]"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  placeholder="Enter verification code"
                  autoComplete="one-time-code"
                />
              </label>
              <div className="flex items-end gap-2">
              <div className="min-w-28 rounded-lg border border-[#d7dccf] bg-[#f8f4ea] px-4 py-3 text-center font-mono text-2xl font-black tracking-[0.18em] text-[#1f5c43]">
                {captcha}
              </div>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="rounded-md border border-[#d7dccf] bg-[#fffdf8] px-3 py-3 text-sm font-semibold text-[#40372f] hover:bg-[#f6f2e8]"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="text-xs text-[#6f6256]">Captcha comparison is case-insensitive.</div>

            {formError ? (
              <div className="rounded-xl border border-[#f5c2c7] bg-[#fdecec] px-4 py-3 text-sm text-[#b42318]">{formError}</div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-md border border-[#0f9d58] bg-[#0f9d58] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)] hover:bg-[#0d8b4f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Login"}
            </button>

            <div className="rounded-xl border border-[#e4dbc9] bg-[#fbfaf6] px-4 py-3 text-xs text-[#6f6256]">
              <div className="font-semibold text-[#40372f]">Test accounts</div>
              <div className="mt-1 leading-5">
                julie, hr_japan_01, tanchanok_pearl, nayara_ribeiro, locked_demo
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
