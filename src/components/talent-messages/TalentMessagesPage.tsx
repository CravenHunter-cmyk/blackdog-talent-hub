"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";

type PlatformRole = "Super Admin" | "Executive" | "HR User";
type ConversationKind = "platform" | "talent" | "group";
type ConversationFilter = "All" | "Management" | "HR" | "Talent Pool" | "Groups";
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
    id: "yamane-risa",
    name: "Yamane Risa",
    language: "Japanese",
    skill: "LLM Evaluation",
    status: "Applied",
    taskId: "japanese-llm-evaluation",
  },
  {
    id: "tanchanok-pearl",
    name: "Tanchanok Pearl",
    language: "Thai",
    skill: "OCR Review",
    status: "Under Review",
    taskId: "arabic-ocr-expert-pool",
  },
  {
    id: "nayara-ribeiro",
    name: "Nayara Ribeiro",
    language: "Portuguese-BR",
    skill: "Localization Review",
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
      { id: "gj5", sender: "Julie Zhu", timestamp: "9:12 AM", kind: "image", text: "Sample task image placeholder", attachmentName: "Sample_Task_Screenshot.png", attachmentMeta: "Image preview", roleLabel: "HR", align: "left" },
      { id: "gj6", sender: "Julie Zhu", timestamp: "9:14 AM", kind: "video", text: "Sample task video placeholder", attachmentName: "Sample_Task_Video.mp4", attachmentMeta: "Video preview", roleLabel: "HR", align: "left" },
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

export function TalentMessagesPage({ initialTab = "", initialTaskId = "", initialTaskName = "" }: TalentMessagesPageProps) {
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
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
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

  const selectedCanSend = selectedConversation ? canSendMessage(currentUser, selectedConversation, permissionConfig) : false;
  const selectedCanFile = selectedConversation ? canSendFile(currentUser, selectedConversation, permissionConfig) : false;
  const selectedCanVideo = selectedConversation ? canSendVideo(currentUser, selectedConversation, permissionConfig) : false;
  const selectedCanCreateGroup = canCreateGroup(currentUser, permissionConfig);
  const selectedCanInvite = selectedConversation ? canInviteMembers(currentUser, selectedConversation, permissionConfig) : false;
  const selectedCanHistory = selectedConversation ? canViewChatHistory(currentUser, selectedConversation, permissionConfig) : false;

  useEffect(() => {
    return () => {
      attachmentUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      attachmentUrlsRef.current = [];
    };
  }, []);

  function updateConversation(targetId: string, updater: (conversation: Conversation) => Conversation) {
    setConversations((prev) => prev.map((conversation) => (conversation.id === targetId ? updater(conversation) : conversation)));
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
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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

  function handleSend() {
    if (!selectedConversation || !selectedCanSend) return;
    const value = draft.trim();
    if (!value) return;

    const nextMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
      permissionsSummary: `${groupDraft.groupType} created from the Talent Workbench preview.`,
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
      projectBackground: createTaskForm.description.trim() || "Mock recruiting task created from Talent Workbench.",
      workScope: "Review task requirements, confirm fit, and coordinate with the project owner after approval.",
      languageRequirement: createTaskForm.language.trim() || "Language requirement TBD.",
      workload: "Workload will be confirmed after the mock task is reviewed.",
      timeline: createTaskForm.deadline.trim() ? `Target deadline is ${createTaskForm.deadline.trim()}.` : "Timeline TBD.",
      paymentNote: "Payment will be confirmed after official scope and workload are finalized.",
      applicationRequirement: "Applicants should provide relevant background, experience, and availability.",
      materialsToSubmit: "Self-introduction, relevant experience, availability, and optional resume/profile link.",
      notes: "This is a local mock task and is not saved to a database.",
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
  const applicantsForSelectedTask = workbenchApplicants.filter((applicant) => applicant.taskId === selectedTask?.id);
  const profileApplicant = workbenchApplicants.find((applicant) => applicant.id === profileApplicantId);
  const projectGroupCards = Object.values(projectGroups);
  const pendingApplicants = workbenchApplicants.filter((applicant) => applicant.status === "Applied" || applicant.status === "Under Review");
  const talentAppliedTasks = workbenchTasks.filter((task) => talentApplications[task.id]);
  const talentApprovedTasks = workbenchTasks.filter((task) => approvedProjectIds.includes(task.id));

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

  const blockedReason = useMemo(() => {
    if (!selectedConversation) return "";
    return "";
  }, [selectedConversation]);

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    appendLocalAttachment(file, "file");
  }

  function handleVideoSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    appendLocalAttachment(file, "video");
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#f6f0e6] text-[#1f2937]">
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
      <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-6 px-6 py-6">
        <section className="rounded-xl border border-[#e4d7c6] bg-[#fbfaf6] p-6 shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-[#111827]">Talent Workbench</h1>
              <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-[#6f6256]">
                Manage recruiting tasks, talent applications, approvals, and project communication in one workspace.
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

        {activeTab === "task-center" ? (
        <section className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
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
                return (
                  <article
                    key={task.id}
                    onClick={() => selectTask(task.id, activeView === "manager" ? "applicants" : "details")}
                    className={`cursor-pointer rounded-2xl border bg-white p-4 transition ${
                      selected
                        ? "border-[#b7dfca] border-l-4 border-l-[#1f5c43] bg-[#f2fbf5] shadow-[0_10px_22px_rgba(31,92,67,0.10)]"
                        : "border-[#e4d7c6] hover:border-[#cfe8d9] hover:bg-[#fffdf8]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-lg font-semibold leading-6 text-[#111827]">{task.taskName}</div>
                        <div className="mt-2 text-sm leading-6 text-[#6b7280]">
                          {task.language} · {task.targetTalent} · Deadline {task.deadline}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#4b5563]">
                          <span>Applicants: <strong className="text-[#111827]">{task.applicants}</strong></span>
                          <span>Approved: <strong className="text-[#111827]">{task.approved}</strong></span>
                          <span>Owner: <strong className="text-[#111827]">{task.owner}</strong></span>
                        </div>
                      </div>
                      <Badge className="border-[#1f5c43] bg-[#edf8f1] text-[#1f5c43]">{task.status}</Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
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

          <aside className="min-w-0 overflow-y-auto rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-5 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
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
                <div className="mt-5 space-y-2 border-t border-[#eadfcd] pt-4 text-sm">
                  {[
                    ["Language", selectedTask.language],
                    ["Target", selectedTask.targetTalent],
                    ["Deadline", selectedTask.deadline],
                    ["Owner", selectedTask.owner],
                    ["Applicants", String(selectedTask.applicants)],
                    ["Approved", String(selectedTask.approved)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-4">
                      <span className="font-semibold text-[#6f6256]">{label}</span>
                      <span className="min-w-0 max-w-[64%] break-words text-right font-medium text-[#111827]">{value}</span>
                    </div>
                  ))}
                </div>

                {activeView === "manager" && taskPanelMode === "manage" ? (
                  <div className="mt-6 space-y-4">
                    <SectionHeading label="Task Overview" subtitle="Mock management panel for task setup and delivery readiness." />
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
                ) : activeView === "manager" ? (
                  <div className="mt-6">
                    <SectionHeading label="Applicant Review Queue" subtitle="Review applicants for the selected task and update mock application status." />
                    <div className="space-y-3">
                      {applicantsForSelectedTask.length ? applicantsForSelectedTask.map((applicant) => (
                        <div key={applicant.id} className="rounded-2xl border border-[#eadfcd] bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-[#111827]">{applicant.name}</div>
                              <div className="mt-1 text-sm text-[#6b7280]">{applicant.language} · {applicant.skill}</div>
                            </div>
                            <Badge className={applicant.status === "Approved" ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : applicant.status === "Rejected" ? "border-[#f5c2c7] bg-[#fdecec] text-[#b42318]" : "border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]"}>
                              {applicant.status}
                            </Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <button type="button" onClick={() => setProfileApplicantId(applicant.id)} className="rounded-full border border-[#d7cec0] bg-[#f8f4ea] px-2.5 py-1 text-[11px] font-semibold text-[#4b5563]">View Profile</button>
                            <button type="button" onClick={() => openApplicantMessage(applicant)} className="rounded-full border border-[#d7cec0] bg-[#f8f4ea] px-2.5 py-1 text-[11px] font-semibold text-[#4b5563]">Message</button>
                            <button type="button" onClick={() => handleApplicantDecision(applicant.id, "Approved")} className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-2.5 py-1 text-[11px] font-semibold text-white">Approve</button>
                            <button type="button" onClick={() => handleApplicantDecision(applicant.id, "Rejected")} className="rounded-full border border-[#f5c2c7] bg-[#fff5f5] px-2.5 py-1 text-[11px] font-semibold text-[#b42318]">Reject</button>
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-2xl border border-[#eadfcd] bg-white px-4 py-3 text-sm text-[#6b7280]">
                          No applicants for this task yet.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6">
                    {applyingTaskId === selectedTask.id ? (
                      <div>
                        <SectionHeading label="Application Form" subtitle="Submit a local mock application for this task." />
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
                      <div className="space-y-5">
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
                            <section key={label} className="rounded-2xl border border-[#eadfcd] bg-white p-4">
                              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#1f5c43]">{label}</div>
                              <p className="mt-2 text-sm leading-6 text-[#4b5563]">{value}</p>
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
                      <div>
                        <SectionHeading label="Application Status" subtitle="Open the full brief or submit a local mock application." />
                        <div className="rounded-2xl border border-[#eadfcd] bg-white px-4 py-3 text-sm font-semibold text-[#111827]">
                          {talentApplications[selectedTask.id] || "Not Applied"}
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

        {activeTab === "personal-center" ? (
        <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-5 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
            <SectionHeading label="Profile Summary" subtitle="Mock personal workspace profile for the current user." />
            <div className="mt-4 space-y-2 text-sm">
              {activeView === "manager" ? (
                <>
                  <InfoRow label="Name" value="Julie Zhu" />
                  <InfoRow label="Role" value="Super Admin / Manager" />
                  <InfoRow label="Department" value="Platform Ops" />
                  <InfoRow label="Status" value="Active" />
                </>
              ) : (
                <>
                  <InfoRow label="Name" value="Yamane Risa" />
                  <InfoRow label="Role" value="Talent" />
                  <InfoRow label="Native Language" value="Japanese" />
                  <InfoRow label="Skills" value="LLM Evaluation, Translation, Localization" />
                  <InfoRow label="Status" value="Available" />
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-5 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
            {activeView === "manager" ? (
              <>
                <SectionHeading label="My Managed Tasks" subtitle="Manager-owned mock recruiting tasks." />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {workbenchTasks.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-[#eadfcd] bg-white px-4 py-3 text-sm font-semibold text-[#111827]">
                      {task.taskName}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <SectionHeading label="My Applications" subtitle="Mock applications submitted from Talent View." />
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
            )}
          </div>

          <div className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-5 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
            <SectionHeading label={activeView === "manager" ? "Pending Applicants" : "My Active Projects"} subtitle={activeView === "manager" ? "Applicants waiting for review." : "Approved tasks appear here."} />
            <div className="mt-4 space-y-2">
              {activeView === "manager" ? (
                pendingApplicants.map((applicant) => (
                  <div key={applicant.id} className="rounded-2xl border border-[#eadfcd] bg-white px-4 py-3 text-sm text-[#4b5563]">
                    {applicant.name} — {applicant.status}
                  </div>
                ))
              ) : talentApprovedTasks.length ? (
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
            {activeView === "manager" ? (
              <>
                <SectionHeading label="Recent Actions" subtitle="Manager follow-ups for task execution." />
                <div className="mt-4 space-y-2">
                  {["Review new Japanese applicants", "Confirm Arabic OCR shortlist", "Sync project scripts"].map((action) => (
                    <div key={action} className="rounded-2xl border border-[#eadfcd] bg-white px-4 py-3 text-sm text-[#4b5563]">{action}</div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <SectionHeading label="My To-do" subtitle="Talent-side task readiness checklist." />
                <div className="mt-4 space-y-2">
                  {["Complete profile", "Check task guideline", "Reply to project owner"].map((todo) => (
                    <div key={todo} className="rounded-2xl border border-[#eadfcd] bg-white px-4 py-3 text-sm text-[#4b5563]">{todo}</div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
        ) : null}

        {activeTab === "communication-hub" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-5">
          <section className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-5 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
            <SectionHeading
              label="Communication Hub"
              subtitle="Coordinate task-related conversations with talents, project groups, and language groups."
            />
            <div className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-2xl border border-[#eadfcd] bg-white p-4">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#1f5c43]">Project Groups</div>
                <div className="mt-3 space-y-3">
                  {projectGroupCards.map((group) => (
                    <div key={group.groupName} className="border-b border-[#f0e7d8] pb-3 last:border-0 last:pb-0">
                      <div className="text-sm font-semibold text-[#111827]">{group.groupName}</div>
                      <div className="mt-1 text-sm text-[#6b7280]">Members: {group.members}</div>
                      <div className="mt-1 text-sm text-[#4b5563]">{group.activity}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-[#eadfcd] bg-white p-4">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#1f5c43]">Direct Messages</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Julie Zhu", "Maya Chen", "Daniel Kim"].map((name) => (
                    <Badge key={name} className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">{name}</Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-[#eadfcd] bg-white p-4">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#1f5c43]">Language Groups</div>
                <div className="mt-3 space-y-2 text-sm text-[#4b5563]">
                  <div>Japanese Talent Pool</div>
                  <div>Arabic OCR Reviewers</div>
                  <div>Portuguese-BR Localization Pool</div>
                </div>
              </div>
            </div>
          </section>
        <section className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[330px_minmax(0,1fr)_360px]">
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
            <div className="border-b border-[#eadfcd] p-4">
              <SectionHeading label="Task-related Conversations" subtitle="Communication Hub for task, project group, language group, and personal coordination." />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations"
                className="mt-3 w-full rounded-2xl border border-[#d9d2c7] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {(["All", "Management", "HR", "Talent Pool", "Groups"] as ConversationFilter[]).map((item) => (
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
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <div className="space-y-1.5">
                {visibleConversations.map((conversation) => {
                  const active = conversation.id === selectedConversation?.id;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className={`flex w-full items-start gap-3 rounded-xl border border-[#e5ddcf] border-l-4 px-3 py-2.5 text-left transition ${
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
                })}
              </div>
            </div>
          </aside>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e4d7c6] bg-[#fcfbf7] shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
            <div className="border-b border-[#eadfcd] px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-lg font-semibold text-[#111827]">{selectedConversation?.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6b7280]">
                    <Badge className={selectedConversation ? typeBadge(selectedConversation.kind, selectedConversation.kind === "platform" ? selectedConversation.role : undefined) : "border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]"}>
                      {selectedConversation?.kind === "platform"
                        ? selectedConversation.role
                        : selectedConversation?.kind === "talent"
                          ? "Talent"
                          : "Group"}
                    </Badge>
                    {selectedConversation?.kind === "talent" ? (
                      <>
                        <Badge className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">{selectedConversation.profileStatus}</Badge>
                        <Badge className={selectedConversation.online ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#cbd5e1] bg-[#f1f5f9] text-[#64748b]"}>
                          {selectedConversation.online ? "Online" : "Offline"}
                        </Badge>
                      </>
                    ) : null}
                    {selectedConversation?.kind === "group" ? (
                      <>
                        <Badge className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">{selectedConversation.groupType}</Badge>
                        <Badge className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">{`${selectedConversation.memberCount} members`}</Badge>
                      </>
                    ) : null}
                    {selectedConversation?.kind === "platform" ? (
                      <>
                        <Badge className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">{selectedConversation.department}</Badge>
                        <Badge className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">{selectedConversation.status ?? currentUser.status}</Badge>
                      </>
                    ) : null}
                  </div>
                  <div className="mt-2 text-sm text-[#6b7280]">{headerMeta}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={selectedConversation ? typeBadge(selectedConversation.kind, selectedConversation.kind === "platform" ? selectedConversation.role : undefined) : "border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]"}>
                    {selectedConversation?.kind === "platform"
                      ? selectedConversation.role
                      : selectedConversation?.kind === "talent"
                        ? "Talent"
                        : "Group"}
                  </Badge>
                  <Badge className={selectedCanHistory ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#f5c2c7] bg-[#fdecec] text-[#b42318]"}>
                    {selectedCanHistory ? "History Allowed" : "History Blocked"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {selectedCanHistory && selectedConversation ? (
                <div className="space-y-4">
                  {selectedConversation.messages.map((message) => {
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

            <div className="sticky bottom-0 border-t border-[#eadfcd] bg-[#fcfbf7] px-5 py-4">
              <div className="rounded-2xl border border-[#e2d8c8] bg-[#fbfaf6] p-4 shadow-[0_10px_20px_rgba(31,41,51,0.04)]">
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#6f6256]">
                  <Badge className={selectedCanHistory ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#f5c2c7] bg-[#fdecec] text-[#b42318]"}>
                    {selectedCanHistory ? "Chat history allowed" : "Chat history blocked"}
                  </Badge>
                  <Badge className={selectedCanSend ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#f5c2c7] bg-[#fdecec] text-[#b42318]"}>
                    {selectedCanSend ? "Message allowed" : "Message blocked"}
                  </Badge>
                  <Badge className={selectedCanFile ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#f5c2c7] bg-[#fdecec] text-[#b42318]"}>
                    {selectedCanFile ? "File allowed" : "File blocked"}
                  </Badge>
                  <Badge className={selectedCanVideo ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#f5c2c7] bg-[#fdecec] text-[#b42318]"}>
                    {selectedCanVideo ? "Video allowed" : "Video blocked"}
                  </Badge>
                </div>

                <div className="mt-3">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    disabled={!selectedCanSend}
                    placeholder={blockedReason || "Write a message to the selected conversation..."}
                    className="min-h-[108px] w-full resize-none rounded-2xl border border-[#d9d2c7] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc] disabled:cursor-not-allowed disabled:bg-[#f5f5f4]"
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!selectedCanSend}
                    onClick={handleSend}
                    className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_18px_rgba(31,92,67,0.18)] transition hover:bg-[#184d38] disabled:cursor-not-allowed disabled:border-[#cbd5e1] disabled:bg-[#94a3b8]"
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    disabled={!selectedCanFile}
                    onClick={() => handleQuickAttachment("attachment")}
                    className="rounded-full border border-[#d7cec0] bg-white px-4 py-2 text-sm font-semibold text-[#4b5563] transition hover:border-[#1f5c43] hover:text-[#1f5c43] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Attach File
                  </button>
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
                </div>

                {!selectedCanSend ? (
                  <div className="mt-3 rounded-2xl border border-[#f2d1d1] bg-[#fff5f5] px-4 py-3 text-sm text-[#9a3412]">
                    {blockedReason}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <aside className="flex min-h-0 flex-col gap-5 overflow-hidden">
            <div className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-4 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
              <SectionHeading
                label="Conversation Details"
                subtitle="Context changes based on the selected person or group."
              />

              {selectedConversation?.kind === "talent" ? (
                <>
                  <div className="flex items-start gap-3">
                    <Avatar name={selectedConversation.name} seed={selectedConversation.avatarSeed} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-semibold text-[#111827]">{selectedConversation.name}</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">{selectedConversation.profileStatus}</Badge>
                        <Badge className={selectedConversation.online ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : "border-[#cbd5e1] bg-[#f1f5f9] text-[#64748b]"}>
                          {selectedConversation.online ? "Online" : "Offline"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <InfoRow label="Talent ID" value={selectedConversation.talentId} />
                    <InfoRow label="Native Language" value={selectedConversation.nativeLanguage} />
                    <InfoRow label="Second Language" value={selectedConversation.secondLanguage} />
                    <InfoRow label="Skill" value={selectedConversation.skill} />
                    <InfoRow label="Education" value={selectedConversation.education} />
                    <InfoRow label="Professional Domain" value={selectedConversation.professionalDomain} />
                    <InfoRow label="Assigned HR" value={selectedConversation.assignedHr} />
                    <InfoRow label="Related Projects" value={selectedConversation.relatedProjects.join(", ")} />
                    <InfoRow label="Upwork Chat URL" value={selectedConversation.upworkChatUrl} />
                    <InfoRow label="Upwork Profile URL" value={selectedConversation.upworkProfileUrl} />
                    <InfoRow label="Last Contact Time" value={selectedConversation.lastContactTime} />
                  </div>

                  <div className="mt-4 grid gap-2">
                    <button type="button" className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_18px_rgba(31,92,67,0.18)]">
                      Open Talent Profile
                    </button>
                    <button type="button" className="rounded-full border border-[#d7cec0] bg-white px-4 py-2 text-sm font-semibold text-[#4b5563]">
                      Open Upwork Chat
                    </button>
                    <button type="button" className="rounded-full border border-[#d7cec0] bg-white px-4 py-2 text-sm font-semibold text-[#4b5563]">
                      View in Talent Library
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
                    <InfoRow label="Group Owner" value={selectedConversation.owner} />
                    <InfoRow
                      label="Project / Language"
                      value={selectedConversation.relatedProject ?? selectedConversation.relatedLanguage ?? "—"}
                    />
                    <InfoRow label="Permissions Summary" value={selectedConversation.permissionsSummary} />
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
                    <InfoRow label="Department" value={selectedConversation.department} />
                    <InfoRow label="Assigned Projects" value={selectedConversation.assignedProjects.join(", ")} />
                    <InfoRow label="Permissions Summary" value={selectedConversation.permissionsSummary} />
                    <InfoRow label="Last Active" value={selectedConversation.lastActive} />
                  </div>
                </>
              ) : null}
            </div>

            <div className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-4 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
              <SectionHeading label="Communication Permissions Debug" subtitle="Mock permission logic for message, file, group, and history access." />

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

            <div className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-4 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
              <SectionHeading label="Create Group" subtitle="Mock local-only group creation." />
              <div className="space-y-3">
                <label className="block">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Group Name</div>
                  <input
                    value={groupDraft.groupName}
                    onChange={(event) => setGroupDraft((prev) => ({ ...prev, groupName: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[#d9d2c7] bg-white px-3 py-2 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Group Type</div>
                  <select
                    value={groupDraft.groupType}
                    onChange={(event) => setGroupDraft((prev) => ({ ...prev, groupType: event.target.value as GroupType }))}
                    className="mt-2 w-full rounded-xl border border-[#d9d2c7] bg-white px-3 py-2 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
                  >
                    <option>Project Group</option>
                    <option>Language Group</option>
                    <option>Custom Group</option>
                  </select>
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Related Project</div>
                    <input
                      value={groupDraft.relatedProject}
                      onChange={(event) => setGroupDraft((prev) => ({ ...prev, relatedProject: event.target.value }))}
                      className="mt-2 w-full rounded-xl border border-[#d9d2c7] bg-white px-3 py-2 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
                    />
                  </label>
                  <label className="block">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Related Language</div>
                    <input
                      value={groupDraft.relatedLanguage}
                      onChange={(event) => setGroupDraft((prev) => ({ ...prev, relatedLanguage: event.target.value }))}
                      className="mt-2 w-full rounded-xl border border-[#d9d2c7] bg-white px-3 py-2 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
                    />
                  </label>
                </div>
                <label className="block">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Group Owner</div>
                  <input
                    value={groupDraft.owner}
                    onChange={(event) => setGroupDraft((prev) => ({ ...prev, owner: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[#d9d2c7] bg-white px-3 py-2 text-sm outline-none focus:border-[#1f5c43] focus:ring-2 focus:ring-[#d6eadc]"
                  />
                </label>
                <div className="rounded-2xl border border-[#eadfcd] bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f6256]">Members</div>
                  <div className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1">
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
                                <div className="text-xs text-[#6b7280]">
                                  {contact.nativeLanguage} • {contact.assignedHr}
                                </div>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-[#334155]">
                    <input
                      type="checkbox"
                      checked={groupDraft.allowFileSharing}
                      onChange={(event) => setGroupDraft((prev) => ({ ...prev, allowFileSharing: event.target.checked }))}
                      className="h-4 w-4 rounded border-[#c8bba8] text-[#1f5c43] focus:ring-[#1f5c43]"
                    />
                    Allow file sharing
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-[#334155]">
                    <input
                      type="checkbox"
                      checked={groupDraft.allowVideoSharing}
                      onChange={(event) => setGroupDraft((prev) => ({ ...prev, allowVideoSharing: event.target.checked }))}
                      className="h-4 w-4 rounded border-[#c8bba8] text-[#1f5c43] focus:ring-[#1f5c43]"
                    />
                    Allow video sharing
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleCreateGroup}
                  className="w-full rounded-full border border-[#1f5c43] bg-[#1f5c43] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_18px_rgba(31,92,67,0.18)] transition hover:bg-[#184d38]"
                >
                  Create Group
                </button>
              </div>
            </div>
          </aside>
        </section>
        </div>
        ) : null}
      </div>

      {isCreateTaskOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/40 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#e4d7c6] bg-[#fbfaf6] p-6 shadow-[0_24px_60px_rgba(17,24,39,0.25)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-semibold text-[#111827]">Create Recruiting Task</div>
                <div className="mt-1 text-sm text-[#6b7280]">Create a local mock task for the current workbench preview.</div>
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
                Create Mock Task
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
                <div className="mt-1 text-sm text-[#6b7280]">Local mock applicant details for Task Center review.</div>
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
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#e4d7c6] bg-[#fbfaf6] p-6 shadow-[0_24px_60px_rgba(17,24,39,0.25)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-semibold text-[#111827]">Create Group</div>
                <div className="mt-1 text-sm text-[#6b7280]">Mock local-only group creation for Talent Workbench.</div>
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
                <div className="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-2xl border border-[#eadfcd] bg-white p-3">
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
    </main>
  );
}
