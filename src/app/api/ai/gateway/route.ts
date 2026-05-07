import { NextResponse } from "next/server";
import { runAIGatewayTask } from "@/lib/ai/aiGateway";
import type { AIGatewayRequest } from "@/lib/ai/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AIGatewayRequest>;
    if (!body?.task) {
      return NextResponse.json({ ok: false, error: "Invalid AI gateway request." }, { status: 400 });
    }

    const result = await runAIGatewayTask({
      task: body.task,
      input: body.input || {},
      options: body.options,
    });

    const status = result.ok ? 200 : result.error === "Task type not implemented yet" ? 501 : 500;
    return NextResponse.json(result, { status });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid AI gateway request." }, { status: 400 });
  }
}
