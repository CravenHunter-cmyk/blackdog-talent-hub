import crypto from "node:crypto"
import { spawn } from "node:child_process"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"

import type {
  HrSubmissionRecord,
  TalentPoolSubmissionPayload,
  TalentProfileRecord,
  CurrentUser,
} from "@/types/talent-pool"

export const CURRENT_MOCK_HR: CurrentUser = {
  id: "mock-hr-julie",
  name: "Julie Zhu",
  role: "hr",
}

export const TALENT_POOL_DATA_DIR = path.join(process.cwd(), "data", "talent-pool")
export const TALENT_POOL_PDF_DIR = path.join(process.cwd(), "public", "generated", "talent-profiles")
export const TALENT_PROFILES_PATH = path.join(TALENT_POOL_DATA_DIR, "talent-profiles.json")
export const HR_SUBMISSIONS_PATH = path.join(TALENT_POOL_DATA_DIR, "hr-submissions.json")

const writeQueues = new Map<string, Promise<void>>()

function safeName(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim()
}

function slugify(value = "") {
  return safeName(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function normalizeUrlKey(value = "") {
  const input = safeName(value)
  if (!input) return ""
  try {
    const url = new URL(input)
    url.hash = ""
    const removableParams = [
      "sidebar",
      "companyReference",
      "pageTitle",
      "ref",
      "source",
      "utm_source",
      "utm_medium",
      "utm_campaign",
    ]
    removableParams.forEach((key) => url.searchParams.delete(key))
    const query = url.searchParams.toString()
    return `${url.origin}${url.pathname}${query ? `?${query}` : ""}`
  } catch {
    return input
  }
}

function nowIso() {
  return new Date().toISOString()
}

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true })
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8")
    if (!raw.trim()) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

async function writeJsonFile(filePath: string, value: unknown) {
  await ensureDir(path.dirname(filePath))
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
  await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8")
  await fs.rename(tempPath, filePath)
}

async function queueFileWrite(filePath: string, task: () => Promise<void>) {
  const previous = writeQueues.get(filePath) || Promise.resolve()
  const next = previous
    .catch(() => null)
    .then(task)
    .finally(() => {
      if (writeQueues.get(filePath) === next) {
        writeQueues.delete(filePath)
      }
    })
  writeQueues.set(filePath, next)
  return next
}

export async function readTalentProfiles(): Promise<TalentProfileRecord[]> {
  const records = await readJsonFile<TalentProfileRecord[]>(TALENT_PROFILES_PATH, [])
  if (!Array.isArray(records)) return []
  return records.map((record) => {
    const legacyAvatarUrl = safeName(
      String(
        (record as TalentProfileRecord & {
          avatar?: string
          profileImage?: string
          imageUrl?: string
          photoUrl?: string
          candidateAvatar?: string
          candidateAvatarUrl?: string
        }).avatar ||
          (record as TalentProfileRecord & { profileImage?: string }).profileImage ||
          (record as TalentProfileRecord & { imageUrl?: string }).imageUrl ||
          (record as TalentProfileRecord & { photoUrl?: string }).photoUrl ||
          (record as TalentProfileRecord & { candidateAvatar?: string }).candidateAvatar ||
          (record as TalentProfileRecord & { candidateAvatarUrl?: string }).candidateAvatarUrl ||
          "",
      ),
    )
    return {
      ...record,
      avatarUrl: safeName(record.avatarUrl || legacyAvatarUrl),
    }
  })
}

export async function readHrSubmissions(): Promise<HrSubmissionRecord[]> {
  const records = await readJsonFile<HrSubmissionRecord[]>(HR_SUBMISSIONS_PATH, [])
  return Array.isArray(records) ? records : []
}

export async function writeTalentProfiles(records: TalentProfileRecord[]) {
  await queueFileWrite(TALENT_PROFILES_PATH, async () => {
    await writeJsonFile(TALENT_PROFILES_PATH, records)
  })
}

export async function writeHrSubmissions(records: HrSubmissionRecord[]) {
  await queueFileWrite(HR_SUBMISSIONS_PATH, async () => {
    await writeJsonFile(HR_SUBMISSIONS_PATH, records)
  })
}

function createTalentId(profile: TalentPoolSubmissionPayload) {
  const seed = normalizeUrlKey(profile.upworkChatUrl || "") || `${profile.candidateName}|${profile.submittedAt}`
  const digest = crypto.createHash("sha1").update(seed).digest("hex").slice(0, 12)
  const base = slugify(profile.candidateName || "candidate") || "candidate"
  return `tal_${base}_${digest}`
}

export async function upsertTalentProfile(profile: TalentPoolSubmissionPayload) {
  const records = await readTalentProfiles()
  const normalizedChatUrl = normalizeUrlKey(profile.upworkChatUrl || "")
  const now = nowIso()
  const existingIndex = records.findIndex((item) => normalizeUrlKey(item.upworkChatUrl || "") === normalizedChatUrl)
  const existing = existingIndex >= 0 ? records[existingIndex] : null
  const talentId = existing?.talentId || createTalentId(profile)
  const talentProfile: TalentProfileRecord = {
    talentId,
    sourcePlatform: "Upwork",
    candidateName: safeName(profile.candidateName || existing?.candidateName || "Unknown Candidate"),
    avatarUrl: safeName(profile.avatarUrl || existing?.avatarUrl || ""),
    education: safeName(profile.education || existing?.education || ""),
    professionalDomain: safeName(profile.professionalDomain || existing?.professionalDomain || ""),
    upworkChatUrl: safeName(profile.upworkChatUrl || existing?.upworkChatUrl || ""),
    profileUrl: safeName(profile.profileUrl || existing?.profileUrl || ""),
    nativeLanguage: safeName(profile.nativeLanguage || existing?.nativeLanguage || ""),
    secondLanguage: safeName(profile.secondLanguage || existing?.secondLanguage || ""),
    mainSkill: safeName(profile.mainSkill || existing?.mainSkill || ""),
    experienceSummary: safeName(profile.experienceSummary || existing?.experienceSummary || ""),
    dailyAvailability: safeName(profile.dailyAvailability || existing?.dailyAvailability || ""),
    weekendAvailability: safeName(profile.weekendAvailability || existing?.weekendAvailability || ""),
    email: safeName(profile.email || existing?.email || ""),
    onlineContactMethod: safeName(profile.onlineContactMethod || existing?.onlineContactMethod || "WhatsApp") || "WhatsApp",
    onlineContactAccount: safeName(profile.onlineContactAccount || existing?.onlineContactAccount || ""),
    submittedByHrId: safeName(profile.submittedByHrId || existing?.submittedByHrId || CURRENT_MOCK_HR.id) || CURRENT_MOCK_HR.id,
    submittedByHrName: safeName(profile.submittedByHrName || existing?.submittedByHrName || CURRENT_MOCK_HR.name) || CURRENT_MOCK_HR.name,
    submittedAt: safeName(profile.submittedAt || existing?.submittedAt || now) || now,
    status: "submitted",
    profilePdfFileUrl: safeName(existing?.profilePdfFileUrl || ""),
    profilePdfFilePath: safeName(existing?.profilePdfFilePath || ""),
    createdAt: safeName(existing?.createdAt || now) || now,
    updatedAt: now,
  }

  if (existingIndex >= 0) {
    records[existingIndex] = talentProfile
  } else {
    records.push(talentProfile)
  }

  await writeTalentProfiles(records)
  return { talentProfile, created: existingIndex < 0 }
}

export async function deleteTalentProfiles(
  talentIds: string[],
  deletedBy: { id: string; name: string } = CURRENT_MOCK_HR,
) {
  const ids = Array.from(new Set((talentIds || []).map((item) => safeName(item)).filter(Boolean)))
  if (!ids.length) {
    return { deletedCount: 0 }
  }

  const now = nowIso()
  const profiles = await readTalentProfiles()
  const updatedProfiles = profiles.map((profile) => {
    if (!ids.includes(profile.talentId)) return profile
    return {
      ...profile,
      status: "deleted" as const,
      deletedAt: now,
      deletedById: safeName(deletedBy.id || CURRENT_MOCK_HR.id) || CURRENT_MOCK_HR.id,
      deletedByName: safeName(deletedBy.name || CURRENT_MOCK_HR.name) || CURRENT_MOCK_HR.name,
      updatedAt: now,
    }
  })

  const deletedCount = updatedProfiles.filter((profile) => ids.includes(profile.talentId)).length
  const submissions = await readHrSubmissions()
  const remainingSubmissions = submissions.filter((entry) => !ids.includes(entry.talentId))

  await writeTalentProfiles(updatedProfiles)
  await writeHrSubmissions(remainingSubmissions)

  return { deletedCount }
}

export async function appendHrSubmission(record: HrSubmissionRecord) {
  const records = await readHrSubmissions()
  records.push(record)
  await writeHrSubmissions(records)
  return record
}

type TalentProfileUpdatePayload = {
  talentId: string
  candidateName?: string
  avatarUrl?: string
  education?: string
  professionalDomain?: string
  upworkChatUrl?: string
  profileUrl?: string
  nativeLanguage?: string
  secondLanguage?: string
  mainSkill?: string
  experienceSummary?: string
  dailyAvailability?: string
  weekendAvailability?: string
  email?: string
  onlineContactMethod?: string
  onlineContactAccount?: string
}

export async function updateTalentProfile(payload: TalentProfileUpdatePayload) {
  const talentId = safeName(payload.talentId)
  if (!talentId) {
    throw new Error("talentId is required.")
  }

  const records = await readTalentProfiles()
  const index = records.findIndex((profile) => profile.talentId === talentId && profile.status !== "deleted")
  if (index < 0) {
    throw new Error(`Talent profile not found: ${talentId}`)
  }

  const existing = records[index]
  const updated: TalentProfileRecord = {
    ...existing,
    candidateName: safeName(payload.candidateName || existing.candidateName),
    avatarUrl: safeName(payload.avatarUrl || existing.avatarUrl),
    education: safeName(payload.education || existing.education),
    professionalDomain: safeName(payload.professionalDomain || existing.professionalDomain),
    upworkChatUrl: safeName(payload.upworkChatUrl || existing.upworkChatUrl),
    profileUrl: safeName(payload.profileUrl || existing.profileUrl),
    nativeLanguage: safeName(payload.nativeLanguage || existing.nativeLanguage),
    secondLanguage: safeName(payload.secondLanguage || existing.secondLanguage),
    mainSkill: safeName(payload.mainSkill || existing.mainSkill),
    experienceSummary: safeName(payload.experienceSummary || existing.experienceSummary),
    dailyAvailability: safeName(payload.dailyAvailability || existing.dailyAvailability),
    weekendAvailability: safeName(payload.weekendAvailability || existing.weekendAvailability),
    email: safeName(payload.email || existing.email),
    onlineContactMethod: safeName(payload.onlineContactMethod || existing.onlineContactMethod || "WhatsApp") || "WhatsApp",
    onlineContactAccount: safeName(payload.onlineContactAccount || existing.onlineContactAccount),
    updatedAt: nowIso(),
  }

  records[index] = updated
  await writeTalentProfiles(records)

  const submissions = await readHrSubmissions()
  const updatedSubmissions = submissions.map((entry) =>
    entry.talentId === talentId
      ? {
          ...entry,
          candidateName: updated.candidateName,
          avatarUrl: updated.avatarUrl,
          nativeLanguage: updated.nativeLanguage,
          secondLanguage: updated.secondLanguage,
          upworkChatUrl: updated.upworkChatUrl,
        }
      : entry,
  )
  await writeHrSubmissions(updatedSubmissions)

  return updated
}

function escapeHtml(value = "") {
  return safeName(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function renderSection(title: string, rows: Array<{ label: string; value: string }>) {
  return `
    <section class="section">
      <div class="section-title">${escapeHtml(title)}</div>
      <div class="rows">
        ${rows
          .map(
            (row) => `
              <div class="row">
                <div class="label">${escapeHtml(row.label)}</div>
                <div class="value">${escapeHtml(row.value || "—")}</div>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>
  `
}

export function renderTalentProfilePdfHtml(profile: TalentProfileRecord) {
  const avatarUrl = safeName(profile.avatarUrl || "")
  const initials = safeName(profile.candidateName || "Unknown Candidate")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U"
  const submittedBy = safeName(profile.submittedByHrName || CURRENT_MOCK_HR.name)
  const submittedAt = safeName(profile.submittedAt || nowIso())

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>BlackDog Talent Profile - ${escapeHtml(profile.candidateName)}</title>
      <style>
        @page { size: A4; margin: 14mm; }
        html, body {
          margin: 0;
          padding: 0;
          background: #f6f3ed;
          color: #111827;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Arial, sans-serif;
        }
        body {
          position: relative;
          min-height: 100vh;
        }
        .watermark {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(-28deg);
          font-size: 96px;
          font-weight: 800;
          color: rgba(31, 92, 67, 0.08);
          pointer-events: none;
          z-index: 0;
          letter-spacing: 0.08em;
        }
        .page {
          position: relative;
          z-index: 1;
        }
        .card {
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid #e6ded0;
          padding: 20px;
          box-shadow: 0 18px 40px rgba(31, 41, 51, 0.08);
        }
        .hero {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 18px;
        }
        .avatar {
          width: 84px;
          height: 84px;
          border-radius: 999px;
          background: #eef4ee;
          color: #1f5c43;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          font-weight: 800;
          overflow: hidden;
          flex: none;
        }
        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .name {
          font-size: 28px;
          font-weight: 800;
          color: #111827;
          line-height: 1.1;
        }
        .subtle {
          margin-top: 4px;
          font-size: 12px;
          color: #6f6256;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px 18px;
        }
        .section {
          margin-top: 16px;
        }
        .section-title {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #1f5c43;
          margin-bottom: 8px;
        }
        .rows {
          border: 1px solid #ebe3d6;
          border-radius: 14px;
          overflow: hidden;
        }
        .row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 10px 12px;
          border-bottom: 1px solid #efe7db;
        }
        .row:last-child { border-bottom: 0; }
        .label {
          width: 38%;
          flex: none;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6f6256;
        }
        .value {
          flex: 1;
          text-align: right;
          font-size: 13px;
          font-weight: 600;
          color: #111827;
          word-break: break-word;
        }
        a {
          color: #1f5c43;
          text-decoration: none;
          word-break: break-all;
        }
        .links {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .link-box {
          border: 1px solid #ebe3d6;
          border-radius: 12px;
          padding: 10px 12px;
          background: #fbfaf6;
          min-height: 56px;
        }
        .link-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #6f6256;
          margin-bottom: 6px;
          font-weight: 800;
        }
        .footer {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 16px;
        }
        .footer-box {
          border: 1px solid #ebe3d6;
          border-radius: 12px;
          padding: 10px 12px;
          background: #fbfaf6;
        }
        .footer-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #6f6256;
          margin-bottom: 6px;
          font-weight: 800;
        }
        .footer-value {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }
      </style>
    </head>
    <body>
      <div class="watermark">BlackDog</div>
      <div class="page">
        <div class="card">
          <div class="hero">
            <div class="avatar">
              ${
                avatarUrl
                  ? `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(profile.candidateName)}" />`
                  : escapeHtml(initials)
              }
            </div>
            <div>
              <div class="name">${escapeHtml(profile.candidateName || "Unknown Candidate")}</div>
              <div class="subtle">Submitted by ${escapeHtml(submittedBy)} · ${escapeHtml(submittedAt)}</div>
            </div>
          </div>

          <section class="section">
            <div class="section-title">Links</div>
            <div class="links">
              <div class="link-box">
                <div class="link-title">Upwork Chat URL</div>
                <a href="${escapeHtml(profile.upworkChatUrl)}">${escapeHtml(profile.upworkChatUrl || "—")}</a>
              </div>
              <div class="link-box">
                <div class="link-title">Profile URL</div>
                <a href="${escapeHtml(profile.profileUrl)}">${escapeHtml(profile.profileUrl || "—")}</a>
              </div>
            </div>
          </section>

          ${renderSection("Language", [
            { label: "Native Language", value: profile.nativeLanguage || "—" },
            { label: "Second Language", value: profile.secondLanguage || "—" },
          ])}

          ${renderSection("Skills", [{ label: "Skill", value: profile.mainSkill || "—" }])}

          ${renderSection("Experience", [{ label: "Experience", value: profile.experienceSummary || "—" }])}

          ${renderSection("Availability", [
            { label: "Daily Availability", value: profile.dailyAvailability || "—" },
            { label: "Weekend Availability", value: profile.weekendAvailability || "—" },
          ])}

          ${renderSection("Contact", [
            { label: "Email", value: profile.email || "—" },
            { label: "Contact Method", value: profile.onlineContactMethod || "—" },
            { label: "Contact Account", value: profile.onlineContactAccount || "—" },
          ])}

          <div class="footer">
            <div class="footer-box">
              <div class="footer-label">Submitted By</div>
              <div class="footer-value">${escapeHtml(profile.submittedByHrName || CURRENT_MOCK_HR.name)}</div>
            </div>
            <div class="footer-box">
              <div class="footer-label">Submitted At</div>
              <div class="footer-value">${escapeHtml(profile.submittedAt || nowIso())}</div>
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>`
}

function findChromeBinary() {
  const candidates = [
    process.env.CHROME_BIN,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean) as string[]

  return candidates[0] || ""
}

function runChromePrintToPdf(chromeBinary: string, htmlFileUrl: string, pdfFilePath: string) {
  return new Promise<void>((resolve, reject) => {
    const args = [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--allow-file-access-from-files",
      "--disable-dev-shm-usage",
      "--run-all-compositor-stages-before-draw",
      "--virtual-time-budget=7000",
      `--print-to-pdf=${pdfFilePath}`,
      "--print-to-pdf-no-header",
      htmlFileUrl,
    ]

    const child = spawn(chromeBinary, args, { stdio: ["ignore", "ignore", "pipe"] })
    let stderr = ""
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString()
    })
    child.on("error", (error) => reject(error))
    child.on("exit", (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(stderr.trim() || `Chrome exited with code ${code}`))
    })
  })
}

export async function generateTalentProfilePdf(profile: TalentProfileRecord) {
  await ensureDir(TALENT_POOL_PDF_DIR)
  const pdfFileName = `talent-${profile.talentId}.pdf`
  const pdfFilePath = path.join(TALENT_POOL_PDF_DIR, pdfFileName)
  const pdfFileUrl = `/generated/talent-profiles/${pdfFileName}`
  const htmlFilePath = path.join(os.tmpdir(), `blackdog-talent-${profile.talentId}-${Date.now()}.html`)
  const chromeBinary = findChromeBinary()
  if (!chromeBinary) {
    throw new Error("Chrome binary not found. Please install Chrome or set CHROME_BIN.")
  }

  const html = renderTalentProfilePdfHtml({
    ...profile,
    profilePdfFileUrl: pdfFileUrl,
    profilePdfFilePath: pdfFilePath,
  })
  await fs.writeFile(htmlFilePath, html, "utf8")

  try {
    await runChromePrintToPdf(chromeBinary, pathToFileURL(htmlFilePath).href, pdfFilePath)
  } finally {
    await fs.rm(htmlFilePath, { force: true }).catch(() => null)
  }

  return { pdfFilePath, pdfFileUrl }
}

export async function sendTalentSubmissionBackupEmail(profile: TalentProfileRecord, pdfUrl: string) {
  const backupEmail = safeName(process.env.TALENT_POOL_BACKUP_EMAIL || "")
  const payload = {
    to: backupEmail || "unconfigured",
    subject: `New Talent Pool Submission - ${profile.candidateName}`,
    profile: {
      candidateName: profile.candidateName,
      upworkChatUrl: profile.upworkChatUrl,
      profileUrl: profile.profileUrl,
      education: profile.education,
      professionalDomain: profile.professionalDomain,
      nativeLanguage: profile.nativeLanguage,
      secondLanguage: profile.secondLanguage,
      mainSkill: profile.mainSkill,
      submittedByHrName: profile.submittedByHrName,
      submittedAt: profile.submittedAt,
    },
    pdfUrl,
  }

  console.log("[BlackDog] sendTalentSubmissionBackupEmail placeholder", payload)
  return { emailQueued: false, backupEmail: backupEmail || "" }
}

export async function saveTalentPoolSubmission(payload: TalentPoolSubmissionPayload) {
  const normalizedPayload: TalentPoolSubmissionPayload = {
    ...payload,
    candidateName: safeName(payload.candidateName || ""),
    avatarUrl: safeName(payload.avatarUrl || ""),
    education: safeName(payload.education || ""),
    professionalDomain: safeName(payload.professionalDomain || ""),
    upworkChatUrl: safeName(payload.upworkChatUrl || ""),
    profileUrl: safeName(payload.profileUrl || ""),
    nativeLanguage: safeName(payload.nativeLanguage || ""),
    secondLanguage: safeName(payload.secondLanguage || ""),
    mainSkill: safeName(payload.mainSkill || ""),
    experienceSummary: safeName(payload.experienceSummary || ""),
    dailyAvailability: safeName(payload.dailyAvailability || ""),
    weekendAvailability: safeName(payload.weekendAvailability || ""),
    email: safeName(payload.email || ""),
    onlineContactMethod: safeName(payload.onlineContactMethod || "WhatsApp") || "WhatsApp",
    onlineContactAccount: safeName(payload.onlineContactAccount || ""),
    submittedAt: safeName(payload.submittedAt || nowIso()) || nowIso(),
    roomId: safeName(payload.roomId || ""),
    pageUrl: safeName(payload.pageUrl || ""),
    submittedByHrId: safeName(payload.submittedByHrId || CURRENT_MOCK_HR.id) || CURRENT_MOCK_HR.id,
    submittedByHrName: safeName(payload.submittedByHrName || CURRENT_MOCK_HR.name) || CURRENT_MOCK_HR.name,
  }

  const { talentProfile } = await upsertTalentProfile(normalizedPayload)
  const updatedTalentProfile: TalentProfileRecord = {
    ...talentProfile,
    updatedAt: nowIso(),
  }

  const currentProfiles = await readTalentProfiles()
  const index = currentProfiles.findIndex((item) => item.talentId === updatedTalentProfile.talentId)
  if (index >= 0) {
    currentProfiles[index] = updatedTalentProfile
  } else {
    currentProfiles.push(updatedTalentProfile)
  }
  await writeTalentProfiles(currentProfiles)

  const hrSubmission: HrSubmissionRecord = {
    progressId: `progress_${crypto.randomUUID()}`,
    talentId: updatedTalentProfile.talentId,
    hrId: updatedTalentProfile.submittedByHrId,
    hrName: updatedTalentProfile.submittedByHrName,
    candidateName: updatedTalentProfile.candidateName,
    avatarUrl: updatedTalentProfile.avatarUrl,
    nativeLanguage: updatedTalentProfile.nativeLanguage,
    secondLanguage: updatedTalentProfile.secondLanguage,
    upworkChatUrl: updatedTalentProfile.upworkChatUrl,
    submitStatus: "success",
    submittedAt: updatedTalentProfile.submittedAt,
  }
  await appendHrSubmission(hrSubmission)

  void (async () => {
    try {
      const { pdfFilePath: nextPdfFilePath, pdfFileUrl: nextPdfFileUrl } = await generateTalentProfilePdf(updatedTalentProfile)
      const refreshedProfiles = await readTalentProfiles()
      const refreshIndex = refreshedProfiles.findIndex((item) => item.talentId === updatedTalentProfile.talentId)
      const refreshedProfile: TalentProfileRecord = {
        ...updatedTalentProfile,
        profilePdfFilePath: nextPdfFilePath,
        profilePdfFileUrl: nextPdfFileUrl,
        updatedAt: nowIso(),
      }
      if (refreshIndex >= 0) {
        refreshedProfiles[refreshIndex] = refreshedProfile
      } else {
        refreshedProfiles.push(refreshedProfile)
      }
      await writeTalentProfiles(refreshedProfiles)

      const emailResult = await sendTalentSubmissionBackupEmail(refreshedProfile, nextPdfFileUrl)
      console.log("[BlackDog] background talent submission completed", {
        talentId: refreshedProfile.talentId,
        pdfUrl: nextPdfFileUrl,
        emailQueued: emailResult.emailQueued,
      })
    } catch (error) {
      console.error("[BlackDog] background talent submission processing failed", error)
    }
  })()

  return {
    talentProfile: updatedTalentProfile,
    hrSubmission,
    pdfUrl: null,
    emailQueued: false,
  }
}

export async function loadTalentLibraryProfiles() {
  const records = await readTalentProfiles()
  return records
    .filter((profile) => profile.status !== "deleted")
    .sort((a, b) => new Date(b.submittedAt || b.createdAt || 0).getTime() - new Date(a.submittedAt || a.createdAt || 0).getTime())
}

export async function loadMyProgressEntries(currentHrId = CURRENT_MOCK_HR.id) {
  const submissions = await readHrSubmissions()
  const talentProfiles = await readTalentProfiles()
  const talentProfileMap = new Map(talentProfiles.map((profile) => [profile.talentId, profile] as const))

  const filtered = submissions.filter((entry) => entry.hrId === currentHrId && entry.submitStatus === "success")
  const uniqueByTalentId = new Map<string, HrSubmissionRecord>()
  for (const entry of filtered) {
    if (!uniqueByTalentId.has(entry.talentId)) {
      uniqueByTalentId.set(entry.talentId, entry)
    } else {
      const previous = uniqueByTalentId.get(entry.talentId)!
      if (new Date(entry.submittedAt).getTime() > new Date(previous.submittedAt).getTime()) {
        uniqueByTalentId.set(entry.talentId, entry)
      }
    }
  }

  const entries = Array.from(uniqueByTalentId.values())
    .map((submission) => {
      const profile = talentProfileMap.get(submission.talentId)
      return {
        submission,
        profile,
      }
    })
    .sort((a, b) => new Date(b.submission.submittedAt).getTime() - new Date(a.submission.submittedAt).getTime())

  return {
    count: uniqueByTalentId.size,
    entries,
  }
}
