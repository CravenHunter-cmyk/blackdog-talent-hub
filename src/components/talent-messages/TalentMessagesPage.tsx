"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";

type PlatformRole = "Super Admin" | "Executive" | "HR User";
type ConversationKind = "platform" | "talent" | "group";
type ConversationFilter = "All" | "Management" | "HR" | "Talent Pool" | "Groups";
type MessageKind = "text" | "system" | "attachment" | "image" | "video";
type TalentProfileStatus = "Submitted" | "In Review" | "Drafted" | "New";
type GroupType = "Project Group" | "Language Group" | "Custom Group";

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

export function TalentMessagesPage() {
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
      permissionsSummary: `${groupDraft.groupType} created from the Talent Messages preview.`,
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
        <section className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] px-6 py-5 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-2xl font-semibold tracking-tight text-[#111827]">Talent Messages</div>
              <div className="mt-1 max-w-3xl text-sm text-[#6b7280]">
                Communicate with Talent Library profiles through direct messages, project groups, and language groups.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6f6256]">
              <Badge className="border-[#1f5c43] bg-[#edf8f1] text-[#1f5c43]">Unified conversation list</Badge>
              <Badge className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">Mock local data</Badge>
              <Badge className="border-[#1f5c43] bg-[#1f5c43] text-white">{currentUser.role}</Badge>
              <Badge className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">{currentUser.name}</Badge>
            </div>
          </div>
        </section>

        <section className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[330px_minmax(0,1fr)_360px]">
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
            <div className="border-b border-[#eadfcd] p-4">
              <SectionHeading label="Conversations" subtitle="All people and groups in one unified chat list." />
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
                        <Badge className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">{selectedConversation.memberCount} members</Badge>
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
                        <Badge className="border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]">{selectedConversation.memberCount} members</Badge>
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

      {isCreateGroupOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/40 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#e4d7c6] bg-[#fbfaf6] p-6 shadow-[0_24px_60px_rgba(17,24,39,0.25)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-semibold text-[#111827]">Create Group</div>
                <div className="mt-1 text-sm text-[#6b7280]">Mock local-only group creation for Talent Messages.</div>
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
