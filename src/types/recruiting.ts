export type RecruitingStatus =
  | "Not Contacted"
  | "In Conversation"
  | "Reply Ready"
  | "Screening Invited"
  | "Added to Talent Pool"
  | "Needs Follow-up"
  | "Replied";

export type AvailabilityStatus = "Available Now" | "This Week" | "This Month" | "Limited";

export type AssistantGoal =
  | "First Message"
  | "Follow-up"
  | "Ask Experience"
  | "Ask Availability"
  | "Ask Rate"
  | "Screening Invitation"
  | "Move to Talent Pool"
  | "Polite Rejection";

export type ReplyTone = "Professional" | "Friendly" | "Short";

export type ReplySuggestion = {
  id: string;
  reply: string;
  reason: string;
};

export type WeeklyActivity = {
  date: string;
  conversations: number;
  suggestions: number;
  repliesUsed: number;
  added: number;
  screening: number;
  readyForPool: number;
};

export type RecruitingCandidate = {
  id: string;
  name: string;
  platform: string;
  profileLink: string;
  language: string;
  region: string;
  nativeLevel: string;
  skills: string[];
  hourlyRate: string;
  availability: AvailabilityStatus;
  status: RecruitingStatus;
  currentConversation: string;
  extractedSummary: string;
  riskNotes: string;
  recommendedStatus: RecruitingStatus;
  nextAction: string;
  finalReplyDraft: string;
  updatedAt: string;
  hrNotes: string;
};
