export type AIGatewayProvider = "openai" | "deepseek_future";

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

export type AIGatewayHealthSuccess = {
  ok: true;
  provider: AIGatewayProvider;
  model: string;
  message: string;
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
  result: AnalyzeProjectResult;
};

export type AIGatewayError = {
  ok: false;
  task?: AIGatewayTask;
  provider: AIGatewayProvider;
  error: string;
  debugRaw?: string;
};
