import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ConversationMessage = {
  sender?: string;
  text?: string;
  timestamp?: string;
  direction?: "candidate" | "me" | "unknown";
};

type RecruitingAiBody = {
  mode:
    | "translate_to_chinese"
    | "translate_to_english"
    | "suggest_replies"
    | "extract_profile"
    | "analyze_conversation"
    | "reply";
  candidateName?: string;
  meName?: string;
  candidateStatus?: string;
  conversationMessages?: ConversationMessage[];
  draftText?: string;
  assistantGoal?: string;
  tone?: string;
  customInstruction?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders });
}

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function buildTranscript(messages: ConversationMessage[]) {
  return messages
    .map((message, index) => {
      const sender = normalizeText(message.sender || `Message ${index + 1}`);
      const text = normalizeText(message.text || "");
      const timestamp = normalizeText(message.timestamp || "");
      const direction = normalizeText(message.direction || "unknown");
      return `- sender: ${sender}\n  direction: ${direction}\n  timestamp: ${timestamp || "Unknown"}\n  text: ${text || "Unknown"}`;
    })
    .join("\n");
}

function latestCandidateMessage(messages: ConversationMessage[]) {
  const candidateMessages = messages.filter((message) => message.direction === "candidate" && message.text);
  const latest = candidateMessages.at(-1) ?? messages.filter((message) => message.text).at(-1);
  return normalizeText(latest?.text || "No candidate message found.");
}

function buildReplyFallback(body: RecruitingAiBody) {
  const candidateName = normalizeText(body.candidateName || "candidate") || "candidate";
  const assistantGoal = normalizeText(body.assistantGoal || "First Reply");
  const tone = normalizeText(body.tone || "Professional");
  const customInstruction = normalizeText(body.customInstruction || "");

  const goalLineMap: Record<string, string> = {
    "First Reply": `Hi ${candidateName}, thanks for reaching out and sharing your background.`,
    "Follow-up": `Hi ${candidateName}, thanks again for your message. I wanted to follow up and keep the conversation moving.`,
    "Ask Experience": `Hi ${candidateName}, thanks for your message. Could you share a bit more about your relevant experience?`,
    "Ask Availability": `Hi ${candidateName}, thanks for your message. Could you let me know your daily availability for this type of work?`,
    "Ask Rate": `Hi ${candidateName}, thanks for your message. Could you share your expected hourly rate?`,
    "Explain Work Model": `Hi ${candidateName}, thanks for your interest. I want to quickly clarify our working model and how the project is usually organized.`,
    "Keep in Talent Pool": `Hi ${candidateName}, thanks for staying in touch. I’d like to keep you in mind for future opportunities and related projects.`,
    "Screening Invitation": `Hi ${candidateName}, thanks for the conversation. I’d like to invite you to the next screening step when you’re ready.`,
    "Close Politely": `Hi ${candidateName}, thank you for the conversation and for sharing your background. I appreciate your time.`,
    Custom: `Hi ${candidateName}, thanks for your message. I’d like to continue the conversation based on your background and availability.`,
  };

  const baseLine = goalLineMap[assistantGoal] || goalLineMap.Custom;
  const extraLine =
    customInstruction && assistantGoal === "Custom"
      ? `\n\n${customInstruction}`
      : "";
  const englishReply = `${baseLine}\n\nWould you mind sharing any additional details that would help us assess fit for this role?${extraLine}`.trim();

  return {
    englishReply,
    chineseNotes:
      `这是本地 fallback mock 回复，不是真实 AI 生成，用于测试流程。语气：${tone}。回复意图：推进下一步沟通，同时保持在 Upwork 内进行。`,
    nextStep: "Review and copy this reply into Upwork manually.",
    mock: true,
  };
}

function extractJsonBlock(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const segment = trimmed.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(segment);
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function callOpenAI(mode: RecruitingAiBody["mode"], body: RecruitingAiBody) {
  const client = getClient();
  if (!client) {
    if (mode === "reply") {
      return jsonResponse({
        ok: true,
        mode,
        result: buildReplyFallback(body),
      });
    }
    return jsonResponse({ ok: false, error: "OPENAI_API_KEY is not configured." }, 500);
  }

  const conversationMessages = Array.isArray(body.conversationMessages) ? body.conversationMessages : [];
  const candidateName = normalizeText(body.candidateName || "Needs review") || "Needs review";
  const draftText = normalizeText(body.draftText || "");
  const assistantGoal = normalizeText(body.assistantGoal || "First Message");
  const tone = normalizeText(body.tone || "Professional");
  const replyConversationMessages = mode === "reply" ? conversationMessages.slice(-12) : conversationMessages;
  const transcript = buildTranscript(replyConversationMessages);
  const latestMessage = latestCandidateMessage(replyConversationMessages);

  const prompts: Record<
    RecruitingAiBody["mode"],
    {
      system: string;
      user: string;
      shape: Record<string, unknown>;
    }
  > = {
    translate_to_chinese: {
      system:
        "You are a recruiting assistant for BlackDog. Translate the candidate's latest message into natural Chinese and explain the meaning briefly. Return only JSON.",
      user: JSON.stringify(
        {
          candidateName,
          latestCandidateMessage: latestMessage,
          conversationTranscript: transcript,
          outputShape: {
            latestCandidateMessage: "string",
            chineseTranslation: "string",
            meaningNotes: "string",
          },
        },
        null,
        2,
      ),
      shape: {
        latestCandidateMessage: "",
        chineseTranslation: "",
        meaningNotes: "",
      },
    },
    translate_to_english: {
      system:
        "You are a recruiting assistant for BlackDog. Rewrite the HR's draft into natural, professional English suitable for Upwork recruiting chat. Return only JSON.",
      user: JSON.stringify(
        {
          candidateName,
          draftText,
          assistantGoal,
          tone,
          outputShape: {
            englishReply: "string",
            polishedVersion: "string",
          },
        },
        null,
        2,
      ),
      shape: {
        englishReply: "",
        polishedVersion: "",
      },
    },
    suggest_replies: {
      system:
        "You are a recruiting assistant for BlackDog. Write three concise, professional Upwork recruiting replies that move the conversation forward without overpromising. Return only JSON.",
      user: JSON.stringify(
        {
          candidateName,
          assistantGoal,
          tone,
          conversationTranscript: transcript,
          instructions: [
            "Write 3 replies.",
            "Keep the tone professional, natural, and not overly pushy.",
            "Do not promise long-term work, guaranteed hiring, or inflated compensation.",
            "Replies should naturally ask about experience, availability, rate, or screening when appropriate.",
          ],
          outputShape: {
            suggestions: [{ title: "Professional reply", text: "string" }],
          },
        },
        null,
        2,
      ),
      shape: {
        suggestions: [
          { title: "Professional reply", text: "" },
          { title: "Friendly reply", text: "" },
          { title: "Short reply", text: "" },
        ],
      },
    },
    extract_profile: {
      system:
        "You are a recruiting analyst for BlackDog. Extract a cautious candidate profile from the conversation. Do not invent facts. If a field is unclear, use Needs review. Return only JSON.",
      user: JSON.stringify(
        {
          candidateName,
          conversationTranscript: transcript,
          instructions: [
            "Do not hallucinate missing facts.",
            "Use Needs review for uncertain fields.",
            "Return skills as an array of short strings.",
          ],
          outputShape: {
            candidateProfile: {
              candidateName: "string",
              platform: "Upwork",
              language: "string",
              region: "string",
              nativeLevel: "string",
              skills: ["string"],
              hourlyRate: "string",
              availability: "string",
              experienceSummary: "string",
              riskNotes: "string",
              recommendedStatus: "string",
              nextAction: "string",
            },
          },
        },
        null,
        2,
      ),
      shape: {
        candidateProfile: {
          candidateName: "Needs review",
          platform: "Upwork",
          language: "Needs review",
          region: "Needs review",
          nativeLevel: "Needs review",
          skills: ["Needs review"],
          hourlyRate: "Needs review",
          availability: "Needs review",
          experienceSummary: "Needs review",
          riskNotes: "Needs review",
          recommendedStatus: "Needs review",
          nextAction: "Needs review",
        },
      },
    },
    analyze_conversation: {
      system:
        "You are a recruiting analyst for BlackDog. Analyze the conversation for candidate signals and next actions. Return only JSON.",
      user: JSON.stringify(
        {
          candidateName,
          conversationTranscript: transcript,
          outputShape: {
            conversationSummary: "string",
            candidateSignals: ["string"],
            missingInfo: ["string"],
            nextBestQuestion: "string",
            recommendedAction: "string",
          },
        },
        null,
        2,
      ),
      shape: {
        conversationSummary: "",
        candidateSignals: [""],
        missingInfo: [""],
        nextBestQuestion: "",
        recommendedAction: "",
      },
    },
    reply: {
      system:
        "You are a recruiting assistant for BlackDog. Draft a safe, professional Upwork recruiting reply. Do not promise specific tasks, fixed long-term work, guaranteed hiring, or fixed compensation. Keep the conversation on Upwork. Return only JSON.",
      user: JSON.stringify(
        {
          candidateName,
          meName: normalizeText(body.meName || "HR"),
          candidateStatus: normalizeText(body.candidateStatus || "active"),
          assistantGoal,
          tone,
          customInstruction: normalizeText(body.customInstruction || ""),
          conversationTranscript: transcript,
          latestCandidateMessage: latestMessage,
          instructions: [
            "Generate one natural English reply and a short Chinese explanation.",
            "If information is missing, ask about relevant experience, native language/region, daily availability, or expected hourly rate.",
            "Do not suggest off-platform communication.",
            "Do not overpromise or mention guaranteed work.",
          ],
          outputShape: {
            englishReply: "string",
            chineseNotes: "string",
            nextStep: "string",
          },
        },
        null,
        2,
      ),
      shape: {
        englishReply: "",
        chineseNotes: "",
        nextStep: "",
      },
    },
  };

  const prompt = prompts[mode];

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-nano",
      temperature: 0.2,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "";
    const parsed = extractJsonBlock(rawContent) ?? prompt.shape;

    return jsonResponse({
      ok: true,
      mode,
      result: parsed,
    });
  } catch (error) {
    console.error("[recruiting-ai] OpenAI request failed", error);

    const rawMessage = error instanceof Error ? error.message : "Failed to process recruiting AI request.";
    const message = /timed out/i.test(rawMessage)
      ? "OpenAI request timed out. Please retry or check network access."
      : rawMessage || "Failed to process recruiting AI request.";

    if (mode === "reply") {
      return jsonResponse({
        ok: true,
        mode,
        result: buildReplyFallback(body),
      });
    }

    return jsonResponse(
      {
        ok: false,
        error: message,
      },
      500,
    );
  }
}

export async function GET() {
  return jsonResponse({
    ok: true,
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecruitingAiBody;
    if (!body?.mode) {
      return jsonResponse({ ok: false, error: "Invalid recruiting AI request." }, 400);
    }

    return callOpenAI(body.mode, body);
  } catch {
    return jsonResponse({ ok: false, error: "Invalid recruiting AI request." }, 400);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
