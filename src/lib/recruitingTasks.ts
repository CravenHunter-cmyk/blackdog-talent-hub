export type RecruitingTaskStatus = "Draft" | "In Progress" | "Locked" | "Completed";

export type RecruitingTaskScriptType =
  | "Initial Greeting"
  | "Experience Check"
  | "Availability Check"
  | "Task Explanation"
  | "Follow-up"
  | "Closing";

export type RecruitingTaskScript = {
  scriptId: string;
  title: string;
  type: RecruitingTaskScriptType;
  content: string;
  taskId: string;
  taskName: string;
  languages: string[];
  updatedAt: string;
};

export type RecruitingTask = {
  taskId: string;
  taskName: string;
  status: RecruitingTaskStatus;
  startDate: string;
  endDate: string;
  creatorAccount: string;
  creatorName: string;
  requiredLanguages: string[];
  assignedHrAccounts: string[];
  description: string;
  scripts: RecruitingTaskScript[];
  createdAt: string;
  updatedAt: string;
  lockedAt?: string;
};

const STORAGE_KEY = "blackdog_recruiting_tasks";

function normalize(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function nowIso() {
  return new Date().toISOString();
}

const DEFAULT_RECRUITING_TASKS: RecruitingTask[] = [
  {
    taskId: "task-japanese-llm-evaluator",
    taskName: "Native LLM Evaluator Recruitment - Japanese",
    status: "In Progress",
    startDate: "2026-04-20",
    endDate: "2026-06-30",
    creatorAccount: "julie",
    creatorName: "Julie Zhu",
    requiredLanguages: ["Japanese"],
    assignedHrAccounts: ["hr_japan_01"],
    description: "Recruit Japanese evaluators for language coverage, response quality, and safety review.",
    scripts: [
      {
        scriptId: "script-japanese-greeting",
        title: "Japanese Initial Greeting",
        type: "Initial Greeting",
        content:
          "Hi, thanks for your interest in our Native LLM Evaluator Recruitment project. Could you briefly share your recent LLM evaluation experience and daily availability?",
        taskId: "task-japanese-llm-evaluator",
        taskName: "Native LLM Evaluator Recruitment - Japanese",
        languages: ["Japanese"],
        updatedAt: "2026-04-27 09:55",
      },
    ],
    createdAt: "2026-04-20 09:00",
    updatedAt: "2026-04-27 10:15",
  },
  {
    taskId: "task-latam-localization",
    taskName: "LATAM Localization & Safety Recruitment",
    status: "Draft",
    startDate: "2026-04-18",
    endDate: "2026-06-15",
    creatorAccount: "julie",
    creatorName: "Julie Zhu",
    requiredLanguages: ["Spanish Mexico", "Portuguese Brazil"],
    assignedHrAccounts: ["hr_japan_01"],
    description: "Localization QA and safety review recruitment across LATAM language coverage.",
    scripts: [
      {
        scriptId: "script-latam-open",
        title: "LATAM project opening",
        type: "Task Explanation",
        content:
          "We’re expanding Spanish and Portuguese coverage for localization QA and safety review. Please share your relevant examples.",
        taskId: "task-latam-localization",
        taskName: "LATAM Localization & Safety Recruitment",
        languages: ["Spanish Mexico", "Portuguese Brazil"],
        updatedAt: "2026-04-26 16:10",
      },
    ],
    createdAt: "2026-04-18 11:30",
    updatedAt: "2026-04-27 08:40",
  },
  {
    taskId: "task-apac-search",
    taskName: "APAC Search Quality Recruitment",
    status: "Completed",
    startDate: "2026-04-19",
    endDate: "2026-07-01",
    creatorAccount: "julie",
    creatorName: "Julie Zhu",
    requiredLanguages: ["Japanese", "Korean", "Vietnamese"],
    assignedHrAccounts: ["hr_japan_01"],
    description: "Search quality and evaluation recruitment for APAC languages.",
    scripts: [
      {
        scriptId: "script-apac-intro",
        title: "APAC search quality intro",
        type: "Experience Check",
        content:
          "We are reviewing candidates for APAC search quality coverage. Please confirm your language scope and testing experience.",
        taskId: "task-apac-search",
        taskName: "APAC Search Quality Recruitment",
        languages: ["Japanese", "Korean", "Vietnamese"],
        updatedAt: "2026-04-26 17:20",
      },
    ],
    createdAt: "2026-04-19 14:20",
    updatedAt: "2026-04-27 11:05",
    lockedAt: "2026-04-27 11:05",
  },
];

export function initializeDefaultRecruitingTasks() {
  return DEFAULT_RECRUITING_TASKS.map((task) => ({
    ...task,
    requiredLanguages: [...task.requiredLanguages],
    assignedHrAccounts: [...task.assignedHrAccounts],
    scripts: task.scripts.map((script) => ({ ...script, languages: [...script.languages] })),
  }));
}

function normalizeTaskRecord(record: Partial<RecruitingTask> & { taskId?: string; id?: string }): RecruitingTask | null {
  const taskId = normalize(record.taskId || record.id || "");
  const taskName = normalize(record.taskName || "");
  const status = record.status === "Draft" || record.status === "In Progress" || record.status === "Locked" || record.status === "Completed"
    ? record.status
    : "Draft";
  if (!taskId || !taskName) return null;

  const scripts = Array.isArray(record.scripts)
    ? record.scripts
        .map((script) => {
          const title = normalize((script as RecruitingTaskScript).title);
          const content = normalize((script as RecruitingTaskScript).content);
          const type = (script as RecruitingTaskScript).type;
          const scriptId = normalize((script as RecruitingTaskScript).scriptId || "");
          if (!title || !content || !scriptId) return null;
          return {
            scriptId,
            title,
            type:
              type === "Initial Greeting" ||
              type === "Experience Check" ||
              type === "Availability Check" ||
              type === "Task Explanation" ||
              type === "Follow-up" ||
              type === "Closing"
                ? type
                : "Task Explanation",
            content,
            taskId,
            taskName,
            languages: Array.isArray((script as RecruitingTaskScript).languages)
              ? (script as RecruitingTaskScript).languages.map((item) => normalize(item)).filter(Boolean)
              : [],
            updatedAt: normalize((script as RecruitingTaskScript).updatedAt || nowIso()) || nowIso(),
          } satisfies RecruitingTaskScript;
        })
        .filter((item): item is RecruitingTaskScript => Boolean(item))
    : [];

  return {
    taskId,
    taskName,
    status,
    startDate: normalize(record.startDate || ""),
    endDate: normalize(record.endDate || ""),
    creatorAccount: normalize(record.creatorAccount || ""),
    creatorName: normalize(record.creatorName || ""),
    requiredLanguages: Array.isArray(record.requiredLanguages)
      ? record.requiredLanguages.map((item) => normalize(item)).filter(Boolean)
      : [],
    assignedHrAccounts: Array.isArray(record.assignedHrAccounts)
      ? record.assignedHrAccounts.map((item) => normalize(item)).filter(Boolean)
      : [],
    description: normalize(record.description || ""),
    scripts,
    createdAt: normalize(record.createdAt || nowIso()) || nowIso(),
    updatedAt: normalize(record.updatedAt || nowIso()) || nowIso(),
    lockedAt: normalize(record.lockedAt || "") || undefined,
  };
}

export function getStoredRecruitingTasks(): RecruitingTask[] {
  if (typeof window === "undefined") return initializeDefaultRecruitingTasks();

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const defaults = initializeDefaultRecruitingTasks();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      const defaults = initializeDefaultRecruitingTasks();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }

    const normalized = parsed
      .map((item) => normalizeTaskRecord(item as Partial<RecruitingTask>))
      .filter((item): item is RecruitingTask => Boolean(item));

    if (!normalized.length) {
      const defaults = initializeDefaultRecruitingTasks();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }

    return normalized;
  } catch {
    const defaults = initializeDefaultRecruitingTasks();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
}

export function saveStoredRecruitingTasks(tasks: RecruitingTask[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function getAllRecruitingTaskScripts(tasks: RecruitingTask[]) {
  return tasks.flatMap((task) =>
    task.scripts.map((script) => ({
      title: script.title,
      content: script.content,
      taskId: task.taskId,
      taskName: task.taskName,
      updatedAt: script.updatedAt,
      type: script.type,
      languages: script.languages,
    })),
  );
}
