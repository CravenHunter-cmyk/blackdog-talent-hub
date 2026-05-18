"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { TalentProfileRecord } from "@/types/talent-pool";
import { recruitingCandidates } from "@/data/recruitingCandidates";
import { DEFAULT_LOCAL_ACCOUNTS, getStoredAccounts, type LocalAccount } from "@/lib/localAccounts";
import { readLoggedInSession, type LoggedInSession } from "@/lib/currentUser";
import {
  canonicalRecruitingLanguageLabel,
  findRecruitingLanguageOption,
  rankRecruitingLanguageOption,
  RECRUITING_LANGUAGE_OPTIONS,
} from "@/lib/languageOptions";
import { SKILL_TASK_TYPE_OPTIONS } from "@/lib/talentProfileOptions";
import {
  DEFAULT_BRAIN_RULES,
  createBrainProjectId,
  getStoredBrainProjects,
  getStoredBrainRules,
  saveStoredBrainProjects,
  saveStoredBrainRules,
  type BrainProjectAnalysis,
  type BrainProjectBudget,
  type BrainProjectPriority,
  type BrainProjectRecord,
  type BrainProjectStatus,
} from "@/lib/blackdogBrain";
import {
  getStoredRecruitingTasks,
  initializeDefaultRecruitingTasks,
  saveStoredRecruitingTasks,
  type RecruitingTask,
} from "@/lib/recruitingTasks";

type BrainTalentProfile = {
  talentId: string;
  candidateName: string;
  avatarUrl: string;
  nativeLanguage: string;
  secondLanguage: string;
  skills: string[];
  experienceSummary: string;
  availability: string;
  weekendAvailability: string;
  currentStatus: string;
  sourceLabel: string;
  submittedByHrName: string;
  submittedAt: string;
  currentAssignedTasks: string[];
  matchScore: number;
  matchStatus: "Recommended" | "Backup" | "Risky" | "Not Available";
  matchReason: string;
  riskNotes: string;
};

type ProjectDraft = {
  clientName: string;
  projectName: string;
  projectType: string;
  targetMarketRegion: string;
  projectDescription: string;
  requiredSkills: string;
  expectedStartDate: string;
  expectedEndDate: string;
  deliveryPriority: BrainProjectPriority;
  budgetLevel: BrainProjectBudget;
  notes: string;
};

type PersonaCard = {
  roleName: string;
  requiredLanguageLevel: string;
  requiredExperience: string;
  requiredAvailability: string;
  requiredSkills: string;
  qualityThreshold: string;
  notes: string;
};

type LanguagePlanRow = {
  languageLabel: string;
  language: string;
  region: string;
  requiredHeadcount: number;
  requiredHoursPerDay: string;
  canShareWithOtherLanguage: boolean;
  suggestedTalentCount: number;
  priority: string;
  notes: string;
};

type GapRow = {
  languageLabel: string;
  language: string;
  region: string;
  requiredHeadcount: number;
  matchedTalentCount: number;
  gapCount: number;
  reason: string;
  suggestedRecruitingTask: string;
  suggestedHr: string;
  priority: string;
};

type ProjectRowView = {
  record: BrainProjectRecord;
  draft: ProjectDraft;
  analysis: BrainProjectAnalysis | null;
  required: number;
  inPool: number;
  recruiting: number;
  matched: number;
  ready: boolean;
  status: BrainProjectStatus;
  eta: string;
  talentMatches: BrainTalentProfile[];
  languagePlan: LanguagePlanRow[];
  gapRows: GapRow[];
};

type ProjectFormMode = "create" | "edit";

type AIGatewayAnalyzeResponse = {
  ok?: boolean;
  provider?: string;
  model?: string;
  text?: string;
  error?: string;
  debugRaw?: string;
  result?: {
    projectSummary?: string;
    projectDifficulty?: string;
    requiredCapabilities?: string[];
    recommendedTalentPersonas?: string[];
    languagePlan?: string[];
    matchingConsiderations?: string[];
    recruitingGapLogic?: string[];
    risks?: string[];
    nextSteps?: string[];
  };
};

const PROJECT_TYPE_OPTIONS = [
  "LLM Evaluation",
  "VLM Evaluation",
  "Search Evaluation",
  "Localization QA",
  "Translation Review",
  "OCR Annotation",
  "ASR / Speech Data",
  "TTS Voice Data",
  "Safety Evaluation",
  "Content Moderation",
  "Data Collection",
  "Custom AI Data Project",
];

const DELIVERY_PRIORITY_OPTIONS: BrainProjectPriority[] = ["Normal", "Urgent", "High Priority"];
const BUDGET_LEVEL_OPTIONS: BrainProjectBudget[] = ["Low", "Medium", "High", "Premium"];
const DEFAULT_AI_GATEWAY_MODEL = "gpt-4o-mini";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeLower(value = "") {
  return normalizeText(value).toLowerCase();
}

function slugify(value = "") {
  return normalizeLower(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function splitListInput(value = "") {
  return Array.from(
    new Set(
      String(value || "")
        .split(/[,;\n]/)
        .map((item) => normalizeText(item))
        .filter(Boolean),
    ),
  );
}

function joinList(values: string[] = [], fallback = "") {
  return values.map((value) => normalizeText(value)).filter(Boolean).join("; ") || fallback;
}

function formatDateValue(value = "") {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || "—";
  const pad = (input: number) => String(input).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

function addDays(baseDate: string, days: number) {
  const parsed = new Date(baseDate);
  if (Number.isNaN(parsed.getTime())) return baseDate;
  parsed.setDate(parsed.getDate() + days);
  return formatDateValue(parsed.toISOString());
}

function todayValue() {
  return formatDateValue(new Date().toISOString());
}

function inferDisplayLanguageLabel(query: string, fallback = "English - North American") {
  const matched = findRecruitingLanguageOption(query);
  return matched?.label || canonicalRecruitingLanguageLabel(query) || fallback;
}

function inferProjectLanguages(project: ProjectDraft) {
  const query = normalizeLower(
    [
      project.clientName,
      project.projectName,
      project.projectType,
      project.targetMarketRegion,
      project.projectDescription,
      project.requiredSkills,
      project.notes,
    ].join(" "),
  );

  const ranked = RECRUITING_LANGUAGE_OPTIONS.map((option) => ({
    option,
    score: rankRecruitingLanguageOption(option, query),
  }))
    .filter((item) => item.score < Infinity)
    .sort((left, right) => {
      if (left.score !== right.score) return left.score - right.score;
      if (left.option.language !== right.option.language) return left.option.language.localeCompare(right.option.language);
      const leftRegion = left.option.region || "";
      const rightRegion = right.option.region || "";
      if (leftRegion !== rightRegion) return leftRegion.localeCompare(rightRegion);
      return left.option.label.localeCompare(right.option.label);
    })
    .map((item) => item.option.label);

  const selected: string[] = [];
  const addUnique = (label?: string) => {
    const next = normalizeText(label || "");
    if (!next) return;
    if (!selected.includes(next)) selected.push(next);
  };

  if (ranked.length > 0) {
    ranked.slice(0, 3).forEach((label) => addUnique(label));
  }

  if (!selected.length) {
    if (/japan|japanese|nihongo/.test(query)) addUnique("Japanese - Japan");
    else if (/korea|korean/.test(query)) addUnique("Korean - South Korea");
    else if (/vietnam|vietnamese/.test(query)) addUnique("Vietnamese - Vietnam");
    else if (/thai/.test(query)) addUnique("Thai - Thailand");
    else if (/indonesia|indonesian/.test(query)) addUnique("Indonesian - Indonesia");
    else if (/malay/.test(query)) addUnique(query.includes("singapore") ? "Malay - Singapore" : "Malay - Malaysia");
    else if (/filipino|tagalog|philippines/.test(query)) addUnique("Filipino / Tagalog - Philippines");
    else if (/chinese|mandarin/.test(query)) addUnique(query.includes("hong kong") ? "Chinese - Hong Kong" : "Chinese - Simplified");
    else if (/cantonese/.test(query)) addUnique(query.includes("guangdong") ? "Cantonese - Guangdong" : "Cantonese - Hong Kong");
    else if (/french/.test(query)) addUnique(query.includes("canada") ? "French - Canada" : "French - France");
    else if (/german/.test(query)) addUnique(query.includes("austria") ? "German - Austria" : query.includes("switzerland") ? "German - Switzerland" : "German - Germany");
    else if (/italian/.test(query)) addUnique("Italian - Italy");
    else if (/dutch/.test(query)) addUnique(query.includes("belgium") ? "Dutch - Belgium" : "Dutch - Netherlands");
    else if (/swedish/.test(query)) addUnique("Swedish - Sweden");
    else if (/norwegian/.test(query)) addUnique("Norwegian - Norway");
    else if (/danish/.test(query)) addUnique("Danish - Denmark");
    else if (/finnish/.test(query)) addUnique("Finnish - Finland");
    else if (/hebrew/.test(query)) addUnique("Hebrew - Israel");
    else if (/czech/.test(query)) addUnique("Czech - Czech Republic");
    else if (/polish/.test(query)) addUnique("Polish - Poland");
    else if (/russian/.test(query)) addUnique("Russian - Russia");
    else if (/turkish/.test(query)) addUnique("Turkish - Turkey");
    else if (/arabic/.test(query)) addUnique("Arabic - MENA");
    else if (/spanish/.test(query)) addUnique(query.includes("mexico") ? "Spanish - Mexico" : query.includes("spain") ? "Spanish - Spain" : "Spanish - LATAM");
    else if (/portuguese/.test(query)) addUnique(query.includes("brazil") ? "Portuguese - Brazil" : "Portuguese - Portugal");
    else if (/english/.test(query)) addUnique(query.includes("uk") ? "English - UK" : query.includes("europe") ? "English - EU" : "English - North American");
  }

  if (!selected.length) {
    addUnique(inferDisplayLanguageLabel(project.targetMarketRegion || project.projectType || project.projectDescription));
  }

  const wantsBackupEnglish = /bilingual|multi[- ]?locale|multilingual|evaluation|localization|quality|qa|review|safety/.test(query);
  if (wantsBackupEnglish) {
    addUnique("English - North American");
  }

  return selected.length > 0 ? selected.slice(0, 3) : ["English - North American"];
}

function splitLanguageLabel(label = "") {
  const option = findRecruitingLanguageOption(label);
  if (option) {
    return {
      label: option.label,
      language: option.language,
      region: option.region || "Global",
    };
  }

  const text = normalizeText(label);
  const pieces = text.split(" - ").map((item) => normalizeText(item)).filter(Boolean);
  if (pieces.length >= 3) {
    return {
      label: text,
      language: pieces.slice(1, -1).join(" - "),
      region: pieces[pieces.length - 1] || "Global",
    };
  }
  if (pieces.length === 2) {
    return {
      label: text,
      language: pieces[0],
      region: pieces[1],
    };
  }
  return {
    label: text || "Unknown",
    language: text || "Unknown",
    region: "Global",
  };
}

function createDefaultProjectDraft(): ProjectDraft {
  const start = todayValue();
  return {
    clientName: "",
    projectName: "",
    projectType: "LLM Evaluation",
    targetMarketRegion: "",
    projectDescription: "",
    requiredSkills: "",
    expectedStartDate: start,
    expectedEndDate: addDays(start, 30),
    deliveryPriority: "Normal",
    budgetLevel: "Medium",
    notes: "",
  };
}

function mapBrainProjectRecordToDraft(record: BrainProjectRecord): ProjectDraft {
  return {
    clientName: record.clientName,
    projectName: record.projectName,
    projectType: record.projectType,
    targetMarketRegion: record.targetMarketRegion,
    projectDescription: record.projectDescription,
    requiredSkills: record.requiredSkills.join(", "),
    expectedStartDate: record.expectedStartDate,
    expectedEndDate: record.expectedEndDate,
    deliveryPriority: record.deliveryPriority,
    budgetLevel: record.budgetLevel,
    notes: record.notes,
  };
}

function getPrimaryHrAccount(session: LoggedInSession | null, hrAccounts: LocalAccount[]) {
  const hrUsers = hrAccounts.filter((account) => account.role === "hr_user");
  const current = session ? hrUsers.find((account) => account.loginAccount === session.loginAccount) : null;
  return (
    current ||
    hrUsers[0] ||
    DEFAULT_LOCAL_ACCOUNTS.find((account) => account.role === "hr_user") ||
    DEFAULT_LOCAL_ACCOUNTS[0]
  );
}

function formatHrAccountLabel(account?: LocalAccount | null) {
  if (!account) return "Julie Zhu (julie)";
  return `${account.name} (${account.loginAccount})`;
}

function getProjectDifficulty(projectType: string, priority: BrainProjectPriority, languageCount: number) {
  const normalized = normalizeLower(projectType);
  let score = 3;
  if (normalized.includes("llm")) score = 4;
  if (normalized.includes("vlm")) score = 5;
  if (normalized.includes("search")) score = 4;
  if (normalized.includes("localization")) score = 4;
  if (normalized.includes("translation")) score = 4;
  if (normalized.includes("ocr")) score = 4;
  if (normalized.includes("asr") || normalized.includes("speech")) score = 5;
  if (normalized.includes("tts")) score = 5;
  if (normalized.includes("safety") || normalized.includes("moderation")) score = 5;
  if (normalized.includes("collection")) score = 3;

  if (priority === "High Priority") score += 1;
  if (priority === "Urgent") score += 2;
  if (languageCount > 2) score += 1;

  if (score >= 7) return "Very High";
  if (score >= 5) return "High";
  if (score >= 4) return "Medium";
  return "Moderate";
}

function getRequiredCapability(projectType: string, requiredSkills: string[], languages: string[]) {
  const normalized = normalizeLower(projectType);
  const languageText = languages.join(", ");
  if (normalized.includes("llm")) {
    return `Native ${languageText || "language"} evaluators with strong guideline discipline, clear judgment, and QA review readiness.`;
  }
  if (normalized.includes("vlm")) {
    return `Visual and multimodal reviewers who can handle image understanding, instruction following, and consistency checks.`;
  }
  if (normalized.includes("search")) {
    return `Search evaluators with relevance judgment skills, localization sensitivity, and fast decision making.`;
  }
  if (normalized.includes("localization") || normalized.includes("translation")) {
    return `Native locale reviewers with translation quality awareness, cultural nuance, and formatting review capability.`;
  }
  if (normalized.includes("ocr")) {
    return `Annotation specialists who can read noisy text, verify OCR output, and maintain accuracy under time pressure.`;
  }
  if (normalized.includes("asr") || normalized.includes("speech")) {
    return `Speech reviewers who can check audio quality, transcription accuracy, and speaking consistency.`;
  }
  if (normalized.includes("tts")) {
    return `Voice data reviewers who can confirm speech clarity, recording consistency, and pronunciation quality.`;
  }
  if (normalized.includes("safety") || normalized.includes("moderation")) {
    return `Policy-aware reviewers who can follow safety guidelines, flag edge cases, and maintain high precision.`;
  }
  if (normalized.includes("collection")) {
    return `Reliable contributors with strong turnaround, simple instruction following, and stable availability.`;
  }
  return `${requiredSkills.slice(0, 3).join(", ") || "Project-specific"} talent with reliable availability and guideline discipline.`;
}

function getProjectSummary(project: ProjectDraft, languages: string[]) {
  const languageText = languages.join(", ") || "target language coverage";
  return `${project.projectType} for ${project.clientName || "the client"} targeting ${project.targetMarketRegion || "the defined market"} with ${languageText}.`;
}

function getDeliveryRisk(project: ProjectDraft, languageCount: number) {
  const notes: string[] = [];
  if (project.deliveryPriority === "Urgent") notes.push("Urgent delivery increases ramp-up and QA risk.");
  if (project.deliveryPriority === "High Priority") notes.push("High priority work needs tighter QA and backup coverage.");
  if (project.budgetLevel === "Low") notes.push("Low budget may reduce talent availability and retention.");
  if (languageCount > 2) notes.push("Multiple locale coverage increases coordination complexity.");
  const normalized = normalizeLower(project.projectType);
  if (normalized.includes("safety") || normalized.includes("moderation")) notes.push("Safety work requires higher review discipline.");
  if (normalized.includes("tts") || normalized.includes("asr")) notes.push("Audio quality and consistency checks can slow throughput.");
  return notes.length > 0 ? notes.join(" ") : "Manageable delivery risk with standard QA review and balanced coverage.";
}

function getResourceStrategy(project: ProjectDraft, languageCount: number) {
  const labels: string[] = [];
  if (project.deliveryPriority === "Urgent") {
    labels.push("Use a primary evaluator plus a backup pool to absorb changes quickly.");
  } else if (project.deliveryPriority === "High Priority") {
    labels.push("Use a tight review layer and keep secondary reviewers on standby.");
  } else {
    labels.push("Use steady coverage with periodic QA and escalation checkpoints.");
  }

  if (languageCount > 1) {
    labels.push("Allow bilingual coverage where the language pair supports it.");
  }

  if (project.budgetLevel === "Premium") {
    labels.push("Reserve stronger quality reviewers and senior coverage for the final pass.");
  }
  return labels.join(" ");
}

function getHrAssignmentLogic(currentHr: string, hrAccounts: LocalAccount[], languageCount: number) {
  const fallback = hrAccounts
    .filter((account) => account.role === "hr_user")
    .slice(0, 3)
    .map((account) => account.name)
    .join(", ");
  const current = currentHr || "the current HR";
  return `Assign ${current} as the primary owner, then use ${fallback || "the nearest HR backup"} for secondary coverage. ${
    languageCount > 1 ? "Split languages across the team only when capacity and quality thresholds are stable." : ""
  }`;
}

function buildAnalysis(project: ProjectDraft, currentHr: string, hrAccounts: LocalAccount[]): BrainProjectAnalysis {
  const inferredLanguages = inferProjectLanguages(project);
  const requiredSkills = splitListInput(project.requiredSkills);
  const languageCount = inferredLanguages.length;
  return {
    projectSummary: getProjectSummary(project, inferredLanguages),
    projectDifficulty: getProjectDifficulty(project.projectType, project.deliveryPriority, languageCount),
    requiredCapability: getRequiredCapability(project.projectType, requiredSkills, inferredLanguages),
    deliveryRisk: getDeliveryRisk(project, languageCount),
    resourceStrategy: getResourceStrategy(project, languageCount),
    hrAssignmentLogic: getHrAssignmentLogic(currentHr, hrAccounts, languageCount),
    inferredLanguages,
  };
}

function buildTalentPool(initialProfiles: TalentProfileRecord[]) {
  const mappedProfiles: BrainTalentProfile[] = initialProfiles
    .filter((profile) => profile.status !== "deleted")
    .map((profile) => ({
      talentId: profile.talentId,
      candidateName: profile.candidateName,
      avatarUrl: profile.avatarUrl || "",
      nativeLanguage: profile.nativeLanguage || "—",
      secondLanguage: profile.secondLanguage || "—",
      skills: [profile.mainSkill].filter(Boolean),
      experienceSummary: profile.experienceSummary || "—",
      availability: profile.dailyAvailability || "Available",
      weekendAvailability: profile.weekendAvailability || "—",
      currentStatus: "Submitted",
      sourceLabel: "Talent Museum",
      submittedByHrName: profile.submittedByHrName || "—",
      submittedAt: profile.submittedAt || profile.createdAt || "",
      currentAssignedTasks: [],
      matchScore: 0,
      matchStatus: "Risky",
      matchReason: "",
      riskNotes: "",
    }));

  if (mappedProfiles.length > 0) {
    return mappedProfiles;
  }

  return recruitingCandidates.map((candidate) => ({
    talentId: candidate.id,
    candidateName: candidate.name,
    avatarUrl: "",
    nativeLanguage: candidate.language,
    secondLanguage: candidate.language === "English" ? "—" : "English",
    skills: candidate.skills,
    experienceSummary: candidate.extractedSummary,
    availability: candidate.availability,
    weekendAvailability: candidate.availability,
    currentStatus: candidate.status,
    sourceLabel: "Talent Pipeline",
    submittedByHrName: candidate.hrNotes || "Julie Zhu",
    submittedAt: candidate.updatedAt,
    currentAssignedTasks: [],
    matchScore: 0,
    matchStatus: "Risky" as const,
    matchReason: "",
    riskNotes: candidate.riskNotes,
  }));
}

function languageMatchesProfile(profileLanguage = "", optionLabel = "") {
  const profileText = normalizeLower(profileLanguage);
  const option = findRecruitingLanguageOption(optionLabel);
  const optionLanguage = normalizeLower(option?.language || "");
  const optionRegion = normalizeLower(option?.region || "");
  const labelText = normalizeLower(optionLabel);
  if (!profileText || !optionLanguage) return false;
  return (
    profileText === optionLanguage ||
    profileText.includes(optionLanguage) ||
    optionLanguage.includes(profileText) ||
    (optionRegion ? profileText.includes(optionRegion) || optionRegion.includes(profileText) : false) ||
    labelText.includes(profileText)
  );
}

function deriveAssignedTasks(profile: BrainTalentProfile, tasks: RecruitingTask[]) {
  const candidateTokens = [profile.nativeLanguage, profile.secondLanguage, ...profile.skills, profile.experienceSummary]
    .map((value) => normalizeLower(value))
    .filter(Boolean);

  return tasks
    .filter((task) => task.status !== "Completed")
    .filter((task) => {
      const taskTokens = [
        task.taskName,
        task.description,
        ...task.requiredLanguages,
        ...task.scripts.map((script) => script.content),
      ]
        .map((value) => normalizeLower(value))
        .filter(Boolean);
      return candidateTokens.some((candidateToken) => taskTokens.some((taskToken) => taskToken.includes(candidateToken)));
    })
    .map((task) => task.taskName);
}

function scoreAvailability(value = "") {
  const normalized = normalizeLower(value);
  if (normalized.includes("available now")) return 15;
  if (normalized.includes("this week")) return 10;
  if (normalized.includes("this month")) return 5;
  if (normalized.includes("limited")) return 0;
  return 7;
}

function getMatchStatus(score: number, assignedTasks: string[], availability: string): BrainTalentProfile["matchStatus"] {
  const limitedAvailability = normalizeLower(availability).includes("limited") || normalizeLower(availability).includes("this month");
  if (limitedAvailability || assignedTasks.length >= 3 || score < 50) return "Not Available";
  if (score >= 85) return "Recommended";
  if (score >= 70) return "Backup";
  return "Risky";
}

function matchTalentProfiles(
  project: ProjectDraft,
  analysis: BrainProjectAnalysis | null,
  profiles: BrainTalentProfile[],
  tasks: RecruitingTask[],
): BrainTalentProfile[] {
  const targetLanguages = analysis?.inferredLanguages || [];
  const requiredSkills = splitListInput(project.requiredSkills);
  const projectTokens = [
    project.projectType,
    project.projectDescription,
    project.targetMarketRegion,
    ...requiredSkills,
  ]
    .map((value) => normalizeLower(value))
    .filter(Boolean);

  return profiles
    .map((profile) => {
      const assignedTasks = deriveAssignedTasks(profile, tasks);
      const candidateLanguages = [profile.nativeLanguage, profile.secondLanguage].filter((value) => normalizeLower(value) !== "—");
      let score = 0;
      const reasonParts: string[] = [];
      const riskParts: string[] = [];

      targetLanguages.forEach((languageLabel) => {
        const matched = candidateLanguages.some((candidateLanguage) => languageMatchesProfile(candidateLanguage, languageLabel));
        if (matched) {
          score += 22;
          reasonParts.push(`${languageLabel} match`);
        }
      });

      requiredSkills.forEach((skill) => {
        const normalizedSkill = normalizeLower(skill);
        if (
          [profile.skills.join(" "), profile.experienceSummary, profile.sourceLabel]
            .map((value) => normalizeLower(value))
            .some((value) => value.includes(normalizedSkill))
        ) {
          score += 10;
          reasonParts.push(`${skill} fit`);
        }
      });

      if (
        projectTokens.some((token) =>
          [profile.experienceSummary, profile.skills.join(" "), profile.currentStatus]
            .map((value) => normalizeLower(value))
            .some((value) => value.includes(token)),
        )
      ) {
        score += 8;
        reasonParts.push("project experience match");
      }

      score += scoreAvailability(profile.availability);
      if (profile.currentStatus && normalizeLower(profile.currentStatus) !== "deleted") {
        score += 5;
      }

      const workloadPenalty = Math.min(12, assignedTasks.length * 4);
      score -= workloadPenalty;
      if (assignedTasks.length > 0) {
        riskParts.push(`${assignedTasks.length} active task${assignedTasks.length > 1 ? "s" : ""} linked`);
      }

      if (normalizeLower(profile.availability).includes("this month")) {
        riskParts.push("limited near-term availability");
      }

      const normalizedScore = Math.max(0, Math.min(100, score));
      const matchStatus = getMatchStatus(normalizedScore, assignedTasks, profile.availability);
      const riskNotes =
        riskParts.length > 0 ? riskParts.join("; ") : "No major risk flags; availability and language fit look stable.";
      const matchReason =
        reasonParts.length > 0
          ? reasonParts.join(", ")
          : `Coverage is based on ${profile.nativeLanguage || "profile language"} and general availability signals.`;

      return {
        ...profile,
        currentAssignedTasks: assignedTasks,
        matchScore: normalizedScore,
        matchStatus,
        matchReason,
        riskNotes,
      };
    })
    .sort((left, right) => right.matchScore - left.matchScore)
    .slice(0, 12);
}

function generateTalentPersonas(project: ProjectDraft, analysis: BrainProjectAnalysis | null): PersonaCard[] {
  const languages = analysis?.inferredLanguages?.length ? analysis.inferredLanguages.join(", ") : "target languages";
  const projectType = project.projectType;
  const isUrgent = project.deliveryPriority === "Urgent";
  const isHighPriority = project.deliveryPriority === "High Priority";
  const qualityThreshold = isUrgent ? "98%" : isHighPriority ? "95%" : "92%";
  const primaryAvailability = isUrgent ? "4+ hours/day" : "2–4 hours/day";
  const backupAvailability = isUrgent ? "on-call" : "part-time";

  return [
    {
      roleName: "Primary Evaluator",
      requiredLanguageLevel: `Native / C2 ${languages}`,
      requiredExperience: `${projectType} experience, fast guideline adoption, and consistent task quality.`,
      requiredAvailability: primaryAvailability,
      requiredSkills: `${projectType}, ${splitListInput(project.requiredSkills).slice(0, 3).join(", ") || "quality review"}`,
      qualityThreshold,
      notes: "Owns the main delivery queue and produces the first-pass output.",
    },
    {
      roleName: "Senior Reviewer",
      requiredLanguageLevel: `Native or near-native ${languages}`,
      requiredExperience: `QA or review experience with strong escalation handling.`,
      requiredAvailability: "1–2 hours/day",
      requiredSkills: "quality review, discrepancy resolution, edge-case handling",
      qualityThreshold: isUrgent ? "99%" : "97%",
      notes: "Performs review passes and signs off on borderline work.",
    },
    {
      roleName: "QA Checker",
      requiredLanguageLevel: `${languages} with strong reading accuracy`,
      requiredExperience: `${projectType} delivery plus basic annotation QA.`,
      requiredAvailability: "1–3 hours/day",
      requiredSkills: "guideline compliance, accuracy checks, output consistency",
      qualityThreshold: "95%",
      notes: "Flags drift and enforces quality thresholds.",
    },
    {
      roleName: "Language Lead",
      requiredLanguageLevel: `Native ${languages}`,
      requiredExperience: `Locale leadership, terminology consistency, and cultural review.`,
      requiredAvailability: isHighPriority ? "daily" : "2–3 days/week",
      requiredSkills: "localization judgement, terminology review, cultural nuance",
      qualityThreshold: "96%",
      notes: "Keeps language-specific decisions stable across the project.",
    },
    {
      roleName: "Project Backup Pool",
      requiredLanguageLevel: `Functional ${languages}`,
      requiredExperience: `Backup coverage for spikes, leave, and late-stage issue handling.`,
      requiredAvailability: backupAvailability,
      requiredSkills: "handover readiness, fast ramp-up, flexible coverage",
      qualityThreshold: isUrgent ? "93%" : "90%",
      notes: "Used when the main pool is unavailable or a rush turn comes in.",
    },
  ];
}

function generateLanguagePlan(project: ProjectDraft, analysis: BrainProjectAnalysis | null, matches: BrainTalentProfile[]): LanguagePlanRow[] {
  const languages = analysis?.inferredLanguages?.length ? analysis.inferredLanguages : ["English - North American"];
  const normalizedType = normalizeLower(project.projectType);
  const base = normalizedType.includes("safety") || normalizedType.includes("moderation") ? 6 : normalizedType.includes("collection") ? 8 : normalizedType.includes("llm") ? 7 : 5;
  const priorityBoost = project.deliveryPriority === "Urgent" ? 2 : project.deliveryPriority === "High Priority" ? 1 : 0;
  const budgetPenalty = project.budgetLevel === "Low" ? -1 : 0;
  const perLanguageRequired = Math.max(2, Math.round((base + priorityBoost + budgetPenalty) / Math.max(1, languages.length)));
  const totalMatched = matches.filter((match) => match.matchStatus !== "Not Available").length;

  return languages.map((languageLabel, index) => {
    const split = splitLanguageLabel(languageLabel);
    const compatibleMatches = matches.filter((match) => {
      const candidateLanguages = [match.nativeLanguage, match.secondLanguage].filter((value) => normalizeLower(value) !== "—");
      return candidateLanguages.some((candidateLanguage) => languageMatchesProfile(candidateLanguage, languageLabel));
    });
    const canShareWithOtherLanguage =
      languages.length > 1 || /evaluation|localization|translation|search|safety|moderation/.test(normalizeLower(project.projectType));
    const suggestedTalentCount = Math.max(1, Math.min(perLanguageRequired, Math.max(compatibleMatches.length || totalMatched || 1, Math.ceil(perLanguageRequired * 0.75))));
    const requiredHoursPerDay =
      normalizedType.includes("collection")
        ? "4–6"
        : normalizedType.includes("asr") || normalizedType.includes("speech") || normalizedType.includes("tts")
          ? "3–5"
          : normalizedType.includes("llm") || normalizedType.includes("search") || normalizedType.includes("safety")
            ? "2–4"
            : "2–3";

    return {
      languageLabel,
      language: split.language,
      region: split.region,
      requiredHeadcount: perLanguageRequired,
      requiredHoursPerDay,
      canShareWithOtherLanguage,
      suggestedTalentCount,
      priority: index === 0 ? project.deliveryPriority : project.deliveryPriority === "Normal" ? "Medium" : project.deliveryPriority,
      notes:
        canShareWithOtherLanguage && languages.length > 1
          ? "Allow bilingual backup coverage where quality thresholds remain stable."
          : "Use native-first coverage and keep backup talent ready for escalation.",
    };
  });
}

function generateGapRows(
  project: ProjectDraft,
  languagePlan: LanguagePlanRow[],
  matches: BrainTalentProfile[],
  currentHrLabel: string,
) {
  return languagePlan
    .map((row) => {
      const matchedTalentCount = matches.filter((match) =>
        [match.nativeLanguage, match.secondLanguage]
          .filter((value) => normalizeLower(value) !== "—")
          .some((candidateLanguage) => languageMatchesProfile(candidateLanguage, row.languageLabel)),
      ).length;
      const gapCount = Math.max(row.requiredHeadcount - matchedTalentCount, 0);
      const suggestedRecruitingTask = `${row.language} ${project.projectType} Recruitment`;
      return {
        ...row,
        matchedTalentCount,
        gapCount,
        reason:
          gapCount > 0
            ? `Need ${gapCount} more ${row.language} talent${gapCount > 1 ? "s" : ""} to close the current coverage gap.`
            : `Coverage is sufficient with ${matchedTalentCount} available talent${matchedTalentCount === 1 ? "" : "s"}.`,
        suggestedRecruitingTask,
        suggestedHr: currentHrLabel,
      };
    })
    .filter((row) => row.gapCount > 0);
}

function buildRecruitingTaskFromGap(
  project: ProjectDraft,
  analysis: BrainProjectAnalysis | null,
  gap: GapRow,
  currentHr: LoggedInSession | null,
  hrAccounts: LocalAccount[],
): RecruitingTask {
  const primaryHr = getPrimaryHrAccount(currentHr, hrAccounts);
  const creatorAccount = currentHr?.loginAccount || primaryHr.loginAccount || "julie";
  const creatorName = currentHr?.name || primaryHr.name || "Julie Zhu";
  const taskId = `brain-${slugify(project.projectName || project.clientName || "task")}-${slugify(gap.languageLabel)}-${Date.now()}`;
  const startDate = project.expectedStartDate || todayValue();
  const endDate = project.expectedEndDate || addDays(startDate, 30);
  return {
    taskId,
    taskName: gap.suggestedRecruitingTask,
    status: "Draft",
    startDate,
    endDate,
    creatorAccount,
    creatorName,
    requiredLanguages: [gap.languageLabel],
    assignedHrAccounts: [primaryHr.loginAccount],
    description:
      analysis?.projectSummary ||
      `${gap.language} recruiting task generated from ${project.projectName || project.clientName || "the project"} to fill the current gap.`,
    scripts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lockedAt: undefined,
  };
}

function SectionCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e2d8c8] bg-white shadow-[0_10px_30px_rgba(31,41,51,0.06)]">
      <div className="flex flex-col gap-3 border-b border-[#ebe2d3] px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#111827]">{title}</h2>
          {description ? <p className="mt-1 max-w-4xl text-sm text-[#6f6256]">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function ModalFrame({
  title,
  description,
  actions,
  onClose,
  children,
  widthClassName = "max-w-7xl",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
}) {
  return (
    <div className="scroll-panel fixed inset-0 z-50 flex items-start justify-center bg-[#111827]/50 px-4 py-6">
      <div className={`w-full ${widthClassName} overflow-hidden rounded-3xl border border-[#e2d8c8] bg-[#f8f5ec] shadow-[0_24px_60px_rgba(15,23,42,0.18)]`}>
        <div className="flex items-start justify-between gap-4 border-b border-[#e2d8c8] bg-[#fffdf8] px-6 py-5">
          <div>
            <div className="text-2xl font-black tracking-tight text-[#111827]">{title}</div>
            {description ? <p className="mt-1 max-w-4xl text-sm text-[#6f6256]">{description}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d7dccf] bg-[#fffdf8] px-4 text-sm font-semibold text-[#111827] transition hover:bg-[#f4efe2]"
            >
              Close
            </button>
          </div>
        </div>
        <div className="scroll-panel max-h-[calc(100vh-9rem)] px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "green" | "amber" | "blue" | "red";
}) {
  const className =
    tone === "green"
      ? "border-[#d4e7da] bg-[#eef7f1] text-[#1f5c43]"
      : tone === "amber"
        ? "border-[#f3ddb0] bg-[#fff8e6] text-[#8a5a00]"
        : tone === "blue"
          ? "border-[#cfe0ff] bg-[#edf4ff] text-[#1d4ed8]"
          : tone === "red"
            ? "border-[#f0c9c9] bg-[#fff2f2] text-[#b91c1c]"
            : "border-[#d7dccf] bg-[#fffdf8] text-[#6f6256]";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}>
      {children}
    </span>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="rounded-2xl border border-[#e7ddd0] bg-[#fefdfa] px-4 py-4 shadow-[0_8px_24px_rgba(31,41,51,0.04)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">{label}</div>
      <div className={`mt-2 text-2xl font-black tracking-tight ${tone}`}>{value}</div>
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f0e8db] py-3 last:border-b-0">
      <div className="text-sm font-semibold text-[#6f6256]">{label}</div>
      <div className="max-w-[65%] text-right text-sm font-semibold text-[#111827]">{value || "—"}</div>
    </div>
  );
}

function formatMatchStatusColor(status: BrainTalentProfile["matchStatus"]) {
  switch (status) {
    case "Recommended":
      return "green";
    case "Backup":
      return "blue";
    case "Risky":
      return "amber";
    case "Not Available":
    default:
      return "red";
  }
}

function formatRatePercent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function formatProjectStatusTone(status: ProjectRowView["status"]) {
  switch (status) {
    case "Ready":
    case "Completed":
      return "green";
    case "Recruiting":
      return "blue";
    case "Matching":
      return "amber";
    case "Locked":
      return "red";
    default:
      return "default";
  }
}

export function BlackDogBrainPage({ initialProfiles }: { initialProfiles: TalentProfileRecord[] }) {
  const currentSession = typeof window === "undefined" ? null : readLoggedInSession();
  const hrAccounts: LocalAccount[] = typeof window === "undefined" ? DEFAULT_LOCAL_ACCOUNTS : getStoredAccounts();
  const [recruitingTasks, setRecruitingTasks] = useState<RecruitingTask[]>(() =>
    typeof window === "undefined" ? initializeDefaultRecruitingTasks() : getStoredRecruitingTasks(),
  );
  const [brainProjects, setBrainProjects] = useState<BrainProjectRecord[]>(() =>
    typeof window === "undefined" ? [] : getStoredBrainProjects(),
  );
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectFormMode, setProjectFormMode] = useState<ProjectFormMode>("create");
  const [projectEditingId, setProjectEditingId] = useState<string | null>(null);
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(() => {
    if (typeof window === "undefined") return createDefaultProjectDraft();
    const storedProjects = getStoredBrainProjects();
    return storedProjects[0] ? mapBrainProjectRecordToDraft(storedProjects[0]) : createDefaultProjectDraft();
  });
  const [brainRulesText, setBrainRulesText] = useState(() =>
    typeof window === "undefined" ? DEFAULT_BRAIN_RULES : getStoredBrainRules().content || DEFAULT_BRAIN_RULES,
  );
  const [brainRulesUpdatedAt, setBrainRulesUpdatedAt] = useState(() =>
    typeof window === "undefined" ? new Date().toISOString() : getStoredBrainRules().updatedAt || new Date().toISOString(),
  );
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [analyzingProjectId, setAnalyzingProjectId] = useState<string | null>(null);
  const [isProjectFormAnalyzing, setIsProjectFormAnalyzing] = useState(false);
  const [taskMessage, setTaskMessage] = useState("");
  const [aiGatewayTest, setAiGatewayTest] = useState({
    provider: "openai",
    model: DEFAULT_AI_GATEWAY_MODEL,
    connectionStatus: "Not tested",
    lastTestTime: "—",
    lastError: "",
    isTesting: false,
  });

  const currentHrAccount = useMemo(() => getPrimaryHrAccount(currentSession, hrAccounts), [currentSession, hrAccounts]);
  const currentHrLabel = formatHrAccountLabel(currentHrAccount);
  const currentHrName = currentSession?.name || currentHrAccount.name || "Julie Zhu";

  const talentProfiles = useMemo(() => buildTalentPool(initialProfiles), [initialProfiles]);

  function deriveProjectStatus(
    analysisForMetrics: BrainProjectAnalysis | null,
    talentMatches: BrainTalentProfile[],
    languagePlan: LanguagePlanRow[],
    gapRows: GapRow[],
  ): Exclude<ProjectRowView["status"], "Locked"> {
    if (!analysisForMetrics) return "Draft";
    const required = languagePlan.reduce((sum, row) => sum + row.requiredHeadcount, 0);
    const inPool = talentMatches.filter((profile) => profile.matchStatus !== "Not Available").length;
    const recruiting = gapRows.reduce((sum, row) => sum + row.gapCount, 0);
    if (recruiting > 0) return inPool > 0 ? "Recruiting" : "Matching";
    if (required > 0 && inPool >= required) return "Ready";
    return "Analyzing";
  }

  const projectRows = useMemo<ProjectRowView[]>(
    () =>
      brainProjects.map((record) => {
        const draft = mapBrainProjectRecordToDraft(record);
        const analysisForMetrics = record.analysis || null;
        const talentMatches = analysisForMetrics
          ? matchTalentProfiles(draft, analysisForMetrics, talentProfiles, recruitingTasks)
          : [];
        const languagePlan = analysisForMetrics ? generateLanguagePlan(draft, analysisForMetrics, talentMatches) : [];
        const gapRows = analysisForMetrics ? generateGapRows(draft, languagePlan, talentMatches, currentHrLabel) : [];
        const required = analysisForMetrics ? languagePlan.reduce((sum, row) => sum + row.requiredHeadcount, 0) : 0;
        const inPool = analysisForMetrics ? talentMatches.filter((profile) => profile.matchStatus !== "Not Available").length : 0;
        const matched = analysisForMetrics ? talentMatches.filter((profile) => profile.matchStatus === "Recommended").length : 0;
        const recruiting = analysisForMetrics ? gapRows.reduce((sum, row) => sum + row.gapCount, 0) : 0;
        const ready = Boolean(analysisForMetrics && recruiting === 0 && required > 0 && inPool >= required);
        const unlockedStatus = deriveProjectStatus(analysisForMetrics, talentMatches, languagePlan, gapRows);
        const status: ProjectRowView["status"] = record.status === "Locked" ? "Locked" : record.status || unlockedStatus;
        const eta = record.expectedEndDate || "—";
        return {
          record,
          draft,
          analysis: analysisForMetrics,
          required,
          inPool,
          recruiting,
          matched,
          ready,
          status,
          eta,
          talentMatches,
          languagePlan,
          gapRows,
        };
      }),
    [brainProjects, currentHrLabel, recruitingTasks, talentProfiles],
  );

  const selectedProjectRow = useMemo(
    () => projectRows.find((row) => row.record.brainProjectId === activeProjectId) || null,
    [activeProjectId, projectRows],
  );

  const selectedProjectDraft = selectedProjectRow?.draft || createDefaultProjectDraft();
  const selectedProjectAnalysis = selectedProjectRow
    ? selectedProjectRow.analysis || buildAnalysis(selectedProjectDraft, currentHrName, hrAccounts)
    : null;
  const selectedProjectTalentMatches = selectedProjectRow
    ? matchTalentProfiles(selectedProjectDraft, selectedProjectAnalysis, talentProfiles, recruitingTasks)
    : [];
  const selectedProjectLanguagePlan = selectedProjectRow
    ? generateLanguagePlan(selectedProjectDraft, selectedProjectAnalysis, selectedProjectTalentMatches)
    : [];
  const selectedProjectPersonas = selectedProjectRow ? generateTalentPersonas(selectedProjectDraft, selectedProjectAnalysis) : [];
  const selectedProjectGapRows = selectedProjectRow
    ? generateGapRows(selectedProjectDraft, selectedProjectLanguagePlan, selectedProjectTalentMatches, currentHrLabel)
    : [];

  const portfolioSummary = useMemo(() => {
    const projects = projectRows.length;
    const required = projectRows.reduce((sum, row) => sum + row.required, 0);
    const inPool = projectRows.reduce((sum, row) => sum + row.inPool, 0);
    const recruiting = projectRows.reduce((sum, row) => sum + row.recruiting, 0);
    const ready = projectRows.filter((row) => row.ready).length;
    return { projects, required, inPool, recruiting, ready };
  }, [projectRows]);

  function handleFieldChange<K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) {
    setProjectDraft((current) => ({
      ...current,
      [key]: value,
    }));
    setAnalysisError("");
    setTaskMessage("");
  }

  function hasRequiredProjectFields(draft: ProjectDraft) {
    return [
      draft.clientName,
      draft.projectName,
      draft.projectType,
      draft.targetMarketRegion,
      draft.projectDescription,
      draft.expectedStartDate,
      draft.expectedEndDate,
    ].some((value) => !normalizeText(value));
  }

  function buildAIGatewayProjectInput(draft: ProjectDraft) {
    return {
      clientName: draft.clientName,
      projectName: draft.projectName,
      projectType: draft.projectType,
      targetMarket: draft.targetMarketRegion,
      description: [draft.projectDescription, draft.requiredSkills ? `Required skills: ${draft.requiredSkills}` : "", draft.notes ? `Notes: ${draft.notes}` : ""]
        .filter(Boolean)
        .join("\n\n"),
      priority: draft.deliveryPriority,
      budgetLevel: draft.budgetLevel,
    };
  }

  function mapGatewayAnalysisToBrainAnalysis(draft: ProjectDraft, result: NonNullable<AIGatewayAnalyzeResponse["result"]>): BrainProjectAnalysis {
    const fallback = buildAnalysis(draft, currentHrName, hrAccounts);
    const requiredCapabilities = result.requiredCapabilities?.map((item) => normalizeText(item)).filter(Boolean) || [];
    const recommendedTalentPersonas = result.recommendedTalentPersonas?.map((item) => normalizeText(item)).filter(Boolean) || [];
    const languagePlan = result.languagePlan?.map((item) => normalizeText(item)).filter(Boolean) || [];
    const risks = result.risks?.map((item) => normalizeText(item)).filter(Boolean) || [];
    const nextSteps = result.nextSteps?.map((item) => normalizeText(item)).filter(Boolean) || [];

    return {
      projectSummary: normalizeText(result.projectSummary || "") || fallback.projectSummary,
      projectDifficulty: normalizeText(result.projectDifficulty || "") || fallback.projectDifficulty,
      requiredCapability: joinList(requiredCapabilities, fallback.requiredCapability),
      requiredCapabilities,
      deliveryRisk: joinList(risks, fallback.deliveryRisk),
      resourceStrategy: joinList(recommendedTalentPersonas, fallback.resourceStrategy),
      recommendedTalentPersonas,
      languagePlan,
      risks,
      nextSteps,
      hrAssignmentLogic:
        joinList([...(result.matchingConsiderations || []), ...(result.recruitingGapLogic || [])], fallback.hrAssignmentLogic),
      inferredLanguages: languagePlan.length ? languagePlan.map((item) => inferDisplayLanguageLabel(item, item)) : fallback.inferredLanguages,
    };
  }

  async function analyzeProjectWithGateway(draft: ProjectDraft) {
    const response = await fetch("/api/ai/gateway", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task: "analyze_project",
        input: buildAIGatewayProjectInput(draft),
      }),
    });
    const payload = (await response.json().catch(() => null)) as AIGatewayAnalyzeResponse | null;
    if (!response.ok || !payload?.ok || !payload.result) {
      throw new Error(payload?.error || `AI analysis failed with status ${response.status}.`);
    }
    return mapGatewayAnalysisToBrainAnalysis(draft, payload.result);
  }

  function saveProjectRecord(
    draft: ProjectDraft,
    shouldAnalyze: boolean,
    existingRecord?: BrainProjectRecord,
    analysisOverride?: BrainProjectAnalysis,
  ) {
    const now = new Date().toISOString();
    const nextAnalysis = shouldAnalyze ? analysisOverride || buildAnalysis(draft, currentHrName, hrAccounts) : existingRecord?.analysis;
    const projectDraftRecord = {
      clientName: normalizeText(draft.clientName),
      projectName: normalizeText(draft.projectName),
      projectType: normalizeText(draft.projectType),
      targetMarketRegion: normalizeText(draft.targetMarketRegion),
      projectDescription: normalizeText(draft.projectDescription),
      requiredSkills: splitListInput(draft.requiredSkills),
      expectedStartDate: draft.expectedStartDate,
      expectedEndDate: draft.expectedEndDate,
      deliveryPriority: draft.deliveryPriority,
      budgetLevel: draft.budgetLevel,
      notes: normalizeText(draft.notes),
    };
    const tempRecord: BrainProjectRecord = {
      brainProjectId: existingRecord?.brainProjectId || createBrainProjectId(),
      ...projectDraftRecord,
      createdAt: existingRecord?.createdAt || now,
      updatedAt: now,
      analysis: nextAnalysis || undefined,
      status: existingRecord?.status || "Draft",
      previousStatus: existingRecord?.previousStatus,
    };
    const evaluatedAnalysis = nextAnalysis || existingRecord?.analysis || null;
    const evaluatedDraft = mapBrainProjectRecordToDraft(tempRecord);
    const evaluatedMatches = evaluatedAnalysis ? matchTalentProfiles(evaluatedDraft, evaluatedAnalysis, talentProfiles, recruitingTasks) : [];
    const evaluatedLanguagePlan = evaluatedAnalysis ? generateLanguagePlan(evaluatedDraft, evaluatedAnalysis, evaluatedMatches) : [];
    const evaluatedGapRows = evaluatedAnalysis ? generateGapRows(evaluatedDraft, evaluatedLanguagePlan, evaluatedMatches, currentHrLabel) : [];
    const nextStatus: BrainProjectStatus =
      existingRecord?.status === "Locked"
        ? "Locked"
        : shouldAnalyze && evaluatedAnalysis
          ? deriveProjectStatus(evaluatedAnalysis, evaluatedMatches, evaluatedLanguagePlan, evaluatedGapRows)
          : existingRecord?.status || "Draft";
    const previousStatus: Exclude<BrainProjectStatus, "Locked"> =
      existingRecord?.previousStatus || (existingRecord?.status && existingRecord.status !== "Locked" ? existingRecord.status : "Draft");
    const projectAfterSave: BrainProjectRecord = {
      ...tempRecord,
      analysis: nextAnalysis || tempRecord.analysis,
      status: nextStatus,
      previousStatus: nextStatus === "Locked" ? previousStatus : undefined,
    };

    setBrainProjects((current) => {
      const next = [projectAfterSave, ...current.filter((item) => item.brainProjectId !== projectAfterSave.brainProjectId)];
      saveStoredBrainProjects(next);
      return next;
    });
    return projectAfterSave;
  }

  async function handleAnalyzeStoredProject(projectId: string) {
    const existingRecord = brainProjects.find((item) => item.brainProjectId === projectId);
    if (!existingRecord) return;
    const draft = mapBrainProjectRecordToDraft(existingRecord);
    setAnalyzingProjectId(projectId);
    setAnalysisError("");
    setTaskMessage("Analyzing project with AI Gateway...");
    try {
      const analysis = await analyzeProjectWithGateway(draft);
      const record = saveProjectRecord(draft, true, existingRecord, analysis);
      setActiveProjectId(projectId);
      setTaskMessage(`AI analysis saved for ${record.projectName}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI analysis failed.";
      setAnalysisError(message);
      setTaskMessage("AI analysis failed.");
    } finally {
      setAnalyzingProjectId(null);
    }
  }

  function closeProjectDetail() {
    setActiveProjectId(null);
  }

  function openCreateProjectModal() {
    setActiveProjectId(null);
    setProjectFormMode("create");
    setProjectEditingId(null);
    setProjectDraft(createDefaultProjectDraft());
    setAnalysisError("");
    setTaskMessage("");
    setProjectModalOpen(true);
  }

  function openEditProjectModal(projectId: string) {
    const existingRecord = brainProjects.find((item) => item.brainProjectId === projectId);
    if (!existingRecord) return;
    setActiveProjectId(null);
    setProjectFormMode("edit");
    setProjectEditingId(projectId);
    setProjectDraft(mapBrainProjectRecordToDraft(existingRecord));
    setAnalysisError("");
    setTaskMessage("");
    setProjectModalOpen(true);
  }

  async function handleSaveProjectFromModal(shouldAnalyze: boolean) {
    if (hasRequiredProjectFields(projectDraft)) {
      setAnalysisError("Please complete the required project intake fields before saving.");
      return;
    }

    const existingRecord = projectFormMode === "edit" && projectEditingId ? brainProjects.find((item) => item.brainProjectId === projectEditingId) : undefined;
    setAnalysisError("");
    setIsProjectFormAnalyzing(shouldAnalyze);
    setTaskMessage(shouldAnalyze ? "Analyzing project with AI Gateway..." : "");

    try {
      const analysis = shouldAnalyze ? await analyzeProjectWithGateway(projectDraft) : undefined;
      const nextRecord = saveProjectRecord(projectDraft, shouldAnalyze, existingRecord, analysis);
      setTaskMessage(shouldAnalyze ? "Project saved with AI analysis." : "Project saved locally.");
      setProjectModalOpen(false);
      setProjectEditingId(null);
      setProjectFormMode("create");
      setProjectDraft(createDefaultProjectDraft());
      if (shouldAnalyze) {
        setActiveProjectId(nextRecord.brainProjectId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI analysis failed.";
      setAnalysisError(message);
      setTaskMessage("AI analysis failed.");
    } finally {
      setIsProjectFormAnalyzing(false);
    }
  }

  function handleToggleProjectLock(projectId: string) {
    const existingRecord = brainProjects.find((item) => item.brainProjectId === projectId);
    if (!existingRecord) return;
    const isLocked = existingRecord.status === "Locked";
    const unlockedStatus: Exclude<ProjectRowView["status"], "Locked"> = existingRecord.analysis
      ? (() => {
          const draft = mapBrainProjectRecordToDraft(existingRecord);
          const matches = matchTalentProfiles(draft, existingRecord.analysis || null, talentProfiles, recruitingTasks);
          const languagePlan = generateLanguagePlan(draft, existingRecord.analysis || null, matches);
          const gapRows = generateGapRows(draft, languagePlan, matches, currentHrLabel);
          return gapRows.length > 0 ? (matches.length > 0 ? "Recruiting" : "Matching") : "Matching";
        })()
      : "Draft";
    const nextRecord: BrainProjectRecord = {
      ...existingRecord,
      status: isLocked ? existingRecord.previousStatus || unlockedStatus : "Locked",
      previousStatus: isLocked ? undefined : existingRecord.status === "Locked" ? existingRecord.previousStatus : existingRecord.status || unlockedStatus,
      updatedAt: new Date().toISOString(),
    };
    const nextProjects = brainProjects.map((item) => (item.brainProjectId === projectId ? nextRecord : item));
    setBrainProjects(nextProjects);
    saveStoredBrainProjects(nextProjects);
    setTaskMessage(isLocked ? "Project unlocked." : "Project locked.");
  }

  function handleGenerateProjectTasksFromSelected() {
    if (!selectedProjectRow) return;
    const sourceAnalysis = selectedProjectAnalysis || buildAnalysis(selectedProjectDraft, currentHrName, hrAccounts);
    const sourceMatches = selectedProjectTalentMatches.length
      ? selectedProjectTalentMatches
      : matchTalentProfiles(selectedProjectDraft, sourceAnalysis, talentProfiles, recruitingTasks);
    const sourceLanguagePlan = selectedProjectLanguagePlan.length
      ? selectedProjectLanguagePlan
      : generateLanguagePlan(selectedProjectDraft, sourceAnalysis, sourceMatches);
    const sourceGapRows = selectedProjectGapRows.length
      ? selectedProjectGapRows
      : generateGapRows(selectedProjectDraft, sourceLanguagePlan, sourceMatches, currentHrLabel);

    if (!sourceGapRows.length) {
      setTaskMessage("No recruiting gap detected for this project.");
      return;
    }

    const existingTasks = getStoredRecruitingTasks();
    let nextTasks = [...existingTasks];
    let createdCount = 0;
    sourceGapRows.forEach((gap) => {
      const task = buildRecruitingTaskFromGap(selectedProjectDraft, sourceAnalysis, gap, currentSession, hrAccounts);
      const alreadyExists = nextTasks.some(
        (item) => normalizeLower(item.taskName) === normalizeLower(task.taskName) && item.requiredLanguages.includes(gap.languageLabel),
      );
      if (!alreadyExists) {
        nextTasks = [task, ...nextTasks];
        createdCount += 1;
      }
    });
    saveStoredRecruitingTasks(nextTasks);
    setRecruitingTasks(nextTasks);
    setTaskMessage(
      createdCount > 0
        ? `Created ${createdCount} draft recruiting task${createdCount > 1 ? "s" : ""}.`
        : "Draft recruiting tasks already exist for this project.",
    );
  }

  function handleDeleteProject(projectId: string) {
    const existingRecord = brainProjects.find((item) => item.brainProjectId === projectId);
    if (!existingRecord) return;
    const confirmed = typeof window === "undefined" ? true : window.confirm("Delete this client project?");
    if (!confirmed) return;
    const nextProjects = brainProjects.filter((item) => item.brainProjectId !== projectId);
    setBrainProjects(nextProjects);
    saveStoredBrainProjects(nextProjects);
    if (activeProjectId === projectId) setActiveProjectId(null);
    setTaskMessage(`Deleted ${existingRecord.projectName}.`);
  }

  function handleGenerateRecruitingTask(gap: GapRow) {
    if (!selectedProjectRow) return;
    const task = buildRecruitingTaskFromGap(selectedProjectDraft, selectedProjectAnalysis, gap, currentSession, hrAccounts);
    const existingTasks = getStoredRecruitingTasks();
    const alreadyExists = existingTasks.some(
      (item) => normalizeLower(item.taskName) === normalizeLower(task.taskName) && item.requiredLanguages.includes(gap.languageLabel),
    );
    const nextTasks = alreadyExists ? existingTasks : [task, ...existingTasks];
    saveStoredRecruitingTasks(nextTasks);
    setRecruitingTasks(nextTasks);
    setTaskMessage(alreadyExists ? `Draft task already exists for ${gap.language}.` : `Draft recruiting task created for ${gap.language}.`);
  }

  function handleSaveRules() {
    const updatedAt = new Date().toISOString();
    setBrainRulesUpdatedAt(updatedAt);
    saveStoredBrainRules({
      content: brainRulesText,
      updatedAt,
    });
    setTaskMessage("Matching Brain Rules were saved locally.");
  }

  function handleResetRules() {
    const updatedAt = new Date().toISOString();
    setBrainRulesText(DEFAULT_BRAIN_RULES);
    setBrainRulesUpdatedAt(updatedAt);
    saveStoredBrainRules({
      content: DEFAULT_BRAIN_RULES,
      updatedAt,
    });
    setTaskMessage("Matching Brain Rules were reset to the default knowledge file.");
  }

  async function handleTestOpenAIConnection() {
    setAiGatewayTest((current) => ({
      ...current,
      provider: "openai",
      model: current.model || DEFAULT_AI_GATEWAY_MODEL,
      connectionStatus: "Testing",
      lastError: "",
      isTesting: true,
    }));

    const startedAt = Date.now();
    try {
      const response = await fetch("/api/ai/health", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const payload = (await response.json()) as
        | {
            ok?: boolean;
            provider?: string;
            model?: string;
            message?: string;
            error?: string;
          }
        | null;
      const lastTestTime = new Date().toLocaleString();
      if (payload?.ok) {
        setAiGatewayTest({
          provider: payload.provider || "openai",
          model: payload.model || DEFAULT_AI_GATEWAY_MODEL,
          connectionStatus: "Connected",
          lastTestTime,
          lastError: "",
          isTesting: false,
        });
        setTaskMessage(`AI Gateway test succeeded in ${Date.now() - startedAt} ms.`);
        return;
      }

      setAiGatewayTest({
        provider: payload?.provider || "openai",
        model: payload?.model || DEFAULT_AI_GATEWAY_MODEL,
        connectionStatus: "Failed",
        lastTestTime,
        lastError: payload?.error || "Unable to connect to OpenAI.",
        isTesting: false,
      });
      setTaskMessage("AI Gateway test failed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to connect to OpenAI.";
      setAiGatewayTest({
        provider: "openai",
        model: DEFAULT_AI_GATEWAY_MODEL,
        connectionStatus: "Failed",
        lastTestTime: new Date().toLocaleString(),
        lastError: message,
        isTesting: false,
      });
      setTaskMessage("AI Gateway test failed.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f5ec] pb-24 pt-6 text-[#111827]">
      <div className="page-shell flex flex-col gap-6">
        <header className="rounded-3xl border border-[#e2d8c8] bg-[#fffdf8] px-6 py-6 shadow-[0_10px_30px_rgba(31,41,51,0.06)]">
          <div className="flex flex-col gap-3">
            <div className="text-3xl font-black tracking-tight text-[#111827]">BlackDog Brain</div>
            <p className="max-w-4xl text-sm text-[#6f6256]">
              AI talent matching engine for client projects, talent pools, and recruiting gaps.
            </p>
            <p className="max-w-4xl text-sm text-[#1f5c43]">
              根据客户项目需求，自动分析人才画像、匹配人才库，并生成招聘缺口任务。
            </p>
          </div>
        </header>

        {taskMessage ? (
          <div className="rounded-2xl border border-[#d4e7da] bg-[#eef7f1] px-4 py-3 text-sm font-medium text-[#1f5c43]">
            {taskMessage}
          </div>
        ) : null}

        <SectionCard
          title="AI Gateway Status"
          description="Check the AI gateway status before running project analysis."
          actions={
            <button
              type="button"
              onClick={handleTestOpenAIConnection}
              disabled={aiGatewayTest.isTesting}
              className="inline-flex items-center justify-center rounded-xl bg-[#1f5c43] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)] transition hover:bg-[#164d38] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {aiGatewayTest.isTesting ? "Testing..." : "Test OpenAI Connection"}
            </button>
          }
        >
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-2xl border border-[#e7ddd0] bg-[#fefdfa] p-4">
              <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-4">
                <StatLine label="Provider" value={aiGatewayTest.provider} />
                <StatLine label="Model" value={aiGatewayTest.model} />
                <StatLine label="Connection Status" value={aiGatewayTest.connectionStatus} />
                <StatLine label="Last Test Time" value={aiGatewayTest.lastTestTime} />
              </div>
            </div>
            <div className="rounded-2xl border border-[#e7ddd0] bg-[#fefdfa] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Last Error</div>
              <div className="mt-2 rounded-2xl border border-[#f0c9c9] bg-[#fff2f2] px-4 py-3 text-sm leading-6 text-[#b91c1c]">
                {aiGatewayTest.lastError || "—"}
              </div>
              <div className="mt-4 text-xs leading-5 text-[#6f6256]">
                The gateway is called only when you click the test button. Future AI tasks will route through /api/ai/gateway.
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-4 md:grid-cols-5">
          <MetricCard label="Projects" value={portfolioSummary.projects} tone="text-[#111827]" />
          <MetricCard label="Required" value={portfolioSummary.required} tone="text-[#111827]" />
          <MetricCard label="In Pool" value={portfolioSummary.inPool} tone="text-[#111827]" />
          <MetricCard label="Recruiting" value={portfolioSummary.recruiting} tone="text-[#111827]" />
          <MetricCard label="Ready" value={portfolioSummary.ready} tone="text-[#111827]" />
        </div>

        <SectionCard
          title="Client Project List"
          description="Review project readiness, matching coverage, and recruiting gaps."
          actions={
            <button
              type="button"
              onClick={openCreateProjectModal}
              className="inline-flex items-center justify-center rounded-xl bg-[#1f5c43] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)] transition hover:bg-[#164d38]"
            >
              Create Project
            </button>
          }
        >
          {projectRows.length ? (
            <div className="scroll-x-panel rounded-2xl border border-[#e7ddd0]">
              <table className="data-table min-w-[1280px] table-fixed">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[7%]" />
                  <col className="w-[7%]" />
                  <col className="w-[8%]" />
                  <col className="w-[7%]" />
                  <col className="w-[10%]" />
                  <col className="w-[8%]" />
                  <col className="w-[15%]" />
                </colgroup>
                <thead>
                  <tr>
                    {["Project Name", "Client", "Type", "Required", "In Pool", "Recruiting", "Matched", "ETA", "Status", "Actions"].map((heading) => (
                      <th key={heading} className={["Project Name", "Actions"].includes(heading) ? (heading === "Actions" ? "th-center" : "th-left") : "th-center"}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projectRows.map((row) => (
                    <tr key={row.record.brainProjectId} className="border-b border-[#efe6d8] bg-white hover:bg-[#f7f5ef] align-middle">
                      <td className="td-left font-semibold leading-5 text-[#111827]">{row.record.projectName}</td>
                      <td className="td-center whitespace-nowrap text-[#111827]">{row.record.clientName || <span className="text-[#a69b8c]">—</span>}</td>
                      <td className="td-center whitespace-nowrap text-[#111827]">{row.record.projectType}</td>
                      <td className="td-center whitespace-nowrap tabular-nums font-semibold text-[#1d4ed8]">
                        {row.required || <span className="text-[#a69b8c]">—</span>}
                      </td>
                      <td className="td-center whitespace-nowrap tabular-nums font-semibold text-[#1f5c43]">
                        {row.inPool || <span className="text-[#a69b8c]">—</span>}
                      </td>
                      <td className="td-center whitespace-nowrap tabular-nums font-semibold text-[#b45309]">
                        {row.recruiting || <span className="text-[#a69b8c]">—</span>}
                      </td>
                      <td className="td-center whitespace-nowrap tabular-nums font-semibold text-[#111827]">
                        {row.matched || <span className="text-[#a69b8c]">—</span>}
                      </td>
                      <td className="td-center whitespace-nowrap text-[#111827]">{row.eta}</td>
                      <td className="td-center whitespace-nowrap">
                        <Chip tone={formatProjectStatusTone(row.status)}>
                          {row.status}
                        </Chip>
                      </td>
                      <td className="td-actions">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditProjectModal(row.record.brainProjectId)}
                            className="inline-flex min-w-[52px] items-center justify-center rounded-md border border-[#d7dccf] bg-[#fffdf8] px-2.5 py-1.5 text-xs font-semibold text-[#111827] transition hover:bg-[#f4efe2]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleProjectLock(row.record.brainProjectId)}
                            className={`inline-flex min-w-[64px] items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                              row.status === "Locked"
                                ? "border border-[#b42318] bg-[#fff2f2] text-[#b42318] hover:bg-[#fde8e8]"
                                : "border border-[#d18b2b] bg-[#fff8e6] text-[#8a5a00] hover:bg-[#fff2d6]"
                            }`}
                          >
                            {row.status === "Locked" ? "Locked" : "Pause"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(row.record.brainProjectId)}
                            className="inline-flex min-w-[56px] items-center justify-center rounded-md border border-[#f0c9c9] bg-[#fff2f2] px-2.5 py-1.5 text-xs font-semibold text-[#b91c1c] transition hover:bg-[#fde8e8]"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#d7dccf] bg-[#fffdf8] px-5 py-8 text-sm text-[#6f6256]">
              Create a project to start matching talent and generating recruiting tasks.
            </div>
          )}
        </SectionCard>
      </div>

      {projectModalOpen ? (
        <ModalFrame
          title={projectFormMode === "edit" ? "Edit Project" : "Create Project"}
          description={
            projectFormMode === "edit"
              ? "Update the client project and optionally refresh the AI analysis."
              : "Create a client project and optionally save an initial AI analysis."
          }
          onClose={() => {
            setProjectModalOpen(false);
            setProjectFormMode("create");
            setProjectEditingId(null);
            setAnalysisError("");
          }}
          widthClassName="max-w-5xl"
        >
          <SectionCard
            title="Client Project Intake"
            description={
              projectFormMode === "edit"
                ? "Update the project intake details. Save Changes updates the existing project record."
                : "Enter the project intake details. Save & Analyze will call the AI Gateway and store the result for the project."
            }
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Client Name</span>
                <input
                  value={projectDraft.clientName}
                  onChange={(event) => handleFieldChange("clientName", event.target.value)}
                  placeholder="Enter client name"
                  className="mt-1 w-full rounded-xl border border-[#d7dccf] bg-[#fffdf8] px-4 py-3 text-sm outline-none transition focus:border-[#1f5c43]"
                />
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Project Name</span>
                <input
                  value={projectDraft.projectName}
                  onChange={(event) => handleFieldChange("projectName", event.target.value)}
                  placeholder="Enter project name"
                  className="mt-1 w-full rounded-xl border border-[#d7dccf] bg-[#fffdf8] px-4 py-3 text-sm outline-none transition focus:border-[#1f5c43]"
                />
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Project Type</span>
                <select
                  value={projectDraft.projectType}
                  onChange={(event) => handleFieldChange("projectType", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d7dccf] bg-[#fffdf8] px-4 py-3 text-sm outline-none transition focus:border-[#1f5c43]"
                >
                  {PROJECT_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Target Market / Region</span>
                <input
                  value={projectDraft.targetMarketRegion}
                  onChange={(event) => handleFieldChange("targetMarketRegion", event.target.value)}
                  placeholder="e.g. Japan, LATAM, Germany"
                  className="mt-1 w-full rounded-xl border border-[#d7dccf] bg-[#fffdf8] px-4 py-3 text-sm outline-none transition focus:border-[#1f5c43]"
                />
              </label>
              <label className="block lg:col-span-2">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Required Skills / Task Type</span>
                <input
                  value={projectDraft.requiredSkills}
                  onChange={(event) => handleFieldChange("requiredSkills", event.target.value)}
                  placeholder="e.g. LLM Evaluation, QA Review, Localization"
                  list="brain-skill-options"
                  className="mt-1 w-full rounded-xl border border-[#d7dccf] bg-[#fffdf8] px-4 py-3 text-sm outline-none transition focus:border-[#1f5c43]"
                />
                <datalist id="brain-skill-options">
                  {SKILL_TASK_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Expected Start Date</span>
                <input
                  type="date"
                  value={projectDraft.expectedStartDate}
                  onChange={(event) => handleFieldChange("expectedStartDate", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d7dccf] bg-[#fffdf8] px-4 py-3 text-sm outline-none transition focus:border-[#1f5c43]"
                />
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Expected End Date</span>
                <input
                  type="date"
                  value={projectDraft.expectedEndDate}
                  onChange={(event) => handleFieldChange("expectedEndDate", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#d7dccf] bg-[#fffdf8] px-4 py-3 text-sm outline-none transition focus:border-[#1f5c43]"
                />
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Delivery Priority</span>
                <select
                  value={projectDraft.deliveryPriority}
                  onChange={(event) => handleFieldChange("deliveryPriority", event.target.value as BrainProjectPriority)}
                  className="mt-1 w-full rounded-xl border border-[#d7dccf] bg-[#fffdf8] px-4 py-3 text-sm outline-none transition focus:border-[#1f5c43]"
                >
                  {DELIVERY_PRIORITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Budget Level</span>
                <select
                  value={projectDraft.budgetLevel}
                  onChange={(event) => handleFieldChange("budgetLevel", event.target.value as BrainProjectBudget)}
                  className="mt-1 w-full rounded-xl border border-[#d7dccf] bg-[#fffdf8] px-4 py-3 text-sm outline-none transition focus:border-[#1f5c43]"
                >
                  {BUDGET_LEVEL_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block lg:col-span-3">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Project Description</span>
                <textarea
                  value={projectDraft.projectDescription}
                  onChange={(event) => handleFieldChange("projectDescription", event.target.value)}
                  placeholder="Describe the project, quality expectations, and delivery constraints."
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-[#d7dccf] bg-[#fffdf8] px-4 py-3 text-sm outline-none transition focus:border-[#1f5c43]"
                />
              </label>
              <label className="block lg:col-span-3">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Notes</span>
                <textarea
                  value={projectDraft.notes}
                  onChange={(event) => handleFieldChange("notes", event.target.value)}
                  placeholder="Optional notes, risk flags, or delivery context."
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-[#d7dccf] bg-[#fffdf8] px-4 py-3 text-sm outline-none transition focus:border-[#1f5c43]"
                />
              </label>
            </div>

            {analysisError ? (
              <div className="mt-4 rounded-xl border border-[#f0c9c9] bg-[#fff2f2] px-4 py-3 text-sm font-medium text-[#b91c1c]">
                {analysisError}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleSaveProjectFromModal(false)}
                disabled={isProjectFormAnalyzing}
                className="inline-flex items-center justify-center rounded-xl border border-[#d7dccf] bg-[#fffdf8] px-5 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#f4efe2]"
              >
                {projectFormMode === "edit" ? "Save Changes" : "Save Project"}
              </button>
              <button
                type="button"
                onClick={() => void handleSaveProjectFromModal(true)}
                disabled={isProjectFormAnalyzing}
                className="inline-flex items-center justify-center rounded-xl bg-[#1f5c43] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)] transition hover:bg-[#164d38]"
              >
                {isProjectFormAnalyzing ? "Analyzing..." : projectFormMode === "edit" ? "Save & Analyze" : "Save & Analyze"}
              </button>
            </div>
          </SectionCard>
        </ModalFrame>
      ) : null}

      {selectedProjectRow ? (
        <ModalFrame
          title={selectedProjectRow.record.projectName || "Project Detail"}
          description="Review project requirements, talent matches, gaps, and recruiting actions."
          onClose={closeProjectDetail}
          actions={
            <>
              <button
                type="button"
                onClick={() => void handleAnalyzeStoredProject(selectedProjectRow.record.brainProjectId)}
                disabled={analyzingProjectId === selectedProjectRow.record.brainProjectId}
                className="inline-flex items-center justify-center rounded-xl bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#164d38]"
              >
                {analyzingProjectId === selectedProjectRow.record.brainProjectId
                  ? "Analyzing..."
                  : selectedProjectRow.record.analysis
                    ? "Re-analyze"
                    : "Analyze & Save"}
              </button>
              {selectedProjectGapRows.length > 0 ? (
                <button
                  type="button"
                  onClick={handleGenerateProjectTasksFromSelected}
                  className="inline-flex items-center justify-center rounded-xl border border-[#b42318] bg-[#fff2f2] px-4 py-2 text-sm font-semibold text-[#b42318] transition hover:bg-[#fde8e8]"
                >
                  Generate Tasks
                </button>
              ) : null}
            </>
          }
        >
          <div className="space-y-6">
            <SectionCard
              title="Project Overview"
              description="Project requirements, readiness, and matching summary."
            >
              <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                <div className="rounded-2xl border border-[#e7ddd0] bg-[#fefdfa] p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <StatLine label="Client Name" value={selectedProjectRow.record.clientName || "—"} />
                    <StatLine label="Project Name" value={selectedProjectRow.record.projectName || "—"} />
                    <StatLine label="Project Type" value={selectedProjectRow.record.projectType || "—"} />
                    <StatLine label="Target Market / Region" value={selectedProjectRow.record.targetMarketRegion || "—"} />
                    <StatLine label="Expected Start Date" value={selectedProjectRow.record.expectedStartDate || "—"} />
                    <StatLine label="Expected End Date" value={selectedProjectRow.record.expectedEndDate || "—"} />
                    <StatLine label="Delivery Priority" value={selectedProjectRow.record.deliveryPriority} />
                    <StatLine label="Budget Level" value={selectedProjectRow.record.budgetLevel} />
                  </div>
                  <div className="mt-4 rounded-2xl border border-[#e7ddd0] bg-white p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Project Description</div>
                    <div className="mt-2 text-sm leading-6 text-[#111827]">{selectedProjectRow.record.projectDescription || "—"}</div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-[#e7ddd0] bg-white p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Notes</div>
                    <div className="mt-2 text-sm leading-6 text-[#111827]">{selectedProjectRow.record.notes || "—"}</div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricCard label="Required" value={selectedProjectRow.required} tone="text-[#111827]" />
                  <MetricCard label="In Pool" value={selectedProjectRow.inPool} tone="text-[#111827]" />
                  <MetricCard label="Recruiting" value={selectedProjectRow.recruiting} tone="text-[#111827]" />
                  <MetricCard label="Matched" value={selectedProjectRow.matched} tone="text-[#111827]" />
                  <MetricCard label="ETA" value={selectedProjectRow.eta} tone="text-[#111827]" />
                  <MetricCard label="Status" value={selectedProjectRow.status} tone="text-[#111827]" />
                </div>
              </div>
              {!selectedProjectRow.record.analysis ? (
                <div className="mt-4 rounded-2xl border border-[#f3ddb0] bg-[#fff8e6] px-4 py-3 text-sm text-[#8a5a00]">
                  This project is using preview analysis data. Click Analyze & Save to persist an AI Gateway analysis.
                </div>
              ) : null}
              {analysisError ? (
                <div className="mt-4 rounded-2xl border border-[#f0c9c9] bg-[#fff2f2] px-4 py-3 text-sm font-medium text-[#b91c1c]">
                  {analysisError}
                </div>
              ) : null}
            </SectionCard>

            <SectionCard
              title="AI Requirement Analysis"
              description="AI analysis based on project details and current matching context."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <MetricCard label="Project Difficulty" value={selectedProjectAnalysis?.projectDifficulty || "—"} tone="text-[#111827]" />
                <MetricCard
                  label="Delivery Risk"
                  value={
                    selectedProjectRow.record.deliveryPriority === "Urgent"
                      ? "High"
                      : selectedProjectRow.record.deliveryPriority === "High Priority"
                        ? "Elevated"
                        : "Medium"
                  }
                  tone="text-[#b45309]"
                />
                <MetricCard label="Languages" value={selectedProjectAnalysis?.inferredLanguages.length || 0} tone="text-[#111827]" />
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-[#e7ddd0] bg-[#fefdfa] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Project Summary</div>
                  <div className="mt-2 text-sm leading-6 text-[#111827]">{selectedProjectAnalysis?.projectSummary || "—"}</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedProjectAnalysis?.inferredLanguages.map((language) => (
                      <Chip key={language} tone="green">
                        {language}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#e7ddd0] bg-[#fefdfa] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Required Capability</div>
                  <div className="mt-2 text-sm leading-6 text-[#111827]">{selectedProjectAnalysis?.requiredCapability || "—"}</div>
                </div>
                <div className="rounded-2xl border border-[#e7ddd0] bg-[#fefdfa] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Recommended Talent Personas</div>
                  <div className="mt-2 text-sm leading-6 text-[#111827]">
                    {selectedProjectAnalysis?.recommendedTalentPersonas?.length
                      ? selectedProjectAnalysis.recommendedTalentPersonas.join("; ")
                      : selectedProjectAnalysis?.resourceStrategy || "—"}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#e7ddd0] bg-[#fefdfa] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Language Plan</div>
                  <div className="mt-2 text-sm leading-6 text-[#111827]">
                    {selectedProjectAnalysis?.languagePlan?.length ? selectedProjectAnalysis.languagePlan.join("; ") : selectedProjectAnalysis?.inferredLanguages.join("; ") || "—"}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#e7ddd0] bg-[#fefdfa] p-4 sm:col-span-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Next Steps</div>
                  <div className="mt-2 text-sm leading-6 text-[#111827]">
                    {selectedProjectAnalysis?.nextSteps?.length ? selectedProjectAnalysis.nextSteps.join("; ") : selectedProjectAnalysis?.hrAssignmentLogic || "—"}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#e7ddd0] bg-[#fefdfa] p-4 sm:col-span-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Risks</div>
                  <div className="mt-2 text-sm leading-6 text-[#111827]">
                    {selectedProjectAnalysis?.risks?.length ? selectedProjectAnalysis.risks.join("; ") : selectedProjectAnalysis?.deliveryRisk || "—"}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Talent Persona Breakdown"
              description="Break the project into operational personas that can be assigned, reviewed, and backed up."
            >
              <div className="grid gap-4 xl:grid-cols-2">
                {selectedProjectPersonas.map((persona) => (
                  <article key={persona.roleName} className="rounded-2xl border border-[#e7ddd0] bg-[#fefdfa] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-bold text-[#111827]">{persona.roleName}</div>
                        <div className="mt-1 text-sm text-[#6f6256]">Operational persona for the current project.</div>
                      </div>
                      <Chip tone="blue">{persona.qualityThreshold}</Chip>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <StatLine label="Required Language Level" value={persona.requiredLanguageLevel} />
                      <StatLine label="Required Availability" value={persona.requiredAvailability} />
                      <StatLine label="Required Experience" value={persona.requiredExperience} />
                      <StatLine label="Required Skills" value={persona.requiredSkills} />
                      <StatLine label="Quality Threshold" value={persona.qualityThreshold} />
                      <StatLine label="Notes" value={persona.notes} />
                    </div>
                  </article>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Language & Headcount Plan"
              description="Plan recruiting coverage by language and headcount, with room for bilingual or shared coverage."
            >
              <div className="scroll-x-panel rounded-2xl border border-[#e7ddd0]">
                <table className="data-table min-w-[1120px] table-fixed">
                  <colgroup>
                    <col className="w-[18%]" />
                    <col className="w-[16%]" />
                    <col className="w-[12%]" />
                    <col className="w-[12%]" />
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                    <col className="w-[10%]" />
                    <col className="w-[14%]" />
                  </colgroup>
                  <thead>
                    <tr>
                      {[
                        "Language",
                        "Region",
                        "Required Headcount",
                        "Required Hours / Day",
                        "Can Share With Other Language",
                        "Suggested Talent Count",
                        "Priority",
                        "Notes",
                      ].map((heading) => (
                        <th key={heading} className={["Language", "Notes"].includes(heading) ? "th-left" : "th-center"}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProjectLanguagePlan.map((row) => (
                      <tr key={row.languageLabel} className="border-b border-[#efe6d8] bg-white hover:bg-[#f7f5ef]">
                        <td className="td-left font-semibold text-[#111827]">{row.language}</td>
                        <td className="td-center text-[#111827]">{row.region}</td>
                        <td className="td-center font-black tabular-nums text-[#1d4ed8]">{row.requiredHeadcount}</td>
                        <td className="td-center text-[#111827]">{row.requiredHoursPerDay}</td>
                        <td className="td-center text-[#111827]">{row.canShareWithOtherLanguage ? "Yes" : "No"}</td>
                        <td className="td-center font-black tabular-nums text-[#1f5c43]">{row.suggestedTalentCount}</td>
                        <td className="td-center">
                          <Chip tone={row.priority === "Urgent" ? "red" : row.priority === "High Priority" ? "amber" : "default"}>{row.priority}</Chip>
                        </td>
                        <td className="td-left text-[#111827]">{row.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard
              title="Talent Match Results"
              description="Match project needs against the Talent Museum and available talent pool."
            >
              <div className="grid gap-4">
                {selectedProjectTalentMatches.map((profile) => (
                  <article key={profile.talentId} className="rounded-2xl border border-[#e7ddd0] bg-[#fefdfa] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf7ee] text-sm font-black text-[#1f5c43]">
                          {profile.candidateName
                            .split(/\s+/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0]?.toUpperCase() || "")
                            .join("") || "BD"}
                        </div>
                        <div>
                          <div className="text-lg font-bold text-[#111827]">{profile.candidateName}</div>
                          <div className="text-sm text-[#6f6256]">
                            {profile.sourceLabel} · {profile.submittedByHrName}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Chip tone="green">{formatRatePercent(profile.matchScore)}</Chip>
                        <Chip tone={formatMatchStatusColor(profile.matchStatus)}>{profile.matchStatus}</Chip>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                      <StatLine label="Native Language" value={profile.nativeLanguage} />
                      <StatLine label="Second Language" value={profile.secondLanguage} />
                      <StatLine label="Skills" value={profile.skills.join(", ") || "—"} />
                      <StatLine
                        label="Availability"
                        value={`${profile.availability}${profile.weekendAvailability && profile.weekendAvailability !== profile.availability ? ` · ${profile.weekendAvailability}` : ""}`}
                      />
                      <StatLine label="Current Status" value={profile.matchStatus} />
                      <StatLine label="Current Assigned Tasks" value={profile.currentAssignedTasks.length ? profile.currentAssignedTasks.join(", ") : "None"} />
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-2xl border border-[#e7ddd0] bg-white p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Match Reason</div>
                        <div className="mt-2 text-sm leading-6 text-[#111827]">{profile.matchReason}</div>
                      </div>
                      <div className="rounded-2xl border border-[#e7ddd0] bg-white p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Risk Notes</div>
                        <div className="mt-2 text-sm leading-6 text-[#111827]">{profile.riskNotes}</div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Talent Gap & Recruiting Task Suggestions"
              description="Create recruiting tasks when current coverage does not meet demand."
            >
              {selectedProjectGapRows.length > 0 ? (
                <div className="scroll-x-panel rounded-2xl border border-[#e7ddd0]">
                  <table className="data-table min-w-[1280px] table-fixed">
                    <colgroup>
                      <col className="w-[13%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                      <col className="w-[8%]" />
                      <col className="w-[20%]" />
                      <col className="w-[18%]" />
                      <col className="w-[11%]" />
                      <col className="w-[6%]" />
                      <col className="w-[10%]" />
                    </colgroup>
                    <thead>
                      <tr>
                        {[
                          "Missing Language",
                          "Required",
                          "Matched",
                          "Gap",
                          "Reason",
                          "Suggested Recruiting Task",
                          "Suggested HR",
                          "Priority",
                          "Action",
                        ].map((heading) => (
                          <th key={heading} className={["Missing Language", "Reason", "Suggested Recruiting Task", "Suggested HR"].includes(heading) ? "th-left" : "th-center"}>
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProjectGapRows.map((row) => (
                        <tr key={row.languageLabel} className="border-b border-[#efe6d8] bg-white hover:bg-[#f7f5ef]">
                          <td className="td-left font-semibold text-[#111827]">{row.languageLabel}</td>
                          <td className="td-center tabular-nums text-[#111827]">{row.requiredHeadcount}</td>
                          <td className="td-center tabular-nums text-[#1f5c43]">{row.matchedTalentCount}</td>
                          <td className="td-center tabular-nums font-black text-[#b42318]">{row.gapCount}</td>
                          <td className="td-left text-[#111827]">{row.reason}</td>
                          <td className="td-left text-[#111827]">{row.suggestedRecruitingTask}</td>
                          <td className="td-left text-[#111827]">{row.suggestedHr}</td>
                          <td className="td-center">
                            <Chip tone={row.priority === "Urgent" ? "red" : row.priority === "High Priority" ? "amber" : "default"}>{row.priority}</Chip>
                          </td>
                          <td className="td-actions">
                            <button
                              type="button"
                              onClick={() => handleGenerateRecruitingTask(row)}
                              className="inline-flex items-center justify-center rounded-lg border border-[#1f5c43] bg-[#eef7f1] px-3 py-2 text-xs font-semibold text-[#1f5c43] transition hover:bg-[#e2f0e7]"
                            >
                              Generate Recruiting Task
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#d4e7da] bg-[#eef7f1] px-5 py-8 text-sm text-[#1f5c43]">
                  No recruiting gap detected for this project. The current talent pool appears sufficient for the inferred demand.
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Matching Brain Rules"
              description="Maintain matching rules, scoring guidance, and reusable project knowledge."
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <textarea
                  value={brainRulesText}
                  onChange={(event) => setBrainRulesText(event.target.value)}
                  rows={14}
                  className="w-full rounded-2xl border border-[#d7dccf] bg-[#fffdf8] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#1f5c43]"
                />
                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl border border-[#e7ddd0] bg-[#fefdfa] p-4 text-sm text-[#6f6256]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Last Saved</div>
                    <div className="mt-2 font-semibold text-[#111827]">{formatDateValue(brainRulesUpdatedAt)}</div>
                    <p className="mt-3 leading-6">The rules file should stay concise, explicit, and ready for future model integration.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveRules}
                    className="inline-flex items-center justify-center rounded-xl bg-[#1f5c43] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)] transition hover:bg-[#164d38]"
                  >
                    Save Rules
                  </button>
                  <button
                    type="button"
                    onClick={handleResetRules}
                    className="inline-flex items-center justify-center rounded-xl border border-[#d7dccf] bg-[#fffdf8] px-4 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#f4efe2]"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            </SectionCard>
          </div>
        </ModalFrame>
      ) : null}
    </main>
  );
}
