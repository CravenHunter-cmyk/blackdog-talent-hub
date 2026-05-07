"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, ReactNode } from "react";
import Image from "next/image";
import { TopNav } from "@/components/layout/TopNav";
import {
  RECRUITING_LANGUAGE_OPTIONS,
  canonicalRecruitingLanguageLabel,
  findRecruitingLanguageOption,
  rankRecruitingLanguageOption,
} from "@/lib/languageOptions";
import { recruitingCandidates } from "@/data/recruitingCandidates";
import { readLoggedInSession } from "@/lib/currentUser";
import { DEFAULT_LOCAL_ACCOUNTS, getStoredAccounts, updateStoredAccount, type LocalAccount } from "@/lib/localAccounts";
import {
  getAllRecruitingTaskScripts,
  getStoredRecruitingTasks,
  initializeDefaultRecruitingTasks,
  saveStoredRecruitingTasks,
  type RecruitingTask,
  type RecruitingTaskScript,
} from "@/lib/recruitingTasks";

type PageTab = "Overview" | "Recruiting Tasks" | "Personal Center" | "Plugin Workspace";

type LanguageRecruitmentRow = {
  language: string;
  region: string;
  requiredTalents: number;
  currentTalentPool: number;
  remainingNeeded: number;
  progress: number;
  status: "Not Started" | "In Progress" | "Nearly Done" | "Completed" | "Needs Attention";
};

type ProjectScript = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

type TaskScriptDraft = {
  scriptId: string;
  content: string;
};

type RecruitmentProjectLanguage = {
  language: string;
  region: string;
  requiredCount: number;
  currentCount: number;
  remainingCount: number;
};

type RecruitmentProject = {
  projectId: string;
  projectName: string;
  clientAccount: string;
  projectType: string;
  description: string;
  startDate: string;
  endDate: string;
  ownerHrName: string;
  assignedHrNames: string[];
  languages: RecruitmentProjectLanguage[];
  fixedScripts: ProjectScript[];
  status: "Draft" | "In Progress" | "Locked" | "Completed";
  createdAt: string;
  updatedAt: string;
  notes: string;
};

type HrProgressRow = {
  hrName: string;
  assignedProjects: string[];
  assignedLanguages: string[];
  submittedProfiles: number;
  acceptedProfiles: number;
  todayAdded: number;
  status: "Active" | "Needs Review" | "Idle";
};

type ProjectScriptDraft = {
  title: string;
  content: string;
  editingScriptId: string | null;
};

type ProjectFormDraft = {
  taskName: string;
  startDate: string;
  endDate: string;
  taskCreatorName: string;
  requiredLanguages: string[];
  assignedHrAccounts: string[];
  description: string;
  scripts: TaskScriptDraft[];
};

type PluginSubmissionRecord = {
  id: string;
  candidateName: string;
  projectName: string;
  hrName: string;
  status: "Success" | "Failed" | "Pending";
  submittedAt: string;
  notes: string;
};

function normalizeRecruitingLanguageSelection(values: string[] = []) {
  const seen = new Set<string>();
  return values
    .map((value) => canonicalRecruitingLanguageLabel(value))
    .filter((value) => {
      if (!value) return false;
      const normalized = value.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

function recruitingLanguageToProjectLanguage(value: string): RecruitmentProjectLanguage {
  const option = findRecruitingLanguageOption(value);
  if (option) {
    return {
      language: option.language,
      region: option.region || "Global",
      requiredCount: 1,
      currentCount: 0,
      remainingCount: 1,
    };
  }

  const normalized = String(value || "").trim();
  const hyphenMatch = normalized.match(/^(.+?)\s*-\s*(.+)$/);
  if (hyphenMatch) {
    return {
      language: hyphenMatch[1].trim() || "Unknown",
      region: hyphenMatch[2].trim() || "Global",
      requiredCount: 1,
      currentCount: 0,
      remainingCount: 1,
    };
  }

  return {
    language: normalized || "Unknown",
    region: "Global",
    requiredCount: 1,
    currentCount: 0,
    remainingCount: 1,
  };
}

function projectLanguageToRecruitingLabel(language: RecruitmentProjectLanguage) {
  const candidates = [
    `${language.language} - ${language.region}`.trim(),
    `${language.language} (${language.region})`.trim(),
    `${language.language} ${language.region}`.trim(),
    language.language,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const option = findRecruitingLanguageOption(candidate);
    if (option) return option.label;
  }

  return candidates[0] || "Unknown";
}

const languageRecruitmentProgressSeed: Omit<LanguageRecruitmentRow, "progress" | "status" | "remainingNeeded">[] = [
  { language: "English", region: "UK + North America", requiredTalents: 12, currentTalentPool: 8 },
  { language: "Spanish", region: "Mexico + Latin America", requiredTalents: 8, currentTalentPool: 6 },
  { language: "Portuguese", region: "Brazil", requiredTalents: 6, currentTalentPool: 4 },
  { language: "French", region: "France + Canada", requiredTalents: 5, currentTalentPool: 5 },
  { language: "German", region: "DACH", requiredTalents: 4, currentTalentPool: 2 },
  { language: "Japanese", region: "Japan", requiredTalents: 4, currentTalentPool: 3 },
  { language: "Korean", region: "South Korea", requiredTalents: 3, currentTalentPool: 1 },
  { language: "Vietnamese", region: "Vietnam", requiredTalents: 3, currentTalentPool: 2 },
];

const MIN_TASK_SCRIPT_ROWS = 5;

const taskActionButtonBase =
  "inline-flex h-8 min-w-[64px] items-center justify-center rounded-md px-3 text-xs font-semibold transition";
const taskEditButtonClass = `${taskActionButtonBase} border border-[#d7dccf] bg-[#f7f5ef] text-[#111827] hover:bg-[#f0eadc]`;
const taskPauseButtonClass = `${taskActionButtonBase} border border-[#d7dccf] bg-[#eef4ff] text-[#1d4ed8] hover:bg-[#e4efff]`;
const taskLockedButtonClass = `${taskActionButtonBase} border border-[#f0c9c9] bg-[#fff2f2] text-[#b91c1c] hover:bg-[#fdecec]`;
const taskDeleteButtonClass = `${taskActionButtonBase} border border-[#f0c9c9] bg-[#fff2f2] text-[#b91c1c] hover:bg-[#fdecec]`;

const fallbackHrAccounts = DEFAULT_LOCAL_ACCOUNTS.filter((account) => account.role === "hr_user");

function getInitials(value = "") {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2) || "HR"
}

const initialHrProgressRows: HrProgressRow[] = [
  {
    hrName: "Julie Zhu",
    assignedProjects: ["English Evaluation Expansion", "LATAM Localization & Safety"],
    assignedLanguages: ["English", "Spanish", "Portuguese"],
    submittedProfiles: 18,
    acceptedProfiles: 12,
    todayAdded: 4,
    status: "Active",
  },
  {
    hrName: "Sofia Rodriguez",
    assignedProjects: ["LATAM Localization & Safety"],
    assignedLanguages: ["Spanish", "Portuguese"],
    submittedProfiles: 9,
    acceptedProfiles: 5,
    todayAdded: 2,
    status: "Needs Review",
  },
  {
    hrName: "Mei Lin",
    assignedProjects: ["APAC Search Quality"],
    assignedLanguages: ["Japanese", "Korean", "Vietnamese"],
    submittedProfiles: 11,
    acceptedProfiles: 8,
    todayAdded: 3,
    status: "Active",
  },
  {
    hrName: "Daniel Moore",
    assignedProjects: ["English Evaluation Expansion"],
    assignedLanguages: ["English", "French", "German"],
    submittedProfiles: 5,
    acceptedProfiles: 1,
    todayAdded: 0,
    status: "Idle",
  },
];

const createEmptyProjectFormDraft = (): ProjectFormDraft => ({
  taskName: "",
  description: "",
  startDate: "",
  endDate: "",
  taskCreatorName: "Julie Zhu",
  requiredLanguages: ["English"],
  assignedHrAccounts: ["hr_japan_01"],
  scripts: Array.from({ length: MIN_TASK_SCRIPT_ROWS }, (_, index) => ({
    scriptId: `script-form-empty-${index + 1}`,
    content: "",
  })),
});

function createTaskScriptDraftsFromScripts(scripts: ProjectScript[] = []) {
  const nextDrafts = scripts.map((script) => ({
    scriptId: script.id,
    content: script.content,
  }))
  const minimumCount = Math.max(MIN_TASK_SCRIPT_ROWS, nextDrafts.length)
  while (nextDrafts.length < minimumCount) {
    nextDrafts.push({
      scriptId: `script-form-empty-${nextDrafts.length + 1}-${Date.now()}`,
      content: "",
    })
  }
  return nextDrafts
}

function formatPercent(value = 0) {
  if (!Number.isFinite(value)) return "0%"
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`
}

function mapProjectScriptToTaskScript(project: RecruitmentProject, script: ProjectScript): RecruitingTaskScript {
  return {
    scriptId: script.id,
    title: script.title,
    type: "Task Explanation",
    content: script.content,
    taskId: project.projectId,
    taskName: project.projectName,
    languages: project.languages.map((item) => projectLanguageToRecruitingLabel(item)),
    updatedAt: script.updatedAt,
  }
}

function mapProjectToRecruitingTask(project: RecruitmentProject, creatorName = project.ownerHrName): RecruitingTask {
  return {
    taskId: project.projectId,
    taskName: project.projectName,
    status: project.status,
    startDate: project.startDate,
    endDate: project.endDate,
    creatorAccount: creatorName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""),
    creatorName,
    requiredLanguages: project.languages.map((item) => projectLanguageToRecruitingLabel(item)),
    assignedHrAccounts: project.assignedHrNames.map((name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")),
    description: project.description,
    scripts: project.fixedScripts.map((script) => mapProjectScriptToTaskScript(project, script)),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    lockedAt: project.status === "Completed" ? project.updatedAt : undefined,
  }
}

function mapRecruitingTaskToProject(task: RecruitingTask): RecruitmentProject {
  const languages = task.requiredLanguages.length
    ? task.requiredLanguages.map((language) => {
        const nextLanguage = recruitingLanguageToProjectLanguage(language)
        return {
          ...nextLanguage,
          currentCount: task.status === "Completed" ? 1 : 0,
          remainingCount: task.status === "Completed" ? 0 : 1,
        }
      })
    : [
        {
          language: "English",
          region: "Global",
          requiredCount: 1,
          currentCount: task.status === "Completed" ? 1 : 0,
          remainingCount: task.status === "Completed" ? 0 : 1,
        },
      ]

  return {
    projectId: task.taskId,
    projectName: task.taskName,
    clientAccount: "Recruiting Task",
    projectType: "Recruiting Task",
    description: task.description,
    startDate: task.startDate,
    endDate: task.endDate,
    ownerHrName: task.creatorName || "Julie Zhu",
    assignedHrNames: task.assignedHrAccounts.length ? task.assignedHrAccounts : ["hr_japan_01"],
    languages,
    fixedScripts: task.scripts.map((script) => ({
      id: script.scriptId,
      title: script.title,
      content: script.content,
      updatedAt: script.updatedAt,
    })),
    status:
      task.status === "Completed"
        ? "Completed"
        : task.status === "Locked"
          ? "Locked"
          : task.status === "Draft"
            ? "Draft"
            : "In Progress",
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    notes: "",
  }
}

function getLanguageRecruitmentStatus(required = 0, current = 0): LanguageRecruitmentRow["status"] {
  if (current <= 0) return "Not Started"
  if (current >= required) return "Completed"
  const progress = required > 0 ? current / required : 0
  if (progress >= 0.8) return "Nearly Done"
  if (progress <= 0.4) return "Needs Attention"
  return "In Progress"
}

function dashboardStatusClass(status = "") {
  const normalized = String(status || "").toLowerCase()
  if (normalized.includes("completed")) return "border-[#1f5c43] bg-[#eef4ee] text-[#1f5c43]"
  if (normalized.includes("locked")) return "border-[#b91c1c] bg-[#fdecec] text-[#b91c1c]"
  if (normalized.includes("draft")) return "border-[#7a7f86] bg-[#f5f6f7] text-[#5f665c]"
  if (normalized.includes("nearly")) return "border-[#c9852b] bg-[#fbf4e7] text-[#c9852b]"
  if (normalized.includes("in progress") || normalized.includes("active")) {
    return "border-[#1d4ed8] bg-[#eef4ff] text-[#1d4ed8]"
  }
  if (normalized.includes("review") || normalized.includes("attention")) {
    return "border-[#b91c1c] bg-[#fdecec] text-[#b91c1c]"
  }
  return "border-[#7a7f86] bg-[#f5f6f7] text-[#5f665c]"
}

function formatAccountRoleLabel(role = "") {
  const normalized = String(role || "").trim().toLowerCase()
  if (normalized === "hr_user") return "HR User"
  if (normalized === "super_admin") return "Super Admin"
  if (normalized === "talent") return "Talent"
  return role
}

function formatAccountStatusLabel(status = "") {
  const normalized = String(status || "").trim().toLowerCase()
  if (normalized === "active") return "Active"
  if (normalized === "locked") return "Locked"
  if (normalized === "invited") return "Invited"
  return status
}

function taskSyncStatusClass(status: string) {
  switch (status) {
    case "Synced":
      return "border-[#1f5c43] bg-[#eef7f1] text-[#1f5c43]"
    case "Pending":
      return "border-[#d9a441] bg-[#fff8e6] text-[#8a5a00]"
    case "Not Synced":
      return "border-[#c2410c] bg-[#fff2e8] text-[#c2410c]"
    default:
      return "border-[#d7dccf] bg-[#f7f5ef] text-[#6f6256]"
  }
}

function getProjectStatus(languages: RecruitmentProjectLanguage[]): RecruitmentProject["status"] {
  const totalRequired = languages.reduce((sum, item) => sum + item.requiredCount, 0)
  const totalCurrent = languages.reduce((sum, item) => sum + item.currentCount, 0)
  if (totalCurrent <= 0) return "Draft"
  if (totalCurrent >= totalRequired) return "Completed"
  const progress = totalRequired > 0 ? totalCurrent / totalRequired : 0
  if (progress >= 0.8) return "In Progress"
  if (progress >= 0.5) return "In Progress"
  return "Draft"
}

function getHrStatusFromRow(row: HrProgressRow): HrProgressRow["status"] {
  const successRate = row.submittedProfiles > 0 ? row.acceptedProfiles / row.submittedProfiles : 0
  if (row.submittedProfiles <= 0) return "Idle"
  if (successRate >= 0.7) return "Active"
  if (successRate >= 0.35) return "Needs Review"
  return "Idle"
}

function statusBadgeClass(status = "") {
  switch (status) {
    case "Reply Ready":
    case "Screening Invited":
      return "border-[#1f5c43] bg-[#eef4ee] text-[#1f5c43]";
    case "Added to Talent Pool":
      return "border-[#5f6f3a] bg-[#f4f7ef] text-[#5f6f3a]";
    case "Needs Follow-up":
      return "border-[#b7791f] bg-[#fbf4e7] text-[#b7791f]";
    case "Replied":
      return "border-[#214d3a] bg-[#edf5f1] text-[#214d3a]";
    default:
      return "border-[#d7dde2] bg-[#fafbfc] text-[#5f665c]";
  }
}

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-[#d7dde2] bg-[#f5f7f8] p-4 shadow-[0_10px_24px_rgba(31,41,51,0.06)]">
      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5f665c]">{label}</div>
      <div className="mt-2 text-3xl font-black tabular-nums text-[#111827]">{value}</div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
  className = "",
  contentClassName = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={`rounded-xl border border-[#d7dccf] bg-[#ffffff] p-5 shadow-[0_12px_28px_rgba(31,41,51,0.08)] ${className}`}>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#111827]">{title}</h2>
        {description ? <p className="mt-1 text-sm text-[#6f6256]">{description}</p> : null}
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

type PluginProfileStatus = "idle" | "success" | "failed";

type PluginPreviewMessage = {
  speaker: "Me" | "Candidate";
  text: string;
  time: string;
};

type PluginPreviewCandidate = {
  name: string;
  language: string;
  region: string;
  totalMessages: number;
  lastMessageTime: string;
  profileStatus: PluginProfileStatus;
  summary: string;
  avatarInitials: string;
};

type PluginWorkspacePreviewData = {
  hrName: string;
  projectName: string;
  connectionStatus: "Connected";
  endpoint: string;
  lastSync: string;
  lastSubmitStatus: string;
  selectedProject: string;
  selectedCandidate: PluginPreviewCandidate;
  closedCandidate: PluginPreviewCandidate;
  selectedScriptTitle: string;
  targetLanguages: string[];
  requiredCount: string;
  scriptOptions: { title: string; content: string }[];
  recentSubmissions: PluginSubmissionRecord[];
  conversationMessages: PluginPreviewMessage[];
  hiddenLowConfidenceBlocks: number;
  noiseBlocksRemoved: number;
  meName: string;
  activeCandidates: PluginPreviewCandidate[];
  closedCandidates: PluginPreviewCandidate[];
  candidateProfile: {
    candidateName: string;
    education: string;
    professionalDomain: string;
    upworkChatUrl: string;
    upworkProfileUrl: string;
    nativeLanguage: string;
    secondLanguage: string;
    skill: string;
    experience: string;
    availability: string;
  };
};

const PLUGIN_WORKSPACE_PREVIEW: PluginWorkspacePreviewData = {
  hrName: "Julie Zhu",
  projectName: "Native LLM Evaluator Recruitment",
  connectionStatus: "Connected",
  endpoint: "http://localhost:3000/api/talent-pool/submit",
  lastSync: "Apr 27, 7:43 PM",
  lastSubmitStatus: "Profile ✓",
  selectedProject: "Native LLM Evaluator Recruitment",
  selectedCandidate: {
    name: "Nayara Ribeiro",
    language: "Chinese",
    region: "China",
    totalMessages: 2,
    lastMessageTime: "7:43 PM",
    profileStatus: "idle",
    summary: "Chinese evaluator with strong coverage for evaluation and QA workflows.",
    avatarInitials: "NR",
  },
  closedCandidate: {
    name: "Lode Nuyts",
    language: "Chinese",
    region: "China",
    totalMessages: 2,
    lastMessageTime: "7:15 PM",
    profileStatus: "success",
    summary: "Closed candidate with submitted profile ready for talent pool review.",
    avatarInitials: "LN",
  },
  targetLanguages: ["Chinese (Simplified)", "Chinese (Traditional)", "English"],
  requiredCount: "6",
  selectedScriptTitle: "Chinese screening opener",
  scriptOptions: [
    {
      title: "Initial Screening Message",
      content:
        "Hi, thanks for your interest in our Native LLM Evaluator Recruitment task. Could you confirm your current availability and any recent evaluation experience?",
    },
    {
      title: "Availability Confirmation",
      content: "Thanks for the quick reply. We are confirming availability and the next screening step.",
    },
    {
      title: "LLM Evaluation Experience Check",
      content: "Could you briefly share your experience with LLM response evaluation, ranking, or QA workflows?",
    },
    {
      title: "Long-term Pool Agreement",
    content: "We may keep strong candidates in a long-term talent pool for future Upwork task needs.",
    },
  ],
  recentSubmissions: [
    {
      id: "plugin-submission-1",
      candidateName: "Nayara Ribeiro",
      projectName: "Native LLM Evaluator Recruitment",
      hrName: "Julie Zhu",
      status: "Success",
      submittedAt: "Apr 27, 7:43 PM",
      notes: "Talent profile submitted successfully.",
    },
    {
      id: "plugin-submission-2",
      candidateName: "Lode Nuyts",
      projectName: "Native LLM Evaluator Recruitment",
      hrName: "Julie Zhu",
      status: "Pending",
      submittedAt: "Apr 27, 7:10 PM",
      notes: "Waiting on final submit confirmation.",
    },
  ],
  conversationMessages: [
    {
      speaker: "Me",
      time: "7:41 PM",
      text: "Hi Nayara, thanks for your interest in our Native LLM Evaluator Recruitment task. Could you confirm your current availability and whether you have worked on LLM evaluation or translation QA before?",
    },
    {
      speaker: "Candidate",
      time: "7:43 PM",
      text: "Hi Julie, yes, I’m interested. I’m a native Chinese speaker and I have experience with translation review, localization QA, and AI response evaluation.",
    },
    {
      speaker: "Me",
      time: "7:45 PM",
      text: "Great. For this task, work may be assigned in stages, and the best-performing evaluators will receive priority for future batches. Would you be comfortable with 2–4 hours per day and occasional weekend work?",
    },
    {
      speaker: "Candidate",
      time: "7:46 PM",
      text: "Yes, I can work around 2–4 hours per day, and weekend tasks are also acceptable if scheduled in advance.",
    },
    {
      speaker: "Me",
      time: "7:48 PM",
      text: "Thanks. I’ll prepare your profile and add you to our talent pool for upcoming Chinese evaluation tasks.",
    },
  ],
  hiddenLowConfidenceBlocks: 1,
  noiseBlocksRemoved: 3,
  meName: "Julie Zhu",
  activeCandidates: [
    {
      name: "Nayara Ribeiro",
      language: "Chinese",
      region: "China",
      totalMessages: 2,
      lastMessageTime: "7:43 PM",
      profileStatus: "idle",
      summary: "Chinese evaluator with strong coverage for evaluation and QA workflows.",
      avatarInitials: "NR",
    },
    {
      name: "Tanchanok Pearl",
      language: "Thai",
      region: "Thailand",
      totalMessages: 3,
      lastMessageTime: "7:31 PM",
      profileStatus: "success",
      summary: "Active Thai candidate with a submitted profile.",
      avatarInitials: "TP",
    },
    {
      name: "Yamane Risa",
      language: "Japanese",
      region: "Japan",
      totalMessages: 1,
      lastMessageTime: "7:04 PM",
      profileStatus: "idle",
      summary: "Japanese candidate in the screening queue.",
      avatarInitials: "YR",
    },
    {
      name: "Lode Nuyts",
      language: "Dutch",
      region: "Netherlands",
      totalMessages: 2,
      lastMessageTime: "6:52 PM",
      profileStatus: "failed",
      summary: "Dutch candidate flagged for retry after failed submission.",
      avatarInitials: "LN",
    },
  ],
  closedCandidates: [
    {
      name: "Carlos Mendes",
      language: "Portuguese-BR",
      region: "Brazil",
      totalMessages: 2,
      lastMessageTime: "6:38 PM",
      profileStatus: "success",
      summary: "Closed candidate with profile already submitted.",
      avatarInitials: "CM",
    },
    {
      name: "Maria Gonzalez",
      language: "Spanish-MX",
      region: "Mexico",
      totalMessages: 1,
      lastMessageTime: "5:42 PM",
      profileStatus: "idle",
      summary: "Closed candidate ready to reopen if needed.",
      avatarInitials: "MG",
    },
  ],
  candidateProfile: {
    candidateName: "Nayara Ribeiro",
    education: "Bachelor’s Degree in Linguistics",
    professionalDomain: "Translation / Localization / LLM Evaluation",
    upworkChatUrl: "https://www.upwork.com/ab/messages/rooms/room_preview_nayara",
    upworkProfileUrl: "https://www.upwork.com/freelancers/~nayara-ribeiro-preview",
    nativeLanguage: "Chinese",
    secondLanguage: "English",
    skill: "LLM Response Evaluation",
    experience:
      "Native Chinese evaluator with experience in LLM response evaluation, translation review, localization QA, and multilingual quality checks. Available for long-term part-time evaluation work.",
    availability: "2–4 hours/day",
  },
};

type PluginWorkspacePreviewProps = {
  scriptOptions?: { title: string; content: string }[];
};

function PluginWorkspacePreview({ scriptOptions }: PluginWorkspacePreviewProps) {
  const data = PLUGIN_WORKSPACE_PREVIEW;
  const nextScriptOptions = scriptOptions?.length ? scriptOptions : data.scriptOptions;
  const selectedScriptTitle = nextScriptOptions[0]?.title ?? data.selectedScriptTitle;
  const shellClass =
    "mx-auto min-w-[920px] max-w-[1120px] rounded-[22px] border border-[#d7dccf] bg-[#f5f1e8] p-3 shadow-[0_16px_36px_rgba(31,41,51,0.12)]";
  const cardClass = "rounded-2xl border border-[#d7dccf] bg-white p-4 shadow-sm";
  const titleClass = "text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1f5c43]";
  const labelClass = "block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]";
  const inputClass =
    "w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-2.5 text-sm text-[#111827] outline-none";
  const actionBase =
    "inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-semibold shadow-sm transition-colors";
  const secondaryAction = "border-[#d7dccf] bg-[#fffdf8] text-[#40372f] hover:bg-[#f6f2e8]";
  const primaryAction = "border-[#0f9d58] bg-[#0f9d58] text-white hover:bg-[#0d8b4f]";
  const compactAction = "px-3 text-xs";

  const profileButtonClass = (status: PluginProfileStatus) => {
    switch (status) {
      case "success":
        return "profile-status-success";
      case "failed":
        return "profile-status-failed";
      default:
        return "profile-status-idle";
    }
  };

  const scriptPreview = nextScriptOptions.find((script) => script.title === selectedScriptTitle) ?? nextScriptOptions[0];

  const renderProfileLabel = (status: PluginProfileStatus) => {
    if (status === "success") return "Profile ✓";
    if (status === "failed") return "Profile !";
    return "Profile";
  };

  const renderCandidateCard = (candidate: PluginPreviewCandidate, closed = false) => (
    <article className="rounded-2xl border border-[#d7dccf] bg-[#fbfaf6] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-sm font-bold text-[#111827]">{candidate.name}</strong>
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
            closed
              ? "border border-[#d7dccf] bg-[#f7f5ef] text-[#6f6256]"
              : "border border-[#cde4d7] bg-[#eff8f1] text-[#1f5c43]"
          }`}
        >
          {closed ? "CLOSED" : "ACTIVE"}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#6f6256]">
        <span>{candidate.language}</span>
        <span>•</span>
        <span>{candidate.region}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={`${actionBase} ${secondaryAction} ${compactAction}`}>
          View
        </button>
        <button type="button" className={`${actionBase} ${secondaryAction} ${compactAction} ${profileButtonClass(candidate.profileStatus)}`}>
          {renderProfileLabel(candidate.profileStatus)}
        </button>
        {closed ? (
          <button type="button" className={`${actionBase} ${secondaryAction} ${compactAction}`}>
            Reopen
          </button>
        ) : (
          <>
            <button type="button" className={`${actionBase} ${secondaryAction} ${compactAction}`}>
              Keep
            </button>
            <button type="button" className={`${actionBase} ${secondaryAction} ${compactAction}`}>
              Close
            </button>
          </>
        )}
      </div>
    </article>
  );

  return (
    <div className="overflow-x-auto">
      <div className={shellClass}>
        <header className={`${cardClass} flex items-center justify-between px-4 py-3`}>
          <strong className="text-[15px] font-extrabold tracking-tight text-[#111827]">BlackDog Helper</strong>
          <span
            className="inline-flex items-center rounded-md border border-[#cde4d7] bg-[#eff8f1] px-2.5 py-1 text-xs font-semibold text-[#1f5c43]"
            data-state="connected"
          >
            Connected
          </span>
        </header>

        <main className="mt-3 space-y-3">
          <section className={cardClass}>
            <div className="mb-4">
              <h2 className={titleClass}>PM Info</h2>
            </div>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Upwork User Name</span>
                  <input className={`${inputClass} mt-1`} type="text" value={data.hrName} readOnly />
                </label>
                <label className="block">
                  <span className={labelClass}>Recruiting Task</span>
                  <select className={`${inputClass} mt-1`} value={data.projectName} disabled>
                    <option>{data.projectName}</option>
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className={`${actionBase} ${secondaryAction}`} type="button">Save</button>
                <button className={`${actionBase} ${primaryAction}`} type="button">Refresh</button>
                <button className={`${actionBase} ${secondaryAction}`} type="button">Debug</button>
                <button className={`${actionBase} ${secondaryAction}`} type="button">Clear Cache</button>
              </div>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <section className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className={titleClass}>Current Conversation</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#d7dccf] bg-[#fbfaf6] px-2.5 py-1 text-xs font-semibold text-[#6f6256]">{data.selectedCandidate.language}</span>
                    <span className="rounded-full border border-[#d7dccf] bg-[#fbfaf6] px-2.5 py-1 text-xs font-semibold text-[#6f6256]">{data.selectedCandidate.region}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button className={`${actionBase} ${secondaryAction} ${compactAction}`} type="button">Chinese</button>
                  <label className="flex items-center gap-2 text-xs font-medium text-[#6f6256]">
                    <input id="conversation-translation-default-expanded" type="checkbox" />
                    <span>Open by default</span>
                  </label>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[["Me", data.meName], ["Candidate", data.selectedCandidate.name], ["Total Messages Captured", String(data.selectedCandidate.totalMessages)], ["Last Message Time", data.selectedCandidate.lastMessageTime]].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-[#d7dccf] bg-[#fbfaf6] px-3 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">{label}</div>
                    <div className="mt-1 text-sm font-bold text-[#111827]">{value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-[#e5dccf] bg-[#fbfaf6] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button id="generate-reply" className={`${actionBase} ${primaryAction} ${compactAction}`} type="button">AI Reply</button>
                </div>

                <label className="mt-4 block">
                  <textarea id="reply-english" className="min-h-[132px] w-full resize-none rounded-lg border border-[#d7dde2] bg-white px-3 py-2.5 text-sm leading-6 text-[#111827] outline-none" placeholder="AI reply will appear here." readOnly value={data.conversationMessages[0]?.text || ""} />
                </label>

                <label className="mt-3 block">
                  <textarea id="reply-chinese" className="min-h-[104px] w-full resize-none rounded-lg border border-[#d7dde2] bg-white px-3 py-2.5 text-sm leading-6 text-[#111827] outline-none" placeholder="输入中文，翻译成英文回复" readOnly value="输入中文，翻译成英文回复" />
                </label>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button id="translate-reply" className={`${actionBase} ${secondaryAction} ${compactAction}`} type="button">Translate</button>
                  <button id="copy-reply" className={`${actionBase} ${secondaryAction} ${compactAction}`} type="button">Copy</button>
                  <button id="clear-reply" className={`${actionBase} ${secondaryAction} ${compactAction}`} type="button">Clear</button>
                  <span id="reply-copy-status" className="text-xs font-semibold text-[#1f5c43]" hidden>Copied</span>
                </div>

                <div id="reply-error" className="mt-2 text-xs font-medium text-[#b42318]" hidden />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#d7dccf] bg-[#fbfaf6] p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Hidden low-confidence blocks</div>
                  <div className="mt-1 text-lg font-black text-[#111827]">{data.hiddenLowConfidenceBlocks}</div>
                </div>
                <div className="rounded-xl border border-[#d7dccf] bg-[#fbfaf6] p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Noise blocks removed</div>
                  <div className="mt-1 text-lg font-black text-[#111827]">{data.noiseBlocksRemoved}</div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {data.conversationMessages.map((message) => (
                  <article key={`${message.speaker}-${message.time}`} className="rounded-2xl border border-[#efe6d8] bg-[#fffdf8] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6256]">{message.speaker}</span>
                      <strong className="text-xs font-semibold text-[#111827]">{message.time}</strong>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#111827]">{message.text}</p>
                  </article>
                ))}
              </div>
            </section>

            <aside className={`${cardClass} space-y-4`}>
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className={titleClass}>Task Scripts</h2>
                    <p className="mt-1 text-xs font-medium text-[#6f6256]">Select a script to preview and copy.</p>
                  </div>
                  <span className="rounded-full border border-[#cde4d7] bg-[#eff8f1] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1f5c43]">Copied</span>
                </div>

                <label className="block">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Select a script</span>
                  <select className={`${inputClass} mt-1`} value={selectedScriptTitle} disabled>
                    {nextScriptOptions.map((script) => (
                      <option key={script.title} value={script.title}>{script.title}</option>
                    ))}
                  </select>
                </label>

                <div className="rounded-2xl border border-[#d7dccf] bg-[#fbfaf6] p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Script Preview</div>
                  <p className="mt-2 text-sm leading-6 text-[#111827]">{scriptPreview?.content}</p>
                </div>
              </section>

              <section className="space-y-3">
                <div><h2 className={titleClass}>Candidate Chats</h2></div>
                <div id="candidate-chats-live-note" className="rounded-xl border border-[#d7dccf] bg-[#fbfaf6] px-3 py-2 text-sm text-[#6f6256]">No active room selected yet.</div>
                <div className="space-y-3">
                  {data.activeCandidates.map((candidate) => renderCandidateCard(candidate))}
                </div>
                <div className="rounded-2xl border border-[#d7dccf] bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f5c43]">Closed Chats</div></div>
                    <button id="clear-closed-chats" className={`${actionBase} ${secondaryAction} ${compactAction}`} type="button">Clear Closed</button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {data.closedCandidates.map((candidate) => renderCandidateCard(candidate, true))}
                  </div>
                </div>
              </section>
            </aside>
          </div>

          <section className="mx-auto mt-4 w-full max-w-[760px] rounded-[24px] border border-[#d7dccf] bg-[#fdfbf5] p-4 shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
            <div className="flex items-center justify-between gap-3 border-b border-[#e6dfd0] pb-3">
              <h2 className="text-[14px] font-black uppercase tracking-[0.18em] text-[#111827]">Talent Profile</h2>
              <button className={`${actionBase} ${secondaryAction} ${compactAction}`} type="button">
                ×
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <section className="space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f5c43]">Basic Info</div>
                <div className="rounded-2xl border border-[#d7dccf] bg-white p-4">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[#d7dccf] bg-[#fbfaf6]">
                      <Image src="/blackdog-mascot.jpg" alt="BlackDog mascot" width={80} height={80} className="h-full w-full object-cover" />
                    </div>
                    <label className="block w-full">
                      <span className={labelClass}>Candidate Name</span>
                      <input className={`${inputClass} mt-1 text-center`} type="text" value={data.candidateProfile.candidateName} readOnly />
                    </label>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className={labelClass}>Education</span>
                      <input className={`${inputClass} mt-1`} type="text" value={data.candidateProfile.education} readOnly />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Professional Domain</span>
                      <input className={`${inputClass} mt-1`} type="text" value={data.candidateProfile.professionalDomain} readOnly />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Upwork Chat URL</span>
                      <input className={`${inputClass} mt-1`} type="text" value={data.candidateProfile.upworkChatUrl} readOnly />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Upwork Profile URL</span>
                      <input className={`${inputClass} mt-1`} type="text" value={data.candidateProfile.upworkProfileUrl} readOnly />
                    </label>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f5c43]">Language</div>
                <div className="rounded-2xl border border-[#d7dccf] bg-white p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className={labelClass}>Native Language</span>
                      <input className={`${inputClass} mt-1`} type="text" value={data.candidateProfile.nativeLanguage} readOnly />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Second Language</span>
                      <input className={`${inputClass} mt-1`} type="text" value={data.candidateProfile.secondLanguage} readOnly />
                    </label>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f5c43]">Skills</div>
                <div className="rounded-2xl border border-[#d7dccf] bg-white p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className={labelClass}>Skill / Task Type</span>
                      <input className={`${inputClass} mt-1`} type="text" value={data.candidateProfile.skill} readOnly />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Experience Summary</span>
                      <textarea className="mt-1 min-h-[120px] w-full resize-none rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-2.5 text-sm leading-6 text-[#111827] outline-none" rows={4} readOnly value={data.candidateProfile.experience} />
                    </label>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f5c43]">Availability</div>
                <div className="rounded-2xl border border-[#d7dccf] bg-white p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className={labelClass}>Daily Availability</span>
                      <input className={`${inputClass} mt-1`} type="text" value={data.candidateProfile.availability} readOnly />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Weekend Availability</span>
                      <input className={`${inputClass} mt-1`} type="text" value="Yes" readOnly />
                    </label>
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-[#e6dfd0] pt-4">
              <button className={`${actionBase} ${secondaryAction} ${compactAction}`} type="button">
                AI Fill from Chat
              </button>
              <button className={`${actionBase} ${secondaryAction} ${compactAction}`} type="button">
                Save Draft
              </button>
              <button className={`${actionBase} ${primaryAction} ${compactAction}`} type="button">
                Save to Talent Pool
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export function RecruitingWorkbenchPage() {
  const [activeTab, setActiveTab] = useState<PageTab>("Overview");
  const [projectListView] = useState<"Card View" | "Table View">("Table View");
  const [recruitmentProjects, setRecruitmentProjects] = useState<RecruitmentProject[]>([]);
  const [projectScriptDrafts, setProjectScriptDrafts] = useState<Record<string, ProjectScriptDraft>>(() =>
    Object.fromEntries(
      initializeDefaultRecruitingTasks().map((project) => [
        project.taskId,
        { title: "", content: "", editingScriptId: null } satisfies ProjectScriptDraft,
      ]),
    ),
  );
  const [selectedCandidateId, setSelectedCandidateId] = useState(recruitingCandidates[0].id);
  const [projectFormDraft, setProjectFormDraft] = useState<ProjectFormDraft>(createEmptyProjectFormDraft);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [taskLanguageSearch, setTaskLanguageSearch] = useState("");
  const [taskLanguageDropdownOpen, setTaskLanguageDropdownOpen] = useState(false);
  const [taskHrSearch, setTaskHrSearch] = useState("");
  const [taskHrDropdownOpen, setTaskHrDropdownOpen] = useState(false);
  const [expandedLanguageRows, setExpandedLanguageRows] = useState<Record<string, boolean>>({});
  const [hrAccounts] = useState<LocalAccount[]>(() => getStoredAccounts());
  const [hrAvatarPreview, setHrAvatarPreview] = useState("");
  const [hrAvatarError, setHrAvatarError] = useState("");
  const [hrAvatarDragActive, setHrAvatarDragActive] = useState(false);
  const [hrAvatarImageFailed, setHrAvatarImageFailed] = useState(false);
  const taskLanguageFieldRef = useRef<HTMLDivElement | null>(null);
  const taskHrFieldRef = useRef<HTMLDivElement | null>(null);
  const hrAvatarInputRef = useRef<HTMLInputElement | null>(null);

  const selectedCandidate =
    recruitingCandidates.find((item) => item.id === selectedCandidateId) ?? recruitingCandidates[0];
  const currentHrSession = readLoggedInSession();
  const currentHrName = currentHrSession?.name || "Julie Zhu";
  const currentHrRow = initialHrProgressRows.find((row) => row.hrName === currentHrName) ?? initialHrProgressRows[0];
  const currentHrOptions = useMemo(() => {
    const storedHrAccounts = hrAccounts.filter((account) => account.role === "hr_user");
    const source = storedHrAccounts.length > 0 ? storedHrAccounts : fallbackHrAccounts;
    return source.map((account) => ({
      accountId: account.accountId,
      loginAccount: account.loginAccount,
      name: account.name,
    }));
  }, [hrAccounts]);
  const hrLookup = useMemo(() => new Map(hrAccounts.map((account) => [account.loginAccount, account])), [hrAccounts]);
  const formatHrAccountLabel = (loginAccount: string) => {
    const account = hrLookup.get(loginAccount)
    return account ? `${account.name} (${account.loginAccount})` : loginAccount
  }
  const selectedTaskLanguages = useMemo(
    () => normalizeRecruitingLanguageSelection(projectFormDraft.requiredLanguages),
    [projectFormDraft.requiredLanguages],
  );
  const filteredRecruitingLanguageOptions = useMemo(
    () => {
      const query = taskLanguageSearch.trim()
      if (!query) return RECRUITING_LANGUAGE_OPTIONS

      return RECRUITING_LANGUAGE_OPTIONS
        .map((option, index) => ({
          option,
          index,
          score: rankRecruitingLanguageOption(option, query),
        }))
        .filter((item) => item.score !== Number.POSITIVE_INFINITY)
        .sort((left, right) => {
          if (left.score !== right.score) return left.score - right.score
          const languageCompare = left.option.language.localeCompare(right.option.language)
          if (languageCompare !== 0) return languageCompare
          const regionCompare = (left.option.region || "").localeCompare(right.option.region || "")
          if (regionCompare !== 0) return regionCompare
          const labelCompare = left.option.label.localeCompare(right.option.label)
          if (labelCompare !== 0) return labelCompare
          return left.index - right.index
        })
        .map((item) => item.option)
    },
    [taskLanguageSearch],
  );
  const filteredHrOptions = useMemo(() => {
    const search = taskHrSearch.trim().toLowerCase();
    if (!search) return currentHrOptions;
    return currentHrOptions.filter(
      (account) => account.name.toLowerCase().includes(search) || account.loginAccount.toLowerCase().includes(search),
    );
  }, [currentHrOptions, taskHrSearch]);
  const pluginWorkspaceScriptOptions = getAllRecruitingTaskScripts(
    recruitmentProjects.map((project) => mapProjectToRecruitingTask(project, currentHrName)),
  ).map((script) => ({
    title: `${script.taskName} — ${script.title}`,
    content: script.content,
  }));

  useEffect(() => {
    if (!recruitmentProjects.length) return;
    const currentUser = readLoggedInSession()?.name || currentHrName;
    saveStoredRecruitingTasks(recruitmentProjects.map((project) => mapProjectToRecruitingTask(project, currentUser)));
  }, [currentHrName, recruitmentProjects]);

  useEffect(() => {
    const storedTasks = getStoredRecruitingTasks();
    const nextTasks = storedTasks.length > 0 ? storedTasks : initializeDefaultRecruitingTasks();
    const nextProjects = nextTasks.map(mapRecruitingTaskToProject);
    const nextDrafts = Object.fromEntries(
      nextProjects.map((project) => [
        project.projectId,
        { title: "", content: "", editingScriptId: null } satisfies ProjectScriptDraft,
      ]),
    );
    window.setTimeout(() => {
      setRecruitmentProjects(nextProjects);
      setProjectScriptDrafts(nextDrafts);
    }, 0);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node | null
      if (taskLanguageDropdownOpen && taskLanguageFieldRef.current && target && !taskLanguageFieldRef.current.contains(target)) {
        setTaskLanguageDropdownOpen(false)
      }
      if (taskHrDropdownOpen && taskHrFieldRef.current && target && !taskHrFieldRef.current.contains(target)) {
        setTaskHrDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [taskHrDropdownOpen, taskLanguageDropdownOpen])

  const languageRecruitmentRows = useMemo(() => {
    return languageRecruitmentProgressSeed.map((row) => {
      const remainingNeeded = Math.max(row.requiredTalents - row.currentTalentPool, 0);
      const progress = row.requiredTalents > 0 ? Math.round((row.currentTalentPool / row.requiredTalents) * 100) : 0;
      return {
        ...row,
        remainingNeeded,
        progress,
        status: getLanguageRecruitmentStatus(row.requiredTalents, row.currentTalentPool),
      } satisfies LanguageRecruitmentRow;
    });
  }, []);

  const dashboardTotals = useMemo(() => {
    const totalRequiredTalents = languageRecruitmentRows.reduce((sum, row) => sum + row.requiredTalents, 0);
    const currentTalentPool = languageRecruitmentRows.reduce((sum, row) => sum + row.currentTalentPool, 0);
    const remainingNeeded = languageRecruitmentRows.reduce((sum, row) => sum + row.remainingNeeded, 0);
    const activeProjects = recruitmentProjects.filter((project) => getProjectStatus(project.languages) !== "Completed").length;
    const activeHrs = initialHrProgressRows.filter((row) => getHrStatusFromRow(row) !== "Idle").length;

    return {
      totalRequiredTalents,
      currentTalentPool,
      remainingNeeded,
      activeProjects,
      activeHrs,
    };
  }, [languageRecruitmentRows, recruitmentProjects]);

  const hrProgressRows = useMemo(() => {
    return initialHrProgressRows.map((row) => ({
      ...row,
      status: getHrStatusFromRow(row),
      successRate: row.submittedProfiles > 0 ? Math.round((row.acceptedProfiles / row.submittedProfiles) * 100) : 0,
    }));
  }, []);

  const currentHrLoginAccount = currentHrSession?.loginAccount || "hr_japan_01";
  const currentHrAccount =
    hrAccounts.find((account) => account.loginAccount === currentHrLoginAccount) ??
    DEFAULT_LOCAL_ACCOUNTS.find((account) => account.loginAccount === currentHrLoginAccount) ??
    hrAccounts.find((account) => account.role === "hr_user") ??
    DEFAULT_LOCAL_ACCOUNTS.find((account) => account.loginAccount === "hr_japan_01") ??
    DEFAULT_LOCAL_ACCOUNTS[0];
  const currentHrDisplayName = currentHrAccount?.name || currentHrSession?.name || currentHrRow.hrName || "Julie Zhu";
  const currentHrRole = formatAccountRoleLabel(currentHrAccount?.role || currentHrSession?.role || "hr_user");
  const currentHrStatus = formatAccountStatusLabel(currentHrAccount?.status || currentHrSession?.status || currentHrRow.status || "Active");
  const currentHrLastLogin = currentHrSession?.loggedInAt || currentHrAccount?.lastLogin || "Not recorded";
  const currentHrAvatarUrl = hrAvatarPreview || currentHrAccount?.avatarUrl || currentHrSession?.avatarUrl || "/blackdog-mascot.jpg";

  function persistHrAvatar(nextAvatarUrl: string) {
    const updatedAt = new Date().toISOString()
    if (currentHrAccount) {
      updateStoredAccount(currentHrAccount.accountId, {
        avatarUrl: nextAvatarUrl,
        updatedAt,
      })
    }

    if (typeof window !== "undefined") {
      const nextSession = {
        ...(currentHrSession || {}),
        avatarUrl: nextAvatarUrl,
      }
      window.localStorage.setItem("blackdog_current_user", JSON.stringify(nextSession))
    }
  }

  function applyHrAvatarFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setHrAvatarError("Please upload an image file.")
      return
    }

    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setHrAvatarError("Image is too large. Please upload an image under 5MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const nextAvatar = String(reader.result || "")
      if (!nextAvatar) {
        setHrAvatarError("Could not read the selected image.")
        return
      }
      setHrAvatarError("")
      setHrAvatarImageFailed(false)
      setHrAvatarPreview(nextAvatar)
      persistHrAvatar(nextAvatar)
    }
    reader.onerror = () => {
      setHrAvatarError("Could not read the selected image.")
    }
    reader.readAsDataURL(file)
  }

  function handleHrAvatarFileSelect(fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file) return
    applyHrAvatarFile(file)
    if (hrAvatarInputRef.current) {
      hrAvatarInputRef.current.value = ""
    }
  }

  function handleHrAvatarDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setHrAvatarDragActive(false)
    handleHrAvatarFileSelect(event.dataTransfer.files)
  }

  const personalCenterTasks = (() => {
    const matchingTasks = recruitmentProjects.filter((project) => project.assignedHrNames.includes(currentHrLoginAccount));
    if (matchingTasks.length > 0) return matchingTasks;
    if (String(currentHrAccount?.role || "").toLowerCase() === "super_admin") return recruitmentProjects;
    const fallbackTasks = currentHrRow.assignedProjects
      .map((taskName) => recruitmentProjects.find((project) => project.projectName === taskName))
      .filter((project): project is RecruitmentProject => Boolean(project));
    return fallbackTasks.length > 0 ? fallbackTasks : recruitmentProjects.slice(0, Math.min(2, recruitmentProjects.length));
  })();

  const personalCenterLanguageRows = (() => {
    const rows = new Map<
      string,
      {
        language: string;
        required: number;
        submitted: number;
        accepted: number;
        pending: number;
        remaining: number;
      }
    >();

    personalCenterTasks.forEach((project) => {
      project.languages.forEach((languageRow) => {
        const key = `${languageRow.language}::${languageRow.region}`;
        const current = rows.get(key) || {
          language: `${languageRow.language} (${languageRow.region})`,
          required: 0,
          submitted: 0,
          accepted: 0,
          pending: 0,
          remaining: 0,
        };
        const required = languageRow.requiredCount;
        const submitted = Math.max(languageRow.currentCount, Math.ceil(required * 0.8));
        const accepted = Math.min(languageRow.currentCount, Math.ceil(submitted * 0.75));
        const pending = Math.max(submitted - accepted, 0);
        const remaining = Math.max(required - accepted, 0);
        rows.set(key, {
          language: current.language,
          required: current.required + required,
          submitted: current.submitted + submitted,
          accepted: current.accepted + accepted,
          pending: current.pending + pending,
          remaining: current.remaining + remaining,
        });
      });
    });

    return Array.from(rows.values()).map((row) => {
      const rate = row.submitted > 0 ? Math.round((row.accepted / row.submitted) * 100) : 0;
      const status =
        row.accepted >= row.required && row.required > 0
          ? "Completed"
          : rate >= 75
            ? "Active"
            : rate >= 50
              ? "Needs Review"
              : "Behind";
      return {
        ...row,
        rate,
        status,
      };
    });
  })();

  const personalCenterSummary = (() => {
    const recruited = personalCenterLanguageRows.reduce((sum, row) => sum + row.submitted, 0);
    const accepted = personalCenterLanguageRows.reduce((sum, row) => sum + row.accepted, 0);
    const pending = personalCenterLanguageRows.reduce((sum, row) => sum + row.pending, 0);
    const remaining = personalCenterLanguageRows.reduce((sum, row) => sum + row.remaining, 0);
    const tasks = personalCenterTasks.length;
    const languages = personalCenterLanguageRows.length;

    return { recruited, accepted, pending, remaining, tasks, languages };
  })();

  const pageTitle =
    activeTab === "Personal Center"
      ? "Personal Center"
      : activeTab === "Plugin Workspace"
        ? "Plugin Workspace"
        : activeTab === "Recruiting Tasks"
          ? "Recruiting Tasks"
          : "Recruiting Hub";

  const pageSubtitle =
    activeTab === "Personal Center"
      ? "View your assigned recruiting tasks, language coverage, recruiting output, and quality progress."
      : activeTab === "Recruiting Tasks"
        ? "Create and manage recruiting tasks, target languages, assigned HRs, timelines, and fixed scripts."
        : activeTab === "Plugin Workspace"
          ? "Preview recruiting task scripts and plugin sync readiness."
          : "Plan view of required talent by language, current pool coverage, and what is still missing.";

  function selectCandidate(candidateId: string) {
    setSelectedCandidateId(candidateId);
  }

  function updateProjectScriptDraft(projectId: string, patch: Partial<ProjectScriptDraft>) {
    setProjectScriptDrafts((current) => ({
      ...current,
      [projectId]: {
        ...(current[projectId] || { title: "", content: "", editingScriptId: null }),
        ...patch,
      },
    }));
  }

  function startEditingProjectScript(projectId: string, scriptId: string) {
    const project = recruitmentProjects.find((item) => item.projectId === projectId)
    const script = project?.fixedScripts.find((item) => item.id === scriptId)
    if (!script) return
    updateProjectScriptDraft(projectId, {
      title: script.title,
      content: script.content,
      editingScriptId: script.id,
    })
  }

  function clearProjectScriptDraft(projectId: string) {
    updateProjectScriptDraft(projectId, {
      title: "",
      content: "",
      editingScriptId: null,
    })
  }

  function removeProjectScript(projectId: string, scriptId: string) {
    setRecruitmentProjects((current) =>
      current.map((project) => {
        if (project.projectId !== projectId) return project
        return {
          ...project,
          fixedScripts: project.fixedScripts.filter((script) => script.id !== scriptId),
          updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        }
      }),
    )
    const currentDraft = projectScriptDrafts[projectId]
    if (currentDraft?.editingScriptId === scriptId) {
      clearProjectScriptDraft(projectId)
    }
  }

  function saveProjectScript(projectId: string) {
    const draft = projectScriptDrafts[projectId]
    const title = (draft?.title || "").trim()
    const content = (draft?.content || "").trim()
    if (!title || !content) return

    setRecruitmentProjects((current) =>
      current.map((project) => {
        if (project.projectId !== projectId) return project
        const nextScript: ProjectScript = {
          id: draft?.editingScriptId || `script-${projectId}-${Date.now()}`,
          title,
          content,
          updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        }
        const fixedScripts = draft?.editingScriptId
          ? project.fixedScripts.map((script) => (script.id === draft.editingScriptId ? nextScript : script))
          : [nextScript, ...project.fixedScripts]
        return {
          ...project,
          fixedScripts,
          updatedAt: nextScript.updatedAt,
          status: project.status,
        }
      }),
    )

    clearProjectScriptDraft(projectId)
  }

  function updateProjectFormDraft(patch: Partial<ProjectFormDraft>) {
    setProjectFormDraft((current) => ({
      ...current,
      ...patch,
    }))
  }

  function toggleTaskLanguage(language: string) {
    const nextLanguage = canonicalRecruitingLanguageLabel(language)
    setProjectFormDraft((current) => {
      const exists = current.requiredLanguages.some((item) => canonicalRecruitingLanguageLabel(item) === nextLanguage)
      return {
        ...current,
        requiredLanguages: exists
          ? current.requiredLanguages.filter((item) => canonicalRecruitingLanguageLabel(item) !== nextLanguage)
          : [...current.requiredLanguages, nextLanguage],
      }
    })
  }

  function toggleTaskHrAccount(loginAccount: string) {
    setProjectFormDraft((current) => {
      const exists = current.assignedHrAccounts.includes(loginAccount)
      return {
        ...current,
        assignedHrAccounts: exists
          ? current.assignedHrAccounts.filter((item) => item !== loginAccount)
          : [...current.assignedHrAccounts, loginAccount],
      }
    })
  }

  function addTaskScript() {
    setProjectFormDraft((current) => ({
      ...current,
      scripts: [
        ...current.scripts,
        {
          scriptId: `script-form-${Date.now()}`,
          content: "",
        },
      ],
    }))
  }

  function updateTaskScript(scriptId: string, content: string) {
    setProjectFormDraft((current) => ({
      ...current,
      scripts: current.scripts.map((script) => (script.scriptId === scriptId ? { ...script, content } : script)),
    }))
  }

  function removeTaskScriptFromForm(scriptId: string) {
    setProjectFormDraft((current) => ({
      ...current,
      scripts: current.scripts.filter((script) => script.scriptId !== scriptId),
    }))
  }

  function closeProjectForm() {
    setShowProjectForm(false)
    setEditingProjectId(null)
    setProjectFormDraft(createEmptyProjectFormDraft())
    setTaskLanguageSearch("")
    setTaskLanguageDropdownOpen(false)
    setTaskHrSearch("")
    setTaskHrDropdownOpen(false)
  }

  function openCreateProjectForm() {
    const currentUserName = readLoggedInSession()?.name || currentHrName
    setEditingProjectId(null)
    setProjectFormDraft({
      ...createEmptyProjectFormDraft(),
      requiredLanguages: normalizeRecruitingLanguageSelection(createEmptyProjectFormDraft().requiredLanguages),
      taskCreatorName: currentUserName,
    })
    setShowProjectForm(true)
    setTaskLanguageDropdownOpen(false)
    setTaskHrDropdownOpen(false)
  }

  function openEditProjectForm(project: RecruitmentProject) {
    setEditingProjectId(project.projectId)
    setProjectFormDraft({
      taskName: project.projectName,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      taskCreatorName: project.ownerHrName,
      requiredLanguages: normalizeRecruitingLanguageSelection(
        project.languages.map((item) => projectLanguageToRecruitingLabel(item)),
      ),
      assignedHrAccounts: project.assignedHrNames,
      scripts: createTaskScriptDraftsFromScripts(project.fixedScripts),
    })
    setShowProjectForm(true)
    setTaskLanguageDropdownOpen(false)
    setTaskHrDropdownOpen(false)
  }

  function toggleProjectLock(projectId: string) {
    setRecruitmentProjects((current) =>
      current.map((project) => {
        if (project.projectId !== projectId) return project
        const nextStatus = project.status === "Locked" ? "In Progress" : "Locked"
        return {
          ...project,
          status: nextStatus,
          lockedAt: nextStatus === "Locked" ? new Date().toISOString().slice(0, 16).replace("T", " ") : undefined,
          updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        }
      }),
    )
  }

  function deleteProject(projectId: string) {
    if (typeof window !== "undefined" && !window.confirm("Delete this recruiting task?")) return
    setRecruitmentProjects((current) => current.filter((project) => project.projectId !== projectId))
    if (editingProjectId === projectId) {
      closeProjectForm()
    }
  }

  function saveProjectDraft() {
    const taskName = projectFormDraft.taskName.trim()
    if (!taskName) return
    if (!projectFormDraft.requiredLanguages.length) return
    if (!projectFormDraft.assignedHrAccounts.length) return

    const nextUpdatedAt = new Date().toISOString().slice(0, 16).replace("T", " ")
    const nextSelectedLanguages = normalizeRecruitingLanguageSelection(projectFormDraft.requiredLanguages)

    setRecruitmentProjects((current) => {
      const existing = editingProjectId ? current.find((project) => project.projectId === editingProjectId) : null
      const nextLanguages =
        nextSelectedLanguages.length > 0
          ? nextSelectedLanguages.map((language) => recruitingLanguageToProjectLanguage(language))
          : existing?.languages || [
              {
                language: "English",
                region: "Global",
                requiredCount: 1,
                currentCount: 0,
                remainingCount: 1,
              },
            ]
      const nextScripts: ProjectScript[] = projectFormDraft.scripts
        .map((script, index) => ({
          id:
            script.scriptId ||
            `script-${existing?.projectId || taskName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${index + 1}-${Date.now()}`,
          title: `Script ${index + 1}`,
          content: script.content.trim(),
          updatedAt: nextUpdatedAt,
        }))
        .filter((script) => script.content.length > 0)
      const nextProject: RecruitmentProject = {
        projectId:
          existing?.projectId ||
          `task-${taskName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`,
        projectName: taskName,
        clientAccount: "Recruiting Task",
        projectType: "Recruiting Task",
        description: projectFormDraft.description.trim(),
        startDate: projectFormDraft.startDate || nextUpdatedAt.slice(0, 10),
        endDate: projectFormDraft.endDate || nextUpdatedAt.slice(0, 10),
        ownerHrName: projectFormDraft.taskCreatorName.trim() || readLoggedInSession()?.name || currentHrName,
        assignedHrNames: projectFormDraft.assignedHrAccounts,
        languages: nextLanguages,
        fixedScripts: nextScripts.length > 0 ? nextScripts : existing?.fixedScripts || [],
        status: existing?.status || "Draft",
        createdAt: existing?.createdAt || nextUpdatedAt,
        updatedAt: nextUpdatedAt,
        notes: projectFormDraft.description.trim(),
      }

      if (existing) {
        return current.map((project) => (project.projectId === existing.projectId ? nextProject : project))
      }

      return [nextProject, ...current]
    })
    setShowProjectForm(false)
    setEditingProjectId(null)
    setProjectFormDraft(createEmptyProjectFormDraft())
    setTaskLanguageSearch("")
    setTaskHrSearch("")
  }

  return (
    <main className="min-h-screen bg-transparent text-[#111827]">
      <TopNav />

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] p-6 shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-[#111827]">{pageTitle}</h1>
              <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-[#6f6256]">{pageSubtitle}</p>
            </div>

            <div className="inline-flex rounded-lg border border-[#d7dccf] bg-white p-1 shadow-[0_8px_18px_rgba(31,41,51,0.06)]">
              {[
                { value: "Overview", label: "Overview" },
                { value: "Recruiting Tasks", label: "Task Center" },
                { value: "Personal Center", label: "Personal Center" },
                { value: "Plugin Workspace", label: "Plugin" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value as PageTab)}
                  className={`rounded-md px-3 py-2 text-sm font-semibold whitespace-nowrap transition ${
                    activeTab === tab.value
                      ? "bg-[#1f5c43] text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)]"
                      : "text-[#6f6256] hover:bg-[#f4efe2] hover:text-[#111827]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeTab === "Overview" ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricTile label="Required" value={dashboardTotals.totalRequiredTalents} />
              <MetricTile label="In Pool" value={dashboardTotals.currentTalentPool} />
              <MetricTile label="Needed" value={dashboardTotals.remainingNeeded} />
              <MetricTile label="Tasks" value={dashboardTotals.activeProjects} />
              <MetricTile label="HRs" value={dashboardTotals.activeHrs} />
            </div>

            <SectionCard
              title="Overall Language Recruitment Progress"
              description="Plan view of required talent by language, current pool coverage, and what is still missing."
              contentClassName="p-0"
            >
              <div className="overflow-x-auto rounded-b-xl">
                <table className="min-w-[980px] w-full border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-[#f1ece3] text-[11px] uppercase tracking-[0.18em] text-[#1e1712]">
                    <tr>
                      {[
                        "Language",
                        "Region",
                        "Required",
                        "In Pool",
                        "Needed",
                        "Progress",
                        "Status",
                      ].map((heading) => (
                        <th key={heading} className="border-b border-[#e2d8c8] px-4 py-3 text-left font-semibold">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {languageRecruitmentRows.map((row) => (
                      <tr key={`${row.language}-${row.region}`} className="border-b border-[#efe6d8] bg-white hover:bg-[#f7f5ef]">
                        <td className="px-4 py-3 font-semibold text-[#111827]">{row.language}</td>
                        <td className="px-4 py-3 text-[#6f6256]">{row.region}</td>
                        <td className="px-4 py-3 font-black tabular-nums text-[#1d4ed8]">{row.requiredTalents}</td>
                        <td className="px-4 py-3 font-black tabular-nums text-[#1f5c43]">{row.currentTalentPool}</td>
                        <td className="px-4 py-3 font-black tabular-nums text-[#c85f19]">{row.remainingNeeded}</td>
                        <td className="px-4 py-3">
                          <div className="w-full max-w-[220px]">
                            <div className="h-2 rounded-full bg-[#ece7dc]">
                              <div
                                className="h-2 rounded-full bg-[#1f5c43]"
                                style={{ width: `${Math.min(100, row.progress)}%` }}
                              />
                            </div>
                            <div className="mt-1 text-xs font-semibold text-[#6f6256]">{formatPercent(row.progress)}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={dashboardStatusClass(row.status)}>{row.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard
              title="Recruiting Tasks"
              description="View recruiting task progress, assigned HRs, languages, and plugin sync status."
            >
              {projectListView === "Card View" ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {recruitmentProjects.map((project) => {
                    const projectRequired = project.languages.reduce((sum, item) => sum + item.requiredCount, 0)
                    const projectCurrent = project.languages.reduce((sum, item) => sum + item.currentCount, 0)
                    const projectRemaining = project.languages.reduce((sum, item) => sum + item.remainingCount, 0)
                    const projectProgress = projectRequired > 0 ? Math.round((projectCurrent / projectRequired) * 100) : 0
                    const projectStatus = project.status
                    const draft = projectScriptDrafts[project.projectId] || {
                      title: "",
                      content: "",
                      editingScriptId: null,
                    }

                    return (
                      <article
                        key={project.projectId}
                        className="rounded-xl border border-[#d7dccf] bg-white p-4 shadow-[0_10px_24px_rgba(31,41,51,0.06)]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold text-[#111827]">{project.projectName}</h3>
                            <p className="mt-1 text-sm text-[#6f6256]">Task Creator: {project.ownerHrName}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={dashboardStatusClass(projectStatus)}>{projectStatus}</Badge>
                            <div className="flex flex-wrap justify-end gap-2">
                              <button type="button" onClick={() => openEditProjectForm(project)} className={taskEditButtonClass}>
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleProjectLock(project.projectId)}
                                className={project.status === "Locked" ? taskLockedButtonClass : taskPauseButtonClass}
                              >
                                {project.status === "Locked" ? "Locked" : "Pause"}
                              </button>
                              <button type="button" onClick={() => deleteProject(project.projectId)} className={taskDeleteButtonClass}>
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge className="border-[#d7dccf] bg-[#fbf4e7] text-[#c9852b]">
                            {project.startDate} → {project.endDate}
                          </Badge>
                          <Badge className="border-[#d7dccf] bg-[#eef4ee] text-[#1f5c43]">
                            Assigned HRs: {project.assignedHrNames.map(formatHrAccountLabel).join(", ")}
                          </Badge>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-lg border border-[#e6dccb] bg-[#fbfaf6] p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                              Required Total
                            </div>
                            <div className="mt-2 text-2xl font-black tabular-nums text-[#1d4ed8]">{projectRequired}</div>
                          </div>
                          <div className="rounded-lg border border-[#e6dccb] bg-[#fbfaf6] p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                              Current Total
                            </div>
                            <div className="mt-2 text-2xl font-black tabular-nums text-[#1f5c43]">{projectCurrent}</div>
                          </div>
                          <div className="rounded-lg border border-[#e6dccb] bg-[#fbfaf6] p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                              Remaining Total
                            </div>
                            <div className="mt-2 text-2xl font-black tabular-nums text-[#c85f19]">{projectRemaining}</div>
                          </div>
                          <div className="rounded-lg border border-[#e6dccb] bg-[#fbfaf6] p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                              Overall Progress
                            </div>
                            <div className="mt-2 text-2xl font-black tabular-nums text-[#111827]">
                              {formatPercent(projectProgress)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                            Required Languages
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {project.languages.map((languageRow) => (
                              <div
                                key={`${project.projectId}-${languageRow.language}-${languageRow.region}`}
                                className="rounded-lg border border-[#e6dccb] bg-[#f7f5ef] p-3"
                              >
                                <div className="font-semibold text-[#111827]">
                                  {languageRow.language} <span className="text-[#6f6256]">({languageRow.region})</span>
                                </div>
                                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <div className="text-[10px] uppercase tracking-[0.16em] text-[#6f6256]">Required</div>
                                    <div className="font-black text-[#1d4ed8]">{languageRow.requiredCount}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] uppercase tracking-[0.16em] text-[#6f6256]">Current</div>
                                    <div className="font-black text-[#1f5c43]">{languageRow.currentCount}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] uppercase tracking-[0.16em] text-[#6f6256]">Remaining</div>
                                    <div className="font-black text-[#c85f19]">{languageRow.remainingCount}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 rounded-lg border border-[#d7dde2] bg-[#fbfaf6] p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                                Fixed Scripts
                              </div>
                              <p className="mt-1 text-sm text-[#6f6256]">
                                Save task-specific recruiting scripts here. They are ready for future extension sync.
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-3">
                            <label className="block">
                              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                                Script Title
                              </span>
                              <input
                                value={draft.title}
                                onChange={(event) =>
                                  updateProjectScriptDraft(project.projectId, { title: event.target.value })
                                }
                                className="w-full rounded-lg border border-[#d7dde2] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#1f5c43]"
                                placeholder="Short title for the fixed script"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                                Script Content
                              </span>
                              <textarea
                                value={draft.content}
                                onChange={(event) =>
                                  updateProjectScriptDraft(project.projectId, { content: event.target.value })
                                }
                                rows={5}
                                className="min-h-[120px] w-full rounded-lg border border-[#d7dde2] bg-white px-3 py-2.5 text-sm leading-6 text-[#111827] outline-none transition focus:border-[#1f5c43]"
                                placeholder="Paste the fixed recruiting script or message here"
                              />
                            </label>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                              <button
                              type="button"
                              onClick={() => saveProjectScript(project.projectId)}
                              className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                            >
                              {draft.editingScriptId ? "Save Script" : "Add Script"}
                            </button>
                            <button
                              type="button"
                              onClick={() => clearProjectScriptDraft(project.projectId)}
                              className="rounded-md border border-[#d7dde2] bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition hover:bg-[#f4efe2]"
                            >
                              Clear Draft
                            </button>
                          </div>

                          <div className="mt-4 space-y-3">
                            {project.fixedScripts.length > 0 ? (
                              project.fixedScripts.map((script) => (
                                <div key={script.id} className="rounded-lg border border-[#e6dccb] bg-white p-3">
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <div className="font-semibold text-[#111827]">{script.title}</div>
                                      <div className="mt-1 text-xs text-[#6f6256]">Updated {script.updatedAt}</div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => startEditingProjectScript(project.projectId, script.id)}
                                        className="rounded-md border border-[#d7dde2] bg-[#f7f5ef] px-3 py-1.5 text-xs font-semibold text-[#111827] transition hover:bg-[#f0eadc]"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removeProjectScript(project.projectId, script.id)}
                                        className="rounded-md border border-[#f0c9c9] bg-[#fff2f2] px-3 py-1.5 text-xs font-semibold text-[#b91c1c] transition hover:bg-[#fdecec]"
                                      >
                                        Remove Script
                                      </button>
                                    </div>
                                  </div>
                                  <p className="mt-3 text-sm leading-6 text-[#111827]">{script.content}</p>
                                </div>
                              ))
                            ) : (
                              <div className="rounded-lg border border-dashed border-[#d7dde2] bg-white p-4 text-sm text-[#6f6256]">
                                No fixed scripts saved yet.
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-b-xl">
                  <table className="min-w-[980px] w-full border-collapse text-sm">
                    <thead className="sticky top-0 z-10 bg-[#f1ece3] text-[11px] uppercase tracking-[0.18em] text-[#1e1712]">
                      <tr>
                      {[
                          "Task Name",
                        "Assigned HRs",
                        "Languages",
                        "Required",
                          "Progress",
                          "Actions",
                        ].map((heading) => (
                          <th key={heading} className="border-b border-[#e2d8c8] px-4 py-3 text-left font-semibold">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recruitmentProjects.map((project) => {
                        const projectRequired = project.languages.reduce((sum, item) => sum + item.requiredCount, 0)
                        const projectCurrent = project.languages.reduce((sum, item) => sum + item.currentCount, 0)
                        const projectProgress = projectRequired > 0 ? Math.round((projectCurrent / projectRequired) * 100) : 0

                        return (
                          <tr key={project.projectId} className="border-b border-[#efe6d8] bg-white hover:bg-[#f7f5ef]">
                            <td className="px-4 py-4 align-top font-semibold leading-6 text-[#111827]">
                              <div className="max-w-full break-words">{project.projectName}</div>
                            </td>
                            <td className="px-4 py-4 align-top text-[#111827]">
                              <div className="flex flex-wrap gap-1.5">
                                {project.assignedHrNames.map((hrAccount) => (
                                  <Badge
                                    key={`${project.projectId}-${hrAccount}`}
                                    className="border-[#d7dccf] bg-[#eef4ee] text-[#1f5c43]"
                                  >
                                    {formatHrAccountLabel(hrAccount)}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top text-[#111827]">
                              <div className="flex flex-wrap gap-1.5">
                                {project.languages.map((languageRow) => (
                                  <Badge
                                    key={`${project.projectId}-${languageRow.language}-${languageRow.region}`}
                                    className="border-[#d7dccf] bg-[#f7f5ef] text-[#6f6256]"
                                  >
                                    {languageRow.language} ({languageRow.region})
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top text-center font-black tabular-nums text-[#1d4ed8]">{projectRequired}</td>
                            <td className="px-4 py-4 align-top">
                              <div className="mx-auto w-full max-w-[140px]">
                                <div className="h-2 rounded-full bg-[#ece7dc]">
                                  <div
                                    className="h-2 rounded-full bg-[#1f5c43]"
                                    style={{ width: `${Math.min(100, projectProgress)}%` }}
                                  />
                                </div>
                                <div className="mt-1 text-center text-xs font-semibold text-[#6f6256]">
                                  {formatPercent(projectProgress)}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => openEditProjectForm(project)} className={taskEditButtonClass}>
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleProjectLock(project.projectId)}
                                  className={project.status === "Locked" ? taskLockedButtonClass : taskPauseButtonClass}
                                >
                                  {project.status === "Locked" ? "Locked" : "Pause"}
                                </button>
                                <button type="button" onClick={() => deleteProject(project.projectId)} className={taskDeleteButtonClass}>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="HR Work Progress"
              description="Manager view of how each HR is progressing across assigned tasks and languages."
              contentClassName="p-0"
            >
              <div className="overflow-x-auto">
                <table className="min-w-[1120px] w-full border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-[#f1ece3] text-[11px] uppercase tracking-[0.18em] text-[#1e1712]">
                    <tr>
                      {[
                        "HR",
                        "Tasks",
                        "Languages",
                        "Submitted",
                        "Accepted",
                        "Today",
                        "Rate",
                        "Status",
                      ].map((heading) => (
                        <th key={heading} className="border-b border-[#e2d8c8] px-4 py-3 text-left font-semibold whitespace-nowrap">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hrProgressRows.map((row) => (
                      <tr key={row.hrName} className="border-b border-[#efe6d8] bg-white hover:bg-[#f7f5ef]">
                        <td className="px-4 py-3 font-semibold text-[#111827]">{row.hrName}</td>
                        <td className="px-4 py-3 text-[#111827]">
                          <details className="group">
                            <summary className="cursor-pointer list-none text-sm font-semibold text-[#111827]">
                              {row.assignedProjects.length} {row.assignedProjects.length === 1 ? "task" : "tasks"}
                            </summary>
                            <div className="mt-2 space-y-2 rounded-lg border border-[#e6dccb] bg-[#f7f5ef] p-3">
                              {row.assignedProjects.map((projectName) => {
                                const project = recruitmentProjects.find((item) => item.projectName === projectName)
                                const projectLanguages = project?.languages ?? []
                                const projectStatus = project ? getProjectStatus(project.languages) : "Needs Attention"

                                return (
                                  <div key={projectName} className="rounded-md border border-[#e6dccb] bg-white p-3">
                                    <div className="font-semibold text-[#111827]">{projectName}</div>
                                    <div className="mt-1 text-xs text-[#6f6256]">
                                      {projectLanguages.length > 0 ? (
                                        <span>
                                          Languages:{" "}
                                          {projectLanguages
                                            .map((item) => `${item.language} (${item.region})`)
                                            .join(", ")}
                                        </span>
                                      ) : (
                                        <span>Languages: Not assigned</span>
                                      )}
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                      <Badge className={dashboardStatusClass(projectStatus)}>{projectStatus}</Badge>
                                      {project ? (
                                        <span className="text-xs text-[#6f6256]">
                                          {formatPercent(
                                            project.languages.length > 0
                                              ? Math.round(
                                                  (project.languages.reduce((sum, item) => sum + item.currentCount, 0) /
                                                    project.languages.reduce((sum, item) => sum + item.requiredCount, 0)) *
                                                    100,
                                                )
                                              : 0,
                                          )}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </details>
                        </td>
                        <td className="px-4 py-3 text-[#111827]">
                          <div className="flex flex-wrap gap-1.5">
                            {row.assignedLanguages.map((language) => (
                              <Badge key={language} className="border-[#d7dccf] bg-[#eef4ee] text-[#1f5c43]">
                                {language}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-black tabular-nums text-[#1d4ed8]">{row.submittedProfiles}</td>
                        <td className="px-4 py-3 font-black tabular-nums text-[#1f5c43]">{row.acceptedProfiles}</td>
                        <td className="px-4 py-3 font-black tabular-nums text-[#c85f19]">{row.todayAdded}</td>
                        <td className="px-4 py-3 font-black tabular-nums text-[#111827]">
                          {formatPercent(row.successRate)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={dashboardStatusClass(row.status)}>{row.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard
              title="Candidate Queue"
              description="Track candidates currently being reviewed, followed up, drafted, or submitted before they enter the Talent Library."
              contentClassName="p-0"
            >
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-[#f1ece3] text-[11px] uppercase tracking-[0.18em] text-[#1e1712]">
                    <tr>
                      {["Candidate", "Language", "Region", "Platform", "Status", "Next Action", "Last Updated"].map((heading) => (
                        <th
                          key={heading}
                          className="border-b border-[#e2d8c8] px-4 py-3 text-left font-semibold"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recruitingCandidates.map((candidate) => {
                      const isSelected = candidate.id === selectedCandidate.id;

                      return (
                        <tr
                          key={candidate.id}
                          onClick={() => selectCandidate(candidate.id)}
                          className={`cursor-pointer border-b border-[#efe6d8] transition ${
                            isSelected ? "bg-[#eef4ee]" : "bg-white hover:bg-[#f7f5ef]"
                          }`}
                        >
                          <td className="px-4 py-3 align-top">
                            <div className="font-semibold text-[#111827]">{candidate.name}</div>
                            <div className="text-xs text-[#6f6256]">
                              Track candidates currently being reviewed, followed up, drafted, or submitted before
                              they enter the Talent Library.
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top text-[#111827]">{candidate.language}</td>
                          <td className="px-4 py-3 align-top text-[#111827]">{candidate.region}</td>
                          <td className="px-4 py-3 align-top text-[#111827]">{candidate.platform}</td>
                          <td className="px-4 py-3 align-top">
                            <Badge className={statusBadgeClass(candidate.status)}>{candidate.status}</Badge>
                          </td>
                          <td className="px-4 py-3 align-top text-[#111827]">{candidate.nextAction}</td>
                          <td className="px-4 py-3 align-top text-[#6f6256]">{candidate.updatedAt}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>

          </div>
        ) : activeTab === "Recruiting Tasks" ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricTile label="Tasks" value={recruitmentProjects.length} />
              <MetricTile
                label="Active"
                value={recruitmentProjects.filter((project) => project.status === "In Progress").length}
              />
              <MetricTile label="Locked" value={recruitmentProjects.filter((project) => project.status === "Locked").length} />
              <MetricTile label="Completed" value={recruitmentProjects.filter((project) => project.status === "Completed").length} />
            </div>

            <SectionCard
              title="Recruiting Tasks"
              description="Create and manage recruiting tasks, target languages, assigned HRs, timelines, and fixed scripts."
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Task Management</div>
                  <p className="mt-1 text-sm text-[#6f6256]">Use mock data for now. Scripts are stored locally for future Plugin Workspace sync.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (showProjectForm) {
                      setShowProjectForm(false)
                      setEditingProjectId(null)
                      setProjectFormDraft(createEmptyProjectFormDraft())
                      return
                    }
                    openCreateProjectForm()
                  }}
                  className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  {showProjectForm ? "Hide Task Drawer" : "Create Task"}
                </button>
              </div>

              {showProjectForm ? (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/35">
                  <div className="h-full w-full max-w-[980px] overflow-y-auto border-l border-[#d7dccf] bg-[#fbfaf6] p-6 shadow-[0_18px_42px_rgba(31,41,51,0.22)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-black text-[#111827]">
                          {editingProjectId ? "Edit Task" : "Create Task"}
                        </h3>
                        <p className="mt-2 text-sm text-[#6f6256]">
                          Manage task languages, assigned HRs, timelines, and fixed scripts in one place.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={closeProjectForm}
                        className="rounded-md border border-[#d7dde2] bg-white px-3 py-2 text-sm font-semibold text-[#111827] transition hover:bg-[#f4efe2]"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.08fr]">
                      <div className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="block md:col-span-2">
                            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                              Task Name
                            </span>
                            <input
                              value={projectFormDraft.taskName}
                              onChange={(event) => updateProjectFormDraft({ taskName: event.target.value })}
                              className="w-full rounded-lg border border-[#d7dde2] bg-white px-3 py-2.5 text-sm text-[#111827]"
                              placeholder="Native LLM Evaluator Recruitment - Japanese"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                              Start Date
                            </span>
                            <input
                              type="date"
                              value={projectFormDraft.startDate}
                              onChange={(event) => updateProjectFormDraft({ startDate: event.target.value })}
                              className="w-full rounded-lg border border-[#d7dde2] bg-white px-3 py-2.5 text-sm text-[#111827]"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                              End Date
                            </span>
                            <input
                              type="date"
                              value={projectFormDraft.endDate}
                              onChange={(event) => updateProjectFormDraft({ endDate: event.target.value })}
                              className="w-full rounded-lg border border-[#d7dde2] bg-white px-3 py-2.5 text-sm text-[#111827]"
                            />
                          </label>
                          <label className="block md:col-span-2">
                            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                              Task Creator
                            </span>
                            <input
                              value={projectFormDraft.taskCreatorName}
                              readOnly
                              className="w-full cursor-not-allowed rounded-lg border border-[#d7dde2] bg-[#f7f5ef] px-3 py-2.5 text-sm text-[#6f6256]"
                            />
                          </label>
                        </div>

                        <section ref={taskLanguageFieldRef} className="rounded-xl border border-[#d7dccf] bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                                Required Languages
                              </div>
                            </div>
                            <span className="rounded-full border border-[#d7dccf] bg-[#f7f5ef] px-2.5 py-1 text-xs font-semibold text-[#6f6256]">
                              {selectedTaskLanguages.length} selected
                            </span>
                          </div>
                          <div className="mt-3">
                            <div className="relative">
                              <input
                                value={taskLanguageSearch}
                                onFocus={() => setTaskLanguageDropdownOpen(true)}
                                onChange={(event) => {
                                  setTaskLanguageSearch(event.target.value)
                                  setTaskLanguageDropdownOpen(true)
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === "Escape") {
                                    setTaskLanguageDropdownOpen(false)
                                  }
                                }}
                                placeholder="Search or select languages"
                                className="w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-2.5 pr-10 text-sm text-[#111827] outline-none transition focus:border-[#1f5c43]"
                              />
                              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#6f6256]">▾</div>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedTaskLanguages.length > 0 ? (
                              selectedTaskLanguages.map((language) => (
                                <button
                                  key={language}
                                  type="button"
                                  onClick={() => toggleTaskLanguage(language)}
                                  className="rounded-full border border-[#cde4d7] bg-[#eff8f1] px-3 py-1.5 text-xs font-semibold text-[#1f5c43]"
                                >
                                  {language} ×
                                </button>
                              ))
                            ) : (
                              <span className="text-sm text-[#6f6256]">No languages selected yet.</span>
                            )}
                          </div>
                          {taskLanguageDropdownOpen ? (
                            <div className="mt-3 rounded-lg border border-[#e6dccb] bg-[#fbfaf6] p-3">
                              <div className="grid max-h-60 gap-2 overflow-y-auto">
                                {filteredRecruitingLanguageOptions.length > 0 ? (
                                  filteredRecruitingLanguageOptions.map((option) => {
                                    const selected = selectedTaskLanguages.includes(option.label)
                                    return (
                                      <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => toggleTaskLanguage(option.label)}
                                        className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                                          selected
                                            ? "border-[#1f5c43] bg-[#eef4ee] text-[#1f5c43]"
                                            : "border-[#d7dde2] bg-white text-[#111827] hover:bg-[#f4efe2]"
                                        }`}
                                      >
                                        <div className="font-semibold">{option.label}</div>
                                        <div className="mt-0.5 text-xs text-[#6f6256]">
                                          {[option.language, option.region].filter(Boolean).join(" • ")}
                                        </div>
                                      </button>
                                    )
                                  })
                                ) : (
                                  <div className="col-span-full rounded-lg border border-dashed border-[#d7dde2] bg-white px-3 py-4 text-sm text-[#6f6256]">
                                    No matching languages found.
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </section>

                        <section ref={taskHrFieldRef} className="rounded-xl border border-[#d7dccf] bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Assigned HRs</div>
                            </div>
                            <span className="rounded-full border border-[#d7dccf] bg-[#f7f5ef] px-2.5 py-1 text-xs font-semibold text-[#6f6256]">
                              {projectFormDraft.assignedHrAccounts.length} selected
                            </span>
                          </div>
                          <div className="mt-3">
                            <div className="relative">
                              <input
                                value={taskHrSearch}
                                onFocus={() => setTaskHrDropdownOpen(true)}
                                onChange={(event) => {
                                  setTaskHrSearch(event.target.value)
                                  setTaskHrDropdownOpen(true)
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === "Escape") {
                                    setTaskHrDropdownOpen(false)
                                  }
                                }}
                                placeholder="Search or select HRs"
                                className="w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-2.5 pr-10 text-sm text-[#111827] outline-none transition focus:border-[#1f5c43]"
                              />
                              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#6f6256]">▾</div>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {projectFormDraft.assignedHrAccounts.length > 0 ? (
                              projectFormDraft.assignedHrAccounts.map((loginAccount) => (
                                <button
                                  key={loginAccount}
                                  type="button"
                                  onClick={() => toggleTaskHrAccount(loginAccount)}
                                  className="rounded-full border border-[#cde4d7] bg-[#eff8f1] px-3 py-1.5 text-xs font-semibold text-[#1f5c43]"
                                >
                                  {formatHrAccountLabel(loginAccount)} ×
                                </button>
                              ))
                            ) : (
                              <span className="text-sm text-[#6f6256]">No HR accounts selected yet.</span>
                            )}
                          </div>
                          {taskHrDropdownOpen ? (
                            <div className="mt-3 rounded-lg border border-[#e6dccb] bg-[#fbfaf6] p-3">
                              <div className="grid max-h-52 gap-2 overflow-y-auto">
                                {filteredHrOptions.length > 0 ? (
                                  filteredHrOptions.map((account) => {
                                    const selected = projectFormDraft.assignedHrAccounts.includes(account.loginAccount)
                                    return (
                                      <button
                                        key={account.loginAccount}
                                        type="button"
                                        onClick={() => toggleTaskHrAccount(account.loginAccount)}
                                        className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                                          selected
                                            ? "border-[#1f5c43] bg-[#eef4ee] text-[#1f5c43]"
                                            : "border-[#d7dde2] bg-white text-[#111827] hover:bg-[#f4efe2]"
                                        }`}
                                      >
                                        <div className="font-semibold">{account.name} ({account.loginAccount})</div>
                                      </button>
                                    )
                                  })
                                ) : (
                                  <div className="rounded-lg border border-dashed border-[#d7dde2] bg-white px-3 py-4 text-sm text-[#6f6256]">
                                    No matching HR accounts found.
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </section>

                        <section className="rounded-xl border border-[#d7dccf] bg-white p-4">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Description</div>
                          <textarea
                            value={projectFormDraft.description}
                            onChange={(event) => updateProjectFormDraft({ description: event.target.value })}
                            rows={6}
                            className="mt-3 w-full rounded-lg border border-[#d7dde2] bg-white px-3 py-2.5 text-sm leading-6 text-[#111827]"
                            placeholder="Describe the recruitment task, target candidate profile, and screening expectations."
                          />
                        </section>
                      </div>

                      <section className="space-y-4 rounded-xl border border-[#d7dccf] bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Fixed Scripts</div>
                            <p className="mt-1 text-sm text-[#6f6256]">These scripts will sync to Plugin Workspace.</p>
                          </div>
                          <button
                            type="button"
                            onClick={addTaskScript}
                            className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                          >
                            Add Script
                          </button>
                        </div>

                        <div className="space-y-3">
                          {projectFormDraft.scripts.length > 0 ? (
                            projectFormDraft.scripts.map((script, index) => (
                              <div key={script.scriptId} className="rounded-lg border border-[#e6dccb] bg-[#fbfaf6] p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-sm font-semibold text-[#111827]">Script {index + 1}</div>
                                  <button
                                    type="button"
                                    onClick={() => removeTaskScriptFromForm(script.scriptId)}
                                    className="rounded-md border border-[#f0c9c9] bg-[#fff2f2] px-3 py-1.5 text-xs font-semibold text-[#b91c1c]"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <textarea
                                  value={script.content}
                                  onChange={(event) => updateTaskScript(script.scriptId, event.target.value)}
                                  rows={4}
                                  className="mt-3 min-h-[96px] w-full rounded-lg border border-[#d7dde2] bg-white px-3 py-2.5 text-sm leading-6 text-[#111827]"
                                  placeholder="Paste the recruiting script here."
                                />
                              </div>
                            ))
                          ) : (
                            <div className="rounded-xl border border-dashed border-[#d7dde2] bg-[#fbfaf6] p-4 text-sm text-[#6f6256]">
                              No fixed scripts yet.
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap justify-end gap-2 border-t border-[#e6dfd0] pt-4">
                          <button
                            type="button"
                            onClick={closeProjectForm}
                            className="rounded-md border border-[#d7dde2] bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition hover:bg-[#f4efe2]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={saveProjectDraft}
                            className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                          >
                            Save Task
                          </button>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 space-y-3">
                {recruitmentProjects.map((project) => (
                  <div key={project.projectId} className="rounded-xl border border-[#d7dccf] bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#111827]">{project.projectName}</h3>
                        <p className="mt-1 text-sm text-[#6f6256]">
                          {project.startDate} → {project.endDate}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={dashboardStatusClass(project.status)}>{project.status}</Badge>
                        <div className="flex flex-wrap justify-end gap-2">
                          <button type="button" onClick={() => openEditProjectForm(project)} className={taskEditButtonClass}>
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleProjectLock(project.projectId)}
                            className={project.status === "Locked" ? taskLockedButtonClass : taskPauseButtonClass}
                          >
                            {project.status === "Locked" ? "Locked" : "Pause"}
                          </button>
                          <button type="button" onClick={() => deleteProject(project.projectId)} className={taskDeleteButtonClass}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className="border-[#d7dccf] bg-[#f7f5ef] text-[#6f6256]">Creator: {project.ownerHrName}</Badge>
                      <Badge className="border-[#d7dccf] bg-[#eef4ee] text-[#1f5c43]">
                        Assigned HRs: {project.assignedHrNames.map(formatHrAccountLabel).join(", ")}
                      </Badge>
                      <Badge className="border-[#d7dccf] bg-[#fbf4e7] text-[#c9852b]">
                        {project.fixedScripts.length} scripts
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm text-[#6f6256]">{project.description}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        ) : activeTab === "Personal Center" ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <MetricTile label="Recruited" value={personalCenterSummary.recruited} />
              <MetricTile label="Accepted" value={personalCenterSummary.accepted} />
              <MetricTile label="Pending" value={personalCenterSummary.pending} />
              <MetricTile label="Remaining" value={personalCenterSummary.remaining} />
              <MetricTile label="Tasks" value={personalCenterSummary.tasks} />
              <MetricTile label="Languages" value={personalCenterSummary.languages} />
            </div>

            <SectionCard
              title="HR Basic Info"
              description="Current HR account details and assigned workload summary."
            >
              <div className="grid gap-5 xl:grid-cols-[minmax(280px,340px)_1fr]">
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => hrAvatarInputRef.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setHrAvatarDragActive(true)
                    }}
                    onDragEnter={(event) => {
                      event.preventDefault()
                      setHrAvatarDragActive(true)
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault()
                      setHrAvatarDragActive(false)
                    }}
                    onDrop={handleHrAvatarDrop}
                    className={`group flex w-full flex-col items-center rounded-2xl border-2 border-dashed px-5 py-6 text-center transition ${
                      hrAvatarDragActive
                        ? "border-[#1f5c43] bg-[#eff8f1]"
                        : "border-[#d7dccf] bg-[#fbfaf6] hover:border-[#1f5c43] hover:bg-[#f7fbf8]"
                    }`}
                  >
                    <div className="relative h-24 w-24 overflow-hidden rounded-full border border-[#d7dccf] bg-white shadow-sm">
                      {hrAvatarImageFailed ? (
                        <div className="flex h-full w-full items-center justify-center bg-[#f4efe2] text-2xl font-black text-[#1f5c43]">
                          {getInitials(currentHrDisplayName)}
                        </div>
                      ) : (
                        <Image
                          src={currentHrAvatarUrl}
                          alt={currentHrDisplayName}
                          fill
                          unoptimized
                          className="object-cover"
                          onError={() => {
                            if (currentHrAvatarUrl !== "/blackdog-mascot.jpg") {
                              setHrAvatarImageFailed(true)
                            }
                          }}
                        />
                      )}
                    </div>
                    <div className="mt-4 text-xl font-black text-[#111827]">{currentHrDisplayName}</div>
                    <div className="mt-1 text-sm text-[#6f6256]">
                      {currentHrRole} · {currentHrStatus}
                    </div>
                    <div className="mt-3 text-sm font-semibold text-[#1f5c43]">
                      Drag image here or click to upload
                    </div>
                    <div className="mt-1 text-xs text-[#6f6256]">PNG, JPG, WEBP, GIF up to 5MB</div>
                  </button>
                  <input
                    ref={hrAvatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleHrAvatarFileSelect(event.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => hrAvatarInputRef.current?.click()}
                    className="w-full rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Upload Photo
                  </button>
                  {hrAvatarError ? <p className="text-sm font-medium text-[#b42318]">{hrAvatarError}</p> : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    ["Name", currentHrDisplayName],
                    ["Login Account", currentHrLoginAccount],
                    ["Role", currentHrRole],
                    ["Status", currentHrStatus],
                    ["Assigned Tasks", personalCenterSummary.tasks],
                    ["Assigned Languages", personalCenterSummary.languages],
                    ["Last Login", currentHrLastLogin],
                  ].map(([label, value]) => (
                    <div key={label as string} className="rounded-xl border border-[#d7dccf] bg-[#fbfaf6] p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                        {label}
                      </div>
                      <div className="mt-2 text-base font-semibold text-[#111827]">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Assigned Recruiting Tasks"
              description="Read-only view of the tasks currently assigned to this HR."
            >
              <div className="overflow-x-auto rounded-b-xl">
                <table className="w-full table-fixed border-collapse text-sm">
                  <colgroup>
                    <col className="w-[24%]" />
                    <col className="w-[24%]" />
                    <col className="w-[11%]" />
                    <col className="w-[11%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[8%]" />
                  </colgroup>
                  <thead className="sticky top-0 z-10 bg-[#f1ece3] text-[11px] uppercase tracking-[0.18em] text-[#1e1712]">
                    <tr>
                      {["Task Name", "Languages", "Start Date", "End Date", "Task Status", "Progress", "Script Status"].map(
                        (heading) => (
                          <th
                            key={heading}
                            className={`border-b border-[#e2d8c8] px-4 py-3 font-semibold whitespace-nowrap ${
                              heading === "Task Name" || heading === "Languages" ? "text-left" : "text-center"
                            }`}
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {personalCenterTasks.length > 0 ? (
                      personalCenterTasks.map((project) => {
                        const projectRequired = project.languages.reduce((sum, item) => sum + item.requiredCount, 0);
                        const projectCurrent = project.languages.reduce((sum, item) => sum + item.currentCount, 0);
                        const projectProgress = projectRequired > 0 ? Math.round((projectCurrent / projectRequired) * 100) : 0;
                        const isLanguagesExpanded = Boolean(expandedLanguageRows[project.projectId]);
                        const visibleLanguages = isLanguagesExpanded ? project.languages : project.languages.slice(0, 2);
                        const hiddenLanguageCount = Math.max(project.languages.length - visibleLanguages.length, 0);
                        const scriptStatus = project.fixedScripts.length > 0 ? "Synced" : "Pending";

                        return (
                          <tr key={project.projectId} className="border-b border-[#efe6d8] bg-white hover:bg-[#f7f5ef]">
                            <td className="px-4 py-4 align-top font-semibold leading-6 text-[#111827]">
                              <div className="max-w-full break-words">{project.projectName}</div>
                            </td>
                            <td className="px-4 py-4 align-top text-[#111827]">
                              <div className="flex flex-wrap gap-1.5">
                                {visibleLanguages.map((languageRow) => (
                                  <Badge
                                    key={`${project.projectId}-${languageRow.language}-${languageRow.region}`}
                                    className="border-[#d7dccf] bg-[#f7f5ef] text-[#6f6256]"
                                  >
                                    {languageRow.language} ({languageRow.region})
                                  </Badge>
                                ))}
                                {hiddenLanguageCount > 0 && !isLanguagesExpanded ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedLanguageRows((current) => ({
                                        ...current,
                                        [project.projectId]: true,
                                      }))
                                    }
                                    className="inline-flex h-6 items-center rounded-full border border-[#d7dccf] bg-[#fffdf8] px-2.5 text-[11px] font-semibold text-[#6f6256] transition hover:bg-[#f5efe2]"
                                  >
                                    +{hiddenLanguageCount} more
                                  </button>
                                ) : hiddenLanguageCount > 0 && isLanguagesExpanded ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedLanguageRows((current) => ({
                                        ...current,
                                        [project.projectId]: false,
                                      }))
                                    }
                                    className="inline-flex h-6 items-center rounded-full border border-[#d7dccf] bg-[#fffdf8] px-2.5 text-[11px] font-semibold text-[#6f6256] transition hover:bg-[#f5efe2]"
                                  >
                                    Show less
                                  </button>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center tabular-nums text-[#111827]">{project.startDate}</td>
                            <td className="px-4 py-4 text-center tabular-nums text-[#111827]">{project.endDate}</td>
                            <td className="px-4 py-4 text-center">
                              <Badge className={dashboardStatusClass(project.status)}>{project.status}</Badge>
                            </td>
                            <td className="px-4 py-4">
                              <div className="mx-auto w-full max-w-[140px]">
                                <div className="h-2 rounded-full bg-[#ece7dc]">
                                  <div
                                    className="h-2 rounded-full bg-[#1f5c43]"
                                    style={{ width: `${Math.min(100, projectProgress)}%` }}
                                  />
                                </div>
                                <div className="mt-1 text-center text-xs font-semibold text-[#6f6256]">
                                  {formatPercent(projectProgress)}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <Badge className={taskSyncStatusClass(scriptStatus)}>{scriptStatus}</Badge>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="px-4 py-6 text-center text-sm text-[#6f6256]" colSpan={7}>
                          No tasks are assigned to the current HR yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard
              title="Language Recruiting Progress"
              description="Recruiting progress and quality coverage by language for the current HR."
            >
              <div className="overflow-x-auto rounded-b-xl">
                <table className="w-full table-fixed border-collapse text-sm">
                  <colgroup>
                    <col className="w-[24%]" />
                    <col className="w-[9%]" />
                    <col className="w-[9%]" />
                    <col className="w-[9%]" />
                    <col className="w-[9%]" />
                    <col className="w-[9%]" />
                    <col className="w-[8%]" />
                    <col className="w-[13%]" />
                  </colgroup>
                  <thead className="sticky top-0 z-10 bg-[#f1ece3] text-[11px] uppercase tracking-[0.18em] text-[#1e1712]">
                    <tr>
                      {["Language", "Required", "Submitted", "Accepted", "Pending", "Remaining", "Rate", "Status"].map(
                        (heading) => (
                          <th
                            key={heading}
                            className={`border-b border-[#e2d8c8] px-4 py-3 font-semibold whitespace-nowrap ${
                              heading === "Language" ? "text-left" : "text-center"
                            }`}
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {personalCenterLanguageRows.length > 0 ? (
                      personalCenterLanguageRows.map((row) => (
                        <tr key={row.language} className="border-b border-[#efe6d8] bg-white hover:bg-[#f7f5ef]">
                          <td className="px-4 py-4 font-semibold leading-6 text-[#111827]">{row.language}</td>
                          <td className="px-4 py-4 text-center font-black tabular-nums text-[#1d4ed8]">{row.required}</td>
                          <td className="px-4 py-4 text-center font-black tabular-nums text-[#1f5c43]">{row.submitted}</td>
                          <td className="px-4 py-4 text-center font-black tabular-nums text-[#111827]">{row.accepted}</td>
                          <td className="px-4 py-4 text-center font-black tabular-nums text-[#c85f19]">{row.pending}</td>
                          <td className="px-4 py-4 text-center font-black tabular-nums text-[#c85f19]">{row.remaining}</td>
                          <td className="px-4 py-4 text-center font-semibold text-[#111827]">{formatPercent(row.rate)}</td>
                          <td className="px-4 py-4 text-center">
                            <Badge
                              className={dashboardStatusClass(
                                row.status === "Behind" ? "Needs Attention" : row.status === "Active" ? "In Progress" : row.status,
                              )}
                            >
                              {row.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-6 text-center text-sm text-[#6f6256]" colSpan={8}>
                          No language recruiting progress available yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        ) : activeTab === "Plugin Workspace" ? (
          <div className="mt-6">
            <PluginWorkspacePreview scriptOptions={pluginWorkspaceScriptOptions} />
          </div>
        ) : null}
      </section>
    </main>
  );
}
