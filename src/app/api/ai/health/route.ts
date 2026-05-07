import { NextResponse } from "next/server";
import { testOpenAIHealth } from "@/lib/ai/aiGateway";

export const runtime = "nodejs";

export async function GET() {
  const result = await testOpenAIHealth();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
