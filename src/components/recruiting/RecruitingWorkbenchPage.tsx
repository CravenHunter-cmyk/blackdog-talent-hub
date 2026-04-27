"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { recruitingCandidates, weeklyActivity } from "@/data/recruitingCandidates";
import type {
  AssistantGoal,
  ReplySuggestion,
  ReplyTone,
  RecruitingCandidate,
  RecruitingStatus,
} from "@/types/recruiting";

type PageTab = "Workbench" | "My Progress";

type HelperStatus = {
  extensionStatus: string;
  currentPlatform: string;
  conversationSync: string;
  currentCandidate: string;
};

const assistantGoals: AssistantGoal[] = [
  "First Message",
  "Follow-up",
  "Ask Experience",
  "Ask Availability",
  "Ask Rate",
  "Screening Invitation",
  "Move to Talent Pool",
  "Polite Rejection",
];

const replyTones: ReplyTone[] = ["Professional", "Friendly", "Short"];

function statusBadgeClass(status: RecruitingStatus) {
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

function availabilityBadgeClass(availability: RecruitingCandidate["availability"]) {
  switch (availability) {
    case "Available Now":
      return "border-[#1f5c43] bg-[#eef4ee] text-[#1f5c43]";
    case "This Week":
      return "border-[#5f6f3a] bg-[#f4f7ef] text-[#5f6f3a]";
    case "This Month":
      return "border-[#b7791f] bg-[#fbf4e7] text-[#b7791f]";
    default:
      return "border-[#7a7f86] bg-[#f5f6f7] text-[#5f665c]";
  }
}

function generateSuggestions(candidate: RecruitingCandidate, goal: AssistantGoal, tone: ReplyTone) {
  const firstName = candidate.name.split(" ")[0];
  const toneLine = {
    Professional: "I’ll keep this short and focused.",
    Friendly: "Appreciate the quick response and the context.",
    Short: "Thanks for the update.",
  }[tone];

  const goalLine = {
    "First Message": "Could you share your current availability and a recent example of similar work?",
    "Follow-up": "Checking back to see whether the role and timing still fit your schedule.",
    "Ask Experience": "Could you tell us about one recent project that matches this language coverage?",
    "Ask Availability": "Can you confirm your bandwidth for the coming week?",
    "Ask Rate": "Would you share your expected hourly rate for this type of work?",
    "Screening Invitation": "We’d like to invite you to a short screening step with BlackDog.",
    "Move to Talent Pool": "We’d like to keep your profile in our active talent pool for future projects.",
    "Polite Rejection": "Thanks again. At the moment we’re moving in a different direction, but we appreciate your time.",
  }[goal];

  const baseReply = `Hi ${firstName}, ${toneLine} ${goalLine}`;

  return [
    {
      id: "reply-1",
      reply: `${baseReply} Your ${candidate.language} coverage for ${candidate.region} looks relevant for our Upwork recruiting workflow.`,
      reason: "Clear opening with a direct ask.",
    },
    {
      id: "reply-2",
      reply: `Thanks ${firstName} — we’re reviewing native ${candidate.language} coverage and would love to understand your ${candidate.skills[0].toLowerCase()} experience and current availability.`,
      reason: "Balanced follow-up with one key qualification check.",
    },
    {
      id: "reply-3",
      reply: `If this looks like a fit, we can move to the next step and keep the process lightweight inside BlackDog Recruiting Workbench.`,
      reason: "Good closing note for a screening invitation.",
    },
  ];
}

function buildAnalysis(candidate: RecruitingCandidate, conversation: string) {
  const firstLine = conversation.split("\n\n")[0] ?? conversation.slice(0, 140);

  return {
    extractedSummary: `${candidate.language} native talent with strong ${candidate.region} coverage and ${candidate.skills
      .slice(0, 2)
      .join(", ")} experience.`,
    riskNotes: firstLine.toLowerCase().includes("available")
      ? "Availability is being discussed. Confirm exact scheduling before moving forward."
      : candidate.riskNotes,
    recommendedStatus: candidate.recommendedStatus,
    nextAction: candidate.nextAction,
  } satisfies Partial<RecruitingCandidate>;
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

function FieldRow({
  label,
  value,
  valueClassName = "text-[#111827]",
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#e8e0d2] py-2 last:border-b-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">{label}</div>
      <div className={`max-w-[66%] text-right text-sm font-semibold ${valueClassName}`}>{value}</div>
    </div>
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

export function RecruitingWorkbenchPage() {
  const [activeTab, setActiveTab] = useState<PageTab>("Workbench");
  const [selectedCandidateId, setSelectedCandidateId] = useState(recruitingCandidates[0].id);
  const [candidateProfileUrl, setCandidateProfileUrl] = useState(recruitingCandidates[0].profileLink);
  const [conversationDraft, setConversationDraft] = useState(recruitingCandidates[0].currentConversation);
  const [finalReply, setFinalReply] = useState(recruitingCandidates[0].finalReplyDraft);
  const [hrNoteDraft, setHrNoteDraft] = useState(recruitingCandidates[0].hrNotes);
  const [assistantGoal, setAssistantGoal] = useState<AssistantGoal>("First Message");
  const [replyTone, setReplyTone] = useState<ReplyTone>("Professional");
  const [generatedSuggestions, setGeneratedSuggestions] = useState<ReplySuggestion[]>([]);
  const [helperStatus, setHelperStatus] = useState<HelperStatus>({
    extensionStatus: "Not Connected",
    currentPlatform: "Upwork",
    conversationSync: "Preview Mode",
    currentCandidate: "Not Detected",
  });
  const [syncPreviewMessage, setSyncPreviewMessage] = useState("");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, RecruitingStatus>>({});
  const [noteOverrides, setNoteOverrides] = useState<Record<string, string>>({});
  const [analysisOverrides, setAnalysisOverrides] = useState<Partial<RecruitingCandidate> | null>(null);
  const [syncedCandidateId, setSyncedCandidateId] = useState<string | null>(null);
  const [syncedConversation, setSyncedConversation] = useState<string | null>(null);
  const selectedCandidateIdRef = useRef(selectedCandidateId);
  const finalReplyRef = useRef<HTMLTextAreaElement | null>(null);
  const hrNoteRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedCandidate =
    recruitingCandidates.find((item) => item.id === selectedCandidateId) ?? recruitingCandidates[0];

  useEffect(() => {
    selectedCandidateIdRef.current = selectedCandidateId;
  }, [selectedCandidateId]);

  const selectedCandidateStatus = statusOverrides[selectedCandidate.id] ?? selectedCandidate.status;
  const isSyncedSelection = syncedCandidateId === selectedCandidate.id;
  const selectedProfile = isSyncedSelection && analysisOverrides ? { ...selectedCandidate, ...analysisOverrides } : selectedCandidate;

  const applyCandidateView = useCallback(
    (
      candidate: RecruitingCandidate,
      options?: {
        conversationText?: string;
        profileLink?: string;
        finalReplyDraft?: string;
        hrNotes?: string;
        analysis?: Partial<RecruitingCandidate> | null;
      },
    ) => {
      setCandidateProfileUrl(options?.profileLink ?? candidate.profileLink);
      setConversationDraft(options?.conversationText ?? candidate.currentConversation);
      setFinalReply(options?.finalReplyDraft ?? candidate.finalReplyDraft);
      setHrNoteDraft(options?.hrNotes ?? noteOverrides[candidate.id] ?? candidate.hrNotes);
      setGeneratedSuggestions([]);
      setAssistantGoal("First Message");
      setReplyTone("Professional");
      if (options && "analysis" in options) {
        setAnalysisOverrides(options.analysis);
      }
    },
    [noteOverrides],
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as
        | {
            type?: string;
            payload?: {
              candidateId?: string;
              conversationText?: string;
              currentConversation?: string;
              candidateProfile?: Partial<RecruitingCandidate> & { id?: string; name?: string };
            };
          }
        | undefined;

      if (!data || data.type !== "BLACKDOG_UPWORK_CONVERSATION_SYNC") return;

      const payload = data.payload ?? {};
      const fallbackCandidateId = selectedCandidateIdRef.current;
      const incomingCandidateId = payload.candidateId ?? payload.candidateProfile?.id ?? fallbackCandidateId;
      const matchedCandidate = recruitingCandidates.find((candidate) => candidate.id === incomingCandidateId);

      if (incomingCandidateId) {
        setSyncedCandidateId(incomingCandidateId);
        if (matchedCandidate) {
          setSelectedCandidateId(incomingCandidateId);
          setHelperStatus({
            extensionStatus: "Connected",
            currentPlatform: "Upwork",
            conversationSync: "Live Preview",
            currentCandidate: matchedCandidate.name,
          });
        }
      }

      if (typeof payload.conversationText === "string") {
        setSyncedConversation(payload.conversationText);
        if (matchedCandidate) {
          applyCandidateView(matchedCandidate, {
            conversationText: payload.conversationText,
            profileLink: payload.candidateProfile?.profileLink ?? matchedCandidate.profileLink,
            analysis: payload.candidateProfile ?? null,
          });
        } else {
          setConversationDraft(payload.conversationText);
        }
      } else if (typeof payload.currentConversation === "string") {
        setSyncedConversation(payload.currentConversation);
        if (matchedCandidate) {
          applyCandidateView(matchedCandidate, {
            conversationText: payload.currentConversation,
            profileLink: payload.candidateProfile?.profileLink ?? matchedCandidate.profileLink,
            analysis: payload.candidateProfile ?? null,
          });
        } else {
          setConversationDraft(payload.currentConversation);
        }
      }

      if (payload.candidateProfile) {
        if (!matchedCandidate) {
          setAnalysisOverrides(payload.candidateProfile);
          if (typeof payload.candidateProfile.profileLink === "string") {
            setCandidateProfileUrl(payload.candidateProfile.profileLink);
          }
        }
        setHelperStatus((current) => ({
          ...current,
          extensionStatus: "Connected",
          currentPlatform: payload.candidateProfile.platform ?? "Upwork",
          conversationSync: "Live Preview",
          currentCandidate: payload.candidateProfile.name ?? current.currentCandidate,
        }));
      }

      setSyncPreviewMessage("Browser Helper sync received locally. No message was sent to Upwork.");
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [applyCandidateView]);

  const displayCandidate = selectedProfile;

  const progressTotals = useMemo(() => {
    return weeklyActivity.reduce(
      (totals, day) => ({
        conversations: totals.conversations + day.conversations,
        suggestions: totals.suggestions + day.suggestions,
        repliesUsed: totals.repliesUsed + day.repliesUsed,
        added: totals.added + day.added,
        screening: totals.screening + day.screening,
        readyForPool: totals.readyForPool + day.readyForPool,
      }),
      {
        conversations: 0,
        suggestions: 0,
        repliesUsed: 0,
        added: 0,
        screening: 0,
        readyForPool: 0,
      },
    );
  }, []);

  function selectCandidate(candidateId: string) {
    setSelectedCandidateId(candidateId);
    const candidate =
      recruitingCandidates.find((item) => item.id === candidateId) ?? recruitingCandidates[0];
    const isSyncedCandidate = syncedCandidateId === candidate.id;
    applyCandidateView(candidate, {
      conversationText:
        isSyncedCandidate && syncedConversation ? syncedConversation : candidate.currentConversation,
      profileLink:
        isSyncedCandidate && analysisOverrides?.profileLink
          ? analysisOverrides.profileLink
          : candidate.profileLink,
      finalReplyDraft: candidate.finalReplyDraft,
      hrNotes: noteOverrides[candidateId] ?? candidate.hrNotes,
      analysis: isSyncedCandidate ? analysisOverrides : null,
    });
    setSyncPreviewMessage("");
  }

  function loadMockConversation() {
    setConversationDraft(selectedCandidate.currentConversation);
    setSyncPreviewMessage("Mock conversation loaded into the work area.");
  }

  function analyzeConversation() {
    const overrides = buildAnalysis(selectedCandidate, conversationDraft);
    setAnalysisOverrides(overrides);
    setSyncedCandidateId(selectedCandidate.id);
    setSyncPreviewMessage("Conversation analyzed locally using mock extraction logic.");
  }

  function clearConversation() {
    setConversationDraft("");
    setGeneratedSuggestions([]);
    setSyncPreviewMessage("Conversation cleared.");
  }

  function generateReplySuggestions() {
    setGeneratedSuggestions(generateSuggestions(selectedCandidate, assistantGoal, replyTone));
    setSyncPreviewMessage("Mock reply suggestions generated locally.");
  }

  function applySuggestion(reply: string) {
    setFinalReply(reply);
    finalReplyRef.current?.focus();
  }

  function editSuggestion(reply: string) {
    setFinalReply(reply);
    finalReplyRef.current?.focus();
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setSyncPreviewMessage("Text copied to clipboard.");
    } catch {
      setSyncPreviewMessage("Clipboard copy is unavailable in this browser.");
    }
  }

  function copyFinalReply() {
    void copyText(finalReply);
  }

  function markAsSent() {
    setStatusOverrides((current) => ({
      ...current,
      [selectedCandidate.id]: "Replied",
    }));
    setSyncPreviewMessage("Marked locally as sent. Nothing was pushed to Upwork.");
  }

  function saveNote() {
    setNoteOverrides((current) => ({
      ...current,
      [selectedCandidate.id]: hrNoteDraft,
    }));
    setSyncPreviewMessage("HR note saved locally.");
  }

  function openCandidateProfile() {
    const url = candidateProfileUrl.trim();
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="min-h-screen bg-transparent text-[#111827]">
      <TopNav />

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] p-6 shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-[#111827]">Recruiting Workbench</h1>
              <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-[#6f6256]">
                AI-assisted Upwork recruiting workspace powered by BlackDog Browser Helper.
              </p>
            </div>

            <div className="inline-flex rounded-lg border border-[#d7dccf] bg-white p-1 shadow-[0_8px_18px_rgba(31,41,51,0.06)]">
              {(["Workbench", "My Progress"] as PageTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab
                      ? "bg-[#1f5c43] text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)]"
                      : "text-[#6f6256] hover:bg-[#f4efe2] hover:text-[#111827]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeTab === "Workbench" ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="space-y-6">
                <SectionCard
                  title="Browser Helper Status"
                  description="Future Chrome plugin updates will refresh these fields. Current values are mocked for preview mode."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ["Extension Status", helperStatus.extensionStatus],
                      ["Current Platform", helperStatus.currentPlatform],
                      ["Conversation Sync", helperStatus.conversationSync],
                      ["Current Candidate", helperStatus.currentCandidate],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-[#e6dccb] bg-[#f7f5ef] p-3 shadow-[0_6px_14px_rgba(31,41,51,0.04)]"
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                          {label}
                        </div>
                        <div className="mt-2 text-sm font-semibold text-[#111827]">{value}</div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Upwork Work Session"
                  description="Open Upwork in a new tab and use BlackDog Browser Helper side panel for conversation sync and AI reply suggestions."
                >
                  <div className="mb-4 rounded-lg border border-[#d7dde2] bg-[#f7f5ef] px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                      Recommended workflow:
                    </div>
                    <ol className="mt-2 grid gap-1 text-sm text-[#111827]">
                      <li>1. Click Launch Upwork + BlackDog Helper</li>
                      <li>2. Chat with candidates in Upwork</li>
                      <li>3. Sync the current conversation through the side panel</li>
                      <li>4. Review AI reply suggestions</li>
                      <li>5. Copy or edit the final reply</li>
                    </ol>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        window.open("https://www.upwork.com", "_blank", "noopener,noreferrer");
                      }}
                      className="inline-flex items-center justify-center rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(31,92,67,0.18)] transition hover:opacity-90"
                    >
                      Launch Upwork + BlackDog Helper
                    </button>
                    <button
                      type="button"
                      onClick={openCandidateProfile}
                      className="inline-flex items-center justify-center rounded-md border border-[#d7dde2] bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] transition hover:bg-[#f4efe2]"
                    >
                      Open Candidate Profile
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <label className="block">
                      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                        Candidate Profile URL
                      </span>
                      <input
                        value={candidateProfileUrl}
                        onChange={(event) => setCandidateProfileUrl(event.target.value)}
                        className="w-full rounded-lg border border-[#d7dde2] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#1f5c43]"
                        placeholder="Paste an Upwork candidate profile URL"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setSyncPreviewMessage(
                          "Sync request held locally. BlackDog Browser Helper can listen for future preview events.",
                        );
                      }}
                      className="inline-flex items-center justify-center rounded-md border border-[#d7dde2] bg-[#f7f5ef] px-4 py-2.5 text-sm font-semibold text-[#111827] transition hover:bg-[#f4efe2]"
                    >
                      Sync Current Conversation
                    </button>
                    {syncPreviewMessage ? (
                      <p className="text-sm text-[#6f6256]">{syncPreviewMessage}</p>
                    ) : null}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Current Upwork Conversation"
                  description="Conversation content will be synced from Upwork by BlackDog Browser Helper. For now, use mock or pasted conversation text."
                >
                  <textarea
                    value={conversationDraft}
                    onChange={(event) => setConversationDraft(event.target.value)}
                    rows={16}
                    className="min-h-[360px] w-full rounded-xl border border-[#d7dde2] bg-white px-4 py-3 text-sm leading-6 text-[#111827] outline-none transition focus:border-[#1f5c43]"
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={loadMockConversation}
                      className="rounded-md border border-[#d7dde2] bg-[#f7f5ef] px-4 py-2 text-sm font-semibold text-[#111827] transition hover:bg-[#f4efe2]"
                    >
                      Load Mock Conversation
                    </button>
                    <button
                      type="button"
                      onClick={analyzeConversation}
                      className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      Analyze Conversation
                    </button>
                    <button
                      type="button"
                      onClick={clearConversation}
                      className="rounded-md border border-[#d7dde2] bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition hover:bg-[#f4efe2]"
                    >
                      Clear
                    </button>
                  </div>
                </SectionCard>
              </div>

              <div className="space-y-6">
                <SectionCard
                  title="Candidate Intelligence"
                  description="AI-extracted candidate profile from the current Upwork conversation."
                >
                  <div className="space-y-1">
                    <div className="text-2xl font-black text-[#111827]">{displayCandidate.name}</div>
                    <Badge className={statusBadgeClass(selectedCandidateStatus)}>{selectedCandidateStatus}</Badge>
                  </div>

                  <div className="mt-4 rounded-lg border border-[#d7dde2] bg-[#f7f5ef] px-4 py-1">
                    <FieldRow label="Candidate Name" value={displayCandidate.name} />
                    <FieldRow label="Platform" value={displayCandidate.platform} />
                    <FieldRow
                      label="Profile Link"
                      value={
                        <a
                          href={displayCandidate.profileLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#1f5c43] underline decoration-[#1f5c43]/40 underline-offset-2"
                        >
                          Open profile
                        </a>
                      }
                    />
                    <FieldRow label="Language" value={displayCandidate.language} />
                    <FieldRow label="Region" value={displayCandidate.region} />
                    <FieldRow label="Native Level" value={displayCandidate.nativeLevel} />
                    <FieldRow
                      label="Skills"
                      value={
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {displayCandidate.skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-md border border-[#d7dde2] bg-white px-2 py-1 text-[11px] font-semibold text-[#111827]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      }
                    />
                    <FieldRow
                      label="Availability"
                      value={
                        <Badge className={availabilityBadgeClass(displayCandidate.availability)}>
                          {displayCandidate.availability}
                        </Badge>
                      }
                    />
                    <FieldRow label="Hourly Rate" value={displayCandidate.hourlyRate} />
                    <FieldRow label="Experience Summary" value={displayCandidate.extractedSummary} />
                    <FieldRow
                      label="Risk Notes"
                      value={<span className="text-[#b7791f]">{displayCandidate.riskNotes}</span>}
                    />
                    <FieldRow
                      label="Recommended Status"
                      value={
                        <Badge className={statusBadgeClass(displayCandidate.recommendedStatus)}>
                          {displayCandidate.recommendedStatus}
                        </Badge>
                      }
                    />
                    <FieldRow label="Next Action" value={displayCandidate.nextAction} />
                  </div>
                </SectionCard>

                <SectionCard
                  title="AI Reply Suggestions"
                  description="Review AI suggested replies before using them in Upwork."
                >
                  <div className="grid gap-3">
                    <label className="block">
                      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                        Assistant Goal
                      </span>
                      <select
                        value={assistantGoal}
                        onChange={(event) => setAssistantGoal(event.target.value as AssistantGoal)}
                        className="w-full rounded-lg border border-[#d7dde2] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#1f5c43]"
                      >
                        {assistantGoals.map((goal) => (
                          <option key={goal} value={goal}>
                            {goal}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                        Tone
                      </span>
                      <select
                        value={replyTone}
                        onChange={(event) => setReplyTone(event.target.value as ReplyTone)}
                        className="w-full rounded-lg border border-[#d7dde2] bg-white px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#1f5c43]"
                      >
                        {replyTones.map((tone) => (
                          <option key={tone} value={tone}>
                            {tone}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={generateReplySuggestions}
                      className="inline-flex items-center justify-center rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(31,92,67,0.18)] transition hover:opacity-90"
                    >
                      Generate Suggestions
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {generatedSuggestions.length > 0 ? (
                      generatedSuggestions.map((suggestion, index) => (
                        <div key={suggestion.id} className="rounded-lg border border-[#d7dde2] bg-[#f7f5ef] p-4">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                              Suggested Reply {index + 1}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => applySuggestion(suggestion.reply)}
                                className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-1.5 text-xs font-semibold text-white"
                              >
                                Use This Reply
                              </button>
                              <button
                                type="button"
                                onClick={() => editSuggestion(suggestion.reply)}
                                className="rounded-md border border-[#d7dde2] bg-white px-3 py-1.5 text-xs font-semibold text-[#111827]"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => void copyText(suggestion.reply)}
                                className="rounded-md border border-[#d7dde2] bg-white px-3 py-1.5 text-xs font-semibold text-[#111827]"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                          <p className="text-sm leading-6 text-[#111827]">{suggestion.reply}</p>
                          <p className="mt-2 text-xs text-[#6f6256]">{suggestion.reason}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-[#d7dde2] bg-white p-4 text-sm text-[#6f6256]">
                        Generate 2-3 mock replies for the selected candidate.
                      </div>
                    )}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Final Reply"
                  description="HR can use an AI suggestion, edit it, or write a reply manually before copying it back to Upwork."
                >
                  <textarea
                    ref={finalReplyRef}
                    value={finalReply}
                    onChange={(event) => setFinalReply(event.target.value)}
                    rows={9}
                    className="w-full rounded-xl border border-[#d7dde2] bg-white px-4 py-3 text-sm leading-6 text-[#111827] outline-none transition focus:border-[#1f5c43]"
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={copyFinalReply}
                      className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      Copy Final Reply
                    </button>
                    <button
                      type="button"
                      onClick={markAsSent}
                      className="rounded-md border border-[#d7dde2] bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition hover:bg-[#f4efe2]"
                    >
                      Mark as Sent
                    </button>
                    <button
                      type="button"
                      onClick={saveNote}
                      className="rounded-md border border-[#d7dde2] bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition hover:bg-[#f4efe2]"
                    >
                      Save Note
                    </button>
                  </div>

                  <div className="mt-4 rounded-lg border border-[#d7dde2] bg-[#f7f5ef] p-4">
                    <label className="block">
                      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">
                        Internal Note
                      </span>
                      <textarea
                        ref={hrNoteRef}
                        value={hrNoteDraft}
                        onChange={(event) => setHrNoteDraft(event.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-[#d7dde2] bg-white px-3 py-2.5 text-sm leading-6 text-[#111827] outline-none transition focus:border-[#1f5c43]"
                        placeholder="Optional note for internal follow-up"
                      />
                    </label>
                  </div>
                </SectionCard>
              </div>
            </div>

            <SectionCard
              title="Candidate Queue"
              description="Candidates currently being worked through Upwork conversations."
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
                      const displayStatus = statusOverrides[candidate.id] ?? candidate.status;

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
                            <div className="text-xs text-[#6f6256]">Click to load mock details</div>
                          </td>
                          <td className="px-4 py-3 align-top text-[#111827]">{candidate.language}</td>
                          <td className="px-4 py-3 align-top text-[#111827]">{candidate.region}</td>
                          <td className="px-4 py-3 align-top text-[#111827]">{candidate.platform}</td>
                          <td className="px-4 py-3 align-top">
                            <Badge className={statusBadgeClass(displayStatus)}>{displayStatus}</Badge>
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
        ) : (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <MetricTile label="Conversations Reviewed" value={progressTotals.conversations} />
              <MetricTile label="AI Suggestions Generated" value={progressTotals.suggestions} />
              <MetricTile label="Replies Used" value={progressTotals.repliesUsed} />
              <MetricTile label="Candidates Added" value={progressTotals.added} />
              <MetricTile label="Screening Invites Sent" value={progressTotals.screening} />
              <MetricTile label="Ready for Pool" value={progressTotals.readyForPool} />
            </div>

            <SectionCard
              title="Weekly Activity"
              description="Mock weekly output from the Recruiting Workbench."
              contentClassName="p-0"
            >
              <div className="max-h-[520px] overflow-auto rounded-lg border border-[#d7dde2] bg-white">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-[#f1ece3] text-[11px] uppercase tracking-[0.18em] text-[#1e1712]">
                    <tr>
                      {[
                        "Date",
                        "Conversations",
                        "Suggestions",
                        "Replies Used",
                        "Added",
                        "Screening",
                        "Ready for Pool",
                      ].map((heading) => (
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
                    {weeklyActivity.map((row) => (
                      <tr key={row.date} className="border-b border-[#efe6d8] bg-white hover:bg-[#f7f5ef]">
                        <td className="px-4 py-3 font-semibold text-[#111827]">{row.date}</td>
                        <td className="px-4 py-3 tabular-nums text-[#111827]">{row.conversations}</td>
                        <td className="px-4 py-3 tabular-nums text-[#111827]">{row.suggestions}</td>
                        <td className="px-4 py-3 tabular-nums text-[#111827]">{row.repliesUsed}</td>
                        <td className="px-4 py-3 tabular-nums text-[#111827]">{row.added}</td>
                        <td className="px-4 py-3 tabular-nums text-[#111827]">{row.screening}</td>
                        <td className="px-4 py-3 tabular-nums text-[#111827]">{row.readyForPool}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}
      </section>
    </main>
  );
}
