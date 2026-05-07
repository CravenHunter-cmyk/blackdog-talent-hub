import { NextResponse } from "next/server"
import { updateTalentProfile } from "@/data/talentPoolStore"

export const runtime = "nodejs"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders })
}

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim()
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const talentId = normalizeText(body?.talentId || "")
    if (!talentId) {
      return jsonResponse({ ok: false, error: "talentId is required." }, 400)
    }

    const talentProfile = await updateTalentProfile({
      talentId,
      candidateName: normalizeText(body?.candidateName || ""),
      avatarUrl: normalizeText(body?.avatarUrl || ""),
      education: normalizeText(body?.education || ""),
      professionalDomain: normalizeText(body?.professionalDomain || ""),
      upworkChatUrl: normalizeText(body?.upworkChatUrl || ""),
      profileUrl: normalizeText(body?.profileUrl || ""),
      nativeLanguage: normalizeText(body?.nativeLanguage || ""),
      secondLanguage: normalizeText(body?.secondLanguage || ""),
      mainSkill: normalizeText(body?.mainSkill || ""),
      experienceSummary: normalizeText(body?.experienceSummary || ""),
      dailyAvailability: normalizeText(body?.dailyAvailability || ""),
      weekendAvailability: normalizeText(body?.weekendAvailability || ""),
      email: normalizeText(body?.email || ""),
      onlineContactMethod: normalizeText(body?.onlineContactMethod || ""),
      onlineContactAccount: normalizeText(body?.onlineContactAccount || ""),
    })

    return jsonResponse({ ok: true, talentProfile })
  } catch (error) {
    console.error("[BlackDog] talent profile update failed", error)
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Update failed.",
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
