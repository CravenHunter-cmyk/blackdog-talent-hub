import OpenAI from "openai";
import type { AIGatewayProvider } from "./types";

export const DEFAULT_AI_MODEL = "gpt-4o-mini";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function hasOpenAIKey() {
  return Boolean(normalizeText(process.env.OPENAI_API_KEY || ""));
}

export function resolveOpenAIModel(requestedModel?: string) {
  return normalizeText(requestedModel || process.env.OPENAI_DEFAULT_MODEL || DEFAULT_AI_MODEL) || DEFAULT_AI_MODEL;
}

export function normalizeAIGatewayProvider(provider?: string): AIGatewayProvider {
  const normalized = normalizeText(provider || "").toLowerCase();
  if (normalized === "deepseek" || normalized === "deepseek_future") return "deepseek_future";
  return "openai";
}

export function createOpenAIClient() {
  const apiKey = normalizeText(process.env.OPENAI_API_KEY || "");
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}
