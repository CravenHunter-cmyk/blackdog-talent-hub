"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import { PermissionFallback } from "@/components/auth/AccessGate";
import { canAccessModule, readPlatformUser, type PlatformUser as AccountUser } from "@/lib/permissions";
import type { TalentProfileRecord } from "@/types/talent-pool";

type PlatformRole = "Super Admin" | "Executive" | "HR User";
type ConversationKind = "platform" | "talent" | "group";
type ConversationFilter = "All" | "Management" | "HR" | "Talent Pool" | "Groups";
type TalentCommunicationFilter = "All" | "PM" | "HR" | "Project Group";
type TalentCommunicationKind = "PM" | "HR" | "Project Group";
type MessageKind = "text" | "system" | "attachment" | "image" | "video";
type TalentProfileStatus = "Submitted" | "In Review" | "Drafted" | "New";
type GroupType = "Project Group" | "Language Group" | "Custom Group";
type WorkbenchTab = "task-center" | "personal-center" | "communication-hub";
type WorkbenchView = "manager" | "talent";
type TaskPanelMode = "applicants" | "manage" | "details" | "brief";
type WorkbenchNoticeTone = "success" | "error" | "info";
type WorkbenchTaskStatus = "Open" | "Screening" | "Draft";
type ApplicantStatus = "Applied" | "Under Review" | "Approved" | "Rejected";

type PermissionConfig = {
  allowHrOnlyAssignedTalents: boolean;
  allowHrDirectChat: boolean;
  allowHrMessageUnassignedTalents: boolean;
  allowExecutiveMessageTalents: boolean;
  allowHrCreateGroups: boolean;
  allowHrSendFiles: boolean;
  allowHrSendVideos: boolean;
  allowGroupMembersChatFreely: boolean;
  restrictDirectTalentCommunicationToSuperAdminAndAssignedHrOnly: boolean;
};

type ChatMessage = {
  id: string;
  sender: string;
  timestamp: string;
  kind: MessageKind;
  text: string;
  roleLabel?: string;
  attachmentName?: string;
  attachmentMeta?: string;
  attachmentType?: string;
  attachmentSize?: string;
  previewUrl?: string;
  align: "left" | "right" | "center";
};

type BaseConversation = {
  id: string;
  kind: ConversationKind;
  name: string;
  avatarSeed: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online?: boolean;
  messages: ChatMessage[];
};

type PlatformConversation = BaseConversation & {
  kind: "platform";
  role: PlatformRole;
  status: "Active" | "Busy" | "Away";
  department: string;
  assignedProjects: string[];
  permissionsSummary: string;
  lastActive: string;
};

type TalentConversation = BaseConversation & {
  kind: "talent";
  talentId: string;
  avatarUrl?: string;
  nativeLanguage: string;
  secondLanguage: string;
  skill: string;
  education: string;
  professionalDomain: string;
  assignedHr: string;
  relatedProjects: string[];
  profileStatus: TalentProfileStatus;
  upworkChatUrl: string;
  upworkProfileUrl: string;
  lastContactTime: string;
};

type GroupConversation = BaseConversation & {
  kind: "group";
  groupType: GroupType;
  memberCount: number;
  owner: string;
  relatedProject?: string;
  relatedLanguage?: string;
  members: string[];
  permissionsSummary: string;
  allowFileSharing: boolean;
  allowVideoSharing: boolean;
};

type Conversation = PlatformConversation | TalentConversation | GroupConversation;

type TalentCommunicationConversation = {
  id: string;
  kind: TalentCommunicationKind;
  name: string;
  avatarSeed: string;
  avatarUrl?: string;
  roleLabel: string;
  projectName: string;
  level?: string;
  completedProjects?: number;
  relationship?: string;
  memberScope?: string;
  currentTalentAccess?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online?: boolean;
  messages: ChatMessage[];
  permissionsSummary: string[];
};

type CommunicationAccessItem = {
  id: string;
  name: string;
  subtitle: string;
  meta?: string;
  avatarSeed: string;
  avatarUrl?: string;
  unreadCount?: number;
  onSelect?: () => void;
};

type GroupMemberDetail = {
  name: string;
  role: string;
  level?: string;
  status?: string;
  avatarSeed: string;
  avatarUrl?: string;
};

type GroupRuleLink = {
  title: string;
  url: string;
};

type GroupDraft = {
  groupName: string;
  groupType: GroupType;
  relatedProject: string;
  relatedLanguage: string;
  owner: string;
  memberIds: string[];
  allowFileSharing: boolean;
  allowVideoSharing: boolean;
};

type WorkbenchTask = {
  id: string;
  taskName: string;
  status: WorkbenchTaskStatus;
  language: string;
  skillRequirement: string;
  targetTalent: string;
  applicants: number;
  approved: number;
  owner: string;
  deadline: string;
  description?: string;
  projectBackground: string;
  workScope: string;
  languageRequirement: string;
  workload: string;
  timeline: string;
  paymentNote: string;
  applicationRequirement: string;
  materialsToSubmit: string;
  notes: string;
  ownerContact: string;
};

type WorkbenchApplicant = {
  id: string;
  name: string;
  language: string;
  skill: string;
  level?: string;
  status: ApplicantStatus;
  taskId: string;
};

type TalentApplicationForm = {
  selfIntroduction: string;
  relevantExperience: string;
  availability: string;
  portfolioNote: string;
  additionalNotes: string;
};

type CreateTaskForm = {
  taskName: string;
  language: string;
  targetTalent: string;
  deadline: string;
  owner: string;
  description: string;
};

type WorkbenchNotice = {
  tone: WorkbenchNoticeTone;
  message: string;
};

type ProjectGroupPreview = {
  groupName: string;
  members: number;
  activity: string;
};

type TalentMessagesPageProps = {
  initialTab?: string;
  initialTaskId?: string;
  initialTaskName?: string;
  initialTalentProfiles?: TalentProfileRecord[];
};

function normalizeTaskParam(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const initialWorkbenchTasks: WorkbenchTask[] = [
  {
    id: "korean-llm-evaluation",
    taskName: "Korean LLM Evaluation",
    status: "Open" as const,
    language: "Korean",
    skillRequirement: "LLM Evaluation",
    targetTalent: "30 native Korean evaluators",
    applicants: 9,
    approved: 8,
    owner: "Julie Zhu",
    deadline: "May 17",
    projectBackground: "We are building a Korean evaluator pool for LLM response quality evaluation and ranking tasks.",
    workScope: "Evaluate AI-generated responses, compare multiple answers, score quality, and provide concise remarks based on project guidelines.",
    languageRequirement: "Native Korean; strong English reading ability is preferred because guidelines may be in English.",
    workload: "Pilot tasks may take 2-3 hours. Official batches will be assigned based on quality and availability.",
    timeline: "Urgent pilot recruitment is in progress. Official task schedule will be confirmed after qualification.",
    paymentNote: "Payment will be confirmed based on task type, difficulty, and accepted workload.",
    applicationRequirement: "Applicants should briefly describe Korean language background, AI evaluation experience, daily availability, and similar projects.",
    materialsToSubmit: "Short self-introduction, relevant project experience, availability, and optional resume or profile link.",
    notes: "High-quality evaluators will be prioritized for future Korean AI evaluation projects.",
    ownerContact: "Julie Zhu",
  },
  {
    id: "japanese-llm-evaluation",
    taskName: "Japanese LLM Evaluation Recruiting",
    status: "Open" as const,
    language: "Japanese",
    skillRequirement: "LLM Evaluation",
    targetTalent: "20 native Japanese evaluators",
    applicants: 12,
    approved: 5,
    owner: "Julie Zhu",
    deadline: "May 20",
    projectBackground: "We are building a native Japanese evaluator pool for LLM response quality evaluation and ranking tasks.",
    workScope: "Evaluate AI-generated responses, compare multiple answers, score quality, and provide concise remarks based on project guidelines.",
    languageRequirement: "Native Japanese; strong English reading ability is preferred because guidelines may be in English.",
    workload: "Pilot tasks may take 2-3 hours. Official batches will be assigned based on quality and availability.",
    timeline: "Pilot recruitment this week. Official task schedule will be confirmed after qualification.",
    paymentNote: "Payment will be confirmed based on task type, difficulty, and accepted workload.",
    applicationRequirement: "Applicants should briefly describe Japanese language background, AI evaluation experience, daily availability, and similar projects.",
    materialsToSubmit: "Short self-introduction, relevant project experience, availability, and optional resume or profile link.",
    notes: "High-quality evaluators will be prioritized for future Japanese AI evaluation projects.",
    ownerContact: "Julie Zhu",
  },
  {
    id: "japanese-evaluator-pool",
    taskName: "Japanese Evaluator Pool",
    status: "Open" as const,
    language: "Japanese",
    skillRequirement: "LLM Evaluation",
    targetTalent: "100 Japanese evaluators",
    applicants: 90,
    approved: 80,
    owner: "Maya Chen",
    deadline: "June 2",
    projectBackground: "We are expanding the Japanese evaluator pool for recurring LLM evaluation and quality ranking work.",
    workScope: "Evaluate AI-generated responses, rank alternatives, and provide concise issue notes against client guidelines.",
    languageRequirement: "Native Japanese; English reading ability is preferred for guideline review.",
    workload: "Ongoing batches will be assigned based on quality, availability, and project demand.",
    timeline: "Recruiting remains open while the pool expands toward the target headcount.",
    paymentNote: "Payment will be confirmed based on accepted workload and task complexity.",
    applicationRequirement: "Applicants should describe Japanese language background, evaluation experience, and weekly availability.",
    materialsToSubmit: "Self-introduction, relevant AI evaluation or localization experience, availability, and optional profile link.",
    notes: "Backup evaluators are useful for peak delivery windows.",
    ownerContact: "Maya Chen",
  },
  {
    id: "arabic-ocr-expert-pool",
    taskName: "Arabic OCR Expert Pool",
    status: "Screening" as const,
    language: "Arabic",
    skillRequirement: "OCR Review",
    targetTalent: "15 Arabic OCR reviewers",
    applicants: 9,
    approved: 3,
    owner: "Maya Chen",
    deadline: "May 22",
    projectBackground: "We are preparing an Arabic OCR expert pool for document/image text recognition quality review.",
    workScope: "Review OCR outputs, identify text recognition errors, check Arabic script accuracy, and annotate issues based on rules.",
    languageRequirement: "Native or professional Arabic proficiency. Regional Arabic background can be noted in the application.",
    workload: "Initial pilot may include a small number of cases. Larger batches depend on client schedule.",
    timeline: "Screening stage now. Qualified reviewers may be invited to pilot tasks.",
    paymentNote: "Payment will be confirmed by case volume, task difficulty, and quality requirements.",
    applicationRequirement: "Applicants should provide Arabic background, OCR/VLM experience, and daily availability.",
    materialsToSubmit: "Self-introduction, Arabic market/region background, OCR or annotation experience, optional resume.",
    notes: "Candidates with OCR or VLM labeling experience will be prioritized.",
    ownerContact: "Maya Chen",
  },
  {
    id: "portuguese-br-localization",
    taskName: "Portuguese-BR Localization Review",
    status: "Draft" as const,
    language: "Portuguese-BR",
    skillRequirement: "Localization Review",
    targetTalent: "10 Portuguese-BR reviewers",
    applicants: 4,
    approved: 0,
    owner: "Daniel Kim",
    deadline: "May 25",
    projectBackground: "We are preparing Portuguese-BR reviewers for localization and language quality review tasks.",
    workScope: "Review localized content, check fluency and cultural naturalness, identify translation issues, and provide improvement suggestions.",
    languageRequirement: "Native Portuguese-BR; English reading ability preferred.",
    workload: "Small pilot first. Follow-up workload depends on client confirmation.",
    timeline: "Draft stage. Recruitment will start after task details are confirmed.",
    paymentNote: "Payment will be confirmed after official scope and workload are finalized.",
    applicationRequirement: "Applicants should describe localization/translation experience, domain background, and availability.",
    materialsToSubmit: "Self-introduction, relevant localization experience, availability, optional resume/profile link.",
    notes: "Candidates with AI data, localization, or evaluation project experience will be prioritized.",
    ownerContact: "Daniel Kim",
  },
];

const initialWorkbenchApplicants: WorkbenchApplicant[] = [
  {
    id: "kim-seoyeon",
    name: "Kim Seoyeon",
    language: "Korean",
    skill: "LLM Evaluation",
    level: "Level A",
    status: "Approved",
    taskId: "korean-llm-evaluation",
  },
  {
    id: "park-minjun",
    name: "Park Minjun",
    language: "Korean",
    skill: "Model Response Review",
    level: "Level B",
    status: "Approved",
    taskId: "korean-llm-evaluation",
  },
  {
    id: "choi-hana",
    name: "Choi Hana",
    language: "Korean",
    skill: "LLM Evaluation",
    level: "Level C",
    status: "Under Review",
    taskId: "korean-llm-evaluation",
  },
  {
    id: "yamane-risa",
    name: "Yamane Risa",
    language: "Japanese",
    skill: "LLM Evaluation",
    level: "Level B",
    status: "Applied",
    taskId: "japanese-llm-evaluation",
  },
  {
    id: "rika-tanaka",
    name: "Rika Tanaka",
    language: "Japanese",
    skill: "LLM Evaluation",
    level: "Level A",
    status: "Approved",
    taskId: "japanese-llm-evaluation",
  },
  {
    id: "haruto-sato",
    name: "Haruto Sato",
    language: "Japanese",
    skill: "LLM Evaluation",
    level: "Level B",
    status: "Approved",
    taskId: "japanese-evaluator-pool",
  },
  {
    id: "tanchanok-pearl",
    name: "Tanchanok Pearl",
    language: "Thai",
    skill: "OCR Review",
    level: "Level C",
    status: "Under Review",
    taskId: "arabic-ocr-expert-pool",
  },
  {
    id: "amina-hassan",
    name: "Amina Hassan",
    language: "Arabic",
    skill: "OCR Review",
    level: "Level B",
    status: "Approved",
    taskId: "arabic-ocr-expert-pool",
  },
  {
    id: "nayara-ribeiro",
    name: "Nayara Ribeiro",
    language: "Portuguese-BR",
    skill: "Localization Review",
    level: "Level B",
    status: "Applied",
    taskId: "portuguese-br-localization",
  },
];

const ROLE_DEFAULTS: Record<PlatformRole, PermissionConfig> = {
  "Super Admin": {
    allowHrOnlyAssignedTalents: true,
    allowHrDirectChat: true,
    allowHrMessageUnassignedTalents: true,
    allowExecutiveMessageTalents: true,
    allowHrCreateGroups: true,
    allowHrSendFiles: true,
    allowHrSendVideos: true,
    allowGroupMembersChatFreely: true,
    restrictDirectTalentCommunicationToSuperAdminAndAssignedHrOnly: false,
  },
  Executive: {
    allowHrOnlyAssignedTalents: true,
    allowHrDirectChat: true,
    allowHrMessageUnassignedTalents: false,
    allowExecutiveMessageTalents: true,
    allowHrCreateGroups: true,
    allowHrSendFiles: true,
    allowHrSendVideos: true,
    allowGroupMembersChatFreely: true,
    restrictDirectTalentCommunicationToSuperAdminAndAssignedHrOnly: false,
  },
  "HR User": {
    allowHrOnlyAssignedTalents: true,
    allowHrDirectChat: true,
    allowHrMessageUnassignedTalents: false,
    allowExecutiveMessageTalents: false,
    allowHrCreateGroups: true,
    allowHrSendFiles: true,
    allowHrSendVideos: false,
    allowGroupMembersChatFreely: true,
    restrictDirectTalentCommunicationToSuperAdminAndAssignedHrOnly: false,
  },
};

const PLATFORM_USERS: Array<{
  id: string;
  name: string;
  role: PlatformRole;
  status: "Active" | "Busy" | "Away";
  department: string;
  assignedProjects: string[];
  lastActive: string;
  permissionsSummary: string;
  avatarSeed: string;
}> = [
  {
    id: "julie",
    name: "Julie Zhu",
    role: "Super Admin",
    status: "Active",
    department: "Platform Ops",
    assignedProjects: ["Global Coverage", "Plugin Workflow"],
    lastActive: "Just now",
    permissionsSummary: "Full platform access",
    avatarSeed: "Julie Zhu",
  },
  {
    id: "maya",
    name: "Maya Chen",
    role: "Executive",
    status: "Active",
    department: "Leadership",
    assignedProjects: ["Executive Review", "RFQ Tracking"],
    lastActive: "14 min ago",
    permissionsSummary: "View and oversight access",
    avatarSeed: "Maya Chen",
  },
  {
    id: "daniel",
    name: "Daniel Kim",
    role: "HR User",
    status: "Busy",
    department: "Recruiting",
    assignedProjects: ["TikTok LLM Evaluation", "Japanese Pool"],
    lastActive: "7 min ago",
    permissionsSummary: "Assigned-project recruiting access",
    avatarSeed: "Daniel Kim",
  },
  {
    id: "aisha",
    name: "Aisha Khan",
    role: "HR User",
    status: "Away",
    department: "Recruiting",
    assignedProjects: ["Global Website Collection"],
    lastActive: "2 hr ago",
    permissionsSummary: "Language pool and follow-up access",
    avatarSeed: "Aisha Khan",
  },
];

const initialConversations: Conversation[] = [
  {
    id: "julie-zhu",
    kind: "platform",
    name: "Julie Zhu",
    avatarSeed: "Julie Zhu",
    role: "Super Admin",
    status: "Active",
    department: "Platform Ops",
    assignedProjects: ["Global Coverage", "Plugin Workflow"],
    permissionsSummary: "Can message all talents and manage all groups.",
    lastActive: "Just now",
    unreadCount: 2,
    online: true,
    lastMessage: "Please update the Japanese pool today.",
    lastMessageTime: "8:42 AM",
    messages: [
      { id: "j1", sender: "Julie Zhu", timestamp: "8:10 AM", kind: "text", text: "Please update the Japanese pool today.", roleLabel: "Super Admin", align: "right" },
      { id: "j2", sender: "Maya Chen", timestamp: "8:12 AM", kind: "text", text: "I can review the latest coverage report this morning.", roleLabel: "Executive", align: "left" },
      { id: "j3", sender: "Julie Zhu", timestamp: "8:42 AM", kind: "text", text: "I’ll sync the latest project scripts after the meeting.", roleLabel: "Super Admin", align: "right" },
    ],
  },
  {
    id: "maya-chen",
    kind: "platform",
    name: "Maya Chen",
    avatarSeed: "Maya Chen",
    role: "Executive",
    status: "Active",
    department: "Leadership",
    assignedProjects: ["Executive Review", "RFQ Tracking"],
    permissionsSummary: "Reviews coverage and project progress.",
    lastActive: "14 min ago",
    unreadCount: 0,
    online: true,
    lastMessage: "Can you send me the RFQ progress?",
    lastMessageTime: "9:05 AM",
    messages: [
      { id: "mc1", sender: "Maya Chen", timestamp: "8:55 AM", kind: "text", text: "Can you send me the RFQ progress?", roleLabel: "Executive", align: "right" },
      { id: "mc2", sender: "Julie Zhu", timestamp: "9:05 AM", kind: "text", text: "Yes, I’ll share it after the next update.", roleLabel: "Super Admin", align: "left" },
    ],
  },
  {
    id: "daniel-kim",
    kind: "platform",
    name: "Daniel Kim",
    avatarSeed: "Daniel Kim",
    role: "HR User",
    status: "Busy",
    department: "Recruiting",
    assignedProjects: ["TikTok LLM Evaluation", "Japanese Pool"],
    permissionsSummary: "HR workflow and assigned talent follow-up.",
    lastActive: "7 min ago",
    unreadCount: 1,
    online: true,
    lastMessage: "I submitted 8 profiles today.",
    lastMessageTime: "9:12 AM",
    messages: [
      { id: "dk1", sender: "Daniel Kim", timestamp: "9:08 AM", kind: "text", text: "I submitted 8 profiles today.", roleLabel: "HR", align: "right" },
      { id: "dk2", sender: "Julie Zhu", timestamp: "9:12 AM", kind: "text", text: "Good work. Let’s prioritize the Japanese pool next.", roleLabel: "Super Admin", align: "left" },
    ],
  },
  {
    id: "aisha-khan",
    kind: "platform",
    name: "Aisha Khan",
    avatarSeed: "Aisha Khan",
    role: "HR User",
    status: "Away",
    department: "Recruiting",
    assignedProjects: ["Global Website Collection"],
    permissionsSummary: "Language coverage and follow-up access.",
    lastActive: "2 hr ago",
    unreadCount: 0,
    online: false,
    lastMessage: "Please confirm the Portuguese shortlist.",
    lastMessageTime: "Yesterday",
    messages: [
      { id: "ak1", sender: "Aisha Khan", timestamp: "Yesterday", kind: "text", text: "Please confirm the Portuguese shortlist.", roleLabel: "HR", align: "right" },
      { id: "ak2", sender: "Carlos Mendes", timestamp: "Yesterday", kind: "text", text: "I’m still available for the next batch.", roleLabel: "Talent", align: "left" },
    ],
  },
  {
    id: "talent-tanchanok",
    kind: "talent",
    talentId: "tal_tanchanok-pearl_b7e9e2143200",
    name: "Tanchanok Pearl",
    avatarSeed: "Tanchanok Pearl",
    nativeLanguage: "Thai",
    secondLanguage: "English",
    skill: "LLM Response Evaluation",
    education: "Bachelor’s Degree",
    professionalDomain: "LLM Evaluation / QA",
    assignedHr: "Julie Zhu",
    relatedProjects: ["TikTok LLM Evaluation"],
    profileStatus: "Submitted",
    upworkChatUrl: "https://www.upwork.com/ab/messages/rooms/tanchanok-pearl",
    upworkProfileUrl: "https://www.upwork.com/freelancers/~tanchanok-pearl",
    lastContactTime: "7:43 PM",
    unreadCount: 3,
    online: true,
    lastMessage: "I can work 2–4 hours per day.",
    lastMessageTime: "7:43 PM",
    messages: [
      { id: "tp1", sender: "Julie Zhu", timestamp: "7:38 PM", kind: "text", text: "Hi Tanchanok, thanks for confirming your interest in our Thai LLM evaluation project. Could you confirm your daily availability this week?", roleLabel: "HR", align: "left" },
      { id: "tp2", sender: "Tanchanok Pearl", timestamp: "7:39 PM", kind: "text", text: "Hi Julie, yes, I can work around 2–4 hours per day. Weekend tasks are also fine if scheduled in advance.", roleLabel: "Talent", align: "right" },
      { id: "tp3", sender: "Julie Zhu", timestamp: "7:41 PM", kind: "text", text: "Great. I have added your profile to our talent pool. We will contact you first when the next Thai evaluation batch starts.", roleLabel: "HR", align: "left" },
      { id: "tp4", sender: "Tanchanok Pearl", timestamp: "7:43 PM", kind: "text", text: "Thank you. Please feel free to send me the guidelines when the task is ready.", roleLabel: "Talent", align: "right" },
    ],
  },
  {
    id: "talent-nayara",
    kind: "talent",
    talentId: "tal_nayara-ribeiro_a9f3d01701",
    name: "Nayara Ribeiro",
    avatarSeed: "Nayara Ribeiro",
    nativeLanguage: "Chinese",
    secondLanguage: "English",
    skill: "Translation Review / LLM Evaluation",
    education: "Bachelor’s Degree in Linguistics",
    professionalDomain: "Translation / Localization / LLM Evaluation",
    assignedHr: "Julie Zhu",
    relatedProjects: ["Native LLM Evaluator Recruitment", "Localization QA Expansion"],
    profileStatus: "In Review",
    upworkChatUrl: "https://www.upwork.com/ab/messages/rooms/room_preview_nayara",
    upworkProfileUrl: "https://www.upwork.com/freelancers/~nayara-ribeiro-preview",
    lastContactTime: "7:12 PM",
    unreadCount: 0,
    online: true,
    lastMessage: "Please send the guideline when ready.",
    lastMessageTime: "7:12 PM",
    messages: [
      { id: "nr1", sender: "Julie Zhu", timestamp: "6:50 PM", kind: "text", text: "Hi Nayara, thanks for your interest in our Native LLM Evaluator Recruitment project. Could you confirm your current availability and whether you have worked on LLM evaluation or translation QA before?", roleLabel: "HR", align: "left" },
      { id: "nr2", sender: "Nayara Ribeiro", timestamp: "6:53 PM", kind: "text", text: "Hi Julie, yes, I’m interested. I’m a native Chinese speaker and I have experience with translation review, localization QA, and AI response evaluation.", roleLabel: "Talent", align: "right" },
      { id: "nr3", sender: "Julie Zhu", timestamp: "7:02 PM", kind: "text", text: "Great. For this project, tasks may be assigned in stages, and the best-performing evaluators will receive priority for future batches. Would you be comfortable with 2–4 hours per day and occasional weekend work?", roleLabel: "HR", align: "left" },
      { id: "nr4", sender: "Nayara Ribeiro", timestamp: "7:12 PM", kind: "text", text: "Yes, I can work around 2–4 hours per day, and weekend tasks are also acceptable if scheduled in advance.", roleLabel: "Talent", align: "right" },
    ],
  },
  {
    id: "talent-yamane",
    kind: "talent",
    talentId: "tal_yamane-risa_9bb9e2b1f9",
    name: "Yamane Risa",
    avatarSeed: "Yamane Risa",
    nativeLanguage: "Japanese",
    secondLanguage: "English",
    skill: "Localization QA",
    education: "Master’s Degree",
    professionalDomain: "Localization / Search Quality",
    assignedHr: "Daniel Kim",
    relatedProjects: ["TikTok LLM Evaluation - Japanese Team"],
    profileStatus: "Drafted",
    upworkChatUrl: "https://www.upwork.com/ab/messages/rooms/yamane-risa",
    upworkProfileUrl: "https://www.upwork.com/freelancers/~yamane-risa",
    lastContactTime: "Yesterday",
    unreadCount: 0,
    online: false,
    lastMessage: "Thanks, I can support weekdays.",
    lastMessageTime: "Yesterday",
    messages: [
      { id: "yr1", sender: "Daniel Kim", timestamp: "Yesterday", kind: "text", text: "Hi Yamane, we are reviewing your profile for the Japanese localization QA team. Could you share your current task availability?", roleLabel: "HR", align: "left" },
      { id: "yr2", sender: "Yamane Risa", timestamp: "Yesterday", kind: "text", text: "Thanks. I can support 1-2 hours per day during weekdays.", roleLabel: "Talent", align: "right" },
    ],
  },
  {
    id: "talent-carlos",
    kind: "talent",
    talentId: "tal_carlos-mendes_08a0a4f113",
    name: "Carlos Mendes",
    avatarSeed: "Carlos Mendes",
    nativeLanguage: "Portuguese-BR",
    secondLanguage: "English",
    skill: "Website Collection",
    education: "Associate Degree",
    professionalDomain: "Website Collection / Research",
    assignedHr: "Aisha Khan",
    relatedProjects: ["Global Website Collection Team"],
    profileStatus: "Submitted",
    upworkChatUrl: "https://www.upwork.com/ab/messages/rooms/carlos-mendes",
    upworkProfileUrl: "https://www.upwork.com/freelancers/~carlos-mendes",
    lastContactTime: "9:15 AM",
    unreadCount: 4,
    online: true,
    lastMessage: "Thanks, I’ll keep the pool updated.",
    lastMessageTime: "9:15 AM",
    messages: [
      { id: "cm1", sender: "Aisha Khan", timestamp: "9:00 AM", kind: "text", text: "Hi Carlos, we’re expanding the website collection team and would like to review your profile.", roleLabel: "HR", align: "left" },
      { id: "cm2", sender: "Carlos Mendes", timestamp: "9:07 AM", kind: "text", text: "Hello! I’m available and have previous collection and research experience.", roleLabel: "Talent", align: "right" },
      { id: "cm3", sender: "Aisha Khan", timestamp: "9:15 AM", kind: "text", text: "Thanks, I’ll keep your profile in the active pool for upcoming tasks.", roleLabel: "HR", align: "left" },
    ],
  },
  {
    id: "talent-maria",
    kind: "talent",
    talentId: "tal_maria-gonzalez_f89e192c2b",
    name: "Maria Gonzalez",
    avatarSeed: "Maria Gonzalez",
    nativeLanguage: "Spanish-MX",
    secondLanguage: "English",
    skill: "LLM Response Ranking",
    education: "Bachelor’s Degree",
    professionalDomain: "LLM Evaluation / Ranking",
    assignedHr: "Marco Silva",
    relatedProjects: ["LATAM Localization & Safety"],
    profileStatus: "New",
    upworkChatUrl: "https://www.upwork.com/ab/messages/rooms/maria-gonzalez",
    upworkProfileUrl: "https://www.upwork.com/freelancers/~maria-gonzalez",
    lastContactTime: "Last week",
    unreadCount: 0,
    online: false,
    lastMessage: "Thank you. I’m available for the next batch.",
    lastMessageTime: "Last week",
    messages: [
      { id: "mg1", sender: "Marco Silva", timestamp: "Last week", kind: "text", text: "Hi Maria, we’re reviewing candidates for the Spanish-MX response ranking workflow.", roleLabel: "HR", align: "left" },
      { id: "mg2", sender: "Maria Gonzalez", timestamp: "Last week", kind: "text", text: "Thank you. I’m available for a few hours per day and can support with evaluation tasks.", roleLabel: "Talent", align: "right" },
    ],
  },
  {
    id: "group-japanese",
    kind: "group",
    name: "Japanese LLM Eval Team",
    avatarSeed: "Japanese LLM Eval Team",
    groupType: "Project Group",
    memberCount: 14,
    owner: "Julie Zhu",
    relatedProject: "TikTok LLM Evaluation",
    unreadCount: 5,
    allowFileSharing: true,
    allowVideoSharing: true,
    members: ["Yamane Risa", "Rika Tanaka", "Keiko Sato"],
    permissionsSummary: "Assigned project group with file sharing enabled.",
    lastMessage: "Guideline v1 has been uploaded.",
    lastMessageTime: "9:10 AM",
    messages: [
      { id: "gj1", sender: "System", timestamp: "9:05 AM", kind: "system", text: "Julie Zhu created the group Japanese LLM Eval Team.", align: "center" },
      { id: "gj2", sender: "Julie Zhu", timestamp: "9:06 AM", kind: "text", text: "Hi everyone, this group will be used for task notifications, guideline updates, and delivery reminders.", roleLabel: "HR", align: "left" },
      { id: "gj3", sender: "Yamane Risa", timestamp: "9:08 AM", kind: "text", text: "Thanks. Please share the guideline when it is ready.", roleLabel: "Talent", align: "right" },
      { id: "gj4", sender: "Julie Zhu", timestamp: "9:10 AM", kind: "attachment", text: "Guidelines_v1.pdf", attachmentName: "Guidelines_v1.pdf", attachmentMeta: "PDF • 2.1 MB", roleLabel: "HR", align: "left" },
      { id: "gj5", sender: "Julie Zhu", timestamp: "9:12 AM", kind: "image", text: "Task reference image", attachmentName: "Task_Reference_Screenshot.png", attachmentMeta: "Image preview", roleLabel: "HR", align: "left" },
      { id: "gj6", sender: "Julie Zhu", timestamp: "9:14 AM", kind: "video", text: "Task reference video", attachmentName: "Task_Reference_Video.mp4", attachmentMeta: "Video preview", roleLabel: "HR", align: "left" },
    ],
  },
  {
    id: "group-portuguese",
    kind: "group",
    name: "Portuguese-BR Talent Pool",
    avatarSeed: "Portuguese-BR Talent Pool",
    groupType: "Language Group",
    memberCount: 9,
    owner: "Aisha Khan",
    relatedLanguage: "Portuguese-BR",
    unreadCount: 0,
    allowFileSharing: true,
    allowVideoSharing: false,
    members: ["Carlos Mendes", "Beatriz Costa", "Lucas Pereira"],
    permissionsSummary: "Language group for Brazilian Portuguese coverage.",
    lastMessage: "Next batch starts this Friday.",
    lastMessageTime: "Yesterday",
    messages: [
      { id: "gp1", sender: "System", timestamp: "Yesterday", kind: "system", text: "Aisha Khan created the Portuguese-BR Talent Pool.", align: "center" },
      { id: "gp2", sender: "Aisha Khan", timestamp: "Yesterday", kind: "text", text: "This group is for Portuguese-BR candidates who may join future localization and collection tasks.", roleLabel: "HR", align: "left" },
      { id: "gp3", sender: "Carlos Mendes", timestamp: "Yesterday", kind: "text", text: "Thanks, please keep me posted on the next batch.", roleLabel: "Talent", align: "right" },
      { id: "gp4", sender: "Aisha Khan", timestamp: "Yesterday", kind: "attachment", text: "Language_Requirement_Sheet.xlsx", attachmentName: "Language_Requirement_Sheet.xlsx", attachmentMeta: "Spreadsheet • 320 KB", roleLabel: "HR", align: "left" },
    ],
  },
  {
    id: "group-arabic",
    kind: "group",
    name: "Arabic MENA Evaluation Pool",
    avatarSeed: "Arabic MENA Evaluation Pool",
    groupType: "Language Group",
    memberCount: 7,
    owner: "Marco Silva",
    relatedLanguage: "Arabic MENA",
    unreadCount: 1,
    allowFileSharing: true,
    allowVideoSharing: false,
    members: ["Fatima Noor", "Hassan Ali"],
    permissionsSummary: "Regional talent pool for Arabic MENA evaluation.",
    lastMessage: "Please keep this pool updated.",
    lastMessageTime: "Monday",
    messages: [
      { id: "ga1", sender: "Marco Silva", timestamp: "Monday", kind: "text", text: "Please keep this pool updated with availability changes and profile completion status.", roleLabel: "HR", align: "left" },
    ],
  },
  {
    id: "group-global",
    kind: "group",
    name: "Global Website Collection Team",
    avatarSeed: "Global Website Collection Team",
    groupType: "Project Group",
    memberCount: 12,
    owner: "Daniel Kim",
    relatedProject: "Global Website Collection",
    unreadCount: 0,
    allowFileSharing: true,
    allowVideoSharing: true,
    members: ["Carlos Mendes", "Olivia Park", "Mina Ito"],
    permissionsSummary: "Project group for website collection and follow-ups.",
    lastMessage: "Use this group for project notices.",
    lastMessageTime: "Today",
    messages: [
      { id: "gw1", sender: "Daniel Kim", timestamp: "Today", kind: "system", text: "Daniel Kim created the group Global Website Collection Team.", align: "center" },
      { id: "gw2", sender: "Daniel Kim", timestamp: "Today", kind: "text", text: "Use this group for project notices, delivery reminders, and guideline updates.", roleLabel: "HR", align: "left" },
    ],
  },
];

const initialTalentCommunicationConversations: TalentCommunicationConversation[] = [
  {
    id: "talent-pm-julie",
    kind: "PM",
    name: "Julie Zhu",
    avatarSeed: "Julie Zhu",
    roleLabel: "Project Manager",
    projectName: "Japanese LLM Evaluation",
    level: "Level A",
    completedProjects: 18,
    relationship: "Assigned PM for Japanese LLM Evaluation",
    lastMessage: "Please review the guideline before the pilot starts.",
    lastMessageTime: "9:20 AM",
    unreadCount: 1,
    online: true,
    permissionsSummary: [
      "Can message assigned PM",
      "Cannot access management groups",
      "Cannot create groups",
    ],
    messages: [
      { id: "tpm1", sender: "Julie Zhu", timestamp: "9:05 AM", kind: "text", text: "Welcome to the Japanese LLM Evaluation project workspace.", roleLabel: "Project Manager", align: "left" },
      { id: "tpm2", sender: "Julie Zhu", timestamp: "9:20 AM", kind: "text", text: "Please review the guideline before the pilot starts.", roleLabel: "Project Manager", align: "left" },
    ],
  },
  {
    id: "talent-pm-maya",
    kind: "PM",
    name: "Maya Chen",
    avatarSeed: "Maya Chen",
    roleLabel: "Project Manager",
    projectName: "Korean LLM Evaluation",
    level: "Level B",
    completedProjects: 12,
    relationship: "Backup PM for Korean LLM Evaluation pilot review",
    lastMessage: "I will share the pilot rubric after Julie confirms timing.",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    online: false,
    permissionsSummary: [
      "Can message assigned PM",
      "Cannot access management groups",
      "Cannot create groups",
    ],
    messages: [
      { id: "tpm-maya-1", sender: "Maya Chen", timestamp: "Yesterday", kind: "text", text: "I will share the pilot rubric after Julie confirms timing.", roleLabel: "Project Manager", align: "left" },
    ],
  },
  {
    id: "talent-hr-daniel",
    kind: "HR",
    name: "Daniel Kim",
    avatarSeed: "Daniel Kim",
    roleLabel: "HR Support",
    projectName: "Onboarding and schedule",
    level: "Level B",
    completedProjects: 22,
    relationship: "Responsible HR for onboarding and schedule",
    lastMessage: "Send me your preferred work window when ready.",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    online: true,
    permissionsSummary: [
      "Can message responsible HR",
      "Cannot message other talents",
      "Cannot access global HR management groups",
    ],
    messages: [
      { id: "thr1", sender: "Daniel Kim", timestamp: "Yesterday", kind: "text", text: "I will help with onboarding, schedule confirmation, and task availability.", roleLabel: "HR Support", align: "left" },
      { id: "thr2", sender: "Daniel Kim", timestamp: "Yesterday", kind: "text", text: "Send me your preferred work window when ready.", roleLabel: "HR Support", align: "left" },
    ],
  },
  {
    id: "talent-hr-aisha",
    kind: "HR",
    name: "Aisha Khan",
    avatarSeed: "Aisha Khan",
    roleLabel: "HR Support",
    projectName: "Availability and timesheet support",
    level: "Level C",
    completedProjects: 14,
    relationship: "Responsible HR for availability updates and timesheet support",
    lastMessage: "I will check your weekend availability note.",
    lastMessageTime: "Monday",
    unreadCount: 0,
    online: false,
    permissionsSummary: [
      "Can message responsible HR",
      "Cannot message other talents",
      "Cannot access global HR management groups",
    ],
    messages: [
      { id: "thr-aisha-1", sender: "Aisha Khan", timestamp: "Monday", kind: "text", text: "I will check your weekend availability note.", roleLabel: "HR Support", align: "left" },
    ],
  },
  {
    id: "talent-project-group-japanese",
    kind: "Project Group",
    name: "Japanese LLM Evaluation Work Group",
    avatarSeed: "Japanese LLM Evaluation Work Group",
    roleLabel: "Project group",
    projectName: "Japanese LLM Evaluation",
    memberScope: "Approved project members only",
    currentTalentAccess: "Joined",
    lastMessage: "Guideline v1 has been uploaded.",
    lastMessageTime: "Today",
    unreadCount: 2,
    online: true,
    permissionsSummary: [
      "Can message joined project groups",
      "Cannot enter other project groups",
      "Cannot add other talents as contacts",
    ],
    messages: [
      { id: "tpg1", sender: "Julie Zhu", timestamp: "Today", kind: "system", text: "You joined Japanese LLM Evaluation Work Group.", align: "center" },
      { id: "tpg2", sender: "Julie Zhu", timestamp: "Today", kind: "attachment", text: "Guideline_v1.pdf", attachmentName: "Guideline_v1.pdf", attachmentMeta: "PDF - project guideline", roleLabel: "Project Manager", align: "left" },
      { id: "tpg3", sender: "Daniel Kim", timestamp: "Today", kind: "text", text: "Please ask task-specific questions in this project group.", roleLabel: "HR Support", align: "left" },
    ],
  },
  {
    id: "talent-project-group-korean",
    kind: "Project Group",
    name: "Korean LLM Pilot Work Group",
    avatarSeed: "Korean LLM Pilot Work Group",
    roleLabel: "Project group",
    projectName: "Korean LLM Evaluation",
    memberScope: "Approved pilot members only",
    currentTalentAccess: "Approved",
    lastMessage: "Pilot schedule draft is ready for review.",
    lastMessageTime: "Yesterday",
    unreadCount: 1,
    online: true,
    permissionsSummary: [
      "Can message joined project groups",
      "Cannot enter other project groups",
      "Cannot add other talents as contacts",
    ],
    messages: [
      { id: "tpg-korean-1", sender: "Maya Chen", timestamp: "Yesterday", kind: "system", text: "You joined Korean LLM Pilot Work Group.", align: "center" },
      { id: "tpg-korean-2", sender: "Maya Chen", timestamp: "Yesterday", kind: "text", text: "Pilot schedule draft is ready for review.", roleLabel: "Project Manager", align: "left" },
    ],
  },
  {
    id: "talent-project-group-guideline",
    kind: "Project Group",
    name: "QA Guideline Review Group",
    avatarSeed: "QA Guideline Review Group",
    roleLabel: "Project group",
    projectName: "Cross-project QA Guideline Review",
    memberScope: "Joined guideline reviewers only",
    currentTalentAccess: "Joined",
    lastMessage: "Please add questions under the QA section.",
    lastMessageTime: "Monday",
    unreadCount: 0,
    online: true,
    permissionsSummary: [
      "Can message joined project groups",
      "Cannot enter other project groups",
      "Cannot add other talents as contacts",
    ],
    messages: [
      { id: "tpg-guideline-1", sender: "Julie Zhu", timestamp: "Monday", kind: "text", text: "Please add questions under the QA section.", roleLabel: "Project Manager", align: "left" },
    ],
  },
];

const conversationTypeColor: Record<string, string> = {
  "Super Admin": "border-[#b38f2d] bg-[#fff4d5] text-[#946200]",
  Executive: "border-[#7c3aed] bg-[#f3e8ff] text-[#6d28d9]",
  HR: "border-[#2563eb] bg-[#dbeafe] text-[#1d4ed8]",
  Talent: "border-[#c46a1c] bg-[#fff2df] text-[#b45309]",
  Group: "border-[#0f766e] bg-[#d7f3ef] text-[#0f766e]",
};

function conversationListTone(conversation: Conversation) {
  if (conversation.kind === "platform") {
    if (conversation.role === "Super Admin") {
      return "border-l-[#c6a84f] bg-[#fffdf6] hover:bg-[#fffaf0]";
    }
    if (conversation.role === "Executive") {
      return "border-l-[#a78bfa] bg-[#faf7ff] hover:bg-[#f7f2ff]";
    }
    return "border-l-[#60a5fa] bg-[#f8fbff] hover:bg-[#f3f8ff]";
  }

  if (conversation.kind === "talent") {
    return "border-l-[#d89a54] bg-[#fffaf4] hover:bg-[#fff6ec]";
  }

  return "border-l-[#48a997] bg-[#f4fbf8] hover:bg-[#eef9f4]";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function normalizeProfileKey(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function displayValue(value?: string | number) {
  const text = String(value ?? "").trim();
  return text || "Not set";
}

function findMatchingTalentProfile(profiles: TalentProfileRecord[], conversation?: TalentConversation) {
  if (!conversation) return undefined;
  const conversationName = normalizeProfileKey(conversation.name);
  const conversationChatUrl = normalizeProfileKey(conversation.upworkChatUrl);
  const conversationProfileUrl = normalizeProfileKey(conversation.upworkProfileUrl);

  return profiles.find((profile) => {
    const profileName = normalizeProfileKey(profile.candidateName);
    const profileChatUrl = normalizeProfileKey(profile.upworkChatUrl);
    const profileUrl = normalizeProfileKey(profile.profileUrl);
    return (
      profile.talentId === conversation.talentId ||
      (conversationName && profileName && conversationName === profileName) ||
      (conversationChatUrl && profileChatUrl && conversationChatUrl === profileChatUrl) ||
      (conversationProfileUrl && profileUrl && conversationProfileUrl === profileUrl)
    );
  });
}

function hashHue(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 360;
  }
  return hash;
}

function avatarStyle(seed: string) {
  const hue = hashHue(seed);
  return {
    background: `linear-gradient(135deg, hsl(${hue} 40% 72%), hsl(${(hue + 24) % 360} 45% 58%))`,
  };
}

function SectionHeading({ label, subtitle }: { label: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1f5c43]">{label}</div>
      {subtitle ? <div className="mt-1 text-sm text-[#6b7280]">{subtitle}</div> : null}
    </div>
  );
}

function Avatar({ name, seed, size = "md" }: { name: string; seed: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "h-9 w-9 text-xs" : size === "lg" ? "h-16 w-16 text-lg" : "h-12 w-12 text-sm";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-[0_10px_20px_rgba(31,41,51,0.12)] ${sizeClass}`}
      style={avatarStyle(seed)}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}

function ProfilePhoto({
  name,
  avatarUrl,
  failed,
  onError,
  sizeClass = "h-24 w-24 text-2xl",
}: {
  name: string;
  avatarUrl?: string;
  failed?: boolean;
  onError?: () => void;
  sizeClass?: string;
}) {
  const photoUrl = String(avatarUrl || "").trim();
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#d7dccf] bg-[#f4efe2] font-black text-[#1f5c43] shadow-sm ${sizeClass}`}
    >
      {photoUrl && !failed ? (
        <Image
          src={photoUrl}
          alt={name}
          fill
          unoptimized
          className="object-cover"
          onError={onError}
        />
      ) : (
        initials(name || "Talent")
      )}
    </div>
  );
}

function Badge({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}>
      {children}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[#eadfcd] bg-white px-3 py-2">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6256]">{label}</div>
      <div className="max-w-[58%] text-right text-sm font-medium text-[#111827]">{value || "—"}</div>
    </div>
  );
}

function typeBadge(kind: Conversation["kind"], role?: PlatformRole) {
  if (kind === "platform" && role) return conversationTypeColor[role];
  if (kind === "talent") return conversationTypeColor.Talent;
  return conversationTypeColor.Group;
}

function renderMessage(message: ChatMessage) {
  if (message.kind === "system") {
    return (
      <div className="rounded-full border border-dashed border-[#d7cec0] bg-[#f8f4ea] px-3 py-2 text-center text-xs text-[#6f6256]">
        {message.text}
      </div>
    );
  }

  if (message.kind === "attachment") {
    return (
      <div className="rounded-2xl border border-[#d9d2c7] bg-white p-3 shadow-[0_10px_20px_rgba(31,41,51,0.04)]">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#edf8f1] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f5c43]">
            File
          </span>
          <div className="text-sm font-semibold text-[#111827]">{message.attachmentName}</div>
        </div>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#6b7280]">
          {message.attachmentType ? <span>{message.attachmentType}</span> : null}
          {message.attachmentSize ? <span>{message.attachmentSize}</span> : null}
          {message.attachmentMeta ? <span>{message.attachmentMeta}</span> : null}
        </div>
      </div>
    );
  }

  if (message.kind === "image" || message.kind === "video") {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#d9d2c7] bg-white shadow-[0_10px_20px_rgba(31,41,51,0.04)]">
        {message.previewUrl ? (
          message.kind === "image" ? (
            <div
              role="img"
              aria-label={message.attachmentName ?? "Image attachment"}
              className="h-32 w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${message.previewUrl})` }}
            />
          ) : (
            <video src={message.previewUrl} controls className="h-32 w-full bg-black object-cover" />
          )
        ) : (
          <div className="flex h-28 items-center justify-center bg-[#f5efe3] text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6f4f]">
            {message.kind === "image" ? "Image preview" : "Video preview"}
          </div>
        )}
        <div className="p-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#edf8f1] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f5c43]">
              {message.kind === "image" ? "Image" : "Video"}
            </span>
            <div className="text-sm font-semibold text-[#111827]">{message.attachmentName}</div>
          </div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#6b7280]">
            {message.attachmentType ? <span>{message.attachmentType}</span> : null}
            {message.attachmentSize ? <span>{message.attachmentSize}</span> : null}
            {message.attachmentMeta ? <span>{message.attachmentMeta}</span> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#d9d2c7] bg-white px-4 py-3 shadow-[0_10px_20px_rgba(31,41,51,0.04)]">
      <div className="whitespace-pre-wrap text-sm leading-6 text-[#243041]">{message.text}</div>
    </div>
  );
}

function canDirectMessage(currentUser: { name: string; role: PlatformRole }, conversation: Conversation, permissionConfig: PermissionConfig) {
  void currentUser;
  void conversation;
  void permissionConfig;
  return true;
}

function canSendGroupMessage(currentUser: { name: string; role: PlatformRole }, conversation: Conversation, permissionConfig: PermissionConfig) {
  void currentUser;
  void conversation;
  void permissionConfig;
  return true;
}

function canSendMessage(currentUser: { name: string; role: PlatformRole }, conversation: Conversation, permissionConfig: PermissionConfig) {
  if (conversation.kind === "group") return canSendGroupMessage(currentUser, conversation, permissionConfig);
  return canDirectMessage(currentUser, conversation, permissionConfig);
}

function canSendFile(currentUser: { name: string; role: PlatformRole }, conversation: Conversation, permissionConfig: PermissionConfig) {
  void currentUser;
  void conversation;
  void permissionConfig;
  return true;
}

function canSendVideo(currentUser: { name: string; role: PlatformRole }, conversation: Conversation, permissionConfig: PermissionConfig) {
  void currentUser;
  void conversation;
  void permissionConfig;
  return true;
}

function canCreateGroup(currentUser: { name: string; role: PlatformRole }, permissionConfig: PermissionConfig) {
  void currentUser;
  void permissionConfig;
  return true;
}

function canInviteMembers(currentUser: { name: string; role: PlatformRole }, conversation: Conversation, permissionConfig: PermissionConfig) {
  void currentUser;
  void conversation;
  void permissionConfig;
  return true;
}

function canViewChatHistory(currentUser: { name: string; role: PlatformRole }, conversation: Conversation, permissionConfig: PermissionConfig) {
  void currentUser;
  void conversation;
  void permissionConfig;
  return true;
}

export function TalentMessagesPage({
  initialTab = "",
  initialTaskId = "",
  initialTaskName = "",
  initialTalentProfiles = [],
}: TalentMessagesPageProps) {
  const initialRequestedTask = initialTaskId || initialTaskName;
  const initialTargetTask = initialRequestedTask
    ? initialWorkbenchTasks.find((task) => {
        const normalizedId = normalizeTaskParam(initialTaskId);
        const normalizedName = normalizeTaskParam(initialTaskName);
        return normalizeTaskParam(task.id) === normalizedId || normalizeTaskParam(task.taskName) === normalizedName;
      })
    : undefined;
  const initialNotice = initialRequestedTask
    ? initialTargetTask
      ? { tone: "info" as const, message: `Opened Task Center for ${initialTargetTask.taskName}.` }
      : { tone: "info" as const, message: "Requested task was not found. Showing the default task." }
    : null;
  const initialWorkbenchTab: WorkbenchTab =
    initialTab === "personal-center" ? "personal-center" : initialTab === "communication-hub" ? "communication-hub" : "task-center";

  const [activeTab, setActiveTab] = useState<WorkbenchTab>(initialWorkbenchTab);
  const [platformUser, setPlatformUser] = useState<AccountUser | null>(null);
  const [activeView, setActiveView] = useState<WorkbenchView>("manager");
  const [workbenchTasks, setWorkbenchTasks] = useState<WorkbenchTask[]>(initialWorkbenchTasks);
  const [workbenchApplicants, setWorkbenchApplicants] = useState<WorkbenchApplicant[]>(initialWorkbenchApplicants);
  const [selectedApplicantsTaskId, setSelectedApplicantsTaskId] = useState(initialTargetTask?.id ?? initialWorkbenchTasks[0]?.id ?? "");
  const [taskPanelMode, setTaskPanelMode] = useState<TaskPanelMode>("applicants");
  const [workbenchNotice, setWorkbenchNotice] = useState<WorkbenchNotice | null>(initialNotice);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskForm, setCreateTaskForm] = useState<CreateTaskForm>({
    taskName: "",
    language: "",
    targetTalent: "",
    deadline: "",
    owner: "",
    description: "",
  });
  const [profileApplicantId, setProfileApplicantId] = useState("");
  const [applyingTaskId, setApplyingTaskId] = useState("");
  const [talentApplications, setTalentApplications] = useState<Record<string, ApplicantStatus>>({});
  const [talentProfiles, setTalentProfiles] = useState<TalentProfileRecord[]>(initialTalentProfiles);
  const talentAvatarInputRef = useRef<HTMLInputElement | null>(null);
  const [talentAvatarDragActive, setTalentAvatarDragActive] = useState(false);
  const [talentAvatarError, setTalentAvatarError] = useState("");
  const [talentAvatarStatus, setTalentAvatarStatus] = useState("");
  const [failedTalentAvatarUrl, setFailedTalentAvatarUrl] = useState("");
  const [approvedProjectIds, setApprovedProjectIds] = useState<string[]>([]);
  const [projectGroups, setProjectGroups] = useState<Record<string, ProjectGroupPreview>>({
    "japanese-llm-evaluation": {
      groupName: "Japanese LLM Evaluation Recruiting Group",
      members: 14,
      activity: "Japanese LLM Evaluation Recruiting Group is ready for approved evaluators.",
    },
  });
  const [applicationForm, setApplicationForm] = useState<TalentApplicationForm>({
    selfIntroduction: "",
    relevantExperience: "",
    availability: "",
    portfolioNote: "",
    additionalNotes: "",
  });
  const [currentUserId, setCurrentUserId] = useState("daniel");
  const currentUser = useMemo(
    () => PLATFORM_USERS.find((item) => item.id === currentUserId) ?? PLATFORM_USERS[2],
    [currentUserId],
  );
  const [permissionConfig, setPermissionConfig] = useState<PermissionConfig>(ROLE_DEFAULTS[currentUser.role]);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState(initialConversations[0]?.id ?? "");
  const [filter, setFilter] = useState<ConversationFilter>("All");
  const [talentCommunicationConversations, setTalentCommunicationConversations] = useState<TalentCommunicationConversation[]>(
    initialTalentCommunicationConversations,
  );
  const [selectedTalentCommunicationId, setSelectedTalentCommunicationId] = useState(initialTalentCommunicationConversations[0]?.id ?? "");
  const [talentCommunicationFilter, setTalentCommunicationFilter] = useState<TalentCommunicationFilter>("All");
  const [openAccessSection, setOpenAccessSection] = useState("");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupMemberOverrides, setGroupMemberOverrides] = useState<Record<string, GroupMemberDetail[]>>({});
  const [groupAdminNames, setGroupAdminNames] = useState<Record<string, string[]>>({});
  const [groupMemberModal, setGroupMemberModal] = useState<{
    mode: "add" | "delete";
    groupKey: string;
    members: GroupMemberDetail[];
  } | null>(null);
  const [groupMemberModalSearch, setGroupMemberModalSearch] = useState("");
  const [selectedGroupMemberNames, setSelectedGroupMemberNames] = useState<string[]>([]);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [groupSettingsSearch, setGroupSettingsSearch] = useState("");
  const [groupActionMemberName, setGroupActionMemberName] = useState("");
  const [groupNoticeDrafts, setGroupNoticeDrafts] = useState<Record<string, string>>({});
  const [groupNameDrafts, setGroupNameDrafts] = useState<Record<string, string>>({});
  const [groupRuleDrafts, setGroupRuleDrafts] = useState<Record<string, GroupRuleLink>>({});
  const [groupSettingToggles, setGroupSettingToggles] = useState<Record<string, Record<string, boolean>>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentUrlsRef = useRef<string[]>([]);
  const [groupDraft, setGroupDraft] = useState<GroupDraft>({
    groupName: "New Talent Group",
    groupType: "Project Group",
    relatedProject: "Native LLM Evaluator Recruitment",
    relatedLanguage: "Chinese",
    owner: currentUser.name,
    memberIds: conversations.filter((item) => item.kind === "talent").slice(0, 2).map((item) => item.id),
    allowFileSharing: true,
    allowVideoSharing: false,
  });

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) ?? conversations[0],
    [conversations, selectedConversationId],
  );

  const visibleConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const matchesFilter =
        filter === "All"
          ? true
          : filter === "Management"
            ? conversation.kind === "platform" && (conversation.role === "Super Admin" || conversation.role === "Executive")
            : filter === "HR"
              ? conversation.kind === "platform" && conversation.role === "HR User"
              : filter === "Talent Pool"
                ? conversation.kind === "talent"
                : conversation.kind === "group";

      if (!matchesFilter) return false;
      if (!query) return true;

      const searchable = [
        conversation.name,
        conversation.lastMessage,
        conversation.lastMessageTime,
        conversation.kind === "platform" ? conversation.role : "",
        conversation.kind === "talent" ? conversation.talentId : "",
        conversation.kind === "talent" ? conversation.nativeLanguage : "",
        conversation.kind === "talent" ? conversation.skill : "",
        conversation.kind === "group" ? conversation.groupType : "",
        conversation.kind === "group" ? conversation.relatedProject ?? "" : "",
        conversation.kind === "group" ? conversation.relatedLanguage ?? "" : "",
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [conversations, filter, search]);

  const selectedTalentCommunication = useMemo(
    () =>
      talentCommunicationConversations.find((item) => item.id === selectedTalentCommunicationId) ??
      talentCommunicationConversations[0],
    [talentCommunicationConversations, selectedTalentCommunicationId],
  );

  const visibleTalentCommunicationConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return talentCommunicationConversations.filter((conversation) => {
      const matchesFilter = talentCommunicationFilter === "All" || conversation.kind === talentCommunicationFilter;
      if (!matchesFilter) return false;
      if (!query) return true;
      return [
        conversation.name,
        conversation.roleLabel,
        conversation.projectName,
        conversation.lastMessage,
        conversation.kind,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [search, talentCommunicationConversations, talentCommunicationFilter]);

  const selectedCanSend = selectedConversation ? canSendMessage(currentUser, selectedConversation, permissionConfig) : false;
  const selectedCanFile = selectedConversation ? canSendFile(currentUser, selectedConversation, permissionConfig) : false;
  const selectedCanVideo = selectedConversation ? canSendVideo(currentUser, selectedConversation, permissionConfig) : false;
  const selectedCanCreateGroup = canCreateGroup(currentUser, permissionConfig);
  const selectedCanInvite = selectedConversation ? canInviteMembers(currentUser, selectedConversation, permissionConfig) : false;
  const selectedCanHistory = selectedConversation ? canViewChatHistory(currentUser, selectedConversation, permissionConfig) : false;
  const activeRestrictedModule = activeTab === "personal-center" ? "personal-center" : activeTab === "communication-hub" ? "communication-hub" : "";
  const activeTabBlocked = Boolean(activeRestrictedModule && !canAccessModule(platformUser, activeRestrictedModule));

  useEffect(() => {
    function refreshAccount() {
      setPlatformUser(readPlatformUser());
    }
    refreshAccount();
    window.addEventListener("storage", refreshAccount);
    return () => window.removeEventListener("storage", refreshAccount);
  }, []);

  useEffect(() => {
    return () => {
      attachmentUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      attachmentUrlsRef.current = [];
    };
  }, []);

  function updateConversation(targetId: string, updater: (conversation: Conversation) => Conversation) {
    setConversations((prev) => prev.map((conversation) => (conversation.id === targetId ? updater(conversation) : conversation)));
  }

  function updateTalentCommunication(targetId: string, updater: (conversation: TalentCommunicationConversation) => TalentCommunicationConversation) {
    setTalentCommunicationConversations((prev) =>
      prev.map((conversation) => (conversation.id === targetId ? updater(conversation) : conversation)),
    );
  }

  function formatFileSize(size: number) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function appendLocalAttachment(file: File, inputKind: "file" | "video") {
    if (!selectedConversation) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = inputKind === "video" || file.type.startsWith("video/");
    const nextKind: MessageKind = isVideo ? "video" : isImage ? "image" : "attachment";
    const previewUrl = isImage || isVideo ? URL.createObjectURL(file) : undefined;
    if (previewUrl) attachmentUrlsRef.current.push(previewUrl);
    const attachmentSize = formatFileSize(file.size);
    const attachmentType = file.type || file.name.split(".").pop()?.toUpperCase() || "FILE";
    const attachmentMeta = isVideo
      ? "Local video preview"
      : isImage
        ? "Local image preview"
        : "Local attachment only";

    const nextMessage: ChatMessage = {
      id: `${selectedConversation.id}-attachment-${selectedConversation.messages.length + 1}`,
      sender: currentUser.name,
      timestamp: "Just now",
      kind: nextKind,
      text: file.name,
      roleLabel: currentUser.role === "HR User" ? "HR" : currentUser.role,
      attachmentName: file.name,
      attachmentMeta,
      attachmentType,
      attachmentSize,
      previewUrl,
      align: "right",
    };

    updateConversation(selectedConversation.id, (conversation) => ({
      ...conversation,
      messages: [...conversation.messages, nextMessage],
      lastMessage: file.name,
      lastMessageTime: "Just now",
      unreadCount: 0,
    }));
  }

  function appendTalentAttachment(file: File) {
    if (!selectedTalentCommunication) return;

    const isImage = file.type.startsWith("image/");
    const nextKind: MessageKind = isImage ? "image" : "attachment";
    const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
    if (previewUrl) attachmentUrlsRef.current.push(previewUrl);

    const nextMessage: ChatMessage = {
      id: `${selectedTalentCommunication.id}-message-${selectedTalentCommunication.messages.length + 1}`,
      sender: currentTalentName,
      timestamp: "Just now",
      kind: nextKind,
      text: file.name,
      roleLabel: "Talent",
      attachmentName: file.name,
      attachmentMeta: isImage ? "Local image preview" : "Local attachment only",
      attachmentType: file.type || file.name.split(".").pop()?.toUpperCase() || "FILE",
      attachmentSize: formatFileSize(file.size),
      previewUrl,
      align: "right",
    };

    updateTalentCommunication(selectedTalentCommunication.id, (conversation) => ({
      ...conversation,
      messages: [...conversation.messages, nextMessage],
      lastMessage: file.name,
      lastMessageTime: "Just now",
      unreadCount: 0,
    }));
  }

  function handleSend() {
    if (!selectedConversation || !selectedCanSend) return;
    const value = draft.trim();
    if (!value) return;

    const nextMessage: ChatMessage = {
      id: `${selectedConversation.id}-message-${selectedConversation.messages.length + 1}`,
      sender: currentUser.name,
      timestamp: "Just now",
      kind: "text",
      text: value,
      roleLabel: currentUser.role === "HR User" ? "HR" : currentUser.role,
      align: "right",
    };

    updateConversation(selectedConversation.id, (conversation) => ({
      ...conversation,
      messages: [...conversation.messages, nextMessage],
      lastMessage: value,
      lastMessageTime: "Just now",
      unreadCount: 0,
    }));
    setDraft("");
  }

  function handleTalentSend() {
    if (!selectedTalentCommunication) return;
    const value = draft.trim();
    if (!value) return;

    const nextMessage: ChatMessage = {
      id: `${selectedTalentCommunication.id}-message-${selectedTalentCommunication.messages.length + 1}`,
      sender: currentTalentName,
      timestamp: "Just now",
      kind: "text",
      text: value,
      roleLabel: "Talent",
      align: "right",
    };

    updateTalentCommunication(selectedTalentCommunication.id, (conversation) => ({
      ...conversation,
      messages: [...conversation.messages, nextMessage],
      lastMessage: value,
      lastMessageTime: "Just now",
      unreadCount: 0,
    }));
    setDraft("");
  }

  function handleQuickAttachment(kind: "attachment" | "image" | "video") {
    void kind;
    if (kind === "attachment") {
      fileInputRef.current?.click();
      return;
    }
    if (kind === "video") {
      videoInputRef.current?.click();
      return;
    }
    fileInputRef.current?.click();
  }

  function handleCreateGroup() {
    const members = conversations
      .filter((item): item is TalentConversation => item.kind === "talent" && groupDraft.memberIds.includes(item.id))
      .map((item) => item.name);

    const groupName = groupDraft.groupName.trim() || "New Talent Group";
    const nextGroup: GroupConversation = {
      id: `group-${Date.now()}`,
      kind: "group",
      name: groupName,
      avatarSeed: groupName,
      groupType: groupDraft.groupType,
      memberCount: members.length,
      owner: groupDraft.owner.trim() || currentUser.name,
      relatedProject: groupDraft.groupType === "Project Group" ? groupDraft.relatedProject.trim() || undefined : undefined,
      relatedLanguage: groupDraft.groupType === "Language Group" ? groupDraft.relatedLanguage.trim() || undefined : undefined,
      unreadCount: 0,
      allowFileSharing: groupDraft.allowFileSharing,
      allowVideoSharing: groupDraft.allowVideoSharing,
      members,
      permissionsSummary: `${groupDraft.groupType} created from the Talent Hub preview.`,
      lastMessage: `${currentUser.name} created the group ${groupName}.`,
      lastMessageTime: "Just now",
      messages: [
        {
          id: `${Date.now()}-system`,
          sender: "System",
          timestamp: "Just now",
          kind: "system",
          text: `${currentUser.name} created the group ${groupName}.`,
          align: "center",
        },
      ],
    };

    setConversations((prev) => [nextGroup, ...prev]);
    setSelectedConversationId(nextGroup.id);
    setIsCreateGroupOpen(false);
  }

  function toggleFilter(next: ConversationFilter) {
    setFilter(next);
  }

  function selectedApplicantsTask() {
    return workbenchTasks.find((task) => task.id === selectedApplicantsTaskId) ?? workbenchTasks[0];
  }

  function showWorkbenchNotice(tone: WorkbenchNoticeTone, message: string) {
    setWorkbenchNotice({ tone, message });
  }

  function selectTask(taskId: string, mode: TaskPanelMode) {
    setSelectedApplicantsTaskId(taskId);
    setTaskPanelMode(mode);
  }

  function handleCreateMockTask() {
    const taskName = createTaskForm.taskName.trim();
    if (!taskName) {
      showWorkbenchNotice("error", "Please enter a task name.");
      return;
    }

    const nextTask: WorkbenchTask = {
      id: `mock-task-${Date.now()}`,
      taskName,
      status: "Draft",
      language: createTaskForm.language.trim() || "TBD",
      skillRequirement: createTaskForm.description.trim() || "Recruiting support",
      targetTalent: createTaskForm.targetTalent.trim() || "Target talent TBD",
      applicants: 0,
      approved: 0,
      owner: createTaskForm.owner.trim() || "Julie Zhu",
      deadline: createTaskForm.deadline.trim() || "TBD",
      description: createTaskForm.description.trim(),
      projectBackground: createTaskForm.description.trim() || "Recruiting task created from Talent Hub.",
      workScope: "Review task requirements, confirm fit, and coordinate with the project owner after approval.",
      languageRequirement: createTaskForm.language.trim() || "Language requirement TBD.",
      workload: "Workload will be confirmed after the task is reviewed.",
      timeline: createTaskForm.deadline.trim() ? `Target deadline is ${createTaskForm.deadline.trim()}.` : "Timeline TBD.",
      paymentNote: "Payment will be confirmed after official scope and workload are finalized.",
      applicationRequirement: "Applicants should provide relevant background, experience, and availability.",
      materialsToSubmit: "Self-introduction, relevant experience, availability, and optional resume/profile link.",
      notes: "This task is pending workspace sync.",
      ownerContact: createTaskForm.owner.trim() || "Julie Zhu",
    };

    setWorkbenchTasks((current) => [nextTask, ...current]);
    setSelectedApplicantsTaskId(nextTask.id);
    setTaskPanelMode("manage");
    setIsCreateTaskOpen(false);
    setCreateTaskForm({
      taskName: "",
      language: "",
      targetTalent: "",
      deadline: "",
      owner: "",
      description: "",
    });
    showWorkbenchNotice("success", `Task created: ${nextTask.taskName}.`);
  }

  function openApplicantMessage(applicant: WorkbenchApplicant) {
    const targetConversation = conversations.find((conversation) => conversation.name === applicant.name);
    if (targetConversation) {
      setSelectedConversationId(targetConversation.id);
      setFilter("All");
      setSearch("");
    }
    setActiveTab("communication-hub");
    showWorkbenchNotice("info", `Opened direct message with ${applicant.name}.`);
  }

  function handleApplicantDecision(applicantId: string, nextStatus: ApplicantStatus) {
    const applicant = workbenchApplicants.find((item) => item.id === applicantId);
    if (!applicant) return;
    const wasApproved = applicant.status === "Approved";
    const taskId = selectedApplicantsTaskId;
    const task = workbenchTasks.find((item) => item.id === taskId);

    setWorkbenchApplicants((current) =>
      current.map((item) => (item.id === applicantId ? { ...item, status: nextStatus } : item)),
    );

    if (nextStatus === "Approved" && !wasApproved) {
      setWorkbenchTasks((current) =>
        current.map((task) => (task.id === taskId ? { ...task, approved: task.approved + 1 } : task)),
      );
      setApprovedProjectIds((current) => (current.includes(taskId) ? current : [...current, taskId]));
      setProjectGroups((current) => {
        const groupName = `${task?.taskName ?? "Selected Task"} Group`;
        const currentGroup = current[taskId];
        return {
          ...current,
          [taskId]: {
            groupName: currentGroup?.groupName ?? groupName,
            members: currentGroup ? currentGroup.members + 1 : 1,
            activity: `${applicant.name} joined ${groupName}.`,
          },
        };
      });
      showWorkbenchNotice("success", `${applicant.name} approved and added to project group.`);
      return;
    }

    if (nextStatus === "Rejected") {
      showWorkbenchNotice("error", `${applicant.name} rejected for this task.`);
    }
  }

  function handleSubmitApplication(taskId: string) {
    const task = workbenchTasks.find((item) => item.id === taskId);
    if (!applicationForm.selfIntroduction.trim()) {
      showWorkbenchNotice("error", "Please enter a short introduction.");
      return;
    }

    setTalentApplications((current) => ({ ...current, [taskId]: "Applied" }));
    setApplyingTaskId("");
    setApplicationForm({
      selfIntroduction: "",
      relevantExperience: "",
      availability: "",
      portfolioNote: "",
      additionalNotes: "",
    });
    showWorkbenchNotice("success", `Application submitted for ${task?.taskName ?? "this task"}.`);
  }

  const selectedTask = selectedApplicantsTask();
  const applicantStatsForTask = (taskId: string) => {
    const normalizedApplicants = workbenchApplicants
      .filter((applicant) => applicant.taskId === taskId)
      .filter((applicant) => applicant.status !== "Rejected");
    return {
      applicants: normalizedApplicants.length,
      approved: normalizedApplicants.filter((applicant) => applicant.status === "Approved").length,
    };
  };
  const applicantsForSelectedTask = workbenchApplicants.filter((applicant) => applicant.taskId === selectedTask?.id);
  const normalizedApplicantsForSelectedTask = applicantsForSelectedTask
    .map((applicant) => {
      if (["Approved"].includes(applicant.status)) return { ...applicant, status: "Approved" as const };
      if (["Rejected"].includes(applicant.status)) return null;
      return { ...applicant, status: "Applied" as const };
    })
    .filter((applicant): applicant is WorkbenchApplicant & { status: "Applied" | "Approved" } => Boolean(applicant));
  const selectedApplicantStats = selectedTask ? applicantStatsForTask(selectedTask.id) : { applicants: 0, approved: 0 };
  const profileApplicant = workbenchApplicants.find((applicant) => applicant.id === profileApplicantId);
  const projectGroupCards = Object.values(projectGroups);
  const talentAppliedTasks = workbenchTasks.filter((task) => talentApplications[task.id]);
  const talentApprovedTasks = workbenchTasks.filter((task) => approvedProjectIds.includes(task.id));
  const talentConversations = conversations.filter((item): item is TalentConversation => item.kind === "talent");
  const currentTalentConversation =
    selectedConversation?.kind === "talent"
      ? selectedConversation
      : talentConversations.find((conversation) => normalizeProfileKey(conversation.name) === "nayara ribeiro") ??
        talentConversations[0];
  const currentTalentProfile = findMatchingTalentProfile(talentProfiles, currentTalentConversation);
  const currentTalentName = currentTalentProfile?.candidateName || currentTalentConversation?.name || "Talent";
  const currentTalentAvatarUrl = currentTalentProfile?.avatarUrl || currentTalentConversation?.avatarUrl || "";
  const currentTalentStatus = currentTalentProfile?.status
    ? currentTalentProfile.status.charAt(0).toUpperCase() + currentTalentProfile.status.slice(1)
    : currentTalentConversation?.profileStatus || "Not set";
  const currentTalentActiveTasks = Math.max(
    talentApprovedTasks.length,
    currentTalentConversation?.relatedProjects.length || 0,
  );
  const currentTalentLastUpdated = currentTalentProfile?.updatedAt
    ? new Date(currentTalentProfile.updatedAt).toLocaleString()
    : "Not set";

  function updateCurrentTalentConversationAvatar(nextAvatarUrl: string) {
    if (!currentTalentConversation) return;
    setConversations((current) =>
      current.map((conversation) =>
        conversation.kind === "talent" && conversation.id === currentTalentConversation.id
          ? { ...conversation, avatarUrl: nextAvatarUrl }
          : conversation,
      ),
    );
  }

  async function persistTalentAvatar(nextAvatarUrl: string) {
    if (!currentTalentProfile) {
      setTalentAvatarError("Current talent profile was not found.");
      return;
    }

    const response = await fetch("/api/talent-pool/update", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        talentId: currentTalentProfile.talentId,
        candidateName: currentTalentProfile.candidateName,
        avatarUrl: nextAvatarUrl,
        education: currentTalentProfile.education,
        professionalDomain: currentTalentProfile.professionalDomain,
        upworkChatUrl: currentTalentProfile.upworkChatUrl,
        profileUrl: currentTalentProfile.profileUrl,
        nativeLanguage: currentTalentProfile.nativeLanguage,
        secondLanguage: currentTalentProfile.secondLanguage,
        mainSkill: currentTalentProfile.mainSkill,
        experienceSummary: currentTalentProfile.experienceSummary,
        dailyAvailability: currentTalentProfile.dailyAvailability,
        weekendAvailability: currentTalentProfile.weekendAvailability,
        email: currentTalentProfile.email,
        onlineContactMethod: currentTalentProfile.onlineContactMethod,
        onlineContactAccount: currentTalentProfile.onlineContactAccount,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || `Profile photo update failed: ${response.status}`);
    }

    const updatedProfile = data.talentProfile as TalentProfileRecord;
    setTalentProfiles((current) =>
      current.map((profile) => (profile.talentId === updatedProfile.talentId ? updatedProfile : profile)),
    );
    updateCurrentTalentConversationAvatar(updatedProfile.avatarUrl);
  }

  function applyTalentAvatarFile(file: File) {
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setTalentAvatarStatus("");
      setTalentAvatarError("Please upload a valid image file.");
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setTalentAvatarStatus("");
      setTalentAvatarError("Image is too large. Please upload a file under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextAvatarUrl = String(reader.result || "");
      if (!nextAvatarUrl) {
        setTalentAvatarStatus("");
        setTalentAvatarError("Could not read the selected image.");
        return;
      }
      setTalentAvatarError("");
      setTalentAvatarStatus("Profile photo updated.");
      setFailedTalentAvatarUrl("");
      setTalentProfiles((current) =>
        current.map((profile) =>
          profile.talentId === currentTalentProfile?.talentId
            ? { ...profile, avatarUrl: nextAvatarUrl, updatedAt: new Date().toISOString() }
            : profile,
        ),
      );
      updateCurrentTalentConversationAvatar(nextAvatarUrl);
      void persistTalentAvatar(nextAvatarUrl).catch((error) => {
        setTalentAvatarStatus("");
        setTalentAvatarError(error instanceof Error ? error.message : "Profile photo update failed.");
      });
    };
    reader.onerror = () => {
      setTalentAvatarStatus("");
      setTalentAvatarError("Could not read the selected image.");
    };
    reader.readAsDataURL(file);
  }

  function handleTalentAvatarFileSelect(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    applyTalentAvatarFile(file);
    if (talentAvatarInputRef.current) {
      talentAvatarInputRef.current.value = "";
    }
  }

  const headerMeta = useMemo(() => {
    if (!selectedConversation) return "";
    if (selectedConversation.kind === "talent") {
      return [
        `${selectedConversation.nativeLanguage}`,
        selectedConversation.skill,
        `Assigned HR: ${selectedConversation.assignedHr}`,
        `Profile: ${selectedConversation.profileStatus}`,
      ]
        .filter(Boolean)
        .join(" • ");
    }
    if (selectedConversation.kind === "group") {
      return [
        selectedConversation.groupType,
        `${selectedConversation.memberCount} members`,
        selectedConversation.relatedProject ? `Project: ${selectedConversation.relatedProject}` : selectedConversation.relatedLanguage ? `Language: ${selectedConversation.relatedLanguage}` : "",
      ]
        .filter(Boolean)
        .join(" • ");
    }
    return [
      selectedConversation.role,
      selectedConversation.department,
      selectedConversation.assignedProjects.join(", "),
    ]
      .filter(Boolean)
      .join(" • ");
  }, [selectedConversation]);

  const permissionRows = [
    { label: "Can send message", value: selectedConversation ? selectedCanSend : false },
    { label: "Can send file", value: selectedConversation ? selectedCanFile : false },
    { label: "Can send video", value: selectedConversation ? selectedCanVideo : false },
    { label: "Can create group", value: selectedCanCreateGroup },
    { label: "Can invite members", value: selectedConversation ? selectedCanInvite : false },
    { label: "Can view history", value: selectedConversation ? selectedCanHistory : false },
  ];

  const communicationTitle = activeView === "manager" ? selectedConversation?.name : selectedTalentCommunication?.name;
  const communicationMessages = activeView === "manager" ? selectedConversation?.messages ?? [] : selectedTalentCommunication?.messages ?? [];
  const communicationCanSend = activeView === "manager" ? selectedCanSend : Boolean(selectedTalentCommunication);
  const communicationCanFile = activeView === "manager" ? selectedCanFile : Boolean(selectedTalentCommunication);
  const communicationCanHistory = activeView === "manager" ? selectedCanHistory : Boolean(selectedTalentCommunication);
  const communicationIsGroup =
    activeView === "manager"
      ? selectedConversation?.kind === "group"
      : selectedTalentCommunication?.kind === "Project Group";
  const communicationHeaderMeta =
    activeView === "manager"
      ? headerMeta
      : selectedTalentCommunication
        ? `${selectedTalentCommunication.roleLabel} · ${selectedTalentCommunication.projectName}`
        : "";

  const managerProjectGroupAccess: CommunicationAccessItem[] = [
    ...conversations
      .filter((conversation): conversation is GroupConversation => conversation.kind === "group" && conversation.groupType === "Project Group")
      .map((conversation) => ({
        id: conversation.id,
        name: conversation.name,
        subtitle: conversation.relatedProject ?? "Project group",
        meta: `${conversation.memberCount} members`,
        avatarSeed: conversation.avatarSeed,
        unreadCount: conversation.unreadCount,
        onSelect: () => setSelectedConversationId(conversation.id),
      })),
    ...projectGroupCards.map((group) => ({
      id: `project-card-${normalizeTaskParam(group.groupName)}`,
      name: group.groupName,
      subtitle: group.activity,
      meta: `${group.members} members`,
      avatarSeed: group.groupName,
    })),
    {
      id: "manager-project-arabic-ocr",
      name: "Arabic OCR Expert Pool Group",
      subtitle: "Arabic OCR Expert Pool",
      meta: "9 members",
      avatarSeed: "Arabic OCR Expert Pool Group",
    },
    {
      id: "manager-project-portuguese-review",
      name: "Portuguese-BR Localization Review Group",
      subtitle: "Portuguese-BR Localization Review",
      meta: "16 members",
      avatarSeed: "Portuguese-BR Localization Review Group",
    },
  ];

  const managerDirectMessageAccess: CommunicationAccessItem[] = conversations
    .filter((conversation): conversation is PlatformConversation | TalentConversation => conversation.kind === "platform" || conversation.kind === "talent")
    .map((conversation) => ({
      id: conversation.id,
      name: conversation.name,
      subtitle: conversation.kind === "platform" ? conversation.role : "Talent",
      meta: conversation.kind === "platform" ? conversation.department : conversation.skill,
      avatarSeed: conversation.avatarSeed,
      avatarUrl: conversation.kind === "talent" ? conversation.avatarUrl : undefined,
      unreadCount: conversation.unreadCount,
      onSelect: () => setSelectedConversationId(conversation.id),
    }));

  const managerLanguageGroupAccess: CommunicationAccessItem[] = [
    ...conversations
      .filter((conversation): conversation is GroupConversation => conversation.kind === "group" && conversation.groupType === "Language Group")
      .map((conversation) => ({
        id: conversation.id,
        name: conversation.name,
        subtitle: conversation.relatedLanguage ?? "Language group",
        meta: `${conversation.memberCount} members`,
        avatarSeed: conversation.avatarSeed,
        unreadCount: conversation.unreadCount,
        onSelect: () => setSelectedConversationId(conversation.id),
      })),
    {
      id: "manager-language-japanese",
      name: "Japanese Talent Pool",
      subtitle: "Japanese",
      meta: "80 members",
      avatarSeed: "Japanese Talent Pool",
    },
    {
      id: "manager-language-arabic-reviewers",
      name: "Arabic OCR Reviewers",
      subtitle: "Arabic OCR",
      meta: "15 members",
      avatarSeed: "Arabic OCR Reviewers",
    },
    {
      id: "manager-language-portuguese",
      name: "Portuguese-BR Localization Pool",
      subtitle: "Portuguese-BR",
      meta: "28 members",
      avatarSeed: "Portuguese-BR Localization Pool",
    },
  ];

  const talentPmAccess: CommunicationAccessItem[] = talentCommunicationConversations
    .filter((conversation) => conversation.kind === "PM")
    .map((conversation) => ({
      id: conversation.id,
      name: conversation.name,
      subtitle: `${conversation.roleLabel} · ${conversation.projectName}`,
      meta: conversation.level,
      avatarSeed: conversation.avatarSeed,
      avatarUrl: conversation.avatarUrl,
      unreadCount: conversation.unreadCount,
      onSelect: () => setSelectedTalentCommunicationId(conversation.id),
    }));

  const talentHrAccess: CommunicationAccessItem[] = talentCommunicationConversations
    .filter((conversation) => conversation.kind === "HR")
    .map((conversation) => ({
      id: conversation.id,
      name: conversation.name,
      subtitle: `${conversation.roleLabel} · ${conversation.projectName}`,
      meta: conversation.level,
      avatarSeed: conversation.avatarSeed,
      avatarUrl: conversation.avatarUrl,
      unreadCount: conversation.unreadCount,
      onSelect: () => setSelectedTalentCommunicationId(conversation.id),
    }));

  const talentProjectGroupAccess: CommunicationAccessItem[] = talentCommunicationConversations
    .filter((conversation) => conversation.kind === "Project Group")
    .map((conversation) => ({
      id: conversation.id,
      name: conversation.name,
      subtitle: conversation.projectName,
      meta: conversation.memberScope,
      avatarSeed: conversation.avatarSeed,
      unreadCount: conversation.unreadCount,
      onSelect: () => setSelectedTalentCommunicationId(conversation.id),
    }));

  const blockedReason = useMemo(() => {
    if (!selectedConversation) return "";
    return "";
  }, [selectedConversation]);

  function accessOverflowKey(sectionKey: string) {
    return `${activeView}-${sectionKey}`;
  }

  function renderAccessChip(item: CommunicationAccessItem, compact = false) {
    return (
      <button
        key={item.id}
        type="button"
        onClick={item.onSelect}
        className={`flex w-full items-center gap-2 rounded-xl border border-[#eadfcd] bg-[#fbfaf6] text-left transition hover:border-[#1f5c43] hover:bg-[#f3fbf6] ${
          compact ? "px-2.5 py-2" : "px-3 py-2.5"
        }`}
      >
        {item.avatarUrl ? (
          <ProfilePhoto name={item.name} avatarUrl={item.avatarUrl} sizeClass={compact ? "h-8 w-8 text-xs" : "h-9 w-9 text-xs"} />
        ) : (
          <Avatar name={item.name} seed={item.avatarSeed} size="sm" />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[#111827]">{item.name}</div>
          <div className="truncate text-xs text-[#6b7280]">{displayValue(item.subtitle)}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {item.meta ? <span className="max-w-[88px] truncate text-[11px] font-semibold text-[#1f5c43]">{item.meta}</span> : null}
          {item.unreadCount ? (
            <span className="rounded-full bg-[#1f5c43] px-2 py-0.5 text-[10px] font-bold text-white">{item.unreadCount}</span>
          ) : null}
        </div>
      </button>
    );
  }

  function renderAccessSection(title: string, items: CommunicationAccessItem[], limit: number, sectionKey: string) {
    const visibleItems = items.slice(0, limit);
    const hiddenItems = items.slice(limit);
    const overflowKey = accessOverflowKey(sectionKey);
    const isOpen = openAccessSection === overflowKey;

    return (
      <div className="relative min-h-[168px] rounded-2xl border border-[#eadfcd] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#1f5c43]">{title}</div>
          {hiddenItems.length ? (
            <button
              type="button"
              onClick={() => setOpenAccessSection(isOpen ? "" : overflowKey)}
              className="rounded-full border border-[#b7dfca] bg-[#edf8f1] px-2.5 py-1 text-[11px] font-bold text-[#1f5c43] transition hover:border-[#1f5c43]"
            >
              +{hiddenItems.length} more
            </button>
          ) : null}
        </div>
        <div className="mt-3 space-y-2">
          {visibleItems.length ? visibleItems.map((item) => renderAccessChip(item, true)) : (
            <div className="rounded-xl border border-dashed border-[#d7cec0] bg-[#fbfaf6] px-3 py-2 text-sm text-[#6b7280]">No access assigned.</div>
          )}
        </div>
        {isOpen && hiddenItems.length ? (
          <div className="absolute left-4 right-4 top-[calc(100%-0.5rem)] z-30 rounded-2xl border border-[#d7cec0] bg-white p-3 shadow-[0_18px_34px_rgba(31,41,51,0.16)]">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#6f6256]">More {title}</div>
              <button type="button" onClick={() => setOpenAccessSection("")} className="text-xs font-semibold text-[#1f5c43]">
                Close
              </button>
            </div>
            <div className="scroll-panel max-h-64 space-y-2 pr-1">
              {hiddenItems.map((item) => renderAccessChip(item, true))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  function managerTalentLevel(conversation: TalentConversation) {
    if (conversation.name.includes("Nayara")) return "Level A";
    if (conversation.name.includes("Risa")) return "Level B";
    if (conversation.name.includes("Pearl")) return "Level C";
    return "Level B";
  }

  function managerTalentProjectsCompleted(conversation: TalentConversation) {
    if (conversation.name.includes("Nayara")) return 26;
    if (conversation.name.includes("Risa")) return 18;
    if (conversation.name.includes("Pearl")) return 11;
    return 9;
  }

  function platformUserLevel(conversation: PlatformConversation) {
    if (conversation.role === "Super Admin") return "Level A";
    if (conversation.role === "Executive") return "Level A";
    return conversation.name.includes("Daniel") ? "Level B" : "Level C";
  }

  function platformUserWorkload(conversation: PlatformConversation): Record<string, string> {
    if (conversation.role === "HR User") {
      return {
        assignedTasks: String(conversation.assignedProjects.length),
        assignedLanguages: conversation.assignedProjects.includes("Japanese Pool") ? "Japanese, Korean" : "Portuguese-BR, Arabic",
        pendingReviews: conversation.name.includes("Daniel") ? "7" : "4",
        acceptedProfiles: conversation.name.includes("Daniel") ? "34" : "21",
        activeProjects: conversation.assignedProjects.join(", "),
      };
    }

    return {
      managedProjects: conversation.assignedProjects.join(", "),
      managedLanguages: conversation.name.includes("Julie") ? "Global, Japanese, Korean" : "Global coverage review",
      team: conversation.department,
    };
  }

  function platformRoleLabel(conversation: PlatformConversation) {
    if (conversation.role === "Super Admin") return "Project Manager";
    if (conversation.role === "Executive") return "Manager";
    return "HR Support";
  }

  function findConversationPerson(name: string) {
    const normalizedName = normalizeProfileKey(name);
    return conversations.find((conversation) => normalizeProfileKey(conversation.name) === normalizedName);
  }

  function personDetailFromName(name: string): GroupMemberDetail {
    const conversation = findConversationPerson(name);
    if (conversation?.kind === "platform") {
      return {
        name: conversation.name,
        role: platformRoleLabel(conversation),
        level: platformUserLevel(conversation),
        status: conversation.online ? "Online" : conversation.status,
        avatarSeed: conversation.avatarSeed,
      };
    }
    if (conversation?.kind === "talent") {
      return {
        name: conversation.name,
        role: "Talent",
        level: managerTalentLevel(conversation),
        status: conversation.online ? "Online" : conversation.profileStatus,
        avatarSeed: conversation.avatarSeed,
        avatarUrl: conversation.avatarUrl,
      };
    }
    return {
      name,
      role: "Member",
      level: "",
      status: "Active",
      avatarSeed: name,
    };
  }

  function availableGroupPeople() {
    const people = [
      ...conversations
        .filter((conversation): conversation is PlatformConversation | TalentConversation => conversation.kind === "platform" || conversation.kind === "talent")
        .map((conversation) => personDetailFromName(conversation.name)),
      ...talentCommunicationConversations
        .filter((conversation) => conversation.kind === "PM" || conversation.kind === "HR")
        .map((conversation) => ({
          name: conversation.name,
          role: conversation.roleLabel,
          level: conversation.level,
          status: conversation.online ? "Online" : "Offline",
          avatarSeed: conversation.avatarSeed,
          avatarUrl: conversation.avatarUrl,
        })),
      personDetailFromName(currentTalentName),
    ];

    const seen = new Set<string>();
    return people.filter((person) => {
      const key = normalizeProfileKey(person.name);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function groupMemberDetails(memberNames: string[], fallbackMembers: number): GroupMemberDetail[] {
    const names = Array.from(new Set(memberNames.filter(Boolean)));
    const detailedMembers = names.map((name) => personDetailFromName(name));

    if (detailedMembers.length) return detailedMembers;
    return Array.from({ length: fallbackMembers }).map((_, index) => ({
      name: `Member ${index + 1}`,
      role: "Member",
      level: "",
      status: "Active",
      avatarSeed: `Member ${index + 1}`,
    }));
  }

  function groupRuleLink(groupName: string): GroupRuleLink | null {
    if (groupName.includes("Japanese")) {
      return {
        title: "Project Guideline",
        url: "https://example.com/blackdog/japanese-llm-guideline",
      };
    }
    if (groupName.includes("Korean")) {
      return {
        title: "Pilot Task Brief",
        url: "https://example.com/blackdog/korean-llm-brief",
      };
    }
    if (groupName.includes("QA")) {
      return {
        title: "QA Review Rule",
        url: "https://example.com/blackdog/qa-review-rule",
      };
    }
    return null;
  }

  function renderDetailRows(rows: Array<[string, string | number | undefined]>) {
    return (
      <div className="mt-4 space-y-2 text-sm">
        {rows
          .filter(([, value]) => String(value ?? "").trim())
          .map(([label, value]) => (
            <InfoRow key={label} label={label} value={displayValue(value)} />
          ))}
      </div>
    );
  }

  function setGroupMembers(groupKey: string, members: GroupMemberDetail[]) {
    setGroupMemberOverrides((current) => ({
      ...current,
      [groupKey]: members,
    }));
  }

  function openGroupMemberModal(mode: "add" | "delete", groupKey: string, members: GroupMemberDetail[]) {
    setGroupMemberModal({ mode, groupKey, members });
    setGroupMemberModalSearch("");
    setSelectedGroupMemberNames([]);
  }

  function closeGroupMemberModal() {
    setGroupMemberModal(null);
    setGroupMemberModalSearch("");
    setSelectedGroupMemberNames([]);
  }

  function toggleSelectedGroupMember(name: string) {
    setSelectedGroupMemberNames((current) =>
      current.some((item) => normalizeProfileKey(item) === normalizeProfileKey(name))
        ? current.filter((item) => normalizeProfileKey(item) !== normalizeProfileKey(name))
        : [...current, name],
    );
  }

  function confirmGroupMemberModal() {
    if (!groupMemberModal || !selectedGroupMemberNames.length) return;
    const selectedKeys = new Set(selectedGroupMemberNames.map((name) => normalizeProfileKey(name)));

    if (groupMemberModal.mode === "add") {
      const nextMembers = availableGroupPeople().filter((person) => selectedKeys.has(normalizeProfileKey(person.name)));
      const currentMembers = groupMemberOverrides[groupMemberModal.groupKey] ?? groupMemberModal.members;
      const existingKeys = new Set(currentMembers.map((member) => normalizeProfileKey(member.name)));
      setGroupMembers(groupMemberModal.groupKey, [
        ...currentMembers,
        ...nextMembers.filter((member) => !existingKeys.has(normalizeProfileKey(member.name))),
      ]);
    } else {
      setGroupMembers(
        groupMemberModal.groupKey,
        groupMemberModal.members.filter((member) => !selectedKeys.has(normalizeProfileKey(member.name))),
      );
      setGroupAdminNames((current) => ({
        ...current,
        [groupMemberModal.groupKey]: (current[groupMemberModal.groupKey] ?? []).filter(
          (name) => !selectedKeys.has(normalizeProfileKey(name)),
        ),
      }));
    }

    closeGroupMemberModal();
  }

  function toggleGroupAdmin(groupKey: string, memberName: string) {
    setGroupAdminNames((current) => {
      const currentAdmins = current[groupKey] ?? [];
      const isAdmin = currentAdmins.some((name) => normalizeProfileKey(name) === normalizeProfileKey(memberName));
      return {
        ...current,
        [groupKey]: isAdmin
          ? currentAdmins.filter((name) => normalizeProfileKey(name) !== normalizeProfileKey(memberName))
          : [...currentAdmins, memberName],
      };
    });
  }

  function removeMemberFromGroup(groupKey: string, members: GroupMemberDetail[], memberName: string) {
    const memberKey = normalizeProfileKey(memberName);
    setGroupMembers(groupKey, members.filter((member) => normalizeProfileKey(member.name) !== memberKey));
    setGroupAdminNames((current) => ({
      ...current,
      [groupKey]: (current[groupKey] ?? []).filter((name) => normalizeProfileKey(name) !== memberKey),
    }));
    setGroupActionMemberName("");
  }

  function toggleGroupSetting(groupKey: string, settingKey: string) {
    setGroupSettingToggles((current) => ({
      ...current,
      [groupKey]: {
        ...(current[groupKey] ?? {}),
        [settingKey]: !(current[groupKey]?.[settingKey] ?? false),
      },
    }));
  }

  function renderProjectRules(rule: GroupRuleLink | null) {
    return (
      <div className="mt-4 rounded-2xl border border-[#eadfcd] bg-white p-3">
        <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#1f5c43]">Project Rules</div>
        {rule ? (
          <div className="mt-3 rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-3">
            <div className="text-sm font-semibold text-[#111827]">{rule.title}</div>
            <div className="mt-1 break-all text-xs text-[#6b7280]">{rule.url}</div>
            <a
              href={rule.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-full border border-[#1f5c43] bg-[#1f5c43] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Open Rule
            </a>
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-[#d7cec0] bg-[#fbfaf6] px-3 py-3 text-sm text-[#6b7280]">
            No project rule link added yet.
          </div>
        )}
      </div>
    );
  }

  function renderGroupMemberTile(person: GroupMemberDetail, admins: string[], selected = false) {
    const isAdmin = admins.some((name) => normalizeProfileKey(name) === normalizeProfileKey(person.name));
    return (
      <div
        key={person.name}
        className={`rounded-2xl border bg-[#fbfaf6] px-2.5 py-3 text-center transition ${
          selected ? "border-[#1f5c43] ring-2 ring-[#d6eadc]" : "border-[#eadfcd]"
        }`}
      >
        <div className="mx-auto flex justify-center">
          {person.avatarUrl ? (
            <ProfilePhoto name={person.name} avatarUrl={person.avatarUrl} sizeClass="h-11 w-11 text-xs" />
          ) : (
            <Avatar name={person.name} seed={person.avatarSeed} size="md" />
          )}
        </div>
        <div className="mt-2 truncate text-xs font-semibold text-[#111827]">{person.name}</div>
        <div className="mt-1 truncate text-[11px] text-[#6b7280]">{person.role}</div>
        {isAdmin ? (
          <div className="mt-1 inline-flex rounded-full border border-[#b7dfca] bg-[#edf8f1] px-2 py-0.5 text-[10px] font-bold text-[#1f5c43]">
            Admin
          </div>
        ) : null}
      </div>
    );
  }

  function renderGroupMembers(members: ReturnType<typeof groupMemberDetails>, groupKey: string) {
    const admins = groupAdminNames[groupKey] ?? (members[0]?.name ? [members[0].name] : []);

    return (
      <div className="mt-4 rounded-2xl border border-[#eadfcd] bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#1f5c43]">Group Members</div>
            <Badge className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">{`Group Members · ${members.length}`}</Badge>
          </div>
        </div>
        <div className="scroll-panel mt-3 grid max-h-80 grid-cols-3 gap-2 pr-1">
          {members.map((member) => renderGroupMemberTile(member, admins))}
        </div>
      </div>
    );
  }

  function renderPersonDetails() {
    if (activeView === "talent" && selectedTalentCommunication && selectedTalentCommunication.kind !== "Project Group") {
      return (
        <>
          <div className="flex items-start gap-3">
            {selectedTalentCommunication.avatarUrl ? (
              <ProfilePhoto name={selectedTalentCommunication.name} avatarUrl={selectedTalentCommunication.avatarUrl} sizeClass="h-16 w-16 text-lg" />
            ) : (
              <Avatar name={selectedTalentCommunication.name} seed={selectedTalentCommunication.avatarSeed} size="lg" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-[#111827]">{selectedTalentCommunication.name}</div>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge className="border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]">{selectedTalentCommunication.roleLabel}</Badge>
                <Badge className={selectedTalentCommunication.online ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#cbd5e1] bg-[#f1f5f9] text-[#64748b]"}>
                  {selectedTalentCommunication.online ? "Online" : "Offline"}
                </Badge>
              </div>
            </div>
          </div>
          {renderDetailRows([
            ["Name", selectedTalentCommunication.name],
            ["Role", selectedTalentCommunication.roleLabel],
            ["Level", selectedTalentCommunication.level],
            ["Projects Completed", `${selectedTalentCommunication.completedProjects ?? 0} projects`],
            ["Assigned Project", selectedTalentCommunication.projectName],
            ["Relationship", selectedTalentCommunication.relationship],
          ])}
        </>
      );
    }

    if (selectedConversation?.kind === "platform") {
      const workload = platformUserWorkload(selectedConversation);
      return (
        <>
          <div className="flex items-start gap-3">
            <Avatar name={selectedConversation.name} seed={selectedConversation.avatarSeed} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-[#111827]">{selectedConversation.name}</div>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge className={selectedConversation.role === "Super Admin" ? "border-[#b38f2d] bg-[#fff4d5] text-[#946200]" : selectedConversation.role === "Executive" ? "border-[#7c3aed] bg-[#f3e8ff] text-[#6d28d9]" : "border-[#2563eb] bg-[#dbeafe] text-[#1d4ed8]"}>
                  {platformRoleLabel(selectedConversation)}
                </Badge>
                <Badge className={selectedConversation.online ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#cbd5e1] bg-[#f1f5f9] text-[#64748b]"}>
                  {selectedConversation.online ? "Online" : selectedConversation.status}
                </Badge>
              </div>
            </div>
          </div>
          {renderDetailRows([
            ["Name", selectedConversation.name],
            ["Role", platformRoleLabel(selectedConversation)],
            ["Level", platformUserLevel(selectedConversation)],
            ["Assigned Tasks", workload.assignedTasks],
            ["Assigned Languages", workload.assignedLanguages],
            ["Managed Projects", workload.managedProjects],
            ["Department", selectedConversation.department],
            ["Status", selectedConversation.status],
            ["Last Active", selectedConversation.lastActive],
          ])}
        </>
      );
    }

    if (selectedConversation?.kind === "talent") {
      return (
        <>
          <div className="flex items-start gap-3">
            {selectedConversation.avatarUrl ? (
              <ProfilePhoto name={selectedConversation.name} avatarUrl={selectedConversation.avatarUrl} sizeClass="h-16 w-16 text-lg" />
            ) : (
              <Avatar name={selectedConversation.name} seed={selectedConversation.avatarSeed} size="lg" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-[#111827]">{selectedConversation.name}</div>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge className="border-[#c46a1c] bg-[#fff2df] text-[#b45309]">Talent</Badge>
                <Badge className={selectedConversation.online ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#cbd5e1] bg-[#f1f5f9] text-[#64748b]"}>
                  {selectedConversation.online ? "Online" : "Offline"}
                </Badge>
              </div>
            </div>
          </div>
          {renderDetailRows([
            ["Name", selectedConversation.name],
            ["Role", "Talent"],
            ["Level", managerTalentLevel(selectedConversation)],
            ["Projects Completed", `${managerTalentProjectsCompleted(selectedConversation)} projects`],
            ["Native Language", selectedConversation.nativeLanguage],
            ["Second Language", selectedConversation.secondLanguage],
            ["Skill", selectedConversation.skill],
            ["Assigned HR", selectedConversation.assignedHr],
            ["Assigned Project", selectedConversation.relatedProjects.join(", ")],
            ["Profile Status", selectedConversation.profileStatus],
            ["Last Active", selectedConversation.lastContactTime],
          ])}
        </>
      );
    }

    return null;
  }

  function renderGroupDetails() {
    if (activeView === "talent" && selectedTalentCommunication?.kind === "Project Group") {
      const groupKey = `talent:${selectedTalentCommunication.id}`;
      const defaultMembers = groupMemberDetails(
        [
          ...talentCommunicationConversations.filter((conversation) => conversation.kind === "PM" || conversation.kind === "HR").map((conversation) => conversation.name),
          currentTalentName,
        ],
        3,
      );
      const members = groupMemberOverrides[groupKey] ?? defaultMembers;
      const rule = groupRuleLink(selectedTalentCommunication.name);
      return (
        <>
          <div className="flex items-start gap-3">
            <Avatar name={selectedTalentCommunication.name} seed={selectedTalentCommunication.avatarSeed} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-[#111827]">{selectedTalentCommunication.name}</div>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge className="border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]">Project Group</Badge>
                <Badge className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">Active</Badge>
              </div>
            </div>
          </div>
          {renderProjectRules(rule)}
          {renderGroupMembers(members, groupKey)}
        </>
      );
    }

    if (selectedConversation?.kind !== "group") return null;
    const groupKey = `manager:${selectedConversation.id}`;
    const defaultMembers = groupMemberDetails([selectedConversation.owner, ...selectedConversation.members], selectedConversation.memberCount);
    const members = groupMemberOverrides[groupKey] ?? defaultMembers;
    const rule = groupRuleLink(selectedConversation.name);
    return (
      <>
        <div className="flex items-start gap-3">
          <Avatar name={selectedConversation.name} seed={selectedConversation.avatarSeed} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold text-[#111827]">{selectedConversation.name}</div>
            <div className="mt-1 flex flex-wrap gap-2">
              <Badge className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">{selectedConversation.groupType}</Badge>
              <Badge className="border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]">Active</Badge>
            </div>
          </div>
        </div>
        {renderProjectRules(rule)}
        {renderGroupMembers(members, groupKey)}
      </>
    );
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (activeTab === "communication-hub" && activeView === "talent") {
      appendTalentAttachment(file);
      return;
    }
    appendLocalAttachment(file, "file");
  }

  function handleVideoSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    appendLocalAttachment(file, "video");
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#f6f0e6] text-[#1f2937]">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,image/*"
        onChange={handleFileSelection}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoSelection}
        className="hidden"
      />
      <div className="page-shell flex min-h-0 flex-1 flex-col gap-6 pb-24 pt-6">
        <section className="rounded-xl border border-[#e4d7c6] bg-[#fbfaf6] p-6 shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-[#111827]">Talent Hub</h1>
              <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-[#6f6256]">
                Manage talent tasks, applications, approvals, and project communication in one hub.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              <div className="inline-flex rounded-lg border border-[#d7dccf] bg-white p-1 shadow-[0_8px_18px_rgba(31,41,51,0.06)]">
                {[
                  { id: "task-center", label: "Task Center" },
                  { id: "personal-center", label: "Personal Center" },
                  { id: "communication-hub", label: "Communication Hub" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as WorkbenchTab)}
                    className={`rounded-md px-3 py-2 text-sm font-semibold whitespace-nowrap transition ${
                      activeTab === tab.id
                        ? "bg-[#1f5c43] text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)]"
                        : "text-[#6f6256] hover:bg-[#f4efe2] hover:text-[#111827]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {activeTab === "personal-center" ? null : (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-[#6f6256]">View as:</span>
                  <div className="inline-flex rounded-lg border border-[#d7dccf] bg-white p-1">
                    {[
                      { id: "manager", label: "Manager" },
                      { id: "talent", label: "Talent" },
                    ].map((view) => (
                      <button
                        key={view.id}
                        type="button"
                        onClick={() => {
                          const nextView = view.id as WorkbenchView;
                          setActiveView(nextView);
                          setTaskPanelMode(nextView === "manager" ? "applicants" : "details");
                        }}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                          activeView === view.id ? "bg-[#1f5c43] text-white" : "text-[#6f6256] hover:bg-[#f4efe2] hover:text-[#111827]"
                        }`}
                      >
                        {view.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {workbenchNotice ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  workbenchNotice.tone === "success"
                    ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]"
                    : workbenchNotice.tone === "error"
                      ? "border-[#f5c2c7] bg-[#fff5f5] text-[#b42318]"
                      : "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]"
                }`}
              >
                {workbenchNotice.message}
              </div>
            ) : null}

        {activeTabBlocked ? (
          <PermissionFallback type="no-permission" />
        ) : null}

        {!activeTabBlocked && activeTab === "task-center" ? (
        <section className="grid min-h-0 gap-5 min-[900px]:grid-cols-[minmax(360px,440px)_minmax(0,1fr)] min-[1180px]:grid-cols-[minmax(480px,520px)_minmax(520px,1fr)]">
          <div className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-5 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <SectionHeading
                label="Task List"
                subtitle={activeView === "manager" ? "Select a task to review applicants and manage delivery." : "Select a task to view details and apply."}
              />
              {activeView === "manager" ? (
                <button
                  type="button"
                  onClick={() => setIsCreateTaskOpen(true)}
                  className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_18px_rgba(31,92,67,0.18)]"
                >
                  Create Task
                </button>
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              {workbenchTasks.map((task) => {
                const selected = selectedTask?.id === task.id;
                const applicationStatus = talentApplications[task.id];
                const taskApplicantStats = applicantStatsForTask(task.id);
                return (
                  <article
                    key={task.id}
                    onClick={() => selectTask(task.id, "details")}
                    className={`cursor-pointer rounded-2xl border bg-white p-3.5 transition ${
                      selected
                        ? "border-[#b7dfca] border-l-4 border-l-[#1f5c43] bg-[#f2fbf5] shadow-[0_10px_22px_rgba(31,92,67,0.10)]"
                        : "border-[#e4d7c6] hover:border-[#cfe8d9] hover:bg-[#fffdf8]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-base font-semibold leading-5 text-[#111827]">{task.taskName}</div>
                        <div className="mt-1.5 text-sm leading-5 text-[#6b7280]">
                          {task.language} · {task.targetTalent} · Deadline {task.deadline}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#4b5563]">
                          <span>Applicants: <strong className="text-[#111827]">{taskApplicantStats.applicants}</strong></span>
                          <span>Approved: <strong className="text-[#111827]">{taskApplicantStats.approved}</strong></span>
                          <span>Owner: <strong className="text-[#111827]">{task.owner}</strong></span>
                        </div>
                      </div>
                      <Badge className="border-[#1f5c43] bg-[#edf8f1] text-[#1f5c43]">{task.status}</Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeView === "manager" ? (
                        <>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              selectTask(task.id, "applicants");
                            }}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                              selected && taskPanelMode === "applicants"
                                ? "border-[#1f5c43] bg-[#1f5c43] text-white"
                                : "border-[#d7cec0] bg-[#f8f4ea] text-[#4b5563]"
                            }`}
                          >
                            View Applicants
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              selectTask(task.id, "manage");
                            }}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                              selected && taskPanelMode === "manage"
                                ? "border-[#1f5c43] bg-[#1f5c43] text-white"
                                : "border-[#d7cec0] bg-[#f8f4ea] text-[#4b5563]"
                            }`}
                          >
                            Manage Task
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              selectTask(task.id, "brief");
                              showWorkbenchNotice("info", `Viewing full task brief for ${task.taskName}.`);
                            }}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                              selected && taskPanelMode === "brief"
                                ? "border-[#1f5c43] bg-[#1f5c43] text-white"
                                : "border-[#d7cec0] bg-[#f8f4ea] text-[#4b5563]"
                            }`}
                          >
                            View Details
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              selectTask(task.id, "details");
                              if (applicationStatus === "Approved") {
                                setActiveTab("communication-hub");
                                showWorkbenchNotice("info", `Project group opened for ${task.taskName}.`);
                                return;
                              }
                              if (applicationStatus) return;
                              setApplyingTaskId(task.id);
                            }}
                            className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            {applicationStatus === "Approved" ? "Go to Project Group" : applicationStatus ? "Applied / View Application" : "Apply"}
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="scroll-panel min-w-0 rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-6 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.24em] text-[#1f5c43]">
                  {activeView === "manager" && taskPanelMode === "applicants"
                    ? "Applicant Review Queue"
                    : activeView === "manager" && taskPanelMode === "manage"
                      ? "Manage Task"
                      : "Task Details"}
                </div>
                <div className="mt-2 text-lg font-semibold leading-6 text-[#111827] break-words">
                  {activeView === "manager" && taskPanelMode === "applicants" ? `Applicant Review Queue for ${selectedTask?.taskName}` : selectedTask?.taskName}
                </div>
              </div>
              {selectedTask ? <Badge className="border-[#1f5c43] bg-[#edf8f1] text-[#1f5c43]">{selectedTask.status}</Badge> : null}
            </div>

            {selectedTask ? (
              <>
                <div className="mt-5 grid gap-3 border-t border-[#eadfcd] pt-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    ["Language", selectedTask.language],
                    ["Target", selectedTask.targetTalent],
                    ["Deadline", selectedTask.deadline],
                    ["Owner", selectedTask.owner],
                    ["Applicants", String(selectedApplicantStats.applicants)],
                    ["Approved", String(selectedApplicantStats.approved)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-[#eadfcd] bg-white px-3 py-2">
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6256]">{label}</div>
                      <div className="mt-1 min-w-0 break-words text-sm font-semibold text-[#111827]">{value}</div>
                    </div>
                  ))}
                </div>

                {activeView === "manager" && taskPanelMode === "manage" ? (
                  <div className="mt-6 space-y-4">
                    <SectionHeading label="Task Overview" subtitle="Review task setup, applicant progress, and delivery readiness." />
                    <div className="rounded-2xl border border-[#eadfcd] bg-white p-4 text-sm leading-6 text-[#4b5563]">
                      <div className="font-semibold text-[#111827]">{selectedTask.taskName}</div>
                      <div className="mt-2">{selectedTask.status} · {selectedTask.language} · {selectedTask.targetTalent}</div>
                      <div>Deadline {selectedTask.deadline} · Owner {selectedTask.owner}</div>
                    </div>
                    <div className="rounded-2xl border border-[#eadfcd] bg-white p-4">
                      <div className="text-sm font-semibold text-[#111827]">Delivery Notes</div>
                      <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                        Use this panel to review task setup, applicant progress, and delivery readiness.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => showWorkbenchNotice("info", "Task editing will be connected after database setup.")}
                        className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Edit Task
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskPanelMode("applicants")}
                        className="rounded-full border border-[#d7cec0] bg-[#f8f4ea] px-3 py-1.5 text-xs font-semibold text-[#4b5563]"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : activeView === "manager" && taskPanelMode === "applicants" ? (
                  <div className="mt-6">
                    <SectionHeading label="Applicant Management" subtitle="Review who applied and approve talents for this task." />
                    <div className="space-y-3">
                      {normalizedApplicantsForSelectedTask.length ? normalizedApplicantsForSelectedTask.map((applicant) => (
                        <div key={applicant.id} className="rounded-2xl border border-[#eadfcd] bg-white p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <Avatar name={applicant.name} seed={applicant.id} size="sm" />
                              <div className="min-w-0">
                                <div className="font-semibold text-[#111827]">{applicant.name}</div>
                                <div className="mt-1 text-sm text-[#6b7280]">
                                  Native: {applicant.language} · Skill: {applicant.skill}
                                  {applicant.level ? ` · ${applicant.level}` : ""}
                                </div>
                              </div>
                            </div>
                            <Badge className={applicant.status === "Approved" ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]"}>
                              {applicant.status}
                            </Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <button type="button" onClick={() => setProfileApplicantId(applicant.id)} className="rounded-full border border-[#d7cec0] bg-[#f8f4ea] px-2.5 py-1 text-[11px] font-semibold text-[#4b5563]">View Profile</button>
                            <button type="button" onClick={() => openApplicantMessage(applicant)} className="rounded-full border border-[#d7cec0] bg-[#f8f4ea] px-2.5 py-1 text-[11px] font-semibold text-[#4b5563]">Message</button>
                            {applicant.status === "Applied" ? (
                              <button type="button" onClick={() => handleApplicantDecision(applicant.id, "Approved")} className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-2.5 py-1 text-[11px] font-semibold text-white">Approve</button>
                            ) : null}
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-2xl border border-[#eadfcd] bg-white px-4 py-3 text-sm text-[#6b7280]">
                          No applicants for this task yet.
                        </div>
                      )}
                    </div>
                  </div>
                ) : activeView === "manager" ? (
                  <div className="mt-6">
                    <SectionHeading label="Applicant Management" subtitle="Review who applied and approve talents for this task." />
                    <div className="space-y-3">
                      {normalizedApplicantsForSelectedTask.length ? normalizedApplicantsForSelectedTask.map((applicant) => (
                        <div key={applicant.id} className="rounded-2xl border border-[#eadfcd] bg-white p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <Avatar name={applicant.name} seed={applicant.id} size="sm" />
                              <div className="min-w-0">
                                <div className="font-semibold text-[#111827]">{applicant.name}</div>
                                <div className="mt-1 text-sm text-[#6b7280]">
                                  Native: {applicant.language} · Skill: {applicant.skill}
                                  {applicant.level ? ` · ${applicant.level}` : ""}
                                </div>
                              </div>
                            </div>
                            <Badge className={applicant.status === "Approved" ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]"}>
                              {applicant.status}
                            </Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <button type="button" onClick={() => setProfileApplicantId(applicant.id)} className="rounded-full border border-[#d7cec0] bg-[#f8f4ea] px-2.5 py-1 text-[11px] font-semibold text-[#4b5563]">View Profile</button>
                            <button type="button" onClick={() => openApplicantMessage(applicant)} className="rounded-full border border-[#d7cec0] bg-[#f8f4ea] px-2.5 py-1 text-[11px] font-semibold text-[#4b5563]">Message</button>
                            {applicant.status === "Applied" ? (
                              <button type="button" onClick={() => handleApplicantDecision(applicant.id, "Approved")} className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-2.5 py-1 text-[11px] font-semibold text-white">Approve</button>
                            ) : null}
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-2xl border border-dashed border-[#d7cec0] bg-white px-4 py-8 text-center text-sm text-[#6b7280]">
                          No applicants for this task yet.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6">
                    {applyingTaskId === selectedTask.id ? (
                      <div>
                        <SectionHeading label="Application Form" subtitle="Share your background, experience, and availability for this task." />
                        <div className="space-y-3">
                          {[
                            ["selfIntroduction", "Self Introduction"],
                            ["relevantExperience", "Relevant Experience"],
                            ["availability", "Availability"],
                            ["portfolioNote", "Resume / Portfolio note"],
                            ["additionalNotes", "Additional Notes"],
                          ].map(([key, label]) => (
                            <label key={key} className="block">
                              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6256]">{label}</div>
                              <textarea
                                value={applicationForm[key as keyof TalentApplicationForm]}
                                onChange={(event) => setApplicationForm((current) => ({ ...current, [key]: event.target.value }))}
                                rows={key === "additionalNotes" ? 3 : 2}
                                className="mt-2 w-full rounded-2xl border border-[#d9d2c7] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
                              />
                            </label>
                          ))}
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setApplyingTaskId("");
                                setApplicationForm({
                                  selfIntroduction: "",
                                  relevantExperience: "",
                                  availability: "",
                                  portfolioNote: "",
                                  additionalNotes: "",
                                });
                              }}
                              className="rounded-full border border-[#d7cec0] bg-[#f8f4ea] px-4 py-2 text-sm font-semibold text-[#4b5563]"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSubmitApplication(selectedTask.id)}
                              className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white"
                            >
                              Submit Application
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : taskPanelMode === "brief" ? (
                      <div className="max-w-[920px] space-y-5">
                        <SectionHeading label="Task Brief" subtitle="Review the full business context before applying." />
                        <div className="rounded-2xl border border-[#eadfcd] bg-white px-4 py-3 text-sm font-semibold text-[#111827]">
                          Application Status: {talentApplications[selectedTask.id] || "Not Applied"}
                        </div>
                        <div className="space-y-4">
                          {[
                            ["Project Background", selectedTask.projectBackground],
                            ["Work Scope", selectedTask.workScope],
                            ["Language Requirement", selectedTask.languageRequirement],
                            ["Skill Requirement", selectedTask.skillRequirement],
                            ["Workload", selectedTask.workload],
                            ["Timeline", selectedTask.timeline],
                            ["Payment Note", selectedTask.paymentNote],
                            ["Application Requirement", selectedTask.applicationRequirement],
                            ["Materials to Submit", selectedTask.materialsToSubmit],
                            ["Notes", selectedTask.notes],
                            ["Owner Contact", selectedTask.ownerContact],
                          ].map(([label, value]) => (
                            <section key={label} className="rounded-2xl border border-[#eadfcd] bg-white p-5">
                              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#1f5c43]">{label}</div>
                              <p className="mt-2 text-sm leading-7 text-[#4b5563]">{value}</p>
                            </section>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {talentApplications[selectedTask.id] === "Approved" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab("communication-hub");
                                showWorkbenchNotice("info", `Project group opened for ${selectedTask.taskName}.`);
                              }}
                              className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white"
                            >
                              Go to Project Group
                            </button>
                          ) : talentApplications[selectedTask.id] ? (
                            <button
                              type="button"
                              className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white"
                            >
                              View Application
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setApplyingTaskId(selectedTask.id)}
                              className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white"
                            >
                              Apply
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setTaskPanelMode("details")}
                            className="rounded-full border border-[#d7cec0] bg-[#f8f4ea] px-4 py-2 text-sm font-semibold text-[#4b5563]"
                          >
                            Back to Summary
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-[920px]">
                        <SectionHeading label="Application Status" subtitle="Open the full brief or submit your application." />
                        <div className="rounded-2xl border border-[#eadfcd] bg-white px-4 py-3 text-sm font-semibold text-[#111827]">
                          {talentApplications[selectedTask.id] === "Approved" ? "Approved" : talentApplications[selectedTask.id] ? "Applied" : "Not Applied"}
                        </div>
                        <div className="mt-5">
                          <SectionHeading label="Application List" subtitle="People who have applied for this task." />
                          <div className="mt-3 space-y-3">
                            {normalizedApplicantsForSelectedTask.length ? normalizedApplicantsForSelectedTask.map((applicant) => (
                              <div key={applicant.id} className="rounded-2xl border border-[#eadfcd] bg-white p-3">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="flex min-w-0 items-start gap-3">
                                    <Avatar name={applicant.name} seed={applicant.id} size="sm" />
                                    <div className="min-w-0">
                                      <div className="font-semibold text-[#111827]">{applicant.name}</div>
                                      <div className="mt-1 text-sm text-[#6b7280]">
                                        Native: {applicant.language} · Skill: {applicant.skill}
                                        {applicant.level ? ` · ${applicant.level}` : ""}
                                      </div>
                                    </div>
                                  </div>
                                  <Badge className={applicant.status === "Approved" ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]"}>
                                    {applicant.status}
                                  </Badge>
                                </div>
                              </div>
                            )) : (
                              <div className="rounded-2xl border border-dashed border-[#d7cec0] bg-white px-4 py-8 text-center text-sm text-[#6b7280]">
                                No applications for this task yet.
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setTaskPanelMode("brief");
                              showWorkbenchNotice("info", `Viewing full task brief for ${selectedTask.taskName}.`);
                            }}
                            className="rounded-full border border-[#d7cec0] bg-[#f8f4ea] px-4 py-2 text-sm font-semibold text-[#4b5563]"
                          >
                            View Full Brief
                          </button>
                          {talentApplications[selectedTask.id] === "Approved" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab("communication-hub");
                                showWorkbenchNotice("info", `Project group opened for ${selectedTask.taskName}.`);
                              }}
                              className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white"
                            >
                              Go to Project Group
                            </button>
                          ) : talentApplications[selectedTask.id] ? (
                            <button
                              type="button"
                              className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white"
                            >
                              View Application
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setApplyingTaskId(selectedTask.id)}
                              className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </aside>
        </section>
        ) : null}

        {!activeTabBlocked && activeTab === "personal-center" ? (
        <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-5 shadow-[0_12px_28px_rgba(31,41,51,0.06)] lg:col-span-2">
              <SectionHeading label="Talent Basic Info" subtitle="Personal profile details and task participation summary." />
              <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(280px,340px)_1fr]">
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => talentAvatarInputRef.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setTalentAvatarDragActive(true);
                    }}
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setTalentAvatarDragActive(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setTalentAvatarDragActive(false);
                    }}
                    onDrop={(event: DragEvent<HTMLButtonElement>) => {
                      event.preventDefault();
                      setTalentAvatarDragActive(false);
                      handleTalentAvatarFileSelect(event.dataTransfer.files);
                    }}
                    className={`group flex w-full flex-col items-center rounded-2xl border-2 border-dashed px-5 py-6 text-center transition ${
                      talentAvatarDragActive
                        ? "border-[#1f5c43] bg-[#eff8f1]"
                        : "border-[#d7dccf] bg-[#fffdf8] hover:border-[#1f5c43] hover:bg-[#f7fbf8]"
                    }`}
                  >
                    <ProfilePhoto
                      name={currentTalentName}
                      avatarUrl={currentTalentAvatarUrl}
                      failed={Boolean(currentTalentAvatarUrl && failedTalentAvatarUrl === currentTalentAvatarUrl)}
                      onError={() => setFailedTalentAvatarUrl(currentTalentAvatarUrl)}
                    />
                    <div className="mt-4 text-xl font-black text-[#111827]">{currentTalentName}</div>
                    <div className="mt-1 text-sm text-[#6f6256]">
                      Talent · {displayValue(currentTalentStatus)}
                    </div>
                    <div className="mt-3 text-sm font-semibold text-[#1f5c43]">
                      Drag image here or click to upload
                    </div>
                    <div className="mt-1 text-xs text-[#6f6256]">PNG, JPG, WEBP, GIF up to 5MB</div>
                  </button>
                  <input
                    ref={talentAvatarInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(event) => handleTalentAvatarFileSelect(event.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => talentAvatarInputRef.current?.click()}
                    className="w-full rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Upload Photo
                  </button>
                  {talentAvatarStatus ? <p className="text-sm font-medium text-[#1f5c43]">{talentAvatarStatus}</p> : null}
                  {talentAvatarError ? <p className="text-sm font-medium text-[#b42318]">{talentAvatarError}</p> : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    ["Name", currentTalentName],
                    ["Native Language", currentTalentProfile?.nativeLanguage || currentTalentConversation?.nativeLanguage],
                    ["Second Language", currentTalentProfile?.secondLanguage || currentTalentConversation?.secondLanguage],
                    ["Main Skill", currentTalentProfile?.mainSkill || currentTalentConversation?.skill],
                    ["Daily Availability", currentTalentProfile?.dailyAvailability],
                    ["Weekend Availability", currentTalentProfile?.weekendAvailability],
                    ["Status", currentTalentStatus],
                    ["Active Tasks", currentTalentActiveTasks],
                    ["Last Updated", currentTalentLastUpdated],
                  ].map(([label, value]) => (
                    <div key={label as string} className="rounded-xl border border-[#d7dccf] bg-[#fffdf8] p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                        {label}
                      </div>
                      <div className="mt-2 break-words text-base font-semibold text-[#111827]">{displayValue(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          <div className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-5 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
            <>
                <SectionHeading label="My Applied Tasks" subtitle="Applications submitted from your talent workspace." />
                <div className="mt-4 space-y-2">
                  {talentAppliedTasks.length ? (
                    talentAppliedTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#eadfcd] bg-white px-4 py-3 text-sm">
                        <span className="font-semibold text-[#111827]">{task.taskName}</span>
                        <Badge className="border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]">{talentApplications[task.id]}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-[#eadfcd] bg-white px-4 py-3 text-sm text-[#6b7280]">No applications submitted yet.</div>
                  )}
                </div>
              </>
          </div>

          <div className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-5 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
            <SectionHeading label="My Tasks" subtitle="Approved project tasks and joined project work appear here." />
            <div className="mt-4 space-y-2">
              {talentApprovedTasks.length ? (
                talentApprovedTasks.map((task) => (
                  <div key={task.id} className="rounded-2xl border border-[#eadfcd] bg-white px-4 py-3 text-sm font-semibold text-[#111827]">
                    {task.taskName}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-[#eadfcd] bg-white px-4 py-3 text-sm text-[#6b7280]">No approved active projects yet.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-5 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
            <>
                <SectionHeading label="My Recent Messages" subtitle="Recent task updates and project manager communication." />
                <div className="mt-4 space-y-2">
                  {(currentTalentConversation?.messages || []).slice(-3).reverse().map((message) => (
                    <div key={message.id} className="rounded-2xl border border-[#eadfcd] bg-white px-4 py-3 text-sm text-[#4b5563]">
                      <div className="font-semibold text-[#111827]">{message.sender}</div>
                      <div className="mt-1 line-clamp-2">{message.text}</div>
                      <div className="mt-1 text-xs text-[#8a8177]">{message.timestamp}</div>
                    </div>
                  ))}
                </div>
              </>
          </div>
        </section>
        ) : null}

        {!activeTabBlocked && activeTab === "communication-hub" ? (
        <div className="mb-16 flex min-h-0 flex-1 flex-col gap-5">
          <section className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-5 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
            <SectionHeading
              label={activeView === "manager" ? "Communication Hub" : "My Communication Access"}
              subtitle={
                activeView === "manager"
                  ? "Coordinate task-related conversations with talents, project groups, and language groups."
                  : "Your assigned PMs, responsible HRs, and approved project groups."
              }
            />
            <div className="grid gap-3 lg:grid-cols-3">
              {activeView === "manager" ? (
                <>
                  {renderAccessSection("Project Groups", managerProjectGroupAccess, 2, "project-groups")}
                  {renderAccessSection("Direct Messages", managerDirectMessageAccess, 2, "direct-messages")}
                  {renderAccessSection("Language Groups", managerLanguageGroupAccess, 2, "language-groups")}
                </>
              ) : (
                <>
                  {renderAccessSection("My PMs", talentPmAccess, 2, "my-pms")}
                  {renderAccessSection("My HRs", talentHrAccess, 2, "my-hrs")}
                  {renderAccessSection("My Project Groups", talentProjectGroupAccess, 2, "my-project-groups")}
                </>
              )}
                </div>
          </section>
        <section className="grid h-[980px] min-h-[980px] gap-5 xl:grid-cols-[330px_minmax(0,1fr)_360px]">
          <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
            <div className="border-b border-[#eadfcd] p-4">
              <SectionHeading
                label={activeView === "manager" ? "Task-related Conversations" : "My Conversations"}
                subtitle={
                  activeView === "manager"
                    ? "Communication Hub for task, project group, language group, and personal coordination."
                    : "Assigned PM, responsible HR, and joined project group only."
                }
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations"
                className="mt-3 w-full rounded-2xl border border-[#d9d2c7] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {activeView === "manager"
                  ? (["All", "Management", "HR", "Talent Pool", "Groups"] as ConversationFilter[]).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleFilter(item)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          filter === item
                            ? "border-[#1f5c43] bg-[#1f5c43] text-white"
                            : "border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256] hover:border-[#1f5c43] hover:text-[#1f5c43]"
                        }`}
                      >
                        {item}
                      </button>
                    ))
                  : (["All", "PM", "HR", "Project Group"] as TalentCommunicationFilter[]).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setTalentCommunicationFilter(item)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          talentCommunicationFilter === item
                            ? "border-[#1f5c43] bg-[#1f5c43] text-white"
                            : "border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256] hover:border-[#1f5c43] hover:text-[#1f5c43]"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
              </div>
            </div>

            <div className="scroll-panel flex-1 p-2">
              <div className="space-y-1.5">
                {activeView === "manager" ? visibleConversations.map((conversation) => {
                  const active = conversation.id === selectedConversation?.id;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className={`flex w-full items-start gap-3 rounded-xl border border-[#e5ddcf] border-l-4 px-3 py-2 text-left transition ${
                        conversationListTone(conversation)
                      } ${
                        active
                          ? "border-[#cfe8d9] border-l-[#1f5c43] bg-[#eef7f0] shadow-[0_10px_20px_rgba(31,92,67,0.12)]"
                          : "shadow-none"
                      }`}
                    >
                      <Avatar name={conversation.name} seed={conversation.avatarSeed} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-[14px] font-semibold leading-5 text-[#111827]">{conversation.name}</div>
                          </div>
                          <div className="shrink-0 text-[11px] font-medium text-[#8a8177]">
                            {conversation.lastMessageTime}
                          </div>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1 truncate text-[12px] leading-5 text-[#6b7280]">
                            {conversation.lastMessage}
                          </div>
                          {conversation.unreadCount ? (
                            <span className="shrink-0 rounded-full bg-[#1f5c43] px-2 py-0.5 text-[11px] font-semibold text-white">
                              {conversation.unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                }) : visibleTalentCommunicationConversations.map((conversation) => {
                  const active = conversation.id === selectedTalentCommunication?.id;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setSelectedTalentCommunicationId(conversation.id)}
                      className={`flex w-full items-start gap-3 rounded-xl border border-[#e5ddcf] border-l-4 px-3 py-2 text-left transition ${
                        active
                          ? "border-[#cfe8d9] border-l-[#1f5c43] bg-[#eef7f0] shadow-[0_10px_20px_rgba(31,92,67,0.12)]"
                          : "border-l-[#d89a54] bg-[#fffaf4] hover:bg-[#fff6ec]"
                      }`}
                    >
                      <Avatar name={conversation.name} seed={conversation.avatarSeed} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-[14px] font-semibold leading-5 text-[#111827]">{conversation.name}</div>
                            <div className="mt-0.5 truncate text-[12px] leading-5 text-[#6b7280]">
                              {conversation.roleLabel} · {conversation.projectName}
                            </div>
                          </div>
                          <div className="shrink-0 text-[11px] font-medium text-[#8a8177]">
                            {conversation.lastMessageTime}
                          </div>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1 truncate text-[12px] leading-5 text-[#6b7280]">
                            {conversation.lastMessage}
                          </div>
                          {conversation.unreadCount ? (
                            <span className="shrink-0 rounded-full bg-[#1f5c43] px-2 py-0.5 text-[11px] font-semibold text-white">
                              {conversation.unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e4d7c6] bg-[#fcfbf7] shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
            <div className="border-b border-[#eadfcd] px-5 py-4">
              {communicationIsGroup ? (
                <div className="flex min-h-10 items-center justify-between gap-4">
                  <div className="min-w-0 truncate text-lg font-semibold text-[#111827]">{communicationTitle}</div>
                  {activeView === "manager" && selectedConversation?.kind === "group" ? (
                    <button
                      type="button"
                      aria-label={`Open group settings for ${selectedConversation.name}`}
                      title="Group settings"
                      onClick={() => {
                        setIsGroupSettingsOpen(true);
                        setGroupSettingsSearch("");
                        setGroupActionMemberName("");
                      }}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-transparent bg-transparent text-xl font-bold leading-none text-[#374151] transition hover:bg-[#eee7da] hover:text-[#1f5c43] focus:outline-none focus:ring-2 focus:ring-[#1f5c43]/20"
                    >
                      <span aria-hidden="true" className="-mt-1">...</span>
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-lg font-semibold text-[#111827]">{communicationTitle}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6b7280]">
                      {activeView === "manager" ? (
                        <Badge className={selectedConversation ? typeBadge(selectedConversation.kind, selectedConversation.kind === "platform" ? selectedConversation.role : undefined) : "border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]"}>
                          {selectedConversation?.kind === "platform"
                            ? selectedConversation.role
                            : selectedConversation?.kind === "talent"
                              ? "Talent"
                              : "Group"}
                        </Badge>
                      ) : selectedTalentCommunication ? (
                        <Badge className="border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]">{selectedTalentCommunication.kind}</Badge>
                      ) : null}
                      {activeView === "manager" && selectedConversation?.kind === "talent" ? (
                        <>
                          <Badge className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">{selectedConversation.profileStatus}</Badge>
                          <Badge className={selectedConversation.online ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#cbd5e1] bg-[#f1f5f9] text-[#64748b]"}>
                            {selectedConversation.online ? "Online" : "Offline"}
                          </Badge>
                        </>
                      ) : null}
                      {activeView === "manager" && selectedConversation?.kind === "platform" ? (
                        <>
                          <Badge className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">{selectedConversation.department}</Badge>
                          <Badge className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">{selectedConversation.status ?? currentUser.status}</Badge>
                        </>
                      ) : null}
                    </div>
                    <div className="mt-2 text-sm text-[#6b7280]">{communicationHeaderMeta}</div>
                  </div>
                  <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
                    {activeView === "manager" ? (
                      <Badge className={selectedConversation ? typeBadge(selectedConversation.kind, selectedConversation.kind === "platform" ? selectedConversation.role : undefined) : "border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]"}>
                        {selectedConversation?.kind === "platform"
                          ? selectedConversation.role
                          : selectedConversation?.kind === "talent"
                            ? "Talent"
                            : "Group"}
                      </Badge>
                    ) : (
                      <Badge className="border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]">Project Access Only</Badge>
                    )}
                    <Badge className={communicationCanHistory ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#f5c2c7] bg-[#fdecec] text-[#b42318]"}>
                      {communicationCanHistory ? "History Allowed" : "History Blocked"}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            <div className="scroll-panel flex-1 px-5 py-5">
              {communicationCanHistory && communicationMessages.length ? (
                <div className="space-y-4">
                  {communicationMessages.map((message) => {
                    if (message.align === "center" || message.kind === "system") {
                      return (
                        <div key={message.id} className="flex justify-center">
                          {renderMessage(message)}
                        </div>
                      );
                    }

                    const isSelf = message.align === "right";
                    return (
                      <div key={message.id} className={`flex gap-3 ${isSelf ? "flex-row-reverse" : "flex-row"}`}>
                        <div className="pt-1">
                          <Avatar name={message.sender} seed={message.sender} size="sm" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`mb-1 flex items-center gap-2 text-xs ${isSelf ? "justify-end" : "justify-start"}`}>
                            <span className="font-semibold text-[#111827]">{message.sender}</span>
                            {message.roleLabel ? (
                              <span className="rounded-full border border-[#d7cec0] bg-[#f8f4ea] px-2 py-0.5 font-semibold text-[#6f6256]">
                                {message.roleLabel}
                              </span>
                            ) : null}
                            <span className="text-[#8b8b8b]">{message.timestamp}</span>
                          </div>
                          <div className={isSelf ? "ml-auto max-w-[82%]" : "max-w-[82%]"}>{renderMessage(message)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-[#f2d1d1] bg-[#fff5f5] px-6 py-10 text-center text-sm text-[#9a3412]">
                  Messaging is blocked by current permission settings.
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-[#eadfcd] bg-[#fcfbf7] px-5 py-4">
              <div className="rounded-2xl border border-[#e2d8c8] bg-[#fbfaf6] p-4 shadow-[0_10px_20px_rgba(31,41,51,0.04)]">
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#6f6256]">
                  <Badge className={communicationCanHistory ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#f5c2c7] bg-[#fdecec] text-[#b42318]"}>
                    {communicationCanHistory ? "Chat history allowed" : "Chat history blocked"}
                  </Badge>
                  <Badge className={communicationCanSend ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#f5c2c7] bg-[#fdecec] text-[#b42318]"}>
                    {communicationCanSend ? "Message allowed" : "Message blocked"}
                  </Badge>
                  <Badge className={communicationCanFile ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#f5c2c7] bg-[#fdecec] text-[#b42318]"}>
                    {communicationCanFile ? "File allowed" : "File blocked"}
                  </Badge>
                  {activeView === "manager" ? (
                    <Badge className={selectedCanVideo ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#f5c2c7] bg-[#fdecec] text-[#b42318]"}>
                      {selectedCanVideo ? "Video allowed" : "Video blocked"}
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-3">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    disabled={!communicationCanSend}
                    placeholder={blockedReason || "Write a message to the selected conversation..."}
                    className="min-h-[108px] w-full resize-none rounded-2xl border border-[#d9d2c7] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc] disabled:cursor-not-allowed disabled:bg-[#f5f5f4]"
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!communicationCanSend}
                    onClick={activeView === "manager" ? handleSend : handleTalentSend}
                    className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_18px_rgba(31,92,67,0.18)] transition hover:bg-[#184d38] disabled:cursor-not-allowed disabled:border-[#cbd5e1] disabled:bg-[#94a3b8]"
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    disabled={!communicationCanFile}
                    onClick={() => handleQuickAttachment("attachment")}
                    className="rounded-full border border-[#d7cec0] bg-white px-4 py-2 text-sm font-semibold text-[#4b5563] transition hover:border-[#1f5c43] hover:text-[#1f5c43] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Attach File
                  </button>
                  {activeView === "manager" ? (
                    <>
                      <button
                        type="button"
                        disabled={!selectedCanVideo}
                        onClick={() => handleQuickAttachment("video")}
                        className="rounded-full border border-[#d7cec0] bg-white px-4 py-2 text-sm font-semibold text-[#4b5563] transition hover:border-[#1f5c43] hover:text-[#1f5c43] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Attach Video
                      </button>
                      <button
                        type="button"
                        disabled={!selectedCanCreateGroup}
                        onClick={() => setIsCreateGroupOpen(true)}
                        className="rounded-full border border-[#d7cec0] bg-white px-4 py-2 text-sm font-semibold text-[#4b5563] transition hover:border-[#1f5c43] hover:text-[#1f5c43] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        New Group
                      </button>
                    </>
                  ) : null}
                </div>

                {!communicationCanSend ? (
                  <div className="mt-3 rounded-2xl border border-[#f2d1d1] bg-[#fff5f5] px-4 py-3 text-sm text-[#9a3412]">
                    {blockedReason}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <aside className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="scroll-panel h-full rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-4 pb-6 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
              <SectionHeading
                label="Conversation Details"
                subtitle="Basic profile or group context for the selected conversation."
              />

              {activeView === "talent" && selectedTalentCommunication?.kind === "Project Group"
                ? renderGroupDetails()
                : activeView === "manager" && selectedConversation?.kind === "group"
                  ? renderGroupDetails()
                  : renderPersonDetails()}

              <div className="hidden" aria-hidden="true">
              {activeView === "talent" && selectedTalentCommunication ? (
                <>
                  <div className="flex items-start gap-3">
                    {selectedTalentCommunication.avatarUrl ? (
                      <ProfilePhoto name={selectedTalentCommunication.name} avatarUrl={selectedTalentCommunication.avatarUrl} sizeClass="h-16 w-16 text-lg" />
                    ) : (
                      <Avatar name={selectedTalentCommunication.name} seed={selectedTalentCommunication.avatarSeed} size="lg" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-semibold text-[#111827]">{selectedTalentCommunication.name}</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge className="border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]">{selectedTalentCommunication.kind}</Badge>
                        <Badge className={selectedTalentCommunication.online ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#cbd5e1] bg-[#f1f5f9] text-[#64748b]"}>
                          {selectedTalentCommunication.online ? "Online" : "Offline"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    {selectedTalentCommunication.kind === "Project Group" ? (
                      <>
                        <InfoRow label="Group Name" value={selectedTalentCommunication.name} />
                        <InfoRow label="Type" value="Project Group" />
                        <InfoRow label="Project Name" value={displayValue(selectedTalentCommunication.projectName)} />
                        <InfoRow label="Member Scope" value={displayValue(selectedTalentCommunication.memberScope)} />
                        <InfoRow label="Current Talent Access" value={displayValue(selectedTalentCommunication.currentTalentAccess)} />
                        <InfoRow label="Unread Count" value={String(selectedTalentCommunication.unreadCount)} />
                      </>
                    ) : (
                      <>
                        <InfoRow label="Role / Position" value={selectedTalentCommunication.roleLabel} />
                        <InfoRow label="Level" value={displayValue(selectedTalentCommunication.level)} />
                        <InfoRow label="Projects Completed" value={`${selectedTalentCommunication.completedProjects ?? 0} projects`} />
                        <InfoRow label="Online Status" value={selectedTalentCommunication.online ? "Online" : "Offline"} />
                        <InfoRow label="Relationship" value={displayValue(selectedTalentCommunication.relationship)} />
                      </>
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl border border-[#b7dfca] bg-[#edf8f1] px-3 py-2 text-sm font-medium text-[#1f5c43]">
                    Access: Assigned PM, responsible HR, and joined project groups only.
                  </div>
                </>
              ) : selectedConversation?.kind === "talent" ? (
                <>
                  <div className="flex items-start gap-3">
                    {selectedConversation.avatarUrl ? (
                      <ProfilePhoto name={selectedConversation.name} avatarUrl={selectedConversation.avatarUrl} sizeClass="h-16 w-16 text-lg" />
                    ) : (
                      <Avatar name={selectedConversation.name} seed={selectedConversation.avatarSeed} size="lg" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-semibold text-[#111827]">{selectedConversation.name}</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge className="border-[#c46a1c] bg-[#fff2df] text-[#b45309]">Talent</Badge>
                        <Badge className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">{selectedConversation.profileStatus}</Badge>
                        <Badge className={selectedConversation.online ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#cbd5e1] bg-[#f1f5f9] text-[#64748b]"}>
                          {selectedConversation.online ? "Online" : "Offline"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <InfoRow label="Name" value={selectedConversation.name} />
                    <InfoRow label="Role" value="Talent" />
                    <InfoRow label="Level" value={managerTalentLevel(selectedConversation)} />
                    <InfoRow label="Projects Completed" value={`${managerTalentProjectsCompleted(selectedConversation)} projects`} />
                    <InfoRow label="Talent ID" value={selectedConversation.talentId} />
                    <InfoRow label="Native Language" value={displayValue(selectedConversation.nativeLanguage)} />
                    <InfoRow label="Second Language" value={displayValue(selectedConversation.secondLanguage)} />
                    <InfoRow label="Skill" value={displayValue(selectedConversation.skill)} />
                    <InfoRow label="Education" value={displayValue(selectedConversation.education)} />
                    <InfoRow label="Professional Domain" value={displayValue(selectedConversation.professionalDomain)} />
                    <InfoRow label="Assigned HR" value={displayValue(selectedConversation.assignedHr)} />
                    <InfoRow label="Related Projects" value={displayValue(selectedConversation.relatedProjects.join(", "))} />
                    <InfoRow label="Availability" value={selectedConversation.online ? "Available now" : "Scheduled availability"} />
                    <InfoRow label="Profile Status" value={selectedConversation.profileStatus} />
                    <InfoRow label="Upwork Chat URL" value={displayValue(selectedConversation.upworkChatUrl)} />
                    <InfoRow label="Upwork Profile URL" value={displayValue(selectedConversation.upworkProfileUrl)} />
                    <InfoRow label="Last Active" value={selectedConversation.lastContactTime} />
                  </div>

                  <div className="mt-4 grid gap-2">
                    <button type="button" className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_18px_rgba(31,92,67,0.18)]">
                      Open Talent Profile
                    </button>
                    <button type="button" className="rounded-full border border-[#d7cec0] bg-white px-4 py-2 text-sm font-semibold text-[#4b5563]">
                      Open Upwork Chat
                    </button>
                    <button type="button" className="rounded-full border border-[#d7cec0] bg-white px-4 py-2 text-sm font-semibold text-[#4b5563]">
                      View in Talent Museum
                    </button>
                  </div>
                </>
              ) : selectedConversation?.kind === "group" ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#d7cec0] bg-[#f7f1e5] text-lg font-bold text-[#6f6256]">
                      {initials(selectedConversation.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-semibold text-[#111827]">{selectedConversation.name}</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">{selectedConversation.groupType}</Badge>
                        <Badge className="border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]">{`${selectedConversation.memberCount} members`}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <InfoRow label="Group Type" value={selectedConversation.groupType} />
                    <InfoRow
                      label="Related Project / Language"
                      value={displayValue(selectedConversation.relatedProject ?? selectedConversation.relatedLanguage)}
                    />
                    <InfoRow label="Members Count" value={`${selectedConversation.memberCount} members`} />
                    <InfoRow label="Owner" value={selectedConversation.owner} />
                    <InfoRow
                      label="Access Scope"
                      value={displayValue(selectedConversation.permissionsSummary)}
                    />
                    <InfoRow label="Last Activity" value={selectedConversation.lastMessageTime} />
                  </div>

                  <div className="mt-4 rounded-2xl border border-[#eadfcd] bg-white p-3">
                    <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#1f5c43]">Members</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedConversation.members.map((member) => (
                        <Badge key={member} className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">
                          {member}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              ) : selectedConversation ? (
                <>
                  <div className="flex items-start gap-3">
                    <Avatar name={selectedConversation.name} seed={selectedConversation.avatarSeed} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-semibold text-[#111827]">{selectedConversation.name}</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge className={selectedConversation.role === "Super Admin" ? "border-[#b38f2d] bg-[#fff4d5] text-[#946200]" : selectedConversation.role === "Executive" ? "border-[#7c3aed] bg-[#f3e8ff] text-[#6d28d9]" : "border-[#2563eb] bg-[#dbeafe] text-[#1d4ed8]"}>
                          {selectedConversation.role}
                        </Badge>
                        <Badge className={selectedConversation.online ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#cbd5e1] bg-[#f1f5f9] text-[#64748b]"}>
                          {selectedConversation.online ? "Online" : "Offline"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    {selectedConversation.role === "HR User" ? (
                      <>
                        <InfoRow label="Name" value={selectedConversation.name} />
                        <InfoRow label="Role" value="HR" />
                        <InfoRow label="Level" value={platformUserLevel(selectedConversation)} />
                        <InfoRow label="Assigned Tasks" value={platformUserWorkload(selectedConversation).assignedTasks ?? "0"} />
                        <InfoRow label="Assigned Languages" value={platformUserWorkload(selectedConversation).assignedLanguages ?? "Not set"} />
                        <InfoRow label="Pending Reviews" value={platformUserWorkload(selectedConversation).pendingReviews ?? "0"} />
                        <InfoRow label="Accepted Profiles" value={platformUserWorkload(selectedConversation).acceptedProfiles ?? "0"} />
                        <InfoRow label="Active Projects" value={platformUserWorkload(selectedConversation).activeProjects ?? "Not set"} />
                        <InfoRow label="Last Active" value={selectedConversation.lastActive} />
                      </>
                    ) : (
                      <>
                        <InfoRow label="Name" value={selectedConversation.name} />
                        <InfoRow label="Role / Position" value={selectedConversation.role === "Super Admin" ? "Project Manager" : selectedConversation.role} />
                        <InfoRow label="Level" value={platformUserLevel(selectedConversation)} />
                        <InfoRow label="Managed Projects" value={platformUserWorkload(selectedConversation).managedProjects ?? "Not set"} />
                        <InfoRow label="Managed Languages" value={platformUserWorkload(selectedConversation).managedLanguages ?? "Not set"} />
                        <InfoRow label="Team / Department" value={platformUserWorkload(selectedConversation).team ?? selectedConversation.department} />
                        <InfoRow label="Permissions Summary" value={selectedConversation.permissionsSummary} />
                        <InfoRow label="Last Active" value={selectedConversation.lastActive} />
                      </>
                    )}
                  </div>
                </>
              ) : null}
              {activeView === "manager" ? (
                <div className="mt-4 rounded-2xl border border-[#eadfcd] bg-white p-3">
                  <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#1f5c43]">Manager Permissions Summary</div>
                  <div className="mt-3 space-y-2">
                    {[
                      "Can message HRs and talents",
                      "Can manage project groups",
                      "Can access language group conversations",
                      "Can create groups",
                    ].map((item) => (
                      <div key={item} className="rounded-xl border border-[#e4d7c6] bg-[#fbfaf6] px-3 py-2 text-sm text-[#4b5563]">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              </div>
            </div>

            {false && activeView === "manager" ? (
            <div className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-4 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
              <SectionHeading label="Communication Permissions" subtitle="Review message, file, group, and history access." />

              <div className="space-y-3">
                <label className="block rounded-2xl border border-[#eadfcd] bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Current Platform User</div>
                  <select
                    value={currentUserId}
                    onChange={(event) => {
                      const nextUser = PLATFORM_USERS.find((item) => item.id === event.target.value) ?? PLATFORM_USERS[2];
                      setCurrentUserId(nextUser.id);
                      setPermissionConfig(ROLE_DEFAULTS[nextUser.role]);
                    }}
                    className="mt-2 w-full rounded-xl border border-[#d9d2c7] bg-[#fbfaf6] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
                  >
                    {PLATFORM_USERS.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge className={currentUser.role === "Super Admin" ? "border-[#b38f2d] bg-[#fff4d5] text-[#946200]" : currentUser.role === "Executive" ? "border-[#7c3aed] bg-[#f3e8ff] text-[#6d28d9]" : "border-[#2563eb] bg-[#dbeafe] text-[#1d4ed8]"}>
                      {currentUser.role}
                    </Badge>
                    <Badge className={currentUser.status === "Active" ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]"}>
                      {currentUser.status}
                    </Badge>
                  </div>
                </label>

                <div className="grid grid-cols-1 gap-2">
                  {permissionRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between rounded-2xl border border-[#eadfcd] bg-white px-3 py-2">
                      <div className="text-sm text-[#334155]">{row.label}</div>
                      <Badge className={row.value ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#f5c2c7] bg-[#fdecec] text-[#b42318]"}>
                        {row.value ? "Allowed" : "Blocked"}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-[#eadfcd] bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Permission Toggles</div>
                  <div className="mt-3 space-y-2 text-sm">
                    {[
                      ["allowHrOnlyAssignedTalents", "Allow HR to message only assigned talents"],
                      ["allowHrDirectChat", "Allow HR-to-talent direct chat"],
                      ["allowHrMessageUnassignedTalents", "Allow HR to message unassigned talents"],
                      ["allowExecutiveMessageTalents", "Allow Executive to message talents"],
                      ["allowHrCreateGroups", "Allow HR to create groups"],
                      ["allowHrSendFiles", "Allow HR to send files"],
                      ["allowHrSendVideos", "Allow HR to send videos"],
                      ["allowGroupMembersChatFreely", "Allow group members to chat freely"],
                      ["restrictDirectTalentCommunicationToSuperAdminAndAssignedHrOnly", "Restrict direct talent communication to Super Admin and assigned HR only"],
                    ].map(([key, label]) => {
                      const typedKey = key as keyof PermissionConfig;
                      return (
                        <label key={key} className="flex items-start gap-3 rounded-2xl border border-[#eadfcd] px-3 py-2">
                          <input
                            type="checkbox"
                            checked={permissionConfig[typedKey]}
                            onChange={(event) => setPermissionConfig((prev) => ({ ...prev, [typedKey]: event.target.checked }))}
                            className="mt-1 h-4 w-4 rounded border-[#c8bba8] text-[#1f5c43] focus:ring-[#1f5c43]"
                          />
                          <span className="text-[#334155]">{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#eadfcd] bg-[#f8f4ea] p-3 text-sm text-[#5f513f]">
                  All messaging permissions are currently open for testing. Role-based restrictions will be added later.
                </div>

                <div className="rounded-2xl border border-[#eadfcd] bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Selected Conversation Permissions</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    {permissionRows.map((row) => (
                      <div
                        key={`summary-${row.label}`}
                        className={`rounded-2xl border px-3 py-2 ${
                          row.value ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#f5c2c7] bg-[#fdecec] text-[#b42318]"
                        }`}
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">{row.label}</div>
                        <div className="mt-1 text-sm font-semibold">{row.value ? "Allowed" : "Blocked"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            ) : null}

            {false && activeView === "manager" ? (
            <div className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-4 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
              <SectionHeading label="Create Group" subtitle="Group creation opens in a modal so this rail stays compact." />
              <div className="rounded-2xl border border-[#eadfcd] bg-white px-3 py-3 text-sm text-[#6b7280]">
                Use New Group when you need to configure members, access, and sharing options.
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(true)}
                  className="w-full rounded-full border border-[#1f5c43] bg-[#1f5c43] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_18px_rgba(31,92,67,0.18)] transition hover:bg-[#184d38]"
                >
                  New Group
                </button>
              </div>
            </div>
            ) : null}
          </aside>
        </section>
        </div>
        ) : null}
      </div>

      {isCreateTaskOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/40 px-4 py-8">
          <div className="scroll-panel max-h-[90vh] w-full max-w-2xl rounded-3xl border border-[#e4d7c6] bg-[#fbfaf6] p-6 shadow-[0_24px_60px_rgba(17,24,39,0.25)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-semibold text-[#111827]">Create Recruiting Task</div>
                <div className="mt-1 text-sm text-[#6b7280]">Create a recruiting task for the current Talent Hub workspace.</div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateTaskOpen(false)}
                className="rounded-full border border-[#d7cec0] bg-white px-3 py-1.5 text-sm font-semibold text-[#4b5563]"
              >
                Close
              </button>
            </div>

            {workbenchNotice?.message === "Please enter a task name." ? (
              <div className="mt-4 rounded-2xl border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#b42318]">
                {workbenchNotice.message}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["taskName", "Task Name"],
                ["language", "Language"],
                ["targetTalent", "Target Talent"],
                ["deadline", "Deadline"],
                ["owner", "Owner"],
              ].map(([key, label]) => (
                <label key={key} className="block">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f6256]">{label}</div>
                  <input
                    value={createTaskForm[key as keyof CreateTaskForm]}
                    onChange={(event) => setCreateTaskForm((current) => ({ ...current, [key]: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-[#d9d2c7] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
                  />
                </label>
              ))}
              <label className="block md:col-span-2">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Description</div>
                <textarea
                  value={createTaskForm.description}
                  onChange={(event) => setCreateTaskForm((current) => ({ ...current, description: event.target.value }))}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-[#d9d2c7] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateTaskOpen(false)}
                className="rounded-full border border-[#d7cec0] bg-white px-4 py-2.5 text-sm font-semibold text-[#4b5563]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateMockTask}
                className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_18px_rgba(31,92,67,0.18)]"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {profileApplicant ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/40 px-4 py-8">
          <div className="w-full max-w-xl rounded-3xl border border-[#e4d7c6] bg-[#fbfaf6] p-6 shadow-[0_24px_60px_rgba(17,24,39,0.25)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-semibold text-[#111827]">Applicant Profile</div>
                <div className="mt-1 text-sm text-[#6b7280]">Applicant details for Task Center review.</div>
              </div>
              <button
                type="button"
                onClick={() => setProfileApplicantId("")}
                className="rounded-full border border-[#d7cec0] bg-white px-3 py-1.5 text-sm font-semibold text-[#4b5563]"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <InfoRow label="Name" value={profileApplicant.name} />
              <InfoRow label="Language" value={profileApplicant.language} />
              <InfoRow label="Skill" value={profileApplicant.skill} />
              <InfoRow label="Status" value={profileApplicant.status} />
              <InfoRow label="Application Summary" value="Candidate is interested in task-based AI data evaluation work." />
              <InfoRow label="Availability" value="3-4 hours/day" />
              <InfoRow label="Resume / Portfolio Note" value="Resume upload will be enabled after storage setup." />
            </div>
          </div>
        </div>
      ) : null}

      {isCreateGroupOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/40 px-4 py-8">
          <div className="scroll-panel max-h-[90vh] w-full max-w-3xl rounded-3xl border border-[#e4d7c6] bg-[#fbfaf6] p-6 shadow-[0_24px_60px_rgba(17,24,39,0.25)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-semibold text-[#111827]">Create Group</div>
                <div className="mt-1 text-sm text-[#6b7280]">Create a project group for Talent Hub collaboration.</div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(false)}
                className="rounded-full border border-[#d7cec0] bg-white px-3 py-1.5 text-sm font-semibold text-[#4b5563]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Group Name</div>
                <input
                  value={groupDraft.groupName}
                  onChange={(event) => setGroupDraft((prev) => ({ ...prev, groupName: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[#d9d2c7] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
                />
              </label>
              <label className="block">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Group Type</div>
                <select
                  value={groupDraft.groupType}
                  onChange={(event) => setGroupDraft((prev) => ({ ...prev, groupType: event.target.value as GroupType }))}
                  className="mt-2 w-full rounded-2xl border border-[#d9d2c7] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
                >
                  <option>Project Group</option>
                  <option>Language Group</option>
                  <option>Custom Group</option>
                </select>
              </label>
              <label className="block">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Group Owner</div>
                <input
                  value={groupDraft.owner}
                  onChange={(event) => setGroupDraft((prev) => ({ ...prev, owner: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[#d9d2c7] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
                />
              </label>
              <label className="block">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Related Project</div>
                <input
                  value={groupDraft.relatedProject}
                  onChange={(event) => setGroupDraft((prev) => ({ ...prev, relatedProject: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[#d9d2c7] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
                />
              </label>
              <label className="block">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Related Language</div>
                <input
                  value={groupDraft.relatedLanguage}
                  onChange={(event) => setGroupDraft((prev) => ({ ...prev, relatedLanguage: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-[#d9d2c7] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
                />
              </label>
              <label className="block md:col-span-2">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Members</div>
                <div className="scroll-panel mt-2 max-h-56 space-y-2 rounded-2xl border border-[#eadfcd] bg-white p-3">
                  {conversations
                    .filter((item): item is TalentConversation => item.kind === "talent")
                    .map((contact) => {
                      const checked = groupDraft.memberIds.includes(contact.id);
                      return (
                        <label key={contact.id} className="flex items-center gap-3 rounded-2xl border border-[#eadfcd] px-3 py-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              setGroupDraft((prev) => ({
                                ...prev,
                                memberIds: event.target.checked
                                  ? [...prev.memberIds, contact.id]
                                  : prev.memberIds.filter((id) => id !== contact.id),
                              }))
                            }
                            className="h-4 w-4 rounded border-[#c8bba8] text-[#1f5c43] focus:ring-[#1f5c43]"
                          />
                          <div className="flex items-center gap-2">
                            <Avatar name={contact.name} seed={contact.avatarSeed} size="sm" />
                            <div>
                              <div className="text-sm font-semibold text-[#111827]">{contact.name}</div>
                              <div className="text-xs text-[#6b7280]">{contact.nativeLanguage} • {contact.assignedHr}</div>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </label>
              <label className="inline-flex items-center gap-2 rounded-2xl border border-[#eadfcd] bg-white px-3 py-2">
                <input
                  type="checkbox"
                  checked={groupDraft.allowFileSharing}
                  onChange={(event) => setGroupDraft((prev) => ({ ...prev, allowFileSharing: event.target.checked }))}
                  className="h-4 w-4 rounded border-[#c8bba8] text-[#1f5c43] focus:ring-[#1f5c43]"
                />
                Allow file sharing
              </label>
              <label className="inline-flex items-center gap-2 rounded-2xl border border-[#eadfcd] bg-white px-3 py-2">
                <input
                  type="checkbox"
                  checked={groupDraft.allowVideoSharing}
                  onChange={(event) => setGroupDraft((prev) => ({ ...prev, allowVideoSharing: event.target.checked }))}
                  className="h-4 w-4 rounded border-[#c8bba8] text-[#1f5c43] focus:ring-[#1f5c43]"
                />
                Allow video sharing
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(false)}
                className="rounded-full border border-[#d7cec0] bg-white px-4 py-2.5 text-sm font-semibold text-[#4b5563]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateGroup}
                className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_18px_rgba(31,92,67,0.18)]"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isGroupSettingsOpen && activeView === "manager" && selectedConversation?.kind === "group" ? (() => {
        const groupKey = `manager:${selectedConversation.id}`;
        const defaultMembers = groupMemberDetails([selectedConversation.owner, ...selectedConversation.members], selectedConversation.memberCount);
        const members = groupMemberOverrides[groupKey] ?? defaultMembers;
        const admins = groupAdminNames[groupKey] ?? (members[0]?.name ? [members[0].name] : []);
        const rule = groupRuleDrafts[groupKey] ?? groupRuleLink(selectedConversation.name);
        const visibleMembers = members.filter((member) =>
          [member.name, member.role, member.level ?? "", member.status ?? ""].join(" ").toLowerCase().includes(groupSettingsSearch.trim().toLowerCase()),
        );
        const selectedActionMember = members.find((member) => normalizeProfileKey(member.name) === normalizeProfileKey(groupActionMemberName));
        const settings = groupSettingToggles[groupKey] ?? {};

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 px-4 py-8"
            onClick={() => {
              setIsGroupSettingsOpen(false);
              setGroupActionMemberName("");
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="group-settings-title"
              onClick={(event) => event.stopPropagation()}
              className="scroll-panel max-h-[calc(100vh-80px)] w-[min(760px,calc(100vw-32px))] rounded-3xl border border-[#e4d7c6] bg-[#fbfaf6] p-6 shadow-[0_24px_70px_rgba(17,24,39,0.28)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div id="group-settings-title" className="text-xl font-semibold text-[#111827]">Group Settings</div>
                  <div className="mt-1 text-sm text-[#6b7280]">Manage project group details and members.</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsGroupSettingsOpen(false);
                    setGroupActionMemberName("");
                  }}
                  className="rounded-full border border-[#d7cec0] bg-white px-3 py-1.5 text-sm font-semibold text-[#4b5563]"
                >
                  X
                </button>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#eadfcd] bg-white p-3">
                <Avatar name={selectedConversation.name} seed={selectedConversation.avatarSeed} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-semibold text-[#111827]">
                    {groupNameDrafts[groupKey] || selectedConversation.name}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">{selectedConversation.groupType}</Badge>
                    <Badge className="border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]">{`${members.length} members`}</Badge>
                  </div>
                </div>
              </div>

              <label className="mt-5 block">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Search group members</div>
                <input
                  value={groupSettingsSearch}
                  onChange={(event) => setGroupSettingsSearch(event.target.value)}
                  placeholder="Search group members"
                  className="mt-2 h-10 w-full rounded-2xl border border-[#d9d2c7] bg-white px-4 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
                />
              </label>

              <div className="mt-4 rounded-2xl border border-[#eadfcd] bg-white p-3">
                <div className="scroll-panel grid max-h-80 grid-cols-4 gap-2 pr-1">
                  {visibleMembers.slice(0, 15).map((member) => (
                    <button
                      key={member.name}
                      type="button"
                      onClick={() => setGroupActionMemberName(member.name)}
                      className="text-left"
                    >
                      {renderGroupMemberTile(member, admins, normalizeProfileKey(groupActionMemberName) === normalizeProfileKey(member.name))}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => openGroupMemberModal("add", groupKey, members)}
                    className="rounded-2xl border border-dashed border-[#1f5c43] bg-[#edf8f1] px-2.5 py-3 text-center text-xs font-bold text-[#1f5c43]"
                  >
                    <div className="text-2xl leading-none">+</div>
                    <div className="mt-2">Add</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => openGroupMemberModal("delete", groupKey, members)}
                    className="rounded-2xl border border-dashed border-[#c58d65] bg-[#fff7ef] px-2.5 py-3 text-center text-xs font-bold text-[#a15c2e]"
                  >
                    <div className="text-2xl leading-none">-</div>
                    <div className="mt-2">Delete</div>
                  </button>
                </div>
                {members.length > 15 ? (
                  <div className="mt-3 text-center text-xs font-semibold text-[#1f5c43]">View more</div>
                ) : null}
              </div>

              {selectedActionMember ? (
                <div className="mt-4 rounded-2xl border border-[#eadfcd] bg-white p-3">
                  <div className="text-sm font-semibold text-[#111827]">{selectedActionMember.name}</div>
                  <div className="mt-1 text-xs text-[#6b7280]">
                    {[selectedActionMember.role, selectedActionMember.level, selectedActionMember.status].filter(Boolean).join(" · ")}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="rounded-full border border-[#d7cec0] bg-[#fbfaf6] px-3 py-1.5 text-xs font-semibold text-[#4b5563]">
                      View Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleGroupAdmin(groupKey, selectedActionMember.name)}
                      className="rounded-full border border-[#1f5c43] bg-[#edf8f1] px-3 py-1.5 text-xs font-semibold text-[#1f5c43]"
                    >
                      {admins.some((name) => normalizeProfileKey(name) === normalizeProfileKey(selectedActionMember.name)) ? "Remove Admin" : "Set as Admin"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMemberFromGroup(groupKey, members, selectedActionMember.name)}
                      className="rounded-full border border-[#f5c2c7] bg-[#fff5f5] px-3 py-1.5 text-xs font-semibold text-[#b42318]"
                    >
                      Remove from Group
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 space-y-3">
                <label className="block rounded-2xl border border-[#eadfcd] bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Group Name</div>
                  <input
                    value={groupNameDrafts[groupKey] ?? selectedConversation.name}
                    onChange={(event) => setGroupNameDrafts((current) => ({ ...current, [groupKey]: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[#d9d2c7] bg-[#fbfaf6] px-3 py-2 text-sm outline-none focus:border-[#1f5c43]"
                  />
                </label>

                <label className="block rounded-2xl border border-[#eadfcd] bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Group Notice</div>
                  <textarea
                    value={groupNoticeDrafts[groupKey] ?? "Please follow project rules and keep task discussions in this group."}
                    onChange={(event) => setGroupNoticeDrafts((current) => ({ ...current, [groupKey]: event.target.value }))}
                    rows={3}
                    className="mt-2 w-full resize-none rounded-xl border border-[#d9d2c7] bg-[#fbfaf6] px-3 py-2 text-sm outline-none focus:border-[#1f5c43]"
                  />
                </label>

                <div className="rounded-2xl border border-[#eadfcd] bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Project Rules</div>
                  {rule ? (
                    <div className="mt-2 rounded-xl border border-[#e4d7c6] bg-[#fbfaf6] p-3">
                      <div className="text-sm font-semibold text-[#111827]">{rule.title}</div>
                      <div className="mt-1 break-all text-xs text-[#6b7280]">{rule.url}</div>
                      <div className="mt-2 flex gap-2">
                        <a href={rule.url} target="_blank" rel="noreferrer" className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-3 py-1.5 text-xs font-semibold text-white">
                          Open Rule
                        </a>
                        <button
                          type="button"
                          onClick={() => setGroupRuleDrafts((current) => ({ ...current, [groupKey]: { title: "Project Guideline", url: "https://example.com/blackdog/project-rule" } }))}
                          className="rounded-full border border-[#d7cec0] bg-white px-3 py-1.5 text-xs font-semibold text-[#4b5563]"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 rounded-xl border border-dashed border-[#d7cec0] bg-[#fbfaf6] p-3 text-sm text-[#6b7280]">
                      No project rule link added yet.
                      <button
                        type="button"
                        onClick={() => setGroupRuleDrafts((current) => ({ ...current, [groupKey]: { title: "Project Guideline", url: "https://example.com/blackdog/project-rule" } }))}
                        className="mt-3 block rounded-full border border-[#1f5c43] bg-[#1f5c43] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Add Rule Link
                      </button>
                    </div>
                  )}
                </div>

                <InfoRow label="My Nickname in Group" value={currentUser.name} />

                <button
                  type="button"
                  onClick={() => showWorkbenchNotice("info", "Search chat history is not connected yet.")}
                  className="w-full rounded-2xl border border-[#eadfcd] bg-white px-3 py-3 text-left text-sm font-semibold text-[#4b5563]"
                >
                  Search chat history
                </button>

                <div className="rounded-2xl border border-[#eadfcd] bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Message Settings</div>
                  {[
                    ["mute", "Mute Notifications"],
                    ["pin", "Pin Chat"],
                    ["contacts", "Save to Contacts"],
                    ["nicknames", "Show Member Nicknames"],
                  ].map(([key, label]) => (
                    <label key={key} className="mt-3 flex items-center justify-between gap-3 text-sm font-semibold text-[#4b5563]">
                      <span>{label}</span>
                      <input
                        type="checkbox"
                        checked={settings[key] ?? false}
                        onChange={() => toggleGroupSetting(groupKey, key)}
                        className="h-4 w-4 rounded border-[#c8bba8] text-[#1f5c43] focus:ring-[#1f5c43]"
                      />
                    </label>
                  ))}
                </div>

                <div className="rounded-2xl border border-[#f5c2c7] bg-[#fff5f5] p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b42318]">Danger Zone</div>
                  <button type="button" className="mt-3 w-full rounded-full border border-[#b42318] bg-white px-3 py-2 text-sm font-semibold text-[#b42318]">
                    Clear Chat History
                  </button>
                  <button type="button" className="mt-2 w-full rounded-full border border-[#d7cec0] bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-[#6b7280]">
                    Leave Group
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })() : null}

      {groupMemberModal ? (() => {
        const admins = groupAdminNames[groupMemberModal.groupKey] ?? (groupMemberModal.members[0]?.name ? [groupMemberModal.members[0].name] : []);
        const availablePeople = availableGroupPeople().filter(
          (person) => !groupMemberModal.members.some((member) => normalizeProfileKey(member.name) === normalizeProfileKey(person.name)),
        );
        const modalPeople = groupMemberModal.mode === "add" ? availablePeople : groupMemberModal.members;
        const query = groupMemberModalSearch.trim().toLowerCase();
        const visiblePeople = modalPeople.filter((person) =>
          [person.name, person.role, person.level ?? "", person.status ?? ""].join(" ").toLowerCase().includes(query),
        );
        const emptyText = groupMemberModal.mode === "add" ? "No available people to add." : "No members available to delete.";
        const actionText = groupMemberModal.mode === "add" ? "Add" : "Delete";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 px-4 py-8">
            <div className="scroll-panel max-h-[calc(100vh-80px)] w-full max-w-[720px] rounded-3xl border border-[#e4d7c6] bg-[#fbfaf6] p-6 shadow-[0_24px_70px_rgba(17,24,39,0.28)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold text-[#111827]">
                    {groupMemberModal.mode === "add" ? "Add members" : "Delete members"}
                  </div>
                  <div className="mt-1 text-sm text-[#6b7280]">
                    {groupMemberModal.mode === "add" ? "Choose people to add to this group." : "Remove selected members from this group only."}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeGroupMemberModal}
                  className="rounded-full border border-[#d7cec0] bg-white px-3 py-1.5 text-sm font-semibold text-[#4b5563]"
                >
                  X
                </button>
              </div>

              <input
                value={groupMemberModalSearch}
                onChange={(event) => setGroupMemberModalSearch(event.target.value)}
                placeholder={groupMemberModal.mode === "add" ? "Search people" : "Search group members"}
                className="mt-5 h-10 w-full rounded-2xl border border-[#d9d2c7] bg-white px-4 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
              />

              <div className="scroll-panel mt-4 max-h-[420px] rounded-2xl border border-[#eadfcd] bg-white p-3">
                {visiblePeople.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {visiblePeople.map((person) => {
                      const selected = selectedGroupMemberNames.some((name) => normalizeProfileKey(name) === normalizeProfileKey(person.name));
                      return (
                        <button
                          key={person.name}
                          type="button"
                          onClick={() => toggleSelectedGroupMember(person.name)}
                          className="text-left"
                        >
                          {renderGroupMemberTile(person, admins, selected)}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#d7cec0] bg-[#fbfaf6] px-4 py-8 text-center text-sm text-[#6b7280]">
                    {emptyText}
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeGroupMemberModal}
                  className="rounded-full border border-[#d7cec0] bg-white px-4 py-2.5 text-sm font-semibold text-[#4b5563]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedGroupMemberNames.length}
                  onClick={confirmGroupMemberModal}
                  className={`rounded-full border px-5 py-2.5 text-sm font-semibold shadow-[0_10px_18px_rgba(31,92,67,0.18)] disabled:cursor-not-allowed disabled:border-[#cbd5e1] disabled:bg-[#94a3b8] ${
                    groupMemberModal.mode === "delete"
                      ? "border-[#b42318] bg-[#b42318] text-white"
                      : "border-[#1f5c43] bg-[#1f5c43] text-white"
                  }`}
                >
                  {actionText}
                </button>
              </div>
            </div>
          </div>
        );
      })() : null}
    </main>
  );
}
