export type AIGatewayProvider = "openai" | "deepseek";

export type AIGatewayTask =
  | "health_check"
  | "analyze_project"
  | "match_talents"
  | "generate_recruiting_task"
  | "generate_script"
  | "extract_profile"
  | "summarize_chat"
  | "translate_message"
  | "chat_reply_suggestion";

export type AIGatewayRequest = {
  task: AIGatewayTask;
  input: Record<string, unknown>;
  options?: {
    provider?: AIGatewayProvider;
    model?: string;
  };
};

export type AnalyzeProjectInput = {
  clientName?: string;
  projectName?: string;
  projectType?: string;
  targetMarket?: string;
  description?: string;
  priority?: string;
  budgetLevel?: string;
};

export type AnalyzeProjectResult = {
  projectSummary: string;
  projectDifficulty: string;
  requiredCapabilities: string[];
  recommendedTalentPersonas: string[];
  languagePlan: string[];
  matchingConsiderations: string[];
  recruitingGapLogic: string[];
  risks: string[];
  nextSteps: string[];
};

export type ChatReplySuggestionInput = {
  candidateName?: string;
  meName?: string;
  conversationMessages?: unknown[];
  projectName?: string;
  goal?: string;
  tone?: string;
  customInstruction?: string;
};

export type ChatReplySuggestionResult = {
  englishReply: string;
  chineseSummary: string;
  recommendedNextStep: string;
};

export type ExtractProfileInput = {
  candidateName?: string;
  conversationMessages?: unknown[];
  existingProfile?: Record<string, unknown>;
};

export type ExtractProfileResult = {
  nativeLanguage: string;
  secondLanguage: string;
  mainSkill: string;
  experienceSummary: string;
  dailyAvailability: string;
  weekendAvailability: string;
  email: string;
  onlineContactMethod: string;
  onlineContactAccount: string;
  profileUrl?: string;
};

export type TranslateMessageInput = {
  sourceLanguage?: string;
  targetLanguage?: string;
  text?: string;
  context?: string | unknown[];
};

export type TranslateMessageResult = {
  translatedText: string;
};

export type AIGatewayHealthSuccess = {
  ok: true;
  provider: AIGatewayProvider;
  model: string;
  message?: string;
};

export type AIGatewayHealthFailure = {
  ok: false;
  provider: AIGatewayProvider;
  error: string;
};

export type AIGatewayAnalyzeSuccess = {
  ok: true;
  task: "analyze_project";
  provider: AIGatewayProvider;
  model: string;
  text: string;
  result: AnalyzeProjectResult;
};

export type AIGatewayTaskResultMap = {
  chat_reply_suggestion: ChatReplySuggestionResult;
  extract_profile: ExtractProfileResult;
  translate_message: TranslateMessageResult;
};

export type AIGatewayTaskSuccess<TTask extends keyof AIGatewayTaskResultMap = keyof AIGatewayTaskResultMap> = {
  ok: true;
  task: TTask;
  provider: AIGatewayProvider;
  model: string;
  text: string;
  result: AIGatewayTaskResultMap[TTask];
};

export type AIGatewayError = {
  ok: false;
  task?: AIGatewayTask;
  provider: AIGatewayProvider;
  error: string;
  debugRaw?: string;
};
