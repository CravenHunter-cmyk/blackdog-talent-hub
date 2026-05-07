import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { createOpenAIClient, hasOpenAIKey, normalizeAIGatewayProvider, resolveOpenAIModel } from "./openaiClient";
import type {
  AIGatewayAnalyzeSuccess,
  AIGatewayError,
  AIGatewayHealthFailure,
  AIGatewayHealthSuccess,
  AIGatewayProvider,
  AIGatewayRequest,
  AnalyzeProjectInput,
  AnalyzeProjectResult,
} from "./types";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    const trimmed = normalizeText(value);
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function logGateway(task: string, provider: AIGatewayProvider, model: string, success: boolean, durationMs: number) {
  console.log(`[ai-gateway] task=${task} provider=${provider} model=${model} success=${success} durationMs=${durationMs}`);
}

function buildAnalyzeProjectPrompt(input: AnalyzeProjectInput): { system: string; user: string } {
  const payload = {
    clientName: input.clientName || "",
    projectName: input.projectName || "",
    projectType: input.projectType || "",
    targetMarket: input.targetMarket || "",
    description: input.description || "",
    priority: input.priority || "",
    budgetLevel: input.budgetLevel || "",
  };

  return {
    system:
      "You are BlackDog Brain. Analyze a client project for recruiting and talent matching. Return JSON only with no markdown or extra text.",
    user: JSON.stringify(
      {
        project: payload,
        outputShape: {
          projectSummary: "string",
          projectDifficulty: "string",
          requiredCapabilities: ["string"],
          recommendedTalentPersonas: ["string"],
          languagePlan: ["string"],
          matchingConsiderations: ["string"],
          recruitingGapLogic: ["string"],
          risks: ["string"],
          nextSteps: ["string"],
        },
      },
      null,
      2,
    ),
  };
}

async function callOpenAIAnalyzeProject(input: AnalyzeProjectInput, model?: string) {
  const client = createOpenAIClient();
  if (!client) {
    return {
      ok: false as const,
      error: "OPENAI_API_KEY is not configured",
    };
  }

  const resolvedModel = resolveOpenAIModel(model);
  const { system, user } = buildAnalyzeProjectPrompt(input);
  const completion = await client.chat.completions.create({
    model: resolvedModel,
    temperature: 0.2,
    max_tokens: 800,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ] as ChatCompletionMessageParam[],
  });

  const raw = completion.choices[0]?.message?.content || "";
  const parsed = safeJsonParse<AnalyzeProjectResult>(raw);
  if (!parsed) {
    return {
      ok: false as const,
      error: "Failed to parse AI response as JSON",
      debugRaw: raw,
    };
  }

  return {
    ok: true as const,
    model: resolvedModel,
    result: parsed,
  };
}

async function callOpenAIHealth(model?: string): Promise<AIGatewayHealthSuccess | AIGatewayHealthFailure> {
  if (!hasOpenAIKey()) {
    return {
      ok: false,
      provider: "openai",
      error: "OPENAI_API_KEY is not configured",
    };
  }

  const client = createOpenAIClient();
  if (!client) {
    return {
      ok: false,
      provider: "openai",
      error: "OpenAI client could not be initialized",
    };
  }

  const resolvedModel = resolveOpenAIModel(model);
  await client.chat.completions.create({
    model: resolvedModel,
    temperature: 0,
    max_tokens: 5,
    messages: [
      { role: "system", content: "Reply with a single word ok." },
      { role: "user", content: "ok" },
    ],
  });

  return {
    ok: true,
    provider: "openai",
    model: resolvedModel,
    message: "OpenAI connected successfully",
  };
}

export async function testOpenAIHealth(options?: { provider?: string; model?: string }) {
  const provider = normalizeAIGatewayProvider(options?.provider || "openai");
  const model = resolveOpenAIModel(options?.model);
  const startedAt = Date.now();

  if (provider !== "openai") {
    const error = "DeepSeek provider not configured yet";
    logGateway("health_check", provider, model, false, Date.now() - startedAt);
    return {
      ok: false,
      provider,
      error,
    } satisfies AIGatewayHealthFailure;
  }

  const result = await callOpenAIHealth(model);
  logGateway("health_check", provider, model, result.ok, Date.now() - startedAt);
  return result;
}

export async function analyzeProjectWithGateway(input: AnalyzeProjectInput, options?: { provider?: string; model?: string }) {
  const provider = normalizeAIGatewayProvider(options?.provider || "openai");
  const model = resolveOpenAIModel(options?.model);
  const startedAt = Date.now();

  if (provider !== "openai") {
    const error = "DeepSeek provider not configured yet";
    logGateway("analyze_project", provider, model, false, Date.now() - startedAt);
    return {
      ok: false as const,
      task: "analyze_project" as const,
      provider,
      error,
    } satisfies AIGatewayError;
  }

  try {
    const result = await callOpenAIAnalyzeProject(input, model);
    if (!result.ok) {
      logGateway("analyze_project", provider, model, false, Date.now() - startedAt);
      return {
        ok: false as const,
        task: "analyze_project" as const,
        provider,
        error: result.error,
        ...(process.env.NODE_ENV !== "production" && result.debugRaw ? { debugRaw: result.debugRaw } : {}),
      } satisfies AIGatewayError;
    }

    logGateway("analyze_project", provider, model, true, Date.now() - startedAt);
    return {
      ok: true as const,
      task: "analyze_project" as const,
      provider,
      model: result.model,
      result: result.result,
    } satisfies AIGatewayAnalyzeSuccess;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze project.";
    logGateway("analyze_project", provider, model, false, Date.now() - startedAt);
    return {
      ok: false,
      task: "analyze_project",
      provider,
      error: message,
    } satisfies AIGatewayError;
  }
}

export async function runAIGatewayTask(request: AIGatewayRequest) {
  const provider = normalizeAIGatewayProvider(request.options?.provider || "openai");
  switch (request.task) {
    case "health_check":
      return testOpenAIHealth({ provider, model: request.options?.model });
    case "analyze_project":
      return analyzeProjectWithGateway(request.input as AnalyzeProjectInput, { provider, model: request.options?.model });
    case "match_talents":
    case "generate_recruiting_task":
    case "generate_script":
    case "extract_profile":
    case "summarize_chat":
    case "translate_message":
    case "chat_reply_suggestion":
      return {
        ok: false,
        task: request.task,
        provider,
        error: "Task type not implemented yet",
      } satisfies AIGatewayError;
    default:
      return {
        ok: false,
        task: request.task,
        provider,
        error: "Task type not implemented yet",
      } satisfies AIGatewayError;
  }
}
