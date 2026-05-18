"use client"
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react"
import type { TalentProfileRecord } from "@/types/talent-pool"
import { canManageTalentLibrary, normalizeCurrentUser, readCurrentUser } from "@/lib/currentUser"
import {
  EDUCATION_OPTIONS,
  LANGUAGE_OPTIONS,
  PROFESSIONAL_DOMAIN_OPTIONS,
  SKILL_TASK_TYPE_OPTIONS,
} from "@/lib/talentProfileOptions"

type ViewMode = "card" | "table"

function initials(name = "") {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return "U"
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function toDateKey(value = "") {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toDateString()
}

function formatDateTime(value = "") {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "—"
  const pad = (input: number) => String(input).padStart(2, "0")
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(
    parsed.getMinutes(),
  )}`
}

const clampTwoLinesStyle = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: 2,
  overflow: "hidden",
}

function TalentField({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">{label}</div>
      <div className="mt-1 break-words text-sm font-medium leading-5 text-[#111827]">{value || "—"}</div>
    </div>
  )
}

function TalentAvatar({
  avatarUrl,
  candidateName,
  className,
  imageClassName = "h-full w-full object-cover",
}: {
  avatarUrl: string
  candidateName: string
  className: string
  imageClassName?: string
}) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState("")
  const avatar = String(avatarUrl || "").trim()
  const failed = Boolean(avatar && failedAvatarUrl === avatar)

  return (
    <div className={className}>
      {avatar && !failed ? (
        <img
          src={avatar}
          alt={candidateName || "Talent avatar"}
          className={imageClassName}
          onError={() => setFailedAvatarUrl(avatar)}
        />
      ) : (
        initials(candidateName)
      )}
    </div>
  )
}

function TalentOptionField({
  label,
  value,
  onChange,
  options,
  placeholder,
  listId,
  wide = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  placeholder: string
  listId: string
  wide?: boolean
}) {
  return (
    <label className={wide ? "block sm:col-span-2" : "block"}>
      <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">{label}</span>
      <input
        className="mt-1 w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        list={listId}
        autoComplete="off"
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  )
}

function formatProfileStatus(value = "") {
  const normalized = String(value || "").trim().toLowerCase()
  if (!normalized) return "—"
  if (normalized === "submitted") return "Submitted"
  if (normalized === "deleted") return "Deleted"
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

export function TalentLibraryPage({ initialProfiles }: { initialProfiles: TalentProfileRecord[] }) {
  const [profiles, setProfiles] = useState<TalentProfileRecord[]>(
    () => initialProfiles.filter((profile) => profile.status !== "deleted"),
  )
  const rawCurrentUser = readCurrentUser()
  const currentUser = normalizeCurrentUser({
    ...rawCurrentUser,
    role: "super_admin",
    permissions: Array.from(new Set([...(rawCurrentUser.permissions || []), "talent_library:view", "talent_library:manage"])),
  })
  const canManage = canManageTalentLibrary(currentUser)
  const [search, setSearch] = useState("")
  const [language, setLanguage] = useState("")
  const [skill, setSkill] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [actionStatus, setActionStatus] = useState("")
  const [editDraft, setEditDraft] = useState<TalentProfileRecord | null>(null)
  const [editError, setEditError] = useState("")
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "card"
    return (window.localStorage.getItem("blackdogTalentLibraryViewMode") as ViewMode) || "card"
  })

  const activeProfiles = useMemo(() => profiles.filter((profile) => profile.status !== "deleted"), [profiles])
  const sortedProfiles = useMemo(
    () =>
      [...activeProfiles].sort(
        (a, b) => new Date(b.submittedAt || b.createdAt || 0).getTime() - new Date(a.submittedAt || a.createdAt || 0).getTime(),
      ),
    [activeProfiles],
  )

  const languageOptions = useMemo(() => {
    const values = new Set(sortedProfiles.flatMap((profile) => [profile.nativeLanguage, profile.secondLanguage]).filter(Boolean))
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [sortedProfiles])

  const skillOptions = useMemo(() => {
    const values = new Set(sortedProfiles.map((profile) => profile.mainSkill).filter(Boolean))
    return Array.from(values).sort((a, b) => a.localeCompare(b))
  }, [sortedProfiles])

  const stats = useMemo(() => {
    const todayKey = new Date().toDateString()
    const languageSet = new Set<string>()

    sortedProfiles.forEach((profile) => {
      ;[profile.nativeLanguage, profile.secondLanguage].forEach((value) => {
        const text = String(value || "").trim()
        if (text) languageSet.add(text)
      })
    })

    const newToday = sortedProfiles.filter((profile) => {
      const submittedKey = toDateKey(profile.submittedAt || profile.createdAt || "")
      return submittedKey === todayKey
    }).length

    return {
      totalProfiles: sortedProfiles.length,
      newToday,
      coveredLanguages: languageSet.size,
    }
  }, [sortedProfiles])

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase()
    return sortedProfiles.filter((profile) => {
      const matchesSearch =
        !query ||
        [profile.candidateName, profile.nativeLanguage, profile.secondLanguage, profile.mainSkill]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      const matchesLanguage = !language || profile.nativeLanguage === language
      const matchesSkill = !skill || profile.mainSkill === skill
      return matchesSearch && matchesLanguage && matchesSkill
    })
  }, [sortedProfiles, search, language, skill])

  const visibleIds = useMemo(() => filteredProfiles.map((profile) => profile.talentId), [filteredProfiles])
  const selectedVisibleIds = selectedIds.filter((id) => visibleIds.includes(id))
  const selectedCount = selectedVisibleIds.length
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedVisibleIds.includes(id))
  const someVisibleSelected = selectedVisibleIds.length > 0 && !allVisibleSelected

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("blackdogTalentLibraryViewMode", viewMode)
    }
  }, [viewMode])

  useEffect(() => {
    if (!pendingDeleteIds.length) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        setPendingDeleteIds([])
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isDeleting, pendingDeleteIds.length])

  function toggleRowSelection(talentId: string) {
    setSelectedIds((current) =>
      current.includes(talentId) ? current.filter((id) => id !== talentId) : [...current, talentId],
    )
  }

  function toggleAllVisible(nextChecked: boolean) {
    setSelectedIds((current) => {
      const remaining = current.filter((id) => !visibleIds.includes(id))
      return nextChecked ? [...new Set([...remaining, ...visibleIds])] : remaining
    })
  }

  function requestDeleteTalentIds(talentIds: string[]) {
    if (!canManage) return
    const ids = Array.from(new Set(talentIds.filter(Boolean)))
    if (!ids.length) {
      setActionStatus("Please select at least one talent profile.")
      return
    }
    setPendingDeleteIds(ids)
  }

  async function confirmDeleteTalentIds() {
    if (!canManage || !pendingDeleteIds.length) return
    const talentIds = pendingDeleteIds
    setIsDeleting(true)
    setActionStatus("Deleting...")
    try {
      const response = await fetch("/api/talent-pool/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          talentIds,
          deletedById: currentUser.id,
          deletedByName: currentUser.name,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || data.ok === false) {
        throw new Error(data.error || `Delete failed: ${response.status}`)
      }

      setProfiles((current) => current.filter((profile) => !talentIds.includes(profile.talentId)))
      setSelectedIds((current) => current.filter((id) => !talentIds.includes(id)))
      setPendingDeleteIds([])
      setActionStatus(`Deleted ${data.deletedCount || talentIds.length} profile${(data.deletedCount || talentIds.length) > 1 ? "s" : ""}.`)
    } catch (error) {
      console.error("[BlackDog] talent library delete failed", error)
      setActionStatus("Delete failed.")
    } finally {
      setIsDeleting(false)
    }
  }

  function openEditProfile(profile: TalentProfileRecord) {
    setEditDraft({ ...profile })
    setEditError("")
  }

  function closeEditProfile() {
    setEditDraft(null)
    setEditError("")
  }

  function updateEditDraft(field: keyof TalentProfileRecord, value: string) {
    setEditDraft((current) => {
      if (!current) return current
      return {
        ...current,
        [field]: value,
      }
    })
  }

  async function saveEditedProfile() {
    if (!editDraft) return

    const candidateName = editDraft.candidateName.trim()
    if (!candidateName) {
      setEditError("Candidate Name is required.")
      return
    }

    setEditError("")
    setActionStatus("Saving profile...")

    try {
      const response = await fetch("/api/talent-pool/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          talentId: editDraft.talentId,
          candidateName: candidateName,
          avatarUrl: editDraft.avatarUrl,
          education: editDraft.education,
          professionalDomain: editDraft.professionalDomain,
          upworkChatUrl: editDraft.upworkChatUrl,
          profileUrl: editDraft.profileUrl,
          nativeLanguage: editDraft.nativeLanguage,
          secondLanguage: editDraft.secondLanguage,
          mainSkill: editDraft.mainSkill,
          experienceSummary: editDraft.experienceSummary,
          dailyAvailability: editDraft.dailyAvailability,
          weekendAvailability: editDraft.weekendAvailability,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || data.ok === false) {
        throw new Error(data.error || `Save failed: ${response.status}`)
      }

      const updatedProfile = data.talentProfile as TalentProfileRecord
      setProfiles((current) => current.map((profile) => (profile.talentId === updatedProfile.talentId ? updatedProfile : profile)))
      setEditDraft(updatedProfile)
      setActionStatus(`Updated ${updatedProfile.candidateName}.`)
      closeEditProfile()
    } catch (error) {
      console.error("[BlackDog] talent library edit failed", error)
      setEditError(error instanceof Error ? error.message : "Save failed.")
      setActionStatus("Save failed.")
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f3ed] pb-24 pt-8 text-[#111827]">
      <div className="page-shell">
        <h1 className="text-3xl font-black tracking-tight">BlackDog Talent Museum</h1>
        <p className="mt-2 text-sm text-[#6f6256]">Submitted candidate profiles for admin review.</p>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[#d7dccf] bg-white p-5 shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f6256]">Total Profiles</div>
            <div className="mt-2 text-4xl font-black tabular-nums text-[#111827]">{stats.totalProfiles}</div>
          </div>
          <div className="rounded-xl border border-[#d7dccf] bg-white p-5 shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f6256]">New Today</div>
            <div className="mt-2 text-4xl font-black tabular-nums text-[#1f5c43]">{stats.newToday}</div>
          </div>
          <div className="rounded-xl border border-[#d7dccf] bg-white p-5 shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f6256]">Covered Languages</div>
            <div className="mt-2 text-4xl font-black tabular-nums text-[#5f6f3a]">{stats.coveredLanguages}</div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-[#d7dccf] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(31,41,51,0.07)]">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-3">
                <label className="block w-full sm:w-[340px] lg:w-[380px]">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f6256]">Search</div>
                  <input
                    className="h-10 w-full rounded-md border border-[#d7dde2] bg-[#fffdf8] px-3 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search candidate"
                  />
                </label>
                <label className="block w-full sm:w-[230px]">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f6256]">Native Language</div>
                  <select
                    className="h-10 w-full rounded-md border border-[#d7dde2] bg-[#fffdf8] px-3 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                  >
                    <option value="">All</option>
                    {languageOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block w-full sm:w-[230px]">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f6256]">Skill</div>
                  <select
                    className="h-10 w-full rounded-md border border-[#d7dde2] bg-[#fffdf8] px-3 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
                    value={skill}
                    onChange={(event) => setSkill(event.target.value)}
                  >
                    <option value="">All</option>
                    {skillOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#e4d7c6] bg-[#fbfaf6] px-3 py-1.5 text-xs font-bold text-[#6f6256]">
                  {selectedCount ? `${selectedCount} selected` : `${filteredProfiles.length} shown`}
                </span>
                <div className="inline-flex rounded-lg border border-[#d7dccf] bg-[#fbfaf6] p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("card")}
                    className={
                      viewMode === "card"
                        ? "rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)]"
                        : "rounded-md border border-transparent px-3 py-1.5 text-xs font-semibold text-[#374151] hover:bg-white hover:text-[#1f5c43]"
                    }
                  >
                    Card View
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={
                      viewMode === "table"
                        ? "rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)]"
                        : "rounded-md border border-transparent px-3 py-1.5 text-xs font-semibold text-[#374151] hover:bg-white hover:text-[#1f5c43]"
                    }
                  >
                    Table View
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#efe6d8] pt-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#6f6256]">
                <input
                  type="checkbox"
                  aria-label="Select all visible profiles"
                  checked={allVisibleSelected}
                  ref={(node) => {
                    if (node) node.indeterminate = someVisibleSelected
                  }}
                  onChange={(event) => toggleAllVisible(event.target.checked)}
                />
                <span>Select all visible</span>
              </label>
              {canManage ? (
                <button
                  type="button"
                  className="rounded-md border border-[#c58d65] bg-[#fff7ef] px-3 py-1.5 text-xs font-semibold text-[#a15c2e] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!selectedVisibleIds.length}
                  onClick={() => requestDeleteTalentIds(selectedVisibleIds)}
                >
                  Delete Selected
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {actionStatus ? (
          <div className="mt-4 rounded-md border border-[#d7dde2] bg-white px-4 py-3 text-sm text-[#374151] shadow-[0_8px_20px_rgba(31,41,51,0.06)]">
            {actionStatus}
          </div>
        ) : null}

        <section className="mt-6">
          {viewMode === "card" ? (
            filteredProfiles.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProfiles.map((profile, index) => {
                  const selected = selectedIds.includes(profile.talentId)
                  const avatarUrl = profile.avatarUrl || ""
                  const submittedAt = formatDateTime(profile.submittedAt || profile.createdAt || "")
                  return (
                    <article
                      key={profile.talentId}
                      className={`flex h-full flex-col rounded-2xl border border-[#d7dccf] bg-white p-5 shadow-[0_12px_28px_rgba(31,41,51,0.08)] ${
                        selected ? "ring-2 ring-[#1f5c43]" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6256]">
                          <input
                            type="checkbox"
                            aria-label={`Select ${profile.candidateName}`}
                            checked={selected}
                            onChange={() => toggleRowSelection(profile.talentId)}
                          />
                          <span>Select</span>
                        </label>
                        <div className="rounded-full border border-[#ebe3d6] bg-[#fbfaf6] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#6f6256]">
                          No. {index + 1}
                        </div>
                      </div>

                      <div className="mt-4 flex items-start gap-3">
                        <TalentAvatar
                          avatarUrl={avatarUrl}
                          candidateName={profile.candidateName}
                          className="flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-full bg-[#eef4ee] text-base font-black text-[#1f5c43]"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="overflow-hidden text-lg font-bold leading-6 text-[#111827]" style={clampTwoLinesStyle}>
                            {profile.candidateName}
                          </h3>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <TalentField label="Native Language" value={profile.nativeLanguage} />
                        <TalentField label="Second Language" value={profile.secondLanguage} />
                        <TalentField label="Skill" value={profile.mainSkill} wide />
                        <TalentField label="Daily Availability" value={profile.dailyAvailability} />
                        <TalentField label="Weekend Availability" value={profile.weekendAvailability} />
                        <TalentField label="Submitted By" value={profile.submittedByHrName || "—"} />
                        <TalentField label="Submitted At" value={submittedAt} />
                      </div>

                      <div className="mt-auto pt-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center rounded-md border border-[#1f5c43] bg-[#f4faf5] px-3 py-2 text-xs font-semibold text-[#1f5c43] hover:bg-[#e9f4eb]"
                            onClick={() => openEditProfile(profile)}
                          >
                            Edit
                          </button>
                          {profile.upworkChatUrl ? (
                            <a
                              href={profile.upworkChatUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-2 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)]"
                            >
                              Open Chat
                            </a>
                          ) : (
                            <span className="inline-flex items-center rounded-md border border-[#d7dde2] px-3 py-2 text-xs font-semibold text-[#6f6256]">
                              No Chat URL
                            </span>
                          )}
                          {profile.profilePdfFileUrl ? (
                            <a
                              href={profile.profilePdfFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-md border border-[#1f5c43] bg-white px-3 py-2 text-xs font-semibold text-[#1f5c43] hover:bg-[#f4efe2]"
                            >
                              Open PDF
                            </a>
                          ) : (
                            <span className="inline-flex items-center rounded-md border border-[#d7dde2] px-3 py-2 text-xs font-semibold text-[#6f6256]">
                              No PDF
                            </span>
                          )}
                          {canManage ? (
                            <button
                              type="button"
                              className="inline-flex items-center rounded-md border border-[#b7791f] bg-[#fbf4e7] px-3 py-2 text-xs font-semibold text-[#b7791f] hover:bg-[#f9edd5]"
                              onClick={() => requestDeleteTalentIds([profile.talentId])}
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#d7dccf] bg-white p-10 text-center text-[#6f6256] shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
                {search || language || skill ? "No profiles found." : "No talent profiles yet."}
              </div>
            )
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#d7dccf] bg-white shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
              <div className="scroll-x-panel">
                <table className="data-table min-w-[1180px]">
                  <thead>
                    <tr>
                      <th className="th-center w-14">
                        {canManage ? (
                          <input
                            type="checkbox"
                            aria-label="Select all visible profiles"
                            checked={allVisibleSelected}
                            ref={(node) => {
                              if (node) node.indeterminate = someVisibleSelected
                            }}
                            onChange={(event) => toggleAllVisible(event.target.checked)}
                          />
                        ) : null}
                      </th>
                      <th className="th-center w-16">No.</th>
                      <th className="th-left min-w-[220px]">Candidate</th>
                      <th className="th-left min-w-[150px]">Native Language</th>
                      <th className="th-left min-w-[150px]">Second Language</th>
                      <th className="th-left min-w-[150px]">Skill</th>
                      <th className="th-left min-w-[190px]">Availability</th>
                      <th className="th-center min-w-[190px]">Submitted</th>
                      <th className="th-center w-[240px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.length ? (
                      filteredProfiles.map((profile, index) => {
                        const selected = selectedIds.includes(profile.talentId)
                        const avatarUrl = profile.avatarUrl || ""
                        const submittedAt = formatDateTime(profile.submittedAt || profile.createdAt || "")
                        const availability = [profile.dailyAvailability, profile.weekendAvailability]
                          .filter(Boolean)
                          .join(" · ")
                        const submittedBy = [profile.submittedByHrName, submittedAt].filter(Boolean).join(" · ")
                        return (
                          <tr key={profile.talentId} className={`border-b border-[#eee7db] last:border-b-0 ${selected ? "bg-[#fbfaf6]" : ""}`}>
                            <td className="td-center">
                              {canManage ? (
                                <input
                                  type="checkbox"
                                  aria-label={`Select ${profile.candidateName}`}
                                  checked={selected}
                                  onChange={() => toggleRowSelection(profile.talentId)}
                                />
                              ) : null}
                            </td>
                            <td className="td-center font-semibold tabular-nums">{index + 1}</td>
                            <td className="td-left">
                              <div className="flex min-w-0 items-center gap-3">
                                <TalentAvatar
                                  avatarUrl={avatarUrl}
                                  candidateName={profile.candidateName}
                                  className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full bg-[#eef4ee] text-sm font-black text-[#1f5c43]"
                                />
                                <div className="min-w-0">
                                  <div className="line-clamp-2 font-semibold leading-5 text-[#111827]">{profile.candidateName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="td-left text-[#374151]">{profile.nativeLanguage || "—"}</td>
                            <td className="td-left text-[#374151]">{profile.secondLanguage || "—"}</td>
                            <td className="td-left text-[#374151]">{profile.mainSkill || "—"}</td>
                            <td className="td-left text-[#374151]">{availability || "—"}</td>
                            <td className="td-center text-[#374151]">{submittedBy || "—"}</td>
                            <td className="td-actions">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  className="rounded-md border border-[#1f5c43] bg-[#f4faf5] px-3 py-1.5 text-xs font-semibold text-[#1f5c43] hover:bg-[#e9f4eb]"
                                  onClick={() => openEditProfile(profile)}
                                >
                                  Edit
                                </button>
                                {profile.upworkChatUrl ? (
                                  <a
                                    href={profile.upworkChatUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)]"
                                  >
                                    Open Chat
                                  </a>
                                ) : null}
                                {profile.profilePdfFileUrl ? (
                                  <a
                                    href={profile.profilePdfFileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-md border border-[#1f5c43] bg-white px-3 py-1.5 text-xs font-semibold text-[#1f5c43] hover:bg-[#f4efe2]"
                                  >
                                    Open PDF
                                  </a>
                                ) : null}
                                {canManage ? (
                                  <button
                                    type="button"
                                    className="rounded-md border border-[#b7791f] bg-[#fbf4e7] px-3 py-1.5 text-xs font-semibold text-[#b7791f] hover:bg-[#f9edd5]"
                                    onClick={() => requestDeleteTalentIds([profile.talentId])}
                                  >
                                    Delete
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-[#6f6256]">
                          {search || language || skill ? "No profiles found." : "No talent profiles yet."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {editDraft ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <button
            type="button"
            className="absolute inset-0 z-0 cursor-default"
            aria-label="Close talent profile editor"
            onClick={closeEditProfile}
          />
          <aside className="relative z-10 flex h-full w-full max-w-5xl flex-col overflow-hidden border-l border-[#d7dccf] bg-[#f6f3ed] shadow-[0_24px_60px_rgba(17,24,39,0.28)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#e8e0d2] bg-white px-6 py-5">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f6256]">Edit Profile</div>
                <h2 className="mt-2 text-2xl font-black text-[#111827]">{editDraft.candidateName || "Talent Profile"}</h2>
                <p className="mt-1 text-sm text-[#6f6256]">Update the submitted talent profile record.</p>
              </div>
              <button
                type="button"
                onClick={closeEditProfile}
                className="rounded-md border border-[#d7dccf] bg-[#fffdf8] px-3 py-2 text-sm font-semibold text-[#40372f]"
              >
                Close
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 xl:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)]">
              <div className="border-b border-[#e8e0d2] bg-[#fbfaf6] p-6 xl:border-b-0 xl:border-r">
                <div className="rounded-xl border border-[#e4dbc9] bg-white p-4 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 rounded-2xl border border-[#e1d5c6] bg-[#f8f5ec] p-2">
                      <TalentAvatar
                        avatarUrl={editDraft.avatarUrl}
                        candidateName={editDraft.candidateName}
                        className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-[#eef4ee] text-2xl font-black text-[#1f5c43]"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f5c43]">Talent Profile Preview</div>
                      <div className="mt-2 text-xl font-black text-[#111827]">{editDraft.candidateName || "No candidate name"}</div>
                      <div className="mt-1 text-xs text-[#6f6256]">{editDraft.talentId}</div>
                      <div className="mt-3 grid gap-2 text-sm text-[#374151]">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[#6f6256]">Native Language</span>
                          <span className="font-semibold text-[#111827]">{editDraft.nativeLanguage || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[#6f6256]">Skill</span>
                          <span className="font-semibold text-[#111827]">{editDraft.mainSkill || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[#6f6256]">Profile Status</span>
                          <span className="inline-flex rounded-full border border-[#d7dccf] bg-[#fffdf8] px-2 py-0.5 text-[11px] font-semibold text-[#40372f]">
                            {formatProfileStatus(editDraft.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="scroll-panel p-6">
                <div className="space-y-5">
                  {editError ? (
                    <div className="rounded-xl border border-[#f5c2c7] bg-[#fdecec] px-4 py-3 text-sm text-[#b42318]">
                      {editError}
                    </div>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Candidate Name</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none"
                        value={editDraft.candidateName}
                        onChange={(event) => updateEditDraft("candidateName", event.target.value)}
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Avatar URL</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none"
                        value={editDraft.avatarUrl}
                        onChange={(event) => updateEditDraft("avatarUrl", event.target.value)}
                        placeholder="https://..."
                      />
                    </label>
                    <TalentOptionField
                      label="Native Language"
                      value={editDraft.nativeLanguage}
                      onChange={(value) => updateEditDraft("nativeLanguage", value)}
                      options={LANGUAGE_OPTIONS}
                      placeholder="Search or select native language"
                      listId="talent-library-native-language-options"
                    />
                    <TalentOptionField
                      label="Second Language"
                      value={editDraft.secondLanguage}
                      onChange={(value) => updateEditDraft("secondLanguage", value)}
                      options={LANGUAGE_OPTIONS}
                      placeholder="Search or select second language"
                      listId="talent-library-second-language-options"
                    />
                    <TalentOptionField
                      label="Education"
                      value={editDraft.education}
                      onChange={(value) => updateEditDraft("education", value)}
                      options={EDUCATION_OPTIONS}
                      placeholder="Search or select education"
                      listId="talent-library-education-options"
                    />
                    <TalentOptionField
                      label="Professional Domain"
                      value={editDraft.professionalDomain}
                      onChange={(value) => updateEditDraft("professionalDomain", value)}
                      options={PROFESSIONAL_DOMAIN_OPTIONS}
                      placeholder="Search or select domain"
                      listId="talent-library-professional-domain-options"
                    />
                    <TalentOptionField
                      label="Skill / Task Type"
                      value={editDraft.mainSkill}
                      onChange={(value) => updateEditDraft("mainSkill", value)}
                      options={SKILL_TASK_TYPE_OPTIONS}
                      placeholder="Search or select skill / task type"
                      listId="talent-library-skill-options"
                      wide
                    />
                    <label className="block sm:col-span-2">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Experience Summary</span>
                      <textarea
                        className="mt-1 min-h-28 w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none"
                        value={editDraft.experienceSummary}
                        onChange={(event) => updateEditDraft("experienceSummary", event.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Daily Availability</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none"
                        value={editDraft.dailyAvailability}
                        onChange={(event) => updateEditDraft("dailyAvailability", event.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Weekend Availability</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none"
                        value={editDraft.weekendAvailability}
                        onChange={(event) => updateEditDraft("weekendAvailability", event.target.value)}
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Upwork Chat URL</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none"
                        value={editDraft.upworkChatUrl}
                        onChange={(event) => updateEditDraft("upworkChatUrl", event.target.value)}
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Upwork Profile URL</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none"
                        value={editDraft.profileUrl}
                        onChange={(event) => updateEditDraft("profileUrl", event.target.value)}
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={saveEditedProfile}
                      className="inline-flex items-center rounded-md border border-[#0f9d58] bg-[#0f9d58] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)] hover:bg-[#0d8b4f]"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={closeEditProfile}
                      className="inline-flex items-center rounded-md border border-[#6b7280] bg-[#6b7280] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5b6170]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
      {pendingDeleteIds.length ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeleting) {
              setPendingDeleteIds([])
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={pendingDeleteIds.length > 1 ? "Delete selected talent profiles?" : "Delete talent profile?"}
            className="w-full max-w-lg rounded-3xl border border-[#eadfcd] bg-[#fbfaf6] p-6 shadow-[0_24px_70px_rgba(17,24,39,0.28)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-black text-[#111827]">
                  {pendingDeleteIds.length > 1 ? "Delete selected talent profiles?" : "Delete talent profile?"}
                </div>
                <p className="mt-3 text-sm leading-6 text-[#6f6256]">
                  {pendingDeleteIds.length > 1
                    ? `Are you sure you want to delete ${pendingDeleteIds.length} selected talent profiles? This action cannot be undone.`
                    : "Are you sure you want to delete this talent profile? This action cannot be undone."}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                disabled={isDeleting}
                onClick={() => setPendingDeleteIds([])}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d7cec0] bg-white text-lg font-semibold text-[#4b5563] transition hover:bg-[#f4efe2] disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPendingDeleteIds([])}
                className="inline-flex h-10 items-center justify-center rounded-md border border-[#d7cec0] bg-white px-4 text-sm font-semibold text-[#4b5563] transition hover:bg-[#f4efe2] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void confirmDeleteTalentIds()}
                className="inline-flex h-10 items-center justify-center rounded-md border border-[#b42318] bg-[#b42318] px-4 text-sm font-semibold text-white transition hover:bg-[#981f14] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting
                  ? "Deleting..."
                  : pendingDeleteIds.length > 1
                    ? `Delete ${pendingDeleteIds.length} profiles`
                    : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
