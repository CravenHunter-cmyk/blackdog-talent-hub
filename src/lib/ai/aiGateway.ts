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
  AIGatewayTaskResultMap,
  AIGatewayTaskSuccess,
  AnalyzeProjectInput,
  AnalyzeProjectResult,
  ChatReplySuggestionInput,
  ExtractProfileInput,
  TranslateMessageInput,
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

function normalizeConversationMessages(messages: unknown[] = []) {
  return messages
    .slice(-30)
    .map((message) => {
      if (!message || typeof message !== "object") return null;
      const record = message as Record<string, unknown>;
      return {
        sender: normalizeText(String(record.sender || record.author || "")) || "Unknown",
        direction: normalizeText(String(record.direction || "")),
        timestamp: normalizeText(String(record.timestamp || record.time || "")),
        text: String(record.text || record.content || "").trim(),
      };
    })
    .filter((message) => message?.text);
}

function buildChatReplySuggestionPrompt(input: ChatReplySuggestionInput): { system: string; user: string } {
  return {
    system:
      "You are BlackDog's recruiting assistant for Upwork candidate conversations. Return JSON only with no markdown or extra text.",
    user: JSON.stringify(
      {
        candidateName: input.candidateName || "",
        meName: input.meName || "",
        projectName: input.projectName || "",
        goal: input.goal || "Auto",
        tone: input.tone || "Professional and friendly",
        customInstruction: input.customInstruction || "",
        conversationMessages: normalizeConversationMessages(input.conversationMessages || []),
        outputShape: {
          englishReply: "string",
          chineseSummary: "string",
          recommendedNextStep: "string",
        },
      },
      null,
      2,
    ),
  };
}

function buildExtractProfilePrompt(input: ExtractProfileInput): { system: string; user: string } {
  return {
    system:
      "You extract structured candidate profile fields from recruiting chat history. Return JSON only. Use empty strings when a field is not clearly present.",
    user: JSON.stringify(
      {
        candidateName: input.candidateName || "",
        existingProfile: input.existingProfile || {},
        conversationMessages: normalizeConversationMessages(input.conversationMessages || []),
        outputShape: {
          nativeLanguage: "string",
          secondLanguage: "string",
          mainSkill: "string",
          experienceSummary: "string",
          dailyAvailability: "string",
          weekendAvailability: "string",
          email: "string",
          onlineContactMethod: "string",
          onlineContactAccount: "string",
          profileUrl: "string",
        },
      },
      null,
      2,
    ),
  };
}

function buildTranslateMessagePrompt(input: TranslateMessageInput): { system: string; user: string } {
  return {
    system:
      "You translate recruiter messages for Upwork conversations. Preserve intent, keep the wording natural and professional, and return JSON only.",
    user: JSON.stringify(
      {
        sourceLanguage: input.sourceLanguage || "Chinese",
        targetLanguage: input.targetLanguage || "English",
        text: input.text || "",
        context: Array.isArray(input.context) ? normalizeConversationMessages(input.context) : input.context || "",
        outputShape: {
          translatedText: "string",
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

async function callOpenAIJsonTask<TResult>(prompt: { system: string; user: string }, model?: string, temperature = 0.3) {
  const client = createOpenAIClient();
  if (!client) {
    return {
      ok: false as const,
      error: "OPENAI_API_KEY is not configured",
    };
  }

  const resolvedModel = resolveOpenAIModel(model);
  const completion = await client.chat.completions.create({
    model: resolvedModel,
    temperature,
    max_tokens: 900,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ] as ChatCompletionMessageParam[],
  });

  const raw = completion.choices[0]?.message?.content || "";
  const parsed = safeJsonParse<TResult>(raw);
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

async function callDeepSeekJsonTask<TResult>(prompt: { system: string; user: string }, model?: string, temperature = 0.3) {
  const completion = await callDeepSeekChatCompletion({
    systemPrompt: prompt.system,
    userPrompt: prompt.user,
    model,
    temperature,
    maxTokens: 900,
  });

  if (!completion.ok) return completion;

  const parsed = safeJsonParse<TResult>(completion.text);
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

async function runJsonGatewayTask<TTask extends keyof AIGatewayTaskResultMap>(
  task: TTask,
  input: Record<string, unknown>,
  options?: { provider?: string; model?: string },
  buildPrompt?: (input: Record<string, unknown>) => { system: string; user: string },
) {
  const provider = resolveAIGatewayProvider(options?.provider);
  const model = provider === "deepseek" ? resolveDeepSeekModel(options?.model) : resolveOpenAIModel(options?.model);
  const startedAt = Date.now();

  try {
    if (!buildPrompt) {
      return {
        ok: false,
        task,
        provider,
        error: "Task type not implemented yet",
      } satisfies AIGatewayError;
    }

    const prompt = buildPrompt(input);
    const result =
      provider === "deepseek"
        ? await callDeepSeekJsonTask<AIGatewayTaskResultMap[TTask]>(prompt, model)
        : await callOpenAIJsonTask<AIGatewayTaskResultMap[TTask]>(prompt, model);

    if (!result.ok) {
      logGateway(task, provider, model, false, Date.now() - startedAt);
      return {
        ok: false,
        task,
        provider,
        error: result.error,
        ...(process.env.NODE_ENV !== "production" && "debugRaw" in result && result.debugRaw ? { debugRaw: result.debugRaw } : {}),
      } satisfies AIGatewayError;
    }

    logGateway(task, provider, model, true, Date.now() - startedAt);
    return {
      ok: true,
      task,
      provider,
      model: result.model,
      text: result.text,
      result: result.result,
    } satisfies AIGatewayTaskSuccess<TTask>;
  } catch (error) {
    const message = getErrorMessage(error, "AI gateway task failed.", process.env.DEEPSEEK_API_KEY);
    logGateway(task, provider, model, false, Date.now() - startedAt);
    return {
      ok: false,
      task,
      provider,
      error: message,
    } satisfies AIGatewayError;
  }
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
    case "chat_reply_suggestion":
      return runJsonGatewayTask<"chat_reply_suggestion">(
        "chat_reply_suggestion",
        request.input,
        { provider, model: request.options?.model },
        (input) => buildChatReplySuggestionPrompt(input as ChatReplySuggestionInput),
      );
    case "extract_profile":
      return runJsonGatewayTask<"extract_profile">(
        "extract_profile",
        request.input,
        { provider, model: request.options?.model },
        (input) => buildExtractProfilePrompt(input as ExtractProfileInput),
      );
    case "translate_message":
      return runJsonGatewayTask<"translate_message">(
        "translate_message",
        request.input,
        { provider, model: request.options?.model },
        (input) => buildTranslateMessagePrompt(input as TranslateMessageInput),
      );
    case "match_talents":
    case "generate_recruiting_task":
    case "generate_script":
    case "summarize_chat":
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
