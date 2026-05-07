export type BrainProjectPriority = "Normal" | "Urgent" | "High Priority";
export type BrainProjectBudget = "Low" | "Medium" | "High" | "Premium";
export type BrainProjectStatus = "Draft" | "Analyzing" | "Matching" | "Recruiting" | "Ready" | "Completed" | "Locked";

export type BrainProjectAnalysis = {
  projectSummary: string;
  projectDifficulty: string;
  requiredCapability: string;
  requiredCapabilities?: string[];
  deliveryRisk: string;
  resourceStrategy: string;
  recommendedTalentPersonas?: string[];
  languagePlan?: string[];
  risks?: string[];
  nextSteps?: string[];
  hrAssignmentLogic: string;
  inferredLanguages: string[];
};

export type BrainProjectRecord = {
  brainProjectId: string;
  clientName: string;
  projectName: string;
  projectType: string;
  targetMarketRegion: string;
  projectDescription: string;
  requiredSkills: string[];
  expectedStartDate: string;
  expectedEndDate: string;
  deliveryPriority: BrainProjectPriority;
  budgetLevel: BrainProjectBudget;
  notes: string;
  createdAt: string;
  updatedAt: string;
  status?: BrainProjectStatus;
  previousStatus?: Exclude<BrainProjectStatus, "Locked">;
  analysis?: BrainProjectAnalysis;
};

export type BrainRulesRecord = {
  content: string;
  updatedAt: string;
};

const PROJECTS_STORAGE_KEY = "blackdog_brain_projects";
const RULES_STORAGE_KEY = "blackdog_brain_rules";

function createProjectAnalysis(summary: string, difficulty: string, capability: string, risk: string, strategy: string, hrLogic: string, inferredLanguages: string[]): BrainProjectAnalysis {
  return {
    projectSummary: summary,
    projectDifficulty: difficulty,
    requiredCapability: capability,
    deliveryRisk: risk,
    resourceStrategy: strategy,
    hrAssignmentLogic: hrLogic,
    inferredLanguages,
  };
}

function createDefaultBrainProjects(nowIso = new Date().toISOString()): BrainProjectRecord[] {
  return [
    {
      brainProjectId: "brain-project-bytedance-global-llm-evaluation",
      clientName: "ByteDance",
      projectName: "Global LLM Evaluation - German & English",
      projectType: "LLM Evaluation",
      targetMarketRegion: "Europe + North America",
      projectDescription: "Recruit native German and English evaluators for multilingual LLM response quality evaluation.",
      requiredSkills: ["LLM Evaluation", "QA Review", "Guideline Discipline"],
      expectedStartDate: "2026-05-06",
      expectedEndDate: "2026-05-20",
      deliveryPriority: "High Priority",
      budgetLevel: "High",
      notes: "High priority multilingual evaluation with strong quality and backup coverage requirements.",
      createdAt: nowIso,
      updatedAt: nowIso,
      status: "Recruiting",
      analysis: createProjectAnalysis(
        "LLM Evaluation for ByteDance targeting Europe and North America with German and English coverage.",
        "High",
        "Native German and English evaluators with strong guideline discipline, clear judgment, and QA review readiness.",
        "High priority delivery and multiple locale coverage increase coordination and QA risk.",
        "Use a primary evaluator plus backup coverage and keep senior review on standby.",
        "Assign a primary HR owner, then split language coverage only when capacity and quality thresholds are stable.",
        ["German - Germany", "English - UK", "English - North American"],
      ),
    },
    {
      brainProjectId: "brain-project-xiaohongshu-latam-localization-qa",
      clientName: "Xiaohongshu",
      projectName: "LATAM Localization QA Talent Matching",
      projectType: "Localization QA",
      targetMarketRegion: "Mexico + Brazil",
      projectDescription: "Match Spanish Mexico and Portuguese Brazil localization QA reviewers with cultural knowledge.",
      requiredSkills: ["Localization QA", "Cultural Review", "Translation Review"],
      expectedStartDate: "2026-05-03",
      expectedEndDate: "2026-05-18",
      deliveryPriority: "Normal",
      budgetLevel: "Medium",
      notes: "Focus on regional nuance and practical QA review coverage.",
      createdAt: nowIso,
      updatedAt: nowIso,
      status: "Matching",
      analysis: createProjectAnalysis(
        "Localization QA for LATAM coverage with Spanish Mexico and Portuguese Brazil talent requirements.",
        "Medium",
        "Native locale reviewers with translation quality awareness, cultural nuance, and formatting review capability.",
        "Regional nuance and QA coordination create moderate delivery risk.",
        "Use steady coverage with periodic QA and bilingual backup where stable.",
        "Assign the current HR owner and only split languages when quality thresholds stay stable.",
        ["Spanish - Mexico", "Portuguese - Brazil"],
      ),
    },
    {
      brainProjectId: "brain-project-internal-pilot-apac-search-quality",
      clientName: "Internal Pilot",
      projectName: "APAC Search Quality Evaluator Pool",
      projectType: "Search Evaluation",
      targetMarketRegion: "Japan + Korea + Vietnam",
      projectDescription: "Build a searchable pool of APAC native search quality evaluators with availability and task experience.",
      requiredSkills: ["Search Evaluation", "Relevance Judgment", "Quality Review"],
      expectedStartDate: "2026-05-08",
      expectedEndDate: "2026-06-01",
      deliveryPriority: "High Priority",
      budgetLevel: "Medium",
      notes: "Ready pool should stay stable and include backup reviewers.",
      createdAt: nowIso,
      updatedAt: nowIso,
      status: "Ready",
      analysis: createProjectAnalysis(
        "Search evaluation pilot for APAC coverage with Japan, Korea, and Vietnam talent pools.",
        "High",
        "Search evaluators with relevance judgment skills, localization sensitivity, and fast decision making.",
        "Multiple APAC locales require careful coordination and workload balancing.",
        "Use strong native-first coverage, a senior QA layer, and backup talent for surge requests.",
        "Assign the current HR owner and keep bilingual coverage limited to stable combinations.",
        ["Japanese - Japan", "Korean - South Korea", "Vietnamese - Vietnam"],
      ),
    },
  ];
}

export const DEFAULT_BRAIN_RULES = `Matching Brain Rules

- Prioritize native language fit.
- Consider second language only when the task allows it.
- Check availability before recommending talent.
- Avoid assigning people already overloaded on active tasks.
- Consider project type and required skill.
- Consider historical quality and accepted profiles.
- Consider time zone and delivery urgency.
- If talent pool is insufficient, generate recruiting tasks.
- Prefer stable candidates for high-priority projects.
- Use the backup pool for urgent delivery.
`;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeArray(values: string[] = []) {
  return values.map((value) => normalizeText(value)).filter(Boolean);
}

export function createBrainProjectId() {
  return `brain-project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getStoredBrainProjects(): BrainProjectRecord[] {
  const records = readJson<BrainProjectRecord[]>(PROJECTS_STORAGE_KEY, []);
  const normalized = Array.isArray(records)
    ? records
        .map((item) => ({
          ...item,
          brainProjectId: normalizeText(item.brainProjectId),
          clientName: normalizeText(item.clientName),
          projectName: normalizeText(item.projectName),
          projectType: normalizeText(item.projectType),
          targetMarketRegion: normalizeText(item.targetMarketRegion),
          projectDescription: normalizeText(item.projectDescription),
          requiredSkills: normalizeArray(item.requiredSkills),
          expectedStartDate: normalizeText(item.expectedStartDate),
          expectedEndDate: normalizeText(item.expectedEndDate),
          deliveryPriority:
            item.deliveryPriority === "Normal" || item.deliveryPriority === "Urgent" || item.deliveryPriority === "High Priority"
              ? item.deliveryPriority
              : "Normal",
          budgetLevel: item.budgetLevel === "Low" || item.budgetLevel === "Medium" || item.budgetLevel === "High" || item.budgetLevel === "Premium"
            ? item.budgetLevel
            : "Medium",
          notes: normalizeText(item.notes),
          createdAt: normalizeText(item.createdAt),
          updatedAt: normalizeText(item.updatedAt),
          status:
            item.status === "Draft" ||
            item.status === "Analyzing" ||
            item.status === "Matching" ||
            item.status === "Recruiting" ||
            item.status === "Ready" ||
            item.status === "Completed" ||
            item.status === "Locked"
              ? item.status
              : undefined,
          previousStatus:
            item.previousStatus === "Draft" ||
            item.previousStatus === "Analyzing" ||
            item.previousStatus === "Matching" ||
            item.previousStatus === "Recruiting" ||
            item.previousStatus === "Ready" ||
            item.previousStatus === "Completed"
              ? item.previousStatus
              : undefined,
        }))
        .filter((item) => Boolean(item.brainProjectId && item.projectName))
    : [];

  if (typeof window !== "undefined" && normalized.length === 0) {
    const defaults = createDefaultBrainProjects();
    writeJson(PROJECTS_STORAGE_KEY, defaults);
    return defaults;
  }

  return normalized;
}

export function saveStoredBrainProjects(projects: BrainProjectRecord[]) {
  writeJson(PROJECTS_STORAGE_KEY, projects);
}

export function getStoredBrainRules(): BrainRulesRecord {
  if (typeof window === "undefined") {
    return { content: DEFAULT_BRAIN_RULES, updatedAt: new Date().toISOString() };
  }

  const raw = window.localStorage.getItem(RULES_STORAGE_KEY);
  if (!raw) {
    const defaults = { content: DEFAULT_BRAIN_RULES, updatedAt: new Date().toISOString() };
    writeJson(RULES_STORAGE_KEY, defaults);
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<BrainRulesRecord>;
    const content = normalizeText(parsed.content || DEFAULT_BRAIN_RULES);
    const updatedAt = normalizeText(parsed.updatedAt || new Date().toISOString());
    return { content: content || DEFAULT_BRAIN_RULES, updatedAt };
  } catch {
    const defaults = { content: DEFAULT_BRAIN_RULES, updatedAt: new Date().toISOString() };
    writeJson(RULES_STORAGE_KEY, defaults);
    return defaults;
  }
}

export function saveStoredBrainRules(rules: BrainRulesRecord) {
  writeJson(RULES_STORAGE_KEY, {
    content: normalizeText(rules.content || DEFAULT_BRAIN_RULES),
    updatedAt: normalizeText(rules.updatedAt || new Date().toISOString()),
  });
}
