import { NextResponse } from "next/server"
import { CURRENT_MOCK_HR, saveTalentPoolSubmission } from "@/data/talentPoolStore"
import type { TalentPoolSubmissionPayload } from "@/types/talent-pool"

export const runtime = "nodejs"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders })
}

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim()
}

function readAvatarUrl(body: Record<string, unknown>) {
  return normalizeText(
    String(
      body.avatarUrl ||
        body.avatar ||
        body.profileImage ||
        body.imageUrl ||
        body.photoUrl ||
        body.candidateAvatar ||
        body.candidateAvatarUrl ||
        "",
    ),
  )
}

function hasRequiredFields(payload: TalentPoolSubmissionPayload) {
  return Boolean(normalizeText(payload?.candidateName || "") && normalizeText(payload?.upworkChatUrl || ""))
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<TalentPoolSubmissionPayload>
    if (!hasRequiredFields(body as TalentPoolSubmissionPayload)) {
      return jsonResponse({ ok: false, error: "candidateName and upworkChatUrl are required" }, 400)
    }

    const payload: TalentPoolSubmissionPayload = {
      source: "upwork",
      platform: "Upwork",
      candidateName: normalizeText(body.candidateName || ""),
      avatarUrl: readAvatarUrl(body as Record<string, unknown>),
      education: normalizeText(body.education || ""),
      professionalDomain: normalizeText(body.professionalDomain || ""),
      upworkChatUrl: normalizeText(body.upworkChatUrl || ""),
      profileUrl: normalizeText(body.profileUrl || ""),
      nativeLanguage: normalizeText(body.nativeLanguage || ""),
      secondLanguage: normalizeText(body.secondLanguage || ""),
      mainSkill: normalizeText(body.mainSkill || ""),
      experienceSummary: normalizeText(body.experienceSummary || ""),
      dailyAvailability: normalizeText(body.dailyAvailability || ""),
      weekendAvailability: normalizeText(body.weekendAvailability || ""),
      email: normalizeText(body.email || ""),
      onlineContactMethod: normalizeText(body.onlineContactMethod || "WhatsApp") || "WhatsApp",
      onlineContactAccount: normalizeText(body.onlineContactAccount || ""),
      submittedAt: normalizeText(body.submittedAt || new Date().toISOString()),
      roomId: normalizeText(body.roomId || ""),
      pageUrl: normalizeText(body.pageUrl || ""),
      submittedByHrId: normalizeText(body.submittedByHrId || CURRENT_MOCK_HR.id) || CURRENT_MOCK_HR.id,
      submittedByHrName: normalizeText(body.submittedByHrName || CURRENT_MOCK_HR.name) || CURRENT_MOCK_HR.name,
    }

    const result = await saveTalentPoolSubmission(payload)
    return jsonResponse({
      ok: true,
      ...result,
    })
  } catch (error) {
    console.error("[BlackDog] talent pool submit failed", error)
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Submit failed.",
      },
      500,
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}
