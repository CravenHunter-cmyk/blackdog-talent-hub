import OpenAI from "openai";
import type { AIGatewayProvider } from "./types";

export const DEFAULT_AI_MODEL = "gpt-4o-mini";
export const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function hasOpenAIKey() {
  return Boolean(normalizeText(process.env.OPENAI_API_KEY || ""));
}

export function hasDeepSeekKey() {
  return Boolean(normalizeText(process.env.DEEPSEEK_API_KEY || ""));
}

export function resolveOpenAIModel(requestedModel?: string) {
  return normalizeText(requestedModel || process.env.OPENAI_DEFAULT_MODEL || DEFAULT_AI_MODEL) || DEFAULT_AI_MODEL;
}

export function resolveDeepSeekBaseUrl() {
  return stripTrailingSlash(normalizeText(process.env.DEEPSEEK_BASE_URL || DEFAULT_DEEPSEEK_BASE_URL) || DEFAULT_DEEPSEEK_BASE_URL);
}

export function resolveDeepSeekModel(requestedModel?: string) {
  return normalizeText(requestedModel || process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL) || DEFAULT_DEEPSEEK_MODEL;
}

export function normalizeAIGatewayProvider(provider?: string): AIGatewayProvider {
  const normalized = normalizeText(provider || "").toLowerCase();
  if (normalized === "deepseek" || normalized === "deepseek_future") return "deepseek";
  return "openai";
}

export function resolveAIGatewayProvider(requestedProvider?: string): AIGatewayProvider {
  return normalizeAIGatewayProvider(requestedProvider || process.env.AI_PROVIDER || "openai");
}

export function createOpenAIClient() {
  const apiKey = normalizeText(process.env.OPENAI_API_KEY || "");
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}
