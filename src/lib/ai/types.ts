export type AIGatewayProvider = "openai" | "deepseek";

export type AIGatewayTask =
  | "health_check"
  | "analyze_project"
  | "match_talents"
  | "generate_recruiting_task"
  | "generate_work_template"
  | "generate_script"
  | "extract_profile"
  | "summarize_chat"
  | "translate_message"
  | "analyze_management_focus"
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
  chineseReply?: string;
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

export type GenerateWorkTemplateInput = {
  projectName?: string;
  taskType?: string;
  filesSummary?: string;
  sampleColumns?: string[];
  sopSummary?: string;
  userInstruction?: string;
};

export type WorkTemplateFieldType = "text" | "image_url" | "number" | "select" | "textarea";

export type WorkTemplateInputField = {
  key: string;
  label: string;
  type: WorkTemplateFieldType;
  sourceColumn?: string;
  readonly?: boolean;
};

export type WorkTemplateOutputField = {
  key: string;
  label: string;
  type: WorkTemplateFieldType;
  options?: string[];
  required?: boolean;
  targetColumn?: string;
};

export type GenerateWorkTemplateResult = {
  templateName: string;
  taskType: string;
  inputSchema: WorkTemplateInputField[];
  outputSchema: WorkTemplateOutputField[];
  uiLayout: {
    leftPanel: string;
    centerPanel: string;
    rightPanel: string;
  };
  validationRules: string[];
  workflowRules: string[];
  rolePermissions: {
    pm: string[];
    teamLeader: string[];
    labeler: string[];
    qc: string[];
    rechecker: string[];
  };
  exportMapping: Record<string, string>;
};

export type ManagementFocusAlertResult = {
  focusAlerts: {
    language?: {
      id: string;
      focusItem: string;
      focusType: "Language";
      riskLevel: "Critical" | "High" | "Medium" | "Low" | "Healthy";
      riskAlert: string;
      reason: string;
      businessImpact: string;
      recommendedActions: string[];
    };
    project?: {
      id: string;
      focusItem: string;
      focusType: "Project";
      riskLevel: "Critical" | "High" | "Medium" | "Low" | "Healthy";
      riskAlert: string;
      reason: string;
      businessImpact: string;
      recommendedActions: string[];
    };
    hr?: {
      id: string;
      focusItem: string;
      focusType: "HR";
      riskLevel: "Critical" | "High" | "Medium" | "Low" | "Healthy";
      riskAlert: string;
      reason: string;
      businessImpact: string;
      recommendedActions: string[];
    };
  };
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
  generate_work_template: GenerateWorkTemplateResult;
  translate_message: TranslateMessageResult;
  analyze_management_focus: ManagementFocusAlertResult;
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
