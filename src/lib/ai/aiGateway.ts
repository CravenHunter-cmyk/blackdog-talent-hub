import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  createOpenAIClient,
  hasDeepSeekKey,
  hasOpenAIKey,
  resolveAIGatewayProvider,
  resolveDeepSeekBaseUrl,
  resolveDeepSeekModel,
  resolveOpenAIModel,
} from "./openaiClient";
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

function redactSecret(value: string, secret?: string) {
  if (!secret) return value;
  return value.split(secret).join("[redacted]");
}

function getErrorMessage(error: unknown, fallback: string, secret?: string) {
  const message = error instanceof Error ? error.message : fallback;
  return redactSecret(message || fallback, secret);
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
    text: raw,
    result: parsed,
  };
}

type DeepSeekChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

async function callDeepSeekChatCompletion(options: {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const apiKey = String(process.env.DEEPSEEK_API_KEY || "").trim();
  const resolvedModel = resolveDeepSeekModel(options.model);
  if (!apiKey) {
    return {
      ok: false as const,
      provider: "deepseek" as const,
      error: "DEEPSEEK_API_KEY is not configured",
    };
  }

  try {
    const response = await fetch(`${resolveDeepSeekBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages: [
          { role: "system", content: options.systemPrompt },
          { role: "user", content: options.userPrompt },
        ],
        temperature: options.temperature ?? 0.3,
        ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
      }),
    });

    const payload = (await response.json().catch(() => null)) as DeepSeekChatResponse | null;
    if (!response.ok) {
      return {
        ok: false as const,
        provider: "deepseek" as const,
        error: redactSecret(payload?.error?.message || `DeepSeek request failed with status ${response.status}`, apiKey),
      };
    }

    const text = payload?.choices?.[0]?.message?.content || "";
    if (!text) {
      return {
        ok: false as const,
        provider: "deepseek" as const,
        error: "DeepSeek response did not include message content",
      };
    }

    return {
      ok: true as const,
      provider: "deepseek" as const,
      model: resolvedModel,
      text,
    };
  } catch (error) {
    return {
      ok: false as const,
      provider: "deepseek" as const,
      error: getErrorMessage(error, "DeepSeek request failed", apiKey),
    };
  }
}

async function callDeepSeekAnalyzeProject(input: AnalyzeProjectInput, model?: string) {
  const { system, user } = buildAnalyzeProjectPrompt(input);
  const completion = await callDeepSeekChatCompletion({
    systemPrompt: system,
    userPrompt: user,
    model,
    temperature: 0.2,
    maxTokens: 800,
  });

  if (!completion.ok) return completion;

  const parsed = safeJsonParse<AnalyzeProjectResult>(completion.text);
  if (!parsed) {
    return {
      ok: false as const,
      provider: "deepseek" as const,
      error: "Failed to parse AI response as JSON",
      debugRaw: completion.text,
    };
  }

  return {
    ok: true as const,
    provider: "deepseek" as const,
    model: completion.model,
    text: completion.text,
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
  };
}

async function callDeepSeekHealth(model?: string): Promise<AIGatewayHealthSuccess | AIGatewayHealthFailure> {
  const resolvedModel = resolveDeepSeekModel(model);
  if (!hasDeepSeekKey()) {
    return {
      ok: false,
      provider: "deepseek",
      error: "DEEPSEEK_API_KEY is not configured",
    };
  }

  const result = await callDeepSeekChatCompletion({
    systemPrompt: "Reply with OK only.",
    userPrompt: "Reply with OK only.",
    model: resolvedModel,
    temperature: 0,
    maxTokens: 5,
  });

  if (!result.ok) {
    return {
      ok: false,
      provider: "deepseek",
      error: result.error,
    };
  }

  return {
    ok: true,
    provider: "deepseek",
    model: resolvedModel,
  };
}

export async function testOpenAIHealth(options?: { provider?: string; model?: string }) {
  const provider = resolveAIGatewayProvider(options?.provider);
  const model = provider === "deepseek" ? resolveDeepSeekModel(options?.model) : resolveOpenAIModel(options?.model);
  const startedAt = Date.now();

  const result = provider === "deepseek" ? await callDeepSeekHealth(model) : await callOpenAIHealth(model);
  logGateway("health_check", provider, model, result.ok, Date.now() - startedAt);
  return result;
}

export async function analyzeProjectWithGateway(input: AnalyzeProjectInput, options?: { provider?: string; model?: string }) {
  const provider = resolveAIGatewayProvider(options?.provider);
  const model = provider === "deepseek" ? resolveDeepSeekModel(options?.model) : resolveOpenAIModel(options?.model);
  const startedAt = Date.now();

  try {
    const result = provider === "deepseek" ? await callDeepSeekAnalyzeProject(input, model) : await callOpenAIAnalyzeProject(input, model);
    if (!result.ok) {
      logGateway("analyze_project", provider, model, false, Date.now() - startedAt);
      return {
        ok: false as const,
        task: "analyze_project" as const,
        provider,
        error: result.error,
        ...(process.env.NODE_ENV !== "production" && "debugRaw" in result && result.debugRaw ? { debugRaw: result.debugRaw } : {}),
      } satisfies AIGatewayError;
    }

    logGateway("analyze_project", provider, model, true, Date.now() - startedAt);
    return {
      ok: true as const,
      task: "analyze_project" as const,
      provider,
      model: result.model,
      text: result.text,
      result: result.result,
    } satisfies AIGatewayAnalyzeSuccess;
  } catch (error) {
    const message = getErrorMessage(error, "Failed to analyze project.", process.env.DEEPSEEK_API_KEY);
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
  const provider = resolveAIGatewayProvider(request.options?.provider);
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
