import { NextResponse } from "next/server"
import { CURRENT_MOCK_HR, deleteTalentProfiles } from "@/data/talentPoolStore"

export const runtime = "nodejs"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders })
}

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim()
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { talentIds?: unknown; deletedById?: unknown; deletedByName?: unknown }
    const talentIds = Array.isArray(body.talentIds) ? body.talentIds.map((item) => normalizeText(String(item || ""))).filter(Boolean) : []
    if (!talentIds.length) {
      return jsonResponse({ ok: false, error: "talentIds are required" }, 400)
    }

    const deletedBy = {
      id: normalizeText(String(body.deletedById || CURRENT_MOCK_HR.id)) || CURRENT_MOCK_HR.id,
      name: normalizeText(String(body.deletedByName || CURRENT_MOCK_HR.name)) || CURRENT_MOCK_HR.name,
    }

    const result = await deleteTalentProfiles(talentIds, deletedBy)
    return jsonResponse({ ok: true, deletedCount: result.deletedCount })
  } catch (error) {
    console.error("[BlackDog] talent pool delete failed", error)
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Delete failed.",
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
