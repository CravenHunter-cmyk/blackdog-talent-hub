"use client";

import { useMemo, useState } from "react";

type TaskStatus = "Not Started" | "In Progress" | "QA Review" | "Client Review" | "Blocked" | "Completed";
type WorkflowStep = "Draft" | "Ready" | "In Progress" | "QA Review" | "Client Review" | "Completed";
type ParticipantStatus = "Not Started" | "Working" | "Submitted" | "Needs Revision" | "QA Passed" | "Completed";
type FileType = "Guidelines" | "Source Files" | "Work Platform Link" | "QA Report" | "Delivery Files";

type TaskParticipant = {
  id: string;
  participantName: string;
  role: string;
  language: string;
  assignedVolume: number;
  completedVolume: number;
  qualityScore: number;
  status: ParticipantStatus;
  lastUpdate: string;
};

type TaskManager = {
  name: string;
  role: string;
  email: string;
  summary: string;
};

type TaskFile = {
  id: string;
  fileName: string;
  type: FileType;
  updatedAt: string;
  owner: string;
};

type TaskRecord = {
  id: string;
  taskName: string;
  client: string;
  projectType: string;
  languageOrMarket: string;
  totalVolume: number;
  completedVolume: number;
  status: TaskStatus;
  dueDate: string;
  ownerPm: string;
  participants: number;
  description: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  createdAt: string;
  updatedAt: string;
  managementTeam: TaskManager[];
  participantRows: TaskParticipant[];
  workflowStep: WorkflowStep;
  files: TaskFile[];
  notes: {
    blockers: string;
    qaNotes: string;
    clientFeedback: string;
    nextAction: string;
  };
};

const initialTasks: TaskRecord[] = [
  {
    id: "task-tiktok-jp",
    taskName: "TikTok LLM Eval Batch 01",
    client: "TikTok",
    projectType: "LLM Evaluation",
    languageOrMarket: "Japanese",
    totalVolume: 5000,
    completedVolume: 2300,
    status: "In Progress",
    dueDate: "2026-05-12",
    ownerPm: "Maya Chen",
    participants: 6,
    description: "Japanese LLM evaluation batch focused on response quality, ranking, and safety alignment.",
    priority: "High",
    createdAt: "2026-04-18 09:10",
    updatedAt: "2026-04-27 11:22",
    workflowStep: "In Progress",
    managementTeam: [
      { name: "Maya Chen", role: "Delivery Owner", email: "maya@blackdog.tld", summary: "Owns task delivery and milestone planning." },
      { name: "Julie Zhu", role: "Capability PM", email: "julie@blackdog.tld", summary: "Owns capability and quality alignment." },
      { name: "Daniel Kim", role: "Resource PM", email: "daniel@blackdog.tld", summary: "Manages staffing and candidate coverage." },
      { name: "Aisha Khan", role: "Client POC PM", email: "aisha@blackdog.tld", summary: "Client-facing coordination and approvals." },
      { name: "Marco Silva", role: "QA Lead", email: "marco@blackdog.tld", summary: "Quality checks and client review readiness." },
    ],
    participantRows: [
      { id: "p1", participantName: "Tanchanok Pearl", role: "Evaluator", language: "Japanese", assignedVolume: 900, completedVolume: 430, qualityScore: 96, status: "Working", lastUpdate: "Today 9:10 AM" },
      { id: "p2", participantName: "Yamane Risa", role: "Evaluator", language: "Japanese", assignedVolume: 800, completedVolume: 800, qualityScore: 98, status: "Completed", lastUpdate: "Today 8:52 AM" },
      { id: "p3", participantName: "Nayara Ribeiro", role: "Reviewer", language: "Japanese", assignedVolume: 700, completedVolume: 480, qualityScore: 94, status: "QA Passed", lastUpdate: "Today 8:40 AM" },
      { id: "p4", participantName: "Carlos Mendes", role: "Reviewer", language: "Japanese", assignedVolume: 600, completedVolume: 220, qualityScore: 91, status: "Submitted", lastUpdate: "Today 8:20 AM" },
      { id: "p5", participantName: "Maria Gonzalez", role: "Labeler", language: "Japanese", assignedVolume: 650, completedVolume: 280, qualityScore: 89, status: "Needs Revision", lastUpdate: "Today 7:55 AM" },
      { id: "p6", participantName: "Lode Nuyts", role: "Labeler", language: "Japanese", assignedVolume: 650, completedVolume: 90, qualityScore: 87, status: "Working", lastUpdate: "Today 7:42 AM" },
    ],
    files: [
      { id: "f1", fileName: "Guidelines_JP_v1.pdf", type: "Guidelines", updatedAt: "2026-04-27 09:40", owner: "Maya Chen" },
      { id: "f2", fileName: "Source_Set_JP_01.zip", type: "Source Files", updatedAt: "2026-04-26 16:15", owner: "Daniel Kim" },
      { id: "f3", fileName: "Work_Platform_Link.txt", type: "Work Platform Link", updatedAt: "2026-04-27 08:50", owner: "Aisha Khan" },
      { id: "f4", fileName: "QA_Report_Round1.xlsx", type: "QA Report", updatedAt: "2026-04-27 10:35", owner: "Marco Silva" },
    ],
    notes: {
      blockers: "Waiting on one revised batch from the Japanese QA team.",
      qaNotes: "Quality remains stable above 95% for top performers.",
      clientFeedback: "Client asked for faster QA turnaround before Friday.",
      nextAction: "Release the next QA review block and update the client by EOD.",
    },
  },
  {
    id: "task-dola-br",
    taskName: "Dola Localization Sites Collection",
    client: "Dola",
    projectType: "Website Collection",
    languageOrMarket: "Brazil",
    totalVolume: 2000,
    completedVolume: 680,
    status: "In Progress",
    dueDate: "2026-05-08",
    ownerPm: "Julie Zhu",
    participants: 5,
    description: "Brazilian website collection and verification task set for delivery support.",
    priority: "Medium",
    createdAt: "2026-04-20 10:00",
    updatedAt: "2026-04-27 10:55",
    workflowStep: "In Progress",
    managementTeam: [
      { name: "Julie Zhu", role: "Delivery Owner", email: "julie@blackdog.tld", summary: "Owns the task plan and delivery cadence." },
      { name: "Maya Chen", role: "Capability PM", email: "maya@blackdog.tld", summary: "Tracks scope and client expectations." },
      { name: "Aisha Khan", role: "Resource PM", email: "aisha@blackdog.tld", summary: "Maintains staffing coverage." },
      { name: "Daniel Kim", role: "Client POC PM", email: "daniel@blackdog.tld", summary: "Handles client sync and notes." },
      { name: "Marco Silva", role: "QA Lead", email: "marco@blackdog.tld", summary: "Reviews output quality and compliance." },
    ],
    participantRows: [
      { id: "p7", participantName: "Carlos Mendes", role: "Collector", language: "Portuguese-BR", assignedVolume: 600, completedVolume: 240, qualityScore: 92, status: "Working", lastUpdate: "Today 9:05 AM" },
      { id: "p8", participantName: "Nayara Ribeiro", role: "Collector", language: "Portuguese-BR", assignedVolume: 400, completedVolume: 180, qualityScore: 90, status: "Submitted", lastUpdate: "Today 8:45 AM" },
      { id: "p9", participantName: "Maria Gonzalez", role: "Collector", language: "Portuguese-BR", assignedVolume: 350, completedVolume: 120, qualityScore: 88, status: "Working", lastUpdate: "Today 8:30 AM" },
      { id: "p10", participantName: "Tanchanok Pearl", role: "Reviewer", language: "Portuguese-BR", assignedVolume: 350, completedVolume: 150, qualityScore: 93, status: "QA Passed", lastUpdate: "Today 8:05 AM" },
      { id: "p11", participantName: "Lode Nuyts", role: "Reviewer", language: "Portuguese-BR", assignedVolume: 300, completedVolume: 0, qualityScore: 0, status: "Not Started", lastUpdate: "Yesterday" },
    ],
    files: [
      { id: "f5", fileName: "Brazil_Guide_v2.pdf", type: "Guidelines", updatedAt: "2026-04-27 09:20", owner: "Julie Zhu" },
      { id: "f6", fileName: "Source_Sites_BR.zip", type: "Source Files", updatedAt: "2026-04-26 14:45", owner: "Aisha Khan" },
      { id: "f7", fileName: "Workspace_Link_BR.txt", type: "Work Platform Link", updatedAt: "2026-04-27 10:10", owner: "Daniel Kim" },
    ],
    notes: {
      blockers: "A few site access checks are still pending.",
      qaNotes: "QA flagged two sources for recheck.",
      clientFeedback: "Client wants cleaner metadata before final handoff.",
      nextAction: "Resolve access checks and share updated delivery pack.",
    },
  },
  {
    id: "task-arabic-safe",
    taskName: "Arabic Safety Evaluation Round 2",
    client: "ByteDance",
    projectType: "Safety Evaluation",
    languageOrMarket: "Arabic MENA",
    totalVolume: 3200,
    completedVolume: 3100,
    status: "QA Review",
    dueDate: "2026-05-01",
    ownerPm: "Daniel Kim",
    participants: 6,
    description: "Arabic safety evaluation with final QA and client review preparation.",
    priority: "High",
    createdAt: "2026-04-16 08:10",
    updatedAt: "2026-04-27 12:10",
    workflowStep: "QA Review",
    managementTeam: [
      { name: "Daniel Kim", role: "Delivery Owner", email: "daniel@blackdog.tld", summary: "Owns delivery and task milestones." },
      { name: "Julie Zhu", role: "Capability PM", email: "julie@blackdog.tld", summary: "Coordinates safety taxonomy and escalation rules." },
      { name: "Maya Chen", role: "Resource PM", email: "maya@blackdog.tld", summary: "Coordinates reviewer supply and coverage." },
      { name: "Aisha Khan", role: "Client POC PM", email: "aisha@blackdog.tld", summary: "Client communications and milestone approval." },
      { name: "Marco Silva", role: "QA Lead", email: "marco@blackdog.tld", summary: "Final QA checks and remediation tracking." },
    ],
    participantRows: [
      { id: "p12", participantName: "Tanchanok Pearl", role: "Safety Reviewer", language: "Arabic MENA", assignedVolume: 600, completedVolume: 600, qualityScore: 97, status: "QA Passed", lastUpdate: "Today 11:05 AM" },
      { id: "p13", participantName: "Yamane Risa", role: "Safety Reviewer", language: "Arabic MENA", assignedVolume: 650, completedVolume: 640, qualityScore: 95, status: "QA Passed", lastUpdate: "Today 10:42 AM" },
      { id: "p14", participantName: "Nayara Ribeiro", role: "Safety Reviewer", language: "Arabic MENA", assignedVolume: 550, completedVolume: 540, qualityScore: 93, status: "QA Passed", lastUpdate: "Today 10:20 AM" },
      { id: "p15", participantName: "Carlos Mendes", role: "Safety Reviewer", language: "Arabic MENA", assignedVolume: 500, completedVolume: 490, qualityScore: 92, status: "QA Passed", lastUpdate: "Today 9:58 AM" },
      { id: "p16", participantName: "Maria Gonzalez", role: "Safety Reviewer", language: "Arabic MENA", assignedVolume: 450, completedVolume: 440, qualityScore: 91, status: "QA Passed", lastUpdate: "Today 9:22 AM" },
      { id: "p17", participantName: "Lode Nuyts", role: "Safety Reviewer", language: "Arabic MENA", assignedVolume: 450, completedVolume: 390, qualityScore: 89, status: "Working", lastUpdate: "Today 9:12 AM" },
    ],
    files: [
      { id: "f8", fileName: "Arabic_Safety_Guide_v2.pdf", type: "Guidelines", updatedAt: "2026-04-27 11:00", owner: "Julie Zhu" },
      { id: "f9", fileName: "Safety_Exceptions_List.xlsx", type: "Source Files", updatedAt: "2026-04-27 11:45", owner: "Marco Silva" },
      { id: "f10", fileName: "QA_Notes_Round2.docx", type: "QA Report", updatedAt: "2026-04-27 12:00", owner: "Maya Chen" },
    ],
    notes: {
      blockers: "One client policy review is still pending sign-off.",
      qaNotes: "Quality is above threshold; only a final spot check remains.",
      clientFeedback: "Client asked to include clearer examples in the final summary.",
      nextAction: "Complete final QC and submit the handoff package.",
    },
  },
  {
    id: "task-vietnamese-asr",
    taskName: "Vietnamese ASR QA Batch",
    client: "Internal QA",
    projectType: "ASR QA",
    languageOrMarket: "Vietnamese",
    totalVolume: 1200,
    completedVolume: 1200,
    status: "Completed",
    dueDate: "2026-04-25",
    ownerPm: "Aisha Khan",
    participants: 4,
    description: "Completed Vietnamese ASR QA batch with final QA and delivery sign-off.",
    priority: "Low",
    createdAt: "2026-04-11 13:00",
    updatedAt: "2026-04-25 18:30",
    workflowStep: "Completed",
    managementTeam: [
      { name: "Aisha Khan", role: "Delivery Owner", email: "aisha@blackdog.tld", summary: "Owned the completed delivery cycle." },
      { name: "Julie Zhu", role: "Capability PM", email: "julie@blackdog.tld", summary: "Maintained ASR QA standards." },
      { name: "Daniel Kim", role: "Resource PM", email: "daniel@blackdog.tld", summary: "Managed coverage and allocation." },
      { name: "Maya Chen", role: "Client POC PM", email: "maya@blackdog.tld", summary: "Reported final delivery to the client." },
      { name: "Marco Silva", role: "QA Lead", email: "marco@blackdog.tld", summary: "Performed final verification and sign-off." },
    ],
    participantRows: [
      { id: "p18", participantName: "Tanchanok Pearl", role: "QA Reviewer", language: "Vietnamese", assignedVolume: 300, completedVolume: 300, qualityScore: 99, status: "Completed", lastUpdate: "Completed" },
      { id: "p19", participantName: "Yamane Risa", role: "QA Reviewer", language: "Vietnamese", assignedVolume: 300, completedVolume: 300, qualityScore: 98, status: "Completed", lastUpdate: "Completed" },
      { id: "p20", participantName: "Nayara Ribeiro", role: "QA Reviewer", language: "Vietnamese", assignedVolume: 300, completedVolume: 300, qualityScore: 97, status: "Completed", lastUpdate: "Completed" },
      { id: "p21", participantName: "Carlos Mendes", role: "QA Reviewer", language: "Vietnamese", assignedVolume: 300, completedVolume: 300, qualityScore: 96, status: "Completed", lastUpdate: "Completed" },
    ],
    files: [
      { id: "f11", fileName: "Vietnamese_ASR_Guide.pdf", type: "Guidelines", updatedAt: "2026-04-20 09:50", owner: "Aisha Khan" },
      { id: "f12", fileName: "Vietnamese_ASR_Source.zip", type: "Source Files", updatedAt: "2026-04-20 10:05", owner: "Daniel Kim" },
      { id: "f13", fileName: "Delivery_Pack_VN.pdf", type: "Delivery Files", updatedAt: "2026-04-25 18:30", owner: "Marco Silva" },
    ],
    notes: {
      blockers: "No open blockers.",
      qaNotes: "All QA checks completed and closed.",
      clientFeedback: "Client accepted the delivery without revisions.",
      nextAction: "Archive the batch and use as reference for future ASR work.",
    },
  },
];

function formatProgress(completed: number, total: number) {
  if (total <= 0) return 0;
  return Math.min((completed / total) * 100, 100);
}

function badgeForStatus(status: TaskStatus | ParticipantStatus | WorkflowStep) {
  if (status === "Completed" || status === "QA Passed") return "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]";
  if (status === "Blocked" || status === "Needs Revision") return "border-[#f5c2c7] bg-[#fdecec] text-[#b42318]";
  if (status === "QA Review" || status === "Client Review") return "border-[#f2d38b] bg-[#fff5d7] text-[#9a6700]";
  if (status === "In Progress" || status === "Working") return "border-[#b7d5fb] bg-[#eef5ff] text-[#1d4ed8]";
  if (status === "Submitted") return "border-[#d6c4ff] bg-[#f3edff] text-[#6b46c1]";
  return "border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]";
}

function SectionHeading({ label, subtitle }: { label: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1f5c43]">{label}</div>
      {subtitle ? <div className="mt-1 text-sm text-[#6b7280]">{subtitle}</div> : null}
    </div>
  );
}

function StepChip({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${active ? "border-[#1f5c43] bg-[#1f5c43] text-white" : "border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]"}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-white" : "bg-[#c3b49e]"}`} />
      {label}
    </div>
  );
}

function RowBadge({ children, className = "" }: { children: string; className?: string }) {
  return <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}>{children}</span>;
}

export function TaskManagementPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>(initialTasks);
  const [selectedTaskId, setSelectedTaskId] = useState(initialTasks[0]?.id ?? "");

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? tasks[0],
    [selectedTaskId, tasks],
  );

  const summary = useMemo(() => {
    const totalTasks = tasks.length;
    const activeTasks = tasks.filter((task) => task.status !== "Completed").length;
    const completedTasks = tasks.filter((task) => task.status === "Completed").length;
    const blockedTasks = tasks.filter((task) => task.status === "Blocked").length;
    const totalAssignedVolume = tasks.reduce((sum, task) => sum + task.totalVolume, 0);
    const totalCompletedVolume = tasks.reduce((sum, task) => sum + task.completedVolume, 0);

    return {
      totalTasks,
      activeTasks,
      completedTasks,
      blockedTasks,
      totalAssignedVolume,
      totalCompletedVolume,
    };
  }, [tasks]);

  const taskRows = useMemo(
    () =>
      tasks.map((task) => ({
        ...task,
        remainingVolume: Math.max(task.totalVolume - task.completedVolume, 0),
        progress: formatProgress(task.completedVolume, task.totalVolume),
      })),
    [tasks],
  );

  const participantRows = selectedTask?.participantRows ?? [];
  const taskRemaining = selectedTask ? Math.max(selectedTask.totalVolume - selectedTask.completedVolume, 0) : 0;
  const taskProgress = selectedTask ? formatProgress(selectedTask.completedVolume, selectedTask.totalVolume) : 0;

  const setRandomStatus = () => {
    if (!selectedTask) return;
    const nextStatuses: TaskStatus[] = ["Not Started", "In Progress", "QA Review", "Client Review", "Blocked", "Completed"];
    const next = nextStatuses[(nextStatuses.indexOf(selectedTask.status) + 1) % nextStatuses.length];
    setTasks((prev) => prev.map((task) => (task.id === selectedTask.id ? { ...task, status: next } : task)));
  };

  return (
    <main className="min-h-screen bg-[#f6f0e6] text-[#1f2937]">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-6 py-6">
        <section className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] px-6 py-5 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
          <div>
            <div className="text-2xl font-semibold tracking-tight text-[#111827]">Task Management</div>
            <div className="mt-1 max-w-3xl text-sm text-[#6b7280]">
              Manage client delivery tasks, progress, participants, files, and handoff readiness.
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SummaryCard label="Total Tasks" value={summary.totalTasks.toString()} />
          <SummaryCard label="Active Tasks" value={summary.activeTasks.toString()} />
          <SummaryCard label="Completed Tasks" value={summary.completedTasks.toString()} />
          <SummaryCard label="Blocked Tasks" value={summary.blockedTasks.toString()} />
          <SummaryCard label="Total Assigned Volume" value={summary.totalAssignedVolume.toLocaleString()} />
          <SummaryCard label="Total Completed Volume" value={summary.totalCompletedVolume.toLocaleString()} />
        </section>

        <section className="grid min-h-[980px] gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,0.75fr)]">
          <div className="flex min-h-0 flex-col gap-5">
            <div className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-4 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <SectionHeading label="Task List" subtitle="Client delivery tasks and operational tracking." />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[1380px] w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.16em] text-[#6f6256]">
                      {[
                        "Task Name",
                        "Client / Account",
                        "Project Type",
                        "Language / Market",
                        "Total Volume",
                        "Completed Volume",
                        "Remaining Volume",
                        "Progress",
                        "Status",
                        "Due Date",
                        "Owner PM",
                        "Participants",
                        "Actions",
                      ].map((heading) => (
                        <th key={heading} className="border-b border-[#eadfcd] px-3 py-3 font-semibold">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {taskRows.map((task) => (
                      <tr key={task.id} className="align-top">
                        <td className="border-b border-[#f0e6d7] px-3 py-4">
                          <button type="button" onClick={() => setSelectedTaskId(task.id)} className="text-left">
                            <div className="font-semibold text-[#111827]">{task.taskName}</div>
                            <div className="mt-1 max-w-[260px] text-xs text-[#6b7280]">{task.description}</div>
                          </button>
                        </td>
                        <td className="border-b border-[#f0e6d7] px-3 py-4 text-sm text-[#334155]">{task.client}</td>
                        <td className="border-b border-[#f0e6d7] px-3 py-4 text-sm text-[#334155]">{task.projectType}</td>
                        <td className="border-b border-[#f0e6d7] px-3 py-4 text-sm text-[#334155]">{task.languageOrMarket}</td>
                        <td className="border-b border-[#f0e6d7] px-3 py-4 text-sm font-semibold text-[#111827]">{task.totalVolume.toLocaleString()}</td>
                        <td className="border-b border-[#f0e6d7] px-3 py-4 text-sm font-semibold text-[#1f5c43]">{task.completedVolume.toLocaleString()}</td>
                        <td className="border-b border-[#f0e6d7] px-3 py-4 text-sm font-semibold text-[#b45309]">{task.remainingVolume.toLocaleString()}</td>
                        <td className="border-b border-[#f0e6d7] px-3 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2.5 w-40 overflow-hidden rounded-full bg-[#ece5d8]">
                              <div className="h-full rounded-full bg-[#1f5c43]" style={{ width: `${task.progress}%` }} />
                            </div>
                            <span className="text-sm font-semibold text-[#334155]">{task.progress.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="border-b border-[#f0e6d7] px-3 py-4">
                          <RowBadge className={badgeForStatus(task.status)}>{task.status}</RowBadge>
                        </td>
                        <td className="border-b border-[#f0e6d7] px-3 py-4 text-sm text-[#334155]">{task.dueDate}</td>
                        <td className="border-b border-[#f0e6d7] px-3 py-4 text-sm text-[#334155]">{task.ownerPm}</td>
                        <td className="border-b border-[#f0e6d7] px-3 py-4 text-sm text-[#334155]">{task.participants}</td>
                        <td className="border-b border-[#f0e6d7] px-3 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedTaskId(task.id)}
                              className="rounded-full border border-[#1f5c43] bg-[#1f5c43] px-3 py-1.5 text-xs font-semibold text-white"
                            >
                              View Detail
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedTaskId(task.id)}
                              className="rounded-full border border-[#d7cec0] bg-white px-3 py-1.5 text-xs font-semibold text-[#4b5563]"
                            >
                              Update Status
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-[#d7cec0] bg-white px-3 py-1.5 text-xs font-semibold text-[#4b5563]"
                            >
                              Open Files
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-4 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
              <SectionHeading label="Task Detail" subtitle="Selected client delivery task and participant progress." />

              {selectedTask ? (
                <div className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <DetailCard label="Task Name" value={selectedTask.taskName} />
                    <DetailCard label="Client / Account" value={selectedTask.client} />
                    <DetailCard label="Project Type" value={selectedTask.projectType} />
                    <DetailCard label="Language / Market" value={selectedTask.languageOrMarket} />
                    <DetailCard label="Total Volume" value={selectedTask.totalVolume.toLocaleString()} />
                    <DetailCard label="Completed Volume" value={selectedTask.completedVolume.toLocaleString()} />
                    <DetailCard label="Remaining Volume" value={taskRemaining.toLocaleString()} />
                    <DetailCard label="Progress" value={`${taskProgress.toFixed(0)}%`} />
                    <DetailCard label="Due Date" value={selectedTask.dueDate} />
                    <DetailCard label="Priority" value={selectedTask.priority} />
                    <DetailCard label="Current Status" value={selectedTask.status} />
                    <DetailCard label="Created At" value={selectedTask.createdAt} />
                    <DetailCard label="Last Updated" value={selectedTask.updatedAt} />
                  </div>

                  <div className="rounded-2xl border border-[#eadfcd] bg-white p-4">
                    <SectionHeading label="Management Team" subtitle="Responsible managers for this delivery task." />
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {selectedTask.managementTeam.map((manager) => (
                        <div key={`${selectedTask.id}-${manager.role}`} className="rounded-2xl border border-[#eadfcd] bg-[#fbfaf6] p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-[#111827]">{manager.name}</div>
                              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1f5c43]">{manager.role}</div>
                            </div>
                            <RowBadge className="border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]">{manager.email}</RowBadge>
                          </div>
                          <div className="mt-2 text-sm text-[#334155]">{manager.summary}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#eadfcd] bg-white p-4">
                    <SectionHeading label="Participant Progress Table" subtitle="Per-participant progress, quality, and status." />
                    <div className="overflow-x-auto">
                      <table className="min-w-[1400px] w-full border-separate border-spacing-0">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-[0.16em] text-[#6f6256]">
                            {[
                              "Participant Name",
                              "Role",
                              "Language",
                              "Assigned Volume",
                              "Completed Volume",
                              "Remaining Volume",
                              "Progress",
                              "Quality Score",
                              "Status",
                              "Last Update",
                              "Actions",
                            ].map((heading) => (
                              <th key={heading} className="border-b border-[#eadfcd] px-3 py-3 font-semibold">
                                {heading}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {participantRows.map((participant) => {
                            const remaining = Math.max(participant.assignedVolume - participant.completedVolume, 0);
                            const progress = formatProgress(participant.completedVolume, participant.assignedVolume);
                            return (
                              <tr key={participant.id}>
                                <td className="border-b border-[#f0e6d7] px-3 py-4 font-semibold text-[#111827]">{participant.participantName}</td>
                                <td className="border-b border-[#f0e6d7] px-3 py-4 text-sm text-[#334155]">{participant.role}</td>
                                <td className="border-b border-[#f0e6d7] px-3 py-4 text-sm text-[#334155]">{participant.language}</td>
                                <td className="border-b border-[#f0e6d7] px-3 py-4 text-sm font-semibold text-[#111827]">{participant.assignedVolume.toLocaleString()}</td>
                                <td className="border-b border-[#f0e6d7] px-3 py-4 text-sm font-semibold text-[#1f5c43]">{participant.completedVolume.toLocaleString()}</td>
                                <td className="border-b border-[#f0e6d7] px-3 py-4 text-sm font-semibold text-[#b45309]">{remaining.toLocaleString()}</td>
                                <td className="border-b border-[#f0e6d7] px-3 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-2.5 w-36 overflow-hidden rounded-full bg-[#ece5d8]">
                                      <div className="h-full rounded-full bg-[#1f5c43]" style={{ width: `${progress}%` }} />
                                    </div>
                                    <span className="text-sm font-semibold text-[#334155]">{progress.toFixed(0)}%</span>
                                  </div>
                                </td>
                                <td className="border-b border-[#f0e6d7] px-3 py-4 text-sm text-[#334155]">{participant.qualityScore}</td>
                                <td className="border-b border-[#f0e6d7] px-3 py-4">
                                  <RowBadge className={badgeForStatus(participant.status)}>{participant.status}</RowBadge>
                                </td>
                                <td className="border-b border-[#f0e6d7] px-3 py-4 text-sm text-[#334155]">{participant.lastUpdate}</td>
                                <td className="border-b border-[#f0e6d7] px-3 py-4">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedTaskId(selectedTask.id)}
                                    className="rounded-full border border-[#d7cec0] bg-white px-3 py-1.5 text-xs font-semibold text-[#4b5563]"
                                  >
                                    Actions
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#eadfcd] bg-white p-4">
                    <SectionHeading label="Task Workflow / Status Timeline" subtitle="Current delivery stage highlighted in sequence." />
                    <div className="flex flex-wrap gap-2">
                      {(["Draft", "Ready", "In Progress", "QA Review", "Client Review", "Completed"] as WorkflowStep[]).map((step) => (
                        <StepChip key={step} label={step} active={selectedTask.workflowStep === step} />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#eadfcd] bg-white p-4">
                    <SectionHeading label="Files / Guidelines / Deliverables" subtitle="Task resources and delivery materials." />
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {selectedTask.files.map((file) => (
                        <div key={file.id} className="rounded-2xl border border-[#eadfcd] bg-[#fbfaf6] p-3">
                          <div className="text-sm font-semibold text-[#111827]">{file.fileName}</div>
                          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[#1f5c43]">{file.type}</div>
                          <div className="mt-2 space-y-1 text-sm text-[#334155]">
                            <div>Updated at: {file.updatedAt}</div>
                            <div>Owner: {file.owner}</div>
                          </div>
                          <button
                            type="button"
                            className="mt-3 rounded-full border border-[#1f5c43] bg-[#1f5c43] px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Open
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#eadfcd] bg-white p-4">
                    <SectionHeading label="Notes / Risks" subtitle="Delivery blockers, QA notes, client feedback, and next action." />
                    <div className="grid gap-3 md:grid-cols-2">
                      <NoteCard label="Current Blockers" value={selectedTask.notes.blockers} />
                      <NoteCard label="QA Notes" value={selectedTask.notes.qaNotes} />
                      <NoteCard label="Client Feedback" value={selectedTask.notes.clientFeedback} />
                      <NoteCard label="Next Action" value={selectedTask.notes.nextAction} />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <aside className="flex min-h-0 flex-col gap-5">
            <div className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-4 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
              <SectionHeading label="Status Controls" subtitle="Mock visual controls for demo purposes only." />
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={setRandomStatus}
                  className="w-full rounded-full border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white"
                >
                  Update Status
                </button>
                <button
                  type="button"
                  className="w-full rounded-full border border-[#d7cec0] bg-white px-4 py-2 text-sm font-semibold text-[#4b5563]"
                >
                  View Files
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-4 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
              <SectionHeading label="Task Snapshot" subtitle="Quick operational summary of the selected task." />
              {selectedTask ? (
                <div className="space-y-2 text-sm">
                  <DetailRow label="Status" value={selectedTask.status} />
                  <DetailRow label="Priority" value={selectedTask.priority} />
                  <DetailRow label="Due Date" value={selectedTask.dueDate} />
                  <DetailRow label="Owner PM" value={selectedTask.ownerPm} />
                  <DetailRow label="Workflow Step" value={selectedTask.workflowStep} />
                </div>
              ) : null}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e4d7c6] bg-[#fbfaf6] p-4 shadow-[0_12px_28px_rgba(31,41,51,0.06)]">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6256]">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-[#111827]">{value}</div>
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#eadfcd] bg-[#fbfaf6] px-3 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6256]">{label}</div>
      <div className="mt-1 text-sm font-medium text-[#111827]">{value}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-[#eadfcd] bg-white px-3 py-2">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6256]">{label}</div>
      <div className="text-right text-sm font-medium text-[#111827]">{value}</div>
    </div>
  );
}

function NoteCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#eadfcd] bg-[#fbfaf6] p-3">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f6256]">{label}</div>
      <div className="mt-2 text-sm text-[#334155]">{value}</div>
    </div>
  );
}
