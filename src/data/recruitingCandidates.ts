import type { RecruitingCandidate, RecruitingStatus, WeeklyActivity } from "@/types/recruiting";

type CandidateSeed = {
  id: string;
  name: string;
  language: string;
  region: string;
  nativeLevel: string;
  skills: string[];
  hourlyRate: string;
  availability: RecruitingCandidate["availability"];
  status: RecruitingStatus;
  recommendedStatus: RecruitingStatus;
  nextAction: string;
  updatedAt: string;
  conversationFocus: string;
  riskNotes: string;
  hrNotes: string;
};

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function buildConversation(seed: CandidateSeed) {
  const firstName = seed.name.split(" ")[0];

  return [
    `HR: Hi ${firstName}, I found your Upwork profile and wanted to ask about your ${seed.language} coverage for ${seed.region}.`,
    `${firstName}: Thanks for reaching out. I have hands-on experience with evaluation, localization review, and fast turnaround delivery.`,
    `HR: Great. Are you available for a short screening call and a paid test task this week?`,
    `${firstName}: Yes, that should work. I can share recent examples and confirm my current bandwidth.`,
    `HR: Perfect. We'll review your background and move forward based on the fit.`,
  ].join("\n\n");
}

function buildSummary(seed: CandidateSeed) {
  return `${seed.language} native talent with ${seed.nativeLevel.toLowerCase()} delivery strength in ${seed.region}. Strong fit for ${seed.skills
    .slice(0, 3)
    .join(", ")} work and quick Upwork-based screening.`;
}

function buildFinalReply(seed: CandidateSeed) {
  const firstName = seed.name.split(" ")[0];

  return `Hi ${firstName}, thanks for sharing your ${seed.language} background. Your ${seed.region} coverage and ${seed.skills[0].toLowerCase()} experience look relevant for our current work. Could you confirm your availability for a short screening step this week?`;
}

function createCandidate(seed: CandidateSeed): RecruitingCandidate {
  return {
    id: seed.id ?? `${slug(seed.name)}-${slug(seed.language)}-${slug(seed.region)}`,
    name: seed.name,
    platform: "Upwork",
    profileLink: `https://www.upwork.com/freelancers/~${slug(seed.name)}-${slug(seed.region)}`,
    language: seed.language,
    region: seed.region,
    nativeLevel: seed.nativeLevel,
    skills: seed.skills,
    hourlyRate: seed.hourlyRate,
    availability: seed.availability,
    status: seed.status,
    currentConversation: buildConversation(seed),
    extractedSummary: buildSummary(seed),
    riskNotes: seed.riskNotes,
    recommendedStatus: seed.recommendedStatus,
    nextAction: seed.nextAction,
    finalReplyDraft: buildFinalReply(seed),
    updatedAt: seed.updatedAt,
    hrNotes: seed.hrNotes,
  };
}

const candidateSeeds: CandidateSeed[] = [
  {
    id: "emily-carter-en-uk",
    name: "Emily Carter",
    language: "English",
    region: "UK",
    nativeLevel: "Native",
    skills: ["LLM Evaluation", "Search Evaluation", "Policy Review"],
    hourlyRate: "$24 / hour",
    availability: "Available Now",
    status: "In Conversation",
    recommendedStatus: "Reply Ready",
    nextAction: "Send a screening invitation and confirm the test task window.",
    updatedAt: "2026-04-26 09:10",
    conversationFocus: "UK English evaluation and policy review",
    riskNotes: "No major risk flags. Confirm timezone and weekly capacity.",
    hrNotes: "Good fit for priority English coverage.",
  },
  {
    id: "daniel-moore-en-na",
    name: "Daniel Moore",
    language: "English",
    region: "North American Accent",
    nativeLevel: "Native",
    skills: ["Ads Evaluation", "LLM Evaluation", "Cultural Review"],
    hourlyRate: "$28 / hour",
    availability: "This Week",
    status: "Reply Ready",
    recommendedStatus: "Screening Invited",
    nextAction: "Invite to screening and ask for a recent project example.",
    updatedAt: "2026-04-26 08:55",
    conversationFocus: "North American English ads and evaluation coverage",
    riskNotes: "Hourly rate is higher but coverage quality is strong.",
    hrNotes: "Reserve for premium workstreams.",
  },
  {
    id: "sofia-rodriguez-es-mx",
    name: "Sofia Rodriguez",
    language: "Spanish",
    region: "Mexico",
    nativeLevel: "Native",
    skills: ["LLM Evaluation", "Localization Review", "Search Evaluation"],
    hourlyRate: "$16 / hour",
    availability: "Available Now",
    status: "In Conversation",
    recommendedStatus: "Reply Ready",
    nextAction: "Ask availability and confirm Mexico-specific coverage.",
    updatedAt: "2026-04-26 09:05",
    conversationFocus: "Mexico Spanish language coverage",
    riskNotes: "Needs timezone confirmation before scheduling.",
    hrNotes: "Strong candidate for LatAm coverage.",
  },
  {
    id: "mateo-garcia-es-ar",
    name: "Mateo Garcia",
    language: "Spanish",
    region: "Argentina",
    nativeLevel: "Native",
    skills: ["LLM Evaluation", "Cultural Review", "Translation Review"],
    hourlyRate: "$14 / hour",
    availability: "This Month",
    status: "Needs Follow-up",
    recommendedStatus: "Needs Follow-up",
    nextAction: "Follow up on long-term availability and weekend coverage.",
    updatedAt: "2026-04-25 18:40",
    conversationFocus: "Argentina Spanish and cultural review",
    riskNotes: "Availability is lighter than ideal for immediate work.",
    hrNotes: "Keep warm and revisit later in the week.",
  },
  {
    id: "ana-pereira-pt-br",
    name: "Ana Pereira",
    language: "Portuguese",
    region: "Brazil",
    nativeLevel: "Native",
    skills: ["LLM Evaluation", "Localization Review", "Search Evaluation"],
    hourlyRate: "$15 / hour",
    availability: "Available Now",
    status: "In Conversation",
    recommendedStatus: "Reply Ready",
    nextAction: "Send the first follow-up and confirm a test round.",
    updatedAt: "2026-04-26 08:50",
    conversationFocus: "Brazil Portuguese localization coverage",
    riskNotes: "Strong match; only small scheduling confirmation needed.",
    hrNotes: "Good backup for Portuguese volume spikes.",
  },
  {
    id: "tomoko-sato-ja-jp",
    name: "Tomoko Sato",
    language: "Japanese",
    region: "Japan",
    nativeLevel: "Native",
    skills: ["LLM Evaluation", "Localization Review", "Policy Review"],
    hourlyRate: "$30 / hour",
    availability: "Available Now",
    status: "Reply Ready",
    recommendedStatus: "Screening Invited",
    nextAction: "Invite to screening and request recent evaluation samples.",
    updatedAt: "2026-04-26 09:00",
    conversationFocus: "Japan Japanese evaluation and localization",
    riskNotes: "Premium rate but strong quality and reliability.",
    hrNotes: "Use for higher-complexity Japanese tasks.",
  },
  {
    id: "jisoo-park-ko-kr",
    name: "Jisoo Park",
    language: "Korean",
    region: "South Korea",
    nativeLevel: "Native",
    skills: ["LLM Evaluation", "Search Evaluation", "Safety Review"],
    hourlyRate: "$27 / hour",
    availability: "This Week",
    status: "In Conversation",
    recommendedStatus: "Reply Ready",
    nextAction: "Confirm weekly availability and ask about recent project scope.",
    updatedAt: "2026-04-26 08:45",
    conversationFocus: "South Korea Korean search and safety coverage",
    riskNotes: "Moderate availability. Good fit if schedule is confirmed.",
    hrNotes: "Keep in active review queue.",
  },
  {
    id: "nguyen-minh-vi-vn",
    name: "Nguyen Minh",
    language: "Vietnamese",
    region: "Vietnam",
    nativeLevel: "Native",
    skills: ["LLM Evaluation", "Localization Review", "Speech QA"],
    hourlyRate: "$13 / hour",
    availability: "Available Now",
    status: "Reply Ready",
    recommendedStatus: "Screening Invited",
    nextAction: "Invite to screening and confirm speech QA experience.",
    updatedAt: "2026-04-26 09:08",
    conversationFocus: "Vietnam Vietnamese localization and speech QA",
    riskNotes: "No major risk; needs final availability confirmation.",
    hrNotes: "Good for short-cycle projects.",
  },
  {
    id: "rina-hartono-id-id",
    name: "Rina Hartono",
    language: "Indonesian",
    region: "Indonesia",
    nativeLevel: "Native",
    skills: ["LLM Evaluation", "Translation Review", "Annotation"],
    hourlyRate: "$12 / hour",
    availability: "This Month",
    status: "Added to Talent Pool",
    recommendedStatus: "Added to Talent Pool",
    nextAction: "Keep warm and revisit when demand increases.",
    updatedAt: "2026-04-25 17:20",
    conversationFocus: "Indonesia Indonesian evaluation coverage",
    riskNotes: "Availability is currently limited for immediate work.",
    hrNotes: "Add to pool and revisit later.",
  },
  {
    id: "claire-dubois-fr-fr",
    name: "Claire Dubois",
    language: "French",
    region: "France",
    nativeLevel: "Native",
    skills: ["LLM Evaluation", "Localization Review", "Cultural Review"],
    hourlyRate: "$22 / hour",
    availability: "Available Now",
    status: "In Conversation",
    recommendedStatus: "Reply Ready",
    nextAction: "Share the screening step and confirm French coverage scope.",
    updatedAt: "2026-04-26 09:12",
    conversationFocus: "France French localization and cultural coverage",
    riskNotes: "Solid match with healthy responsiveness.",
    hrNotes: "Strong French candidate for current pipeline.",
  },
  {
    id: "lukas-schneider-de-de",
    name: "Lukas Schneider",
    language: "German",
    region: "Germany",
    nativeLevel: "Native",
    skills: ["LLM Evaluation", "Search Evaluation", "Policy Review"],
    hourlyRate: "$26 / hour",
    availability: "This Week",
    status: "Screening Invited",
    recommendedStatus: "Screening Invited",
    nextAction: "Schedule screening and ask for recent German examples.",
    updatedAt: "2026-04-26 08:58",
    conversationFocus: "Germany German evaluation workflow",
    riskNotes: "Rate is within range but needs exact availability confirmation.",
    hrNotes: "Reliable German reviewer profile.",
  },
  {
    id: "nadia-el-hassan-ar-mena",
    name: "Nadia El Hassan",
    language: "Arabic",
    region: "MENA",
    nativeLevel: "Native",
    skills: ["LLM Evaluation", "Safety Review", "Cultural Review"],
    hourlyRate: "$20 / hour",
    availability: "Available Now",
    status: "In Conversation",
    recommendedStatus: "Reply Ready",
    nextAction: "Ask for dialect coverage and confirm the first availability window.",
    updatedAt: "2026-04-26 09:15",
    conversationFocus: "Arabic MENA coverage and safety review",
    riskNotes: "Strong match for regional Arabic coverage.",
    hrNotes: "Priority Arabic profile.",
  },
  {
    id: "khaled-al-mansour-ar-ksa",
    name: "Khaled Al Mansour",
    language: "Arabic",
    region: "KSA",
    nativeLevel: "Native",
    skills: ["LLM Evaluation", "Localization Review", "Safety Review"],
    hourlyRate: "$23 / hour",
    availability: "This Week",
    status: "Reply Ready",
    recommendedStatus: "Screening Invited",
    nextAction: "Invite to screening and confirm KSA dialect experience.",
    updatedAt: "2026-04-26 09:02",
    conversationFocus: "KSA Arabic localization coverage",
    riskNotes: "Good fit; moderate schedule flexibility only.",
    hrNotes: "Keep engaged for KSA projects.",
  },
  {
    id: "youssef-benali-ar-ma",
    name: "Youssef Benali",
    language: "Arabic",
    region: "Morocco",
    nativeLevel: "Native",
    skills: ["LLM Evaluation", "Cultural Review", "Localization Review"],
    hourlyRate: "$17 / hour",
    availability: "This Month",
    status: "Needs Follow-up",
    recommendedStatus: "Needs Follow-up",
    nextAction: "Follow up once more and confirm timeline for activation.",
    updatedAt: "2026-04-25 19:00",
    conversationFocus: "Morocco Arabic cultural review",
    riskNotes: "Light availability for now, but promising coverage.",
    hrNotes: "Longer-term Arabic backup candidate.",
  },
  {
    id: "paolo-bianchi-it-it",
    name: "Paolo Bianchi",
    language: "Italian",
    region: "Italy",
    nativeLevel: "Native",
    skills: ["LLM Evaluation", "Localization Review", "Search Evaluation"],
    hourlyRate: "$21 / hour",
    availability: "Available Now",
    status: "Not Contacted",
    recommendedStatus: "Reply Ready",
    nextAction: "Send the first outreach message and confirm fit.",
    updatedAt: "2026-04-25 16:45",
    conversationFocus: "Italy Italian localization coverage",
    riskNotes: "No contact yet; quick outreach recommended.",
    hrNotes: "Potential addition for future Italian demand.",
  },
];

export const recruitingCandidates = candidateSeeds.map(createCandidate);

export const weeklyActivity: WeeklyActivity[] = [
  { date: "Mon, Apr 20", conversations: 10, suggestions: 8, repliesUsed: 5, added: 2, screening: 3, readyForPool: 4 },
  { date: "Tue, Apr 21", conversations: 12, suggestions: 10, repliesUsed: 7, added: 3, screening: 2, readyForPool: 5 },
  { date: "Wed, Apr 22", conversations: 9, suggestions: 8, repliesUsed: 6, added: 2, screening: 3, readyForPool: 3 },
  { date: "Thu, Apr 23", conversations: 11, suggestions: 9, repliesUsed: 6, added: 3, screening: 4, readyForPool: 4 },
  { date: "Fri, Apr 24", conversations: 8, suggestions: 7, repliesUsed: 4, added: 1, screening: 2, readyForPool: 3 },
  { date: "Sat, Apr 25", conversations: 6, suggestions: 5, repliesUsed: 3, added: 1, screening: 1, readyForPool: 2 },
  { date: "Sun, Apr 26", conversations: 7, suggestions: 6, repliesUsed: 4, added: 2, screening: 2, readyForPool: 3 },
];
