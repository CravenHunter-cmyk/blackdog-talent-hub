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
  GenerateWorkTemplateInput,
  GenerateWorkTemplateResult,
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
          chineseReply: "string",
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
      "You translate recruiter messages. Preserve intent, keep the wording natural and professional, and return JSON only.",
    user: JSON.stringify(
      {
        sourceLanguage: input.sourceLanguage || "Chinese",
        targetLanguage: input.targetLanguage || "English",
        text: input.text || "",
        instruction: "Return only the translated message in translatedText. Do not explain.",
        outputShape: {
          translatedText: "string",
        },
      },
      null,
      2,
    ),
  };
}

export function createFallbackWorkTemplate(input: GenerateWorkTemplateInput = {}): GenerateWorkTemplateResult {
  return {
    templateName: input.projectName ? `${input.projectName} Template` : "Multimodal Image Evaluation Template",
    taskType: input.taskType || "Multimodal Evaluation",
    inputSchema: [
      { key: "sessionId", label: "session id", type: "text", sourceColumn: "session id", readonly: true },
      { key: "promptId", label: "prompt id", type: "text", sourceColumn: "prompt id", readonly: true },
      { key: "roundNumber", label: "round_number", type: "number", sourceColumn: "round_number", readonly: true },
      { key: "caseType", label: "Single/Multi", type: "text", sourceColumn: "Single/Multi", readonly: true },
      { key: "language", label: "Language", type: "text", sourceColumn: "Language", readonly: true },
      { key: "modality", label: "Input-Output Modality", type: "text", sourceColumn: "Input-Output Modality", readonly: true },
      { key: "textPrompt", label: "Text Prompt", type: "textarea", sourceColumn: "Text Prompt", readonly: true },
      { key: "translationTextPrompt", label: "Translation_Text Prompt", type: "textarea", sourceColumn: "Translation_Text Prompt", readonly: true },
      { key: "imagePrompt1", label: "Image Prompt1", type: "image_url", sourceColumn: "Image Prompt1", readonly: true },
      { key: "imagePrompt2", label: "Image Prompt2", type: "image_url", sourceColumn: "Image Prompt2", readonly: true },
      { key: "imageResponse", label: "Image Response", type: "image_url", sourceColumn: "Image Response", readonly: true },
      { key: "textResponse", label: "Text Response", type: "textarea", sourceColumn: "Text Response", readonly: true },
    ],
    outputSchema: [
      { key: "finalDCG", label: "final DCG", type: "select", options: ["0", "1", "2", "3", "4"], required: true, targetColumn: "final DCG" },
      { key: "frsDCG", label: "FRS DCG", type: "select", options: ["0", "1", "2", "3"], targetColumn: "FRS DCG" },
      { key: "finalPT", label: "final PT", type: "select", options: ["Main demand not met", "Secondary demand not met", "Structural Integrity", "Prompt following issue"], targetColumn: "final PT" },
      { key: "finalStabilityNeeded", label: "final stability needed?", type: "select", options: ["No", "Yes"], targetColumn: "final stability needed?" },
      { key: "finalStability", label: "final stablity", type: "select", options: ["Stable", "Unstable"], targetColumn: "final stablity" },
      { key: "reason", label: "reason", type: "textarea", required: true, targetColumn: "reason" },
      { key: "done", label: "done", type: "select", options: ["done"], targetColumn: "done" },
      { key: "subjectiveScore", label: "subjective score?", type: "select", options: ["-", "0", "1"], targetColumn: "subjective score?" },
      { key: "subjectiveScoreReason", label: "subj score reason", type: "textarea", targetColumn: "subj score reason" },
    ],
    uiLayout: {
      leftPanel: "Case Queue grouped by session / enc_section_id",
      centerPanel: "Prompt, response, image review, timeline, demand analysis, and QC history",
      rightPanel: "Evaluation form with scoring, PT, stability, reason, draft, and submit actions",
    },
    validationRules: [
      "final DCG required",
      "reason required",
      "FRS DCG only for final round of multi-round tasks",
      "subjective score only for single-round tasks",
      "final stability required only when stability needed = Yes",
    ],
    workflowRules: [
      "Labeler submit one case at a time",
      "QC required",
      "Recheck optional",
      "PM final delivery sync",
    ],
    rolePermissions: {
      pm: ["create projects", "generate templates", "assign team", "view all progress", "delivery sync"],
      teamLeader: ["view assigned task packages", "assign cases to labelers", "track team progress"],
      labeler: ["view my cases", "save drafts", "submit cases", "revise returned cases"],
      qc: ["review submitted cases", "pass or return cases", "write QC feedback"],
      rechecker: ["review disputes and samples", "final pass", "return with recheck feedback"],
    },
    exportMapping: {
      finalDCG: "final DCG",
      frsDCG: "FRS DCG",
      finalPT: "final PT",
      finalStabilityNeeded: "final stability needed?",
      finalStability: "final stablity",
      reason: "reason",
      done: "done",
      subjectiveScore: "subjective score?",
      subjectiveScoreReason: "subj score reason",
    },
  };
}

function buildGenerateWorkTemplatePrompt(input: GenerateWorkTemplateInput): { system: string; user: string } {
  return {
    system:
      "You are BlackDog Work Center's project template architect. Generate a structured task execution template from PM instructions, source data, and SOP notes. Return JSON only with no markdown or extra text.",
    user: JSON.stringify(
      {
        projectName: input.projectName || "",
        taskType: input.taskType || "",
        filesSummary: input.filesSummary || "",
        sampleColumns: input.sampleColumns || [],
        sopSummary: input.sopSummary || "",
        userInstruction: input.userInstruction || "",
        outputShape: {
          templateName: "string",
          taskType: "string",
          inputSchema: [
            {
              key: "string",
              label: "string",
              type: "text | image_url | number | select | textarea",
              sourceColumn: "string",
              readonly: true,
            },
          ],
          outputSchema: [
            {
              key: "string",
              label: "string",
              type: "text | number | select | textarea",
              options: ["string"],
              required: true,
              targetColumn: "string",
            },
          ],
          uiLayout: {
            leftPanel: "string",
            centerPanel: "string",
            rightPanel: "string",
          },
          validationRules: ["string"],
          workflowRules: ["string"],
          rolePermissions: {
            pm: ["string"],
            teamLeader: ["string"],
            labeler: ["string"],
            qc: ["string"],
            rechecker: ["string"],
          },
          exportMapping: {
            finalDCG: "final DCG",
            frsDCG: "FRS DCG",
            finalPT: "final PT",
            reason: "reason",
            done: "done",
          },
        },
      },
      null,
      2,
    ),
  };
}

function buildManagementFocusPrompt(input: Record<string, unknown>): { system: string; user: string } {
  return {
    system:
      "You are BlackDog's recruiting operations risk analyst. You receive pre-scored recruiting risk objects generated by a deterministic rule engine. Do not change the risk level. Do not change the ranking. Do not invent data. Do not mention metrics that are not provided. You must cite provided key numbers when explaining reasons. Your job is to convert the provided metrics and risk factors into concise management alerts. Return JSON only. No markdown. For each focus object, generate riskAlert, reason, businessImpact, and recommendedActions. Keep the tone professional, operational, and direct. Do not exaggerate. Do not say maybe too much. Be specific. Do not include action button labels. Do not suggest that any action has already been performed.",
    user: JSON.stringify(
      {
        instruction: "Generate management alerts from the pre-scored risk objects. Keep riskLevel and ranking unchanged. Do not invent data.",
        outputShape: {
          focusAlerts: {
            language: {
              id: "same as input id",
              focusItem: "same as input focusItem",
              focusType: "Language",
              riskLevel: "same as input riskLevel",
              riskAlert: "string",
              reason: "string",
              businessImpact: "string",
              recommendedActions: ["string"],
            },
            project: {
              id: "same as input id",
              focusItem: "same as input focusItem",
              focusType: "Project",
              riskLevel: "same as input riskLevel",
              riskAlert: "string",
              reason: "string",
              businessImpact: "string",
              recommendedActions: ["string"],
            },
            hr: {
              id: "same as input id",
              focusItem: "same as input focusItem",
              focusType: "HR",
              riskLevel: "same as input riskLevel",
              riskAlert: "string",
              reason: "string",
              businessImpact: "string",
              recommendedActions: ["string"],
            },
          },
        },
        generatedAt: input.generatedAt || new Date().toISOString(),
        topFocus: input.topFocus || {},
        rankings: input.rankings || {},
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

async function callDeepSeekJsonTask<TResult>(prompt: { system: string; user: string }, model?: string, temperature = 0.3, maxTokens = 900) {
  const completion = await callDeepSeekChatCompletion({
    systemPrompt: prompt.system,
    userPrompt: prompt.user,
    model,
    temperature,
    maxTokens,
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

async function translateWithDeepSeek(input: TranslateMessageInput) {
  const provider = "deepseek" as const;
  const model = resolveDeepSeekModel();
  const prompt = buildTranslateMessagePrompt({ ...input, context: [] });
  const result = await callDeepSeekJsonTask<AIGatewayTaskResultMap["translate_message"]>(prompt, model, 0, 300);

  if (!result.ok) {
    return {
      ok: false as const,
      task: "translate_message" as const,
      provider,
      error: result.error,
      ...(process.env.NODE_ENV !== "production" && "debugRaw" in result && result.debugRaw ? { debugRaw: result.debugRaw } : {}),
    } satisfies AIGatewayError;
  }

  return {
    ok: true as const,
    task: "translate_message" as const,
    provider,
    model: result.model,
    text: result.text,
    result: result.result,
  } satisfies AIGatewayTaskSuccess<"translate_message">;
}

async function translateMessageWithGateway(input: TranslateMessageInput) {
  const startedAt = Date.now();

  try {
    const result = await translateWithDeepSeek(input);
    logGateway("translate_message", "deepseek", result.ok ? result.model : resolveDeepSeekModel(), result.ok, Date.now() - startedAt);
    return result;
  } catch (error) {
    const model = resolveDeepSeekModel();
    const message = getErrorMessage(error, "Translation failed.", process.env.DEEPSEEK_API_KEY);
    logGateway("translate_message", "deepseek", model, false, Date.now() - startedAt);
    return {
      ok: false,
      task: "translate_message",
      provider: "deepseek",
      error: message,
    } satisfies AIGatewayError;
  }
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

async function generateWorkTemplateWithGateway(input: GenerateWorkTemplateInput, options?: { provider?: string; model?: string }) {
  const provider = resolveAIGatewayProvider(options?.provider);
  const model = provider === "deepseek" ? resolveDeepSeekModel(options?.model) : resolveOpenAIModel(options?.model);
  const startedAt = Date.now();
  const fallback = createFallbackWorkTemplate(input);

  try {
    const prompt = buildGenerateWorkTemplatePrompt(input);
    const result =
      provider === "deepseek"
        ? await callDeepSeekJsonTask<GenerateWorkTemplateResult>(prompt, model, 0.2, 1800)
        : await callOpenAIJsonTask<GenerateWorkTemplateResult>(prompt, model, 0.2);

    if (!result.ok) {
      logGateway("generate_work_template", provider, model, false, Date.now() - startedAt);
      return {
        ok: true,
        task: "generate_work_template",
        provider,
        model,
        text: "Fallback template generated because the AI provider response was unavailable or invalid.",
        result: fallback,
      } satisfies AIGatewayTaskSuccess<"generate_work_template">;
    }

    logGateway("generate_work_template", provider, result.model, true, Date.now() - startedAt);
    return {
      ok: true,
      task: "generate_work_template",
      provider,
      model: result.model,
      text: result.text,
      result: {
        ...fallback,
        ...result.result,
        uiLayout: { ...fallback.uiLayout, ...(result.result.uiLayout || {}) },
        rolePermissions: { ...fallback.rolePermissions, ...(result.result.rolePermissions || {}) },
        exportMapping: { ...fallback.exportMapping, ...(result.result.exportMapping || {}) },
      },
    } satisfies AIGatewayTaskSuccess<"generate_work_template">;
  } catch (error) {
    const message = getErrorMessage(error, "Template generation failed.", process.env.DEEPSEEK_API_KEY);
    logGateway("generate_work_template", provider, model, false, Date.now() - startedAt);
    return {
      ok: true,
      task: "generate_work_template",
      provider,
      model,
      text: `Fallback template generated. ${message}`,
      result: fallback,
    } satisfies AIGatewayTaskSuccess<"generate_work_template">;
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
      return translateMessageWithGateway(request.input as TranslateMessageInput);
    case "analyze_management_focus":
      return runJsonGatewayTask<"analyze_management_focus">(
        "analyze_management_focus",
        request.input,
        { provider, model: request.options?.model },
        (input) => buildManagementFocusPrompt(input),
      );
    case "generate_work_template":
      return generateWorkTemplateWithGateway(request.input as GenerateWorkTemplateInput, { provider, model: request.options?.model });
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
