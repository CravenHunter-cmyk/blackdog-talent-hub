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
  }) {
    const loggedInAt = new Date().toISOString()
    const session = {
      loginAccount: user.loginAccount,
      name: user.name,
      role: user.role,
      status: user.status,
      linkedTalentProfileId: user.linkedTalentProfileId,
      avatarUrl: user.avatarUrl,
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
      }),
    )
    window.localStorage.setItem(
      STORAGE_KEYS.currentUserLegacyV1,
      JSON.stringify({
        id: user.loginAccount,
        name: user.name,
        role: user.role === "Super Admin" ? "super_admin" : user.role === "HR User" ? "hr" : "talent",
        permissions: [],
      }),
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanedAccount = normalize(account)
    const cleanedPassword = normalize(password)
    const cleanedCode = normalize(verificationCode)

    if (!cleanedAccount) {
      setFormError("Please enter your account.")
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

    const user = findAccountByLogin(cleanedAccount)
    if (!user) {
      setFormError("Account or password is incorrect.")
      return
    }

    if (user.status === "Locked") {
      setFormError("This account is locked. Please contact an administrator.")
      return
    }

    if (user.password !== cleanedPassword) {
      setFormError("Account or password is incorrect.")
      return
    }

    setLoading(true)
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
      } as {
        loginAccount: string
        name: string
        role: MockAccountRole
        status: MockAccountStatus
        linkedTalentProfileId?: string
        avatarUrl?: string
      }
      persistSession(nextUser)
      router.replace(roleToRedirect(nextUser.role))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f3ed] px-6 py-10 text-[#111827]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <section className="w-full max-w-xl rounded-2xl border border-[#d7dccf] bg-white p-8 shadow-[0_18px_50px_rgba(31,41,51,0.12)]">
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
                placeholder="Enter your account"
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
              <div className="font-semibold text-[#40372f]">Mock accounts</div>
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
