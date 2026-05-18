"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { PermissionFallback } from "@/components/auth/AccessGate";
import type { GenerateWorkTemplateResult } from "@/lib/ai/types";
import { canPerform, isClient, readPlatformUser } from "@/lib/permissions";

type WorkCenterSection = "admin" | "team";
type AdminModuleKey = "projects" | "project-setup" | "ai-template" | "assignments" | "accounts" | "teams" | "delivery" | "admin-tools";
type TeamModuleKey = "my-tasks" | "records" | "task-workspace" | "review" | "returned" | "members" | "team-progress";
type Role = "PM" | "Team Leader" | "Annotator" | "QA" | "QC" | "Rechecker";
type Team =
  | "BlackDog Internal Team"
  | "Polish Team"
  | "Arabic Standard Team"
  | "Indonesian Native Team"
  | "Japanese LLM Team";
type ProjectStatus = "Preparing" | "In Progress" | "Moderating" | "QA" | "Recheck" | "Finished" | "Closed";
type ProjectTab = "Overview" | "Records" | "Task Workspace" | "Assignment" | "Review" | "QA / Recheck" | "Export" | "Activity Log";
type SetupStep = 1 | 2 | 3 | 4 | 5 | 6;

type WorkProject = {
  id: string;
  name: string;
  client: string;
  team: Team;
  taskType: string;
  languages: string[];
  totalCases: number;
  completed: number;
  qcPending: number;
  returned: number;
  progress: number;
  status: ProjectStatus;
  createdAt: string;
  deadline: string;
};

type WorkRecord = {
  id: string;
  fileId: string;
  language: string;
  type: string;
  duration: string;
  annotator: string;
  qa: string;
  qc: string;
  createdAt: string;
  annotatedAt: string;
  annotatedDoneAt: string;
  annotationTime: string;
  qaAt: string;
  qaDoneAt: string;
  qaTime: string;
  status: string;
};

type WorkCase = {
  id: string;
  promptId: string;
  round: string;
  type: string;
  language: string;
  status: string;
  prompt: string;
  translation: string;
  textResponse: string;
  imagePromptUrl?: string;
  imageResponseUrl?: string;
};

type Notice = { tone: "success" | "error" | "info"; message: string } | null;

const adminModules: Array<{ id: AdminModuleKey; label: string; description: string }> = [
  { id: "projects", label: "Projects", description: "Lifecycle, status, and actions" },
  { id: "project-setup", label: "Project Setup", description: "Project data, rules, and publish" },
  { id: "ai-template", label: "AI Template Builder", description: "AI-assisted task templates" },
  { id: "assignments", label: "Assignments", description: "Role ownership and access" },
  { id: "accounts", label: "Accounts & Roles", description: "Work accounts and permissions" },
  { id: "teams", label: "Teams", description: "Team structure and access" },
  { id: "delivery", label: "Delivery", description: "Exports, sync, and closure" },
  { id: "admin-tools", label: "Admin Tools", description: "Import and validation tools" },
];

const teamModules: Array<{ id: TeamModuleKey; label: string; description: string }> = [
  { id: "my-tasks", label: "My Tasks", description: "Assigned work and next actions" },
  { id: "records", label: "Records", description: "Resources, owners, and status" },
  { id: "task-workspace", label: "Task Workspace", description: "Case execution and review" },
  { id: "review", label: "Review Center", description: "Review queues and returns" },
  { id: "returned", label: "Returned Cases", description: "Feedback and revision work" },
  { id: "members", label: "Team Members", description: "Team accounts and ownership" },
  { id: "team-progress", label: "Team Progress", description: "Execution progress by person" },
];

const teams: Team[] = [
  "BlackDog Internal Team",
  "Polish Team",
  "Arabic Standard Team",
  "Indonesian Native Team",
  "Japanese LLM Team",
];

const projectStatuses: Array<"All" | ProjectStatus> = ["All", "Preparing", "In Progress", "Moderating", "QA", "Recheck", "Finished", "Closed"];

const workCenterProjects: WorkProject[] = [
  {
    id: "p1",
    name: "Multimodal Image Evaluation",
    client: "TikTok",
    team: "Japanese LLM Team",
    taskType: "Multimodal Evaluation",
    languages: ["Japanese", "English"],
    totalCases: 120,
    completed: 38,
    qcPending: 14,
    returned: 6,
    progress: 42,
    status: "In Progress",
    createdAt: "2026-05-08",
    deadline: "2026-06-08",
  },
  {
    id: "p2",
    name: "Polish Record Resources",
    client: "Internal",
    team: "Polish Team",
    taskType: "Audio Recording QC",
    languages: ["Polish"],
    totalCases: 1,
    completed: 0,
    qcPending: 1,
    returned: 0,
    progress: 50,
    status: "Moderating",
    createdAt: "2026-05-10",
    deadline: "2026-05-22",
  },
  {
    id: "p3",
    name: "Minority Language OCR Review",
    client: "ByteDance",
    team: "Indonesian Native Team",
    taskType: "OCR Labeling",
    languages: ["Indonesian", "Javanese"],
    totalCases: 400,
    completed: 212,
    qcPending: 42,
    returned: 18,
    progress: 61,
    status: "QA",
    createdAt: "2026-04-28",
    deadline: "2026-06-18",
  },
  {
    id: "p4",
    name: "Arabic Dialect Evaluation",
    client: "Internal Demo",
    team: "Arabic Standard Team",
    taskType: "LLM Evaluation",
    languages: ["Arabic"],
    totalCases: 300,
    completed: 138,
    qcPending: 34,
    returned: 12,
    progress: 48,
    status: "In Progress",
    createdAt: "2026-05-03",
    deadline: "2026-06-02",
  },
  {
    id: "p5",
    name: "Translation Review Project",
    client: "SpeedX",
    team: "BlackDog Internal Team",
    taskType: "Translation QA",
    languages: ["English", "Portuguese-BR"],
    totalCases: 80,
    completed: 80,
    qcPending: 0,
    returned: 3,
    progress: 100,
    status: "Finished",
    createdAt: "2026-04-12",
    deadline: "2026-05-18",
  },
];

const workCenterRecords: WorkRecord[] = [
  {
    id: "r1",
    fileId: "ID0039-1",
    language: "Japanese",
    type: "I2I",
    duration: "Round 1/4",
    annotator: "Yamane Risa",
    qa: "Maya Chen",
    qc: "Daniel Kim",
    createdAt: "2026-05-10 10:20",
    annotatedAt: "2026-05-10 11:00",
    annotatedDoneAt: "2026-05-10 11:18",
    annotationTime: "18m",
    qaAt: "2026-05-10 13:10",
    qaDoneAt: "2026-05-10 13:22",
    qaTime: "12m",
    status: "QA Pending",
  },
  {
    id: "r2",
    fileId: "ID0039-2",
    language: "Japanese",
    type: "I2I",
    duration: "Round 2/4",
    annotator: "Rika Tanaka",
    qa: "Maya Chen",
    qc: "Daniel Kim",
    createdAt: "2026-05-10 10:22",
    annotatedAt: "2026-05-10 11:24",
    annotatedDoneAt: "2026-05-10 11:41",
    annotationTime: "17m",
    qaAt: "-",
    qaDoneAt: "-",
    qaTime: "-",
    status: "Annotated",
  },
  {
    id: "r3",
    fileId: "ID0040-1",
    language: "English",
    type: "T2I",
    duration: "Single",
    annotator: "Nayara Ribeiro",
    qa: "Maya Chen",
    qc: "Daniel Kim",
    createdAt: "2026-05-11 09:40",
    annotatedAt: "-",
    annotatedDoneAt: "-",
    annotationTime: "-",
    qaAt: "-",
    qaDoneAt: "-",
    qaTime: "-",
    status: "Not Started",
  },
  {
    id: "r4",
    fileId: "ID0041-1",
    language: "Arabic",
    type: "LLM",
    duration: "Case 1",
    annotator: "Omar Hassan",
    qa: "Maya Chen",
    qc: "Daniel Kim",
    createdAt: "2026-05-12 12:10",
    annotatedAt: "2026-05-12 12:50",
    annotatedDoneAt: "2026-05-12 13:18",
    annotationTime: "28m",
    qaAt: "2026-05-12 14:10",
    qaDoneAt: "-",
    qaTime: "-",
    status: "Returned",
  },
];

const workCenterCases: WorkCase[] = [
  {
    id: "ID0039-1",
    promptId: "ID0039",
    round: "1/4",
    type: "Multi",
    language: "Japanese",
    status: "Submitted",
    prompt: "Remove the people in the background and keep only the woman.",
    translation: "背景の人物を削除し、女性だけを残してください。",
    textResponse: "The output removed the background people and kept the woman as the main subject.",
    imagePromptUrl: "",
    imageResponseUrl: "",
  },
  {
    id: "ID0039-2",
    promptId: "ID0039",
    round: "2/4",
    type: "Multi",
    language: "Japanese",
    status: "In Progress",
    prompt: "Clean remaining artifacts near the hair and shoulder.",
    translation: "髪と肩の周辺に残ったアーティファクトを修正してください。",
    textResponse: "The output improved the edges but still has minor artifacts.",
    imagePromptUrl: "",
    imageResponseUrl: "",
  },
  {
    id: "ID0040-1",
    promptId: "ID0040",
    round: "1/1",
    type: "Single",
    language: "English",
    status: "Not Started",
    prompt: "Create a warm product photo of a ceramic coffee cup on a wooden desk.",
    translation: "Create a warm product photo of a ceramic coffee cup on a wooden desk.",
    textResponse: "The generated image shows a cup with warm light and a wooden table.",
    imagePromptUrl: "",
    imageResponseUrl: "",
  },
  {
    id: "ID0041-1",
    promptId: "ID0041",
    round: "1/3",
    type: "Multi",
    language: "Arabic",
    status: "Returned",
    prompt: "Rank the two model responses by factual accuracy.",
    translation: "رتب استجابتي النموذج حسب الدقة الواقعية.",
    textResponse: "Response B is more accurate but misses one required citation.",
    imagePromptUrl: "",
    imageResponseUrl: "",
  },
  {
    id: "ID0041-2",
    promptId: "ID0041",
    round: "2/3",
    type: "Multi",
    language: "Arabic",
    status: "QC Pending",
    prompt: "Check if the answer follows the dialect preference.",
    translation: "تحقق مما إذا كانت الإجابة تتبع تفضيل اللهجة.",
    textResponse: "The answer partially follows the requested dialect but uses standard terms.",
    imagePromptUrl: "",
    imageResponseUrl: "",
  },
];

const finalPTOptions = [
  "Single round - Main demand not met",
  "Single round - Secondary demand not met",
  "Multi round - Inconsistent with previous round",
  "I2I - Content deviation",
  "T2I - Prompt following issue",
];

function fallbackTemplate(): GenerateWorkTemplateResult {
  return {
    templateName: "Multimodal Image Evaluation Template",
    taskType: "Multimodal Evaluation",
    inputSchema: [
      { key: "sessionId", label: "session id", type: "text", sourceColumn: "session id", readonly: true },
      { key: "promptId", label: "prompt id", type: "text", sourceColumn: "prompt id", readonly: true },
      { key: "roundNumber", label: "round_number", type: "number", sourceColumn: "round_number", readonly: true },
      { key: "caseType", label: "Single/Multi", type: "text", sourceColumn: "Single/Multi", readonly: true },
      { key: "language", label: "Language", type: "text", sourceColumn: "Language", readonly: true },
      { key: "modality", label: "Input-Output Modality", type: "text", sourceColumn: "Input-Output Modality", readonly: true },
      { key: "textPrompt", label: "Text Prompt", type: "textarea", sourceColumn: "Text Prompt", readonly: true },
      { key: "translationTextPrompt", label: "Translation_Text Prompt", type: "textarea", sourceColumn: "Translation_Text Prompt", readonly: true },
      { key: "textResponse", label: "Text Response", type: "textarea", sourceColumn: "Text Response", readonly: true },
      { key: "imagePrompt1", label: "Image Prompt1", type: "image_url", sourceColumn: "Image Prompt1", readonly: true },
      { key: "imagePrompt2", label: "Image Prompt2", type: "image_url", sourceColumn: "Image Prompt2", readonly: true },
      { key: "imageResponse", label: "Image Response", type: "image_url", sourceColumn: "Image Response", readonly: true },
    ],
    outputSchema: [
      { key: "finalDCG", label: "final DCG", type: "select", options: ["0", "1", "2", "3", "4"], required: true, targetColumn: "final DCG" },
      { key: "frsDCG", label: "FRS DCG", type: "select", options: ["0", "1", "2", "3"], targetColumn: "FRS DCG" },
      { key: "finalPT", label: "final PT", type: "select", options: finalPTOptions, targetColumn: "final PT" },
      { key: "finalStabilityNeeded", label: "final stability needed?", type: "select", options: ["No", "Yes"], targetColumn: "final stability needed?" },
      { key: "finalStability", label: "final stability", type: "select", options: ["Stable", "Unstable"], targetColumn: "final stablity" },
      { key: "reason", label: "reason", type: "textarea", required: true, targetColumn: "reason" },
      { key: "done", label: "done", type: "select", options: ["done"], targetColumn: "done" },
      { key: "subjectiveScore", label: "subjective score?", type: "select", options: ["-", "0", "1"], targetColumn: "subjective score?" },
      { key: "subjectiveScoreReason", label: "subj score reason", type: "textarea", targetColumn: "subj score reason" },
    ],
    uiLayout: {
      leftPanel: "Case List",
      centerPanel: "Case Content",
      rightPanel: "Action Panel",
    },
    validationRules: ["final DCG required", "reason required", "FRS DCG only for final multi-round", "subjective score only for single-round"],
    workflowRules: ["Annotator submits cases", "QA/QC review required", "Recheck optional", "PM delivery sync"],
    rolePermissions: {
      pm: ["configure project", "assign team", "export"],
      teamLeader: ["assign tasks", "moderate progress"],
      labeler: ["annotate", "save draft", "submit"],
      qc: ["approve", "return"],
      rechecker: ["final approve", "return"],
    },
    exportMapping: {
      finalDCG: "final DCG",
      frsDCG: "FRS DCG",
      finalPT: "final PT",
      finalStabilityNeeded: "final stability needed?",
      finalStability: "final stablity",
      reason: "reason",
      done: "done",
      subjectiveScore: "subjective score?",
      subjectiveScoreReason: "subj score reason",
    },
  };
}

function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <div className="text-sm font-bold text-[#111827]">{title}</div>
      {subtitle ? <div className="mt-1 text-xs leading-5 text-[#6f6256]">{subtitle}</div> : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-[#eadfcd] bg-white px-3 py-2">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6f6256]">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-[#111827]">{value}</div>
    </div>
  );
}

function statusClass(status: string) {
  if (["Finished", "Final Approved", "Delivered", "Approved", "QC Passed"].includes(status)) return "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]";
  if (["In Progress", "Moderating", "QA", "QC Pending", "Submitted", "Annotated"].includes(status)) return "border-[#f1d39b] bg-[#fff8e8] text-[#9a5b13]";
  if (["Recheck", "Returned", "QC Returned"].includes(status)) return "border-[#f5c2c7] bg-[#fff5f5] text-[#b42318]";
  return "border-[#d7cec0] bg-[#f8f4ea] text-[#6f6256]";
}

export function WorkCenterPage() {
  const platformUser = readPlatformUser();
  const clientReadOnly = isClient(platformUser);
  const [activeSection, setActiveSection] = useState<WorkCenterSection>("admin");
  const [activeAdminModule, setActiveAdminModule] = useState<AdminModuleKey>("projects");
  const [activeTeamModule, setActiveTeamModule] = useState<TeamModuleKey>("my-tasks");
  const [currentTeam, setCurrentTeam] = useState<Team>("BlackDog Internal Team");
  const [role, setRole] = useState<Role>("PM");
  const [statusFilter, setStatusFilter] = useState<"All" | ProjectStatus>("All");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectTab, setProjectTab] = useState<ProjectTab>("Overview");
  const [recordsTab, setRecordsTab] = useState<"My Resources" | "Resource Pool">("My Resources");
  const [viewMode, setViewMode] = useState<"Annotator View" | "QA View" | "QC View" | "Rechecker View">("Annotator View");
  const [selectedCaseId, setSelectedCaseId] = useState("ID0039-2");
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<SetupStep>(1);
  const [notice, setNotice] = useState<Notice>(null);
  const [template, setTemplate] = useState<GenerateWorkTemplateResult>(fallbackTemplate());
  const [templateInstruction, setTemplateInstruction] = useState("Describe the task or ask AI to generate the task template.");
  const [templateLoading, setTemplateLoading] = useState(false);

  const selectedProject = workCenterProjects.find((project) => project.id === selectedProjectId) ?? null;
  const visibleProjects = useMemo(() => {
    return workCenterProjects.filter((project) => {
      const teamMatch = currentTeam === "BlackDog Internal Team" || project.team === currentTeam;
      const statusMatch = statusFilter === "All" || project.status === statusFilter;
      return teamMatch && statusMatch;
    });
  }, [currentTeam, statusFilter]);
  const selectedCase = workCenterCases.find((item) => item.id === selectedCaseId) ?? workCenterCases[0];

  function openSetup(step: SetupStep = 1) {
    if (clientReadOnly || !canPerform(platformUser, "project.configure")) {
      setNotice({ tone: "error", message: "No permission for project configuration." });
      return;
    }
    setSetupStep(step);
    setSetupOpen(true);
  }

  function openProject(projectId: string, tab: ProjectTab = "Overview") {
    setSelectedProjectId(projectId);
    setProjectTab(tab);
  }

  async function generateTemplate() {
    if (clientReadOnly || !canPerform(platformUser, "template.generate")) {
      setNotice({ tone: "error", message: "No permission to generate work templates." });
      return;
    }
    setTemplateLoading(true);
    setNotice({ tone: "info", message: "Generating template..." });
    try {
      const response = await fetch("/api/ai/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "generate_work_template",
          input: {
            projectName: selectedProject?.name || "Multimodal Image Evaluation",
            taskType: selectedProject?.taskType || "Multimodal Evaluation",
            filesSummary: "Test.xlsx, SOP.pdf, sample columns detected.",
            sampleColumns: ["session id", "prompt id", "round_number", "Text Prompt", "Image Prompt1", "Image Response", "reason"],
            sopSummary: "Review prompt, image input/output, model response, and submit structured final DCG, PT, reason, and status.",
            userInstruction: templateInstruction,
          },
        }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; result?: GenerateWorkTemplateResult } | null;
      setTemplate(payload?.ok && payload.result ? payload.result : fallbackTemplate());
      setNotice({ tone: payload?.ok ? "success" : "info", message: payload?.ok ? "Template generated." : "Fallback template generated." });
    } catch {
      setTemplate(fallbackTemplate());
      setNotice({ tone: "info", message: "AI unavailable. Fallback template generated." });
    } finally {
      setTemplateLoading(false);
    }
  }

  function roleActions() {
    if (clientReadOnly) return ["View"];
    if (role === "PM") return ["Configure", "Import Data", "Assign", "Pause", "Close", "Delete"];
    if (role === "Team Leader") return ["View", "Assign Tasks", "Review Progress", "Submit to QA"];
    if (role === "Annotator") return ["View My Tasks", "Start Task", "Continue"];
    if (role === "QA" || role === "QC") return ["View", "QA Check", "Approve", "Return"];
    return ["View", "Recheck", "Final Approve", "Return"];
  }

  function actionClick(action: string, project?: WorkProject) {
    if (action === "Configure" || action === "Import Data") openSetup(action === "Configure" ? 1 : 2);
    else if (action === "View" && project) openProject(project.id);
    else if (action.includes("Task")) {
      if (project) openProject(project.id, "Task Workspace");
      setActiveSection("admin");
      setActiveAdminModule("projects");
    } else setNotice({ tone: "info", message: `${action} is not connected yet.` });
  }

  function renderProjects() {
    if (selectedProject) return renderProjectDetail(selectedProject);
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle title="Projects" subtitle="Project lifecycle, status, and delivery actions." />
          {role === "PM" && canPerform(platformUser, "project.create") ? (
            <button type="button" onClick={() => openSetup(1)} className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white">
              Create Project
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 rounded-lg border border-[#e4d7c6] bg-[#fbfaf6] p-2">
          {projectStatuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-md px-3 py-2 text-sm font-semibold ${statusFilter === status ? "bg-[#1f5c43] text-white" : "text-[#6f6256] hover:bg-white"}`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="scroll-x-panel rounded-lg border border-[#e4d7c6] bg-white">
          <table className="data-table min-w-[1280px]">
            <thead>
              <tr>
                {["No", "Project Name", "Client", "Team", "Task Type", "Languages", "Total Cases", "Progress", "Status", "Created At", "Deadline", "Actions"].map((head, index) => (
                  <th key={head} className={index === 1 || index === 3 || index === 4 || index === 5 ? "th-left" : "th-center"}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleProjects.map((project, index) => (
                <tr key={project.id}>
                  <td className="td-center">{index + 1}</td>
                  <td className="td-left">
                    <button type="button" onClick={() => openProject(project.id)} className="font-bold text-[#1f5c43] hover:underline">
                      {project.name}
                    </button>
                  </td>
                  <td className="td-center">{project.client}</td>
                  <td className="td-left">{project.team}</td>
                  <td className="td-left">{project.taskType}</td>
                  <td className="td-left">{project.languages.join(", ")}</td>
                  <td className="td-center">{project.totalCases}</td>
                  <td className="td-center">{project.progress}%</td>
                  <td className="td-center"><Pill className={statusClass(project.status)}>{project.status}</Pill></td>
                  <td className="td-center">{project.createdAt}</td>
                  <td className="td-center">{project.deadline}</td>
                  <td className="td-actions">
                    <div className="flex flex-wrap gap-1">
                      {roleActions().slice(0, role === "PM" ? 4 : 3).map((action) => (
                        <button key={action} type="button" onClick={() => actionClick(action, project)} className="rounded-md border border-[#d7cec0] bg-[#fbfaf6] px-2 py-1 text-xs font-semibold text-[#4b5563] hover:border-[#1f5c43]">
                          {action}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderProjectDetail(project: WorkProject) {
    const tabs: ProjectTab[] = ["Overview", "Records", "Task Workspace", "Assignment", "Review", "QA / Recheck", "Export", "Activity Log"];
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setSelectedProjectId(null)} className="text-sm font-semibold text-[#1f5c43]">Back to Projects</button>
        <section className="rounded-lg border border-[#e4d7c6] bg-[#fbfaf6] p-4">
          <SectionTitle title="Project Overview" subtitle={project.name} />
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <Field label="Client" value={project.client} />
            <Field label="Team" value={project.team} />
            <Field label="Task Type" value={project.taskType} />
            <Field label="Status" value={<Pill className={statusClass(project.status)}>{project.status}</Pill>} />
            <Field label="Languages" value={project.languages.join(", ")} />
            <Field label="Total Cases" value={project.totalCases} />
            <Field label="Completed" value={project.completed} />
            <Field label="QC Pending" value={project.qcPending} />
            <Field label="Returned" value={project.returned} />
            <Field label="Deadline" value={project.deadline} />
          </div>
        </section>
        <div className="flex flex-wrap gap-2 rounded-lg border border-[#e4d7c6] bg-[#fbfaf6] p-2">
          {tabs.map((tab) => (
            <button key={tab} type="button" onClick={() => setProjectTab(tab)} className={`rounded-md px-3 py-2 text-sm font-semibold ${projectTab === tab ? "bg-[#1f5c43] text-white" : "text-[#6f6256] hover:bg-white"}`}>
              {tab}
            </button>
          ))}
        </div>
        {projectTab === "Overview" ? renderOverview(project) : null}
        {projectTab === "Records" ? renderRecords() : null}
        {projectTab === "Task Workspace" ? renderTaskWorkspace() : null}
        {projectTab === "Assignment" ? renderAssignment() : null}
        {projectTab === "Review" || projectTab === "QA / Recheck" ? renderReviewCenter() : null}
        {projectTab === "Export" ? renderDelivery() : null}
        {projectTab === "Activity Log" ? renderActivityLog() : null}
      </div>
    );
  }

  function renderOverview(project: WorkProject) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Field label="Progress" value={`${project.progress}%`} />
        <Field label="Current phase" value={project.status} />
        <Field label="Next action" value={role === "PM" ? "Configure template or assign team" : "Open assigned work"} />
      </div>
    );
  }

  function renderRecords() {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(["My Resources", "Resource Pool"] as const).map((tab) => (
              <button key={tab} type="button" onClick={() => setRecordsTab(tab)} className={`rounded-md px-3 py-2 text-sm font-semibold ${recordsTab === tab ? "bg-[#1f5c43] text-white" : "border border-[#d7cec0] bg-white text-[#4b5563]"}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(["Annotator View", "QA View", "QC View", "Rechecker View"] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => setViewMode(mode)} className={`rounded-md px-3 py-2 text-sm font-semibold ${viewMode === mode ? "bg-[#1f5c43] text-white" : "border border-[#d7cec0] bg-white text-[#4b5563]"}`}>
                {mode}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 rounded-lg border border-[#e4d7c6] bg-[#fbfaf6] p-3">
          {["Reset Status", "Assign Anno Admin", "Select Status", "Refresh", "Start Annotate"].map((action) => {
            const allowed = !clientReadOnly && (role === "PM" || role === "Team Leader" || (role === "Annotator" && action === "Start Annotate"));
            return allowed ? (
              <button key={action} type="button" onClick={() => setNotice({ tone: "info", message: `${action} is not connected yet.` })} className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-sm font-semibold text-[#4b5563]">
                {action}
              </button>
            ) : null;
          })}
        </div>
        <div className="scroll-x-panel rounded-lg border border-[#e4d7c6] bg-white">
          <table className="data-table min-w-[1500px]">
            <thead>
              <tr>
                {["Select", "No", "File / Case ID", "Duration / Language / Type", "Annotator", "QA", "QC", "Created At", "Annotated At", "Annotated Done At", "Annotation Time", "QA At", "QA Done At", "QA Time", "Status", "Actions"].map((head, index) => (
                  <th key={head} className={index === 2 || index === 3 ? "th-left" : "th-center"}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workCenterRecords.map((record, index) => (
                <tr key={record.id}>
                  <td className="td-center"><input type="checkbox" /></td>
                  <td className="td-center">{index + 1}</td>
                  <td className="td-left font-semibold text-[#111827]">{record.fileId}</td>
                  <td className="td-left">{record.duration} / {record.language} / {record.type}</td>
                  <td className="td-center">{record.annotator}</td>
                  <td className="td-center">{record.qa}</td>
                  <td className="td-center">{record.qc}</td>
                  <td className="td-center">{record.createdAt}</td>
                  <td className="td-center">{record.annotatedAt}</td>
                  <td className="td-center">{record.annotatedDoneAt}</td>
                  <td className="td-center">{record.annotationTime}</td>
                  <td className="td-center">{record.qaAt}</td>
                  <td className="td-center">{record.qaDoneAt}</td>
                  <td className="td-center">{record.qaTime}</td>
                  <td className="td-center"><Pill className={statusClass(record.status)}>{record.status}</Pill></td>
                  <td className="td-actions">
                    <div className="flex flex-wrap gap-1">
                      {recordActions().map((action) => (
                        <button key={action} type="button" onClick={() => setNotice({ tone: "info", message: `${action} is not connected yet.` })} className="rounded-md border border-[#d7cec0] bg-[#fbfaf6] px-2 py-1 text-xs font-semibold text-[#4b5563]">
                          {action}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function recordActions() {
    if (clientReadOnly) return ["View"];
    if (role === "Annotator") return ["Start", "Continue", "Submit"];
    if (role === "QA") return ["QA Check", "Pass", "Return"];
    if (role === "QC") return ["QC Check", "Approve", "Return"];
    if (role === "Rechecker") return ["Recheck", "Final Pass", "Return"];
    return ["View", "Assign", "Reset", "Export"];
  }

  function renderTaskWorkspace() {
    return (
      <section className="grid h-[760px] min-h-[760px] gap-4 xl:grid-cols-[320px_minmax(0,1fr)_460px]">
        <aside className="flex min-h-0 flex-col rounded-lg border border-[#e4d7c6] bg-[#fbfaf6]">
          <div className="border-b border-[#eadfcd] p-4">
            <SectionTitle title="Case List" subtitle="Assigned cases and review status." />
          </div>
          <div className="scroll-panel flex-1 p-3">
            {workCenterCases.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedCaseId(item.id)} className={`mb-2 w-full rounded-lg border p-3 text-left ${selectedCaseId === item.id ? "border-[#1f5c43] bg-[#eef7f1]" : "border-[#eadfcd] bg-white"}`}>
                <div className="font-bold text-[#111827]">{item.id}</div>
                <div className="mt-1 text-xs text-[#6f6256]">{item.promptId} · {item.round} · {item.type} · {item.language}</div>
                <Pill className={`mt-2 ${statusClass(item.status)}`}>{item.status}</Pill>
              </button>
            ))}
          </div>
        </aside>
        <section className="scroll-panel rounded-lg border border-[#e4d7c6] bg-[#fbfaf6] p-5">
          <SectionTitle title="Case Content" subtitle={selectedCase.id} />
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <Field label="Prompt ID" value={selectedCase.promptId} />
            <Field label="Round" value={selectedCase.round} />
            <Field label="Language" value={selectedCase.language} />
            <Field label="Status" value={selectedCase.status} />
          </div>
          <div className="mt-4 grid gap-3">
            <Field label="Prompt" value={selectedCase.prompt} />
            <Field label="Translation" value={selectedCase.translation} />
            <Field label="Text Response" value={selectedCase.textResponse} />
            <Field label="Rule Link" value="https://rules.example.com/project-guideline" />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ImageBox title="Image Prompt URL" value={selectedCase.imagePromptUrl} />
            <ImageBox title="Image Response URL" value={selectedCase.imageResponseUrl} />
          </div>
        </section>
        {renderActionPanel()}
      </section>
    );
  }

  function renderActionPanel() {
    if (clientReadOnly) {
      return (
        <aside className="scroll-panel rounded-lg border border-[#e4d7c6] bg-[#fbfaf6] p-5">
          <SectionTitle title="Read-only Case View" subtitle="Client accounts can inspect case status without submitting or reviewing." />
          <Field label="Current Status" value={selectedCase.status} />
          <Field label="Prompt ID" value={selectedCase.promptId} />
        </aside>
      );
    }
    if (role === "Annotator") {
      return (
        <aside className="scroll-panel rounded-lg border border-[#e4d7c6] bg-[#fbfaf6] p-5">
          <SectionTitle title="Action Panel" subtitle="Submit case work and draft updates." />
          <ScoreBlock />
          <label className="mt-4 block">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#6f6256]">final PT</div>
            <select className="mt-2 h-10 w-full rounded-lg border border-[#d9d2c7] bg-white px-3 text-sm">
              {finalPTOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <ToggleRow label="final stability needed?" items={["No", "Yes"]} />
          <ToggleRow label="final stability" items={["Stable", "Unstable"]} />
          <ToggleRow label="subjective score?" items={["-", "0", "1"]} />
          <textarea rows={5} placeholder="reason" className="mt-4 w-full rounded-lg border border-[#d9d2c7] bg-white px-3 py-2 text-sm" />
          <div className="mt-4 grid gap-2">
            {["Save Draft", "Submit This Case", "Submit & Next"].map((action, index) => (
              <button key={action} type="button" onClick={() => setNotice({ tone: "success", message: `${action} saved locally.` })} className={`rounded-md border px-4 py-2 text-sm font-semibold ${index === 1 ? "border-[#1f5c43] bg-[#1f5c43] text-white" : "border-[#d7cec0] bg-white text-[#4b5563]"}`}>
                {action}
              </button>
            ))}
          </div>
        </aside>
      );
    }
    if (role === "QA" || role === "QC") {
      return (
        <aside className="scroll-panel rounded-lg border border-[#e4d7c6] bg-[#fbfaf6] p-5">
          <SectionTitle title={role === "QA" ? "QA Feedback" : "QC Feedback"} subtitle="Review the submission and record a decision." />
          <Field label="Labeler Submission" value="final DCG: 3 · reason: minor artifact remains near subject edge." />
          <ToggleRow label={`${role} Decision`} items={["Pass", "Return"]} />
          <textarea rows={6} placeholder={`${role} feedback`} className="mt-4 w-full rounded-lg border border-[#d9d2c7] bg-white px-3 py-2 text-sm" />
          <button type="button" onClick={() => setNotice({ tone: "success", message: `${role} result submitted.` })} className="mt-4 w-full rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white">
            Submit {role} Result
          </button>
        </aside>
      );
    }
    if (role === "Rechecker") {
      return (
        <aside className="scroll-panel rounded-lg border border-[#e4d7c6] bg-[#fbfaf6] p-5">
          <SectionTitle title="Recheck Feedback" subtitle="Record final review feedback and outcome." />
          <Field label="QC Result" value="QC Returned · artifact issue" />
          <textarea rows={7} placeholder="Recheck Feedback" className="mt-4 w-full rounded-lg border border-[#d9d2c7] bg-white px-3 py-2 text-sm" />
          <div className="mt-4 grid gap-2">
            <button type="button" onClick={() => setNotice({ tone: "success", message: "Final Pass submitted." })} className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white">Final Pass</button>
            <button type="button" onClick={() => setNotice({ tone: "info", message: "Return saved locally." })} className="rounded-md border border-[#f5c2c7] bg-[#fff5f5] px-4 py-2 text-sm font-semibold text-[#b42318]">Return</button>
          </div>
        </aside>
      );
    }
    return (
      <aside className="scroll-panel rounded-lg border border-[#e4d7c6] bg-[#fbfaf6] p-5">
        <SectionTitle title="Readonly Controls" subtitle="Case coordination actions." />
        <Field label="Current Status" value={selectedCase.status} />
        <div className="mt-4 grid gap-2">
          {["Reassign", "Flag", "View History"].map((action) => (
            <button key={action} type="button" onClick={() => setNotice({ tone: "info", message: `${action} is not connected yet.` })} className="rounded-md border border-[#d7cec0] bg-white px-4 py-2 text-sm font-semibold text-[#4b5563]">
              {action}
            </button>
          ))}
        </div>
      </aside>
    );
  }

  function renderAssignment() {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {["Assign Team Leader", "Assign Annotators", "Assign QA", "Assign QC", "Assign Rechecker"].map((item) => (
          <div key={item} className="rounded-lg border border-[#e4d7c6] bg-[#fbfaf6] p-4">
            <SectionTitle title={item} subtitle={!clientReadOnly && (role === "PM" || role === "Team Leader") ? "Assignment can be updated for this scope." : "Assignment is read-only in this view."} />
            <button type="button" disabled={clientReadOnly || !(role === "PM" || role === "Team Leader")} onClick={() => setNotice({ tone: "info", message: `${item} is not connected yet.` })} className="mt-4 rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-sm font-semibold text-[#4b5563] disabled:opacity-45">
              Configure
            </button>
          </div>
        ))}
      </div>
    );
  }

  function renderReviewCenter() {
    const queues = [
      ["Moderation Queue", workCenterRecords.filter((item) => item.status === "Annotated")],
      ["QA Queue", workCenterRecords.filter((item) => item.status === "QA Pending")],
      ["QC Queue", workCenterRecords.filter((item) => item.status === "Annotated" || item.status === "QA Pending")],
      ["Recheck Queue", workCenterRecords.filter((item) => item.status === "Returned")],
      ["Returned Cases", workCenterRecords.filter((item) => item.status === "Returned")],
    ] as const;
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {queues.map(([queue, rows]) => (
          <div key={queue} className="rounded-lg border border-[#e4d7c6] bg-[#fbfaf6] p-4">
            <SectionTitle title={queue} subtitle={`${rows.length || 1} records`} />
            <div className="mt-3 space-y-2">
              {(rows.length ? rows : workCenterRecords.slice(0, 1)).map((row) => (
                <div key={`${queue}-${row.id}`} className="rounded-lg border border-[#eadfcd] bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold text-[#111827]">{row.fileId}</div>
                    <Pill className={statusClass(row.status)}>{row.status}</Pill>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {reviewActions().map((action) => (
                      <button key={action} type="button" onClick={() => setNotice({ tone: "info", message: `${action} is not connected yet.` })} className="rounded-md border border-[#d7cec0] bg-[#fbfaf6] px-2 py-1 text-xs font-semibold text-[#4b5563]">
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function reviewActions() {
    if (role === "QA") return ["QA Check", "Pass", "Return"];
    if (role === "QC") return ["QC Check", "Approve", "Return"];
    if (role === "Rechecker") return ["Recheck", "Final Pass", "Return"];
    if (role === "Annotator") return ["Open Returned Case"];
    return ["View"];
  }

  function renderDelivery() {
    const canOperate = role === "PM" && canPerform(platformUser, "delivery.sync");
    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-[#e4d7c6] bg-[#fbfaf6] p-4">
          <SectionTitle title="Ready for Delivery" subtitle="Completed records ready for export or sync." />
          <div className="mt-4 space-y-2">
            {workCenterProjects.filter((project) => project.status === "Finished").map((project) => (
              <div key={project.id} className="rounded-lg border border-[#eadfcd] bg-white p-3">
                <div className="font-semibold text-[#111827]">{project.name}</div>
                <div className="mt-1 text-sm text-[#6f6256]">{project.totalCases} cases · {project.client}</div>
              </div>
            ))}
          </div>
        </div>
        <aside className="rounded-lg border border-[#e4d7c6] bg-[#fbfaf6] p-4">
          <SectionTitle title="Export / Sync" subtitle={canOperate ? "Export and sync actions." : "Delivery status is read-only."} />
          <div className="mt-4 space-y-3">
            <Field label="Export Excel" value="final fields mapped to client columns" />
            <Field label="Sync to Lark" value="Not connected yet" />
            <Field label="Delivery History" value="2026-05-14 export generated" />
            {canOperate ? (
              <>
                <button type="button" onClick={() => setNotice({ tone: "info", message: "Export is not connected yet." })} className="w-full rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white">Export Excel</button>
                <button type="button" onClick={() => setNotice({ tone: "info", message: "Delivery sync is not connected yet." })} className="w-full rounded-md border border-[#d7cec0] bg-white px-4 py-2 text-sm font-semibold text-[#4b5563]">Sync to Lark</button>
                <button type="button" onClick={() => setNotice({ tone: "info", message: "Close Project is not connected yet." })} className="w-full rounded-md border border-[#d7cec0] bg-white px-4 py-2 text-sm font-semibold text-[#4b5563]">Close Project</button>
              </>
            ) : null}
          </div>
        </aside>
      </div>
    );
  }

  function renderTools() {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {["AI Template Builder", "Data Import Checker", "Export Mapping Checker", "Image URL Validator", "Batch Status Reset", "Reason Quality Checker"].map((tool) => (
          <div key={tool} className="rounded-lg border border-[#e4d7c6] bg-[#fbfaf6] p-4">
            <SectionTitle title={tool} subtitle={tool === "AI Template Builder" ? "Also available inside Project Setup." : "Tool access is not connected yet."} />
            <button type="button" onClick={() => tool === "AI Template Builder" ? openSetup(4) : setNotice({ tone: "info", message: `${tool} is not connected yet.` })} className="mt-4 rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-sm font-semibold text-[#4b5563]">
              Open
            </button>
          </div>
        ))}
      </div>
    );
  }

  function renderAdmins() {
    const accounts = [
      ["1", "Julie Zhu", "julie@blackdog.ai", "PM", "BlackDog Internal Team", "All Projects", "Active", "2026-05-15"],
      ["2", "Maya Chen", "maya@blackdog.ai", "Team Leader", "Japanese LLM Team", "Japanese projects", "Active", "2026-05-15"],
      ["3", "Yamane Risa", "risa@blackdog.ai", "Annotator", "Japanese LLM Team", "Assigned cases", "Active", "2026-05-14"],
      ["4", "Daniel Kim", "daniel@blackdog.ai", "QC", "BlackDog Internal Team", "QC queue", "Active", "2026-05-15"],
    ];
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle title="Accounts & Roles" subtitle="Delivery Hub working accounts and project permissions." />
          {role === "PM" && canPerform(platformUser, "user.create") ? (
            <div className="flex flex-wrap gap-2">
              {["Create Account", "Invite User", "Assign Role", "Disable Account"].map((action) => (
                <button key={action} type="button" onClick={() => setNotice({ tone: "info", message: `${action} is not connected yet.` })} className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-sm font-semibold text-[#4b5563]">{action}</button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="scroll-x-panel rounded-lg border border-[#e4d7c6] bg-white">
          <table className="data-table min-w-[1000px]">
            <thead><tr>{["No", "Name", "Email", "Role", "Team", "Project Access", "Status", "Last Login", "Actions"].map((head, index) => <th key={head} className={index === 1 || index === 2 || index === 4 || index === 5 ? "th-left" : "th-center"}>{head}</th>)}</tr></thead>
            <tbody>
              {accounts.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, index) => <td key={`${row[0]}-${index}`} className={index === 1 || index === 2 || index === 4 || index === 5 ? "td-left" : "td-center"}>{cell}</td>)}
                  <td className="td-actions"><button type="button" className="rounded-md border border-[#d7cec0] bg-[#fbfaf6] px-2 py-1 text-xs font-semibold text-[#4b5563]">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderTeams() {
    const teamRows = [
      ["BlackDog Internal Team", "Julie Zhu", "18", "English, Portuguese-BR", "3", "Active"],
      ["Polish Team", "Maja Kowalska", "6", "Polish", "1", "Active"],
      ["Arabic Standard Team", "Omar Hassan", "9", "Arabic", "2", "Active"],
      ["Indonesian Native Team", "Ayu Putri", "11", "Indonesian, Javanese", "1", "Active"],
      ["Japanese LLM Team", "Maya Chen", "8", "Japanese", "2", "Active"],
    ];
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle title="Teams" subtitle="Delivery teams and active project access." />
          {role === "PM" && canPerform(platformUser, "project.assign") ? (
            <div className="flex flex-wrap gap-2">
              {["Create Team", "Assign Team Leader", "Add Members"].map((action) => (
                <button key={action} type="button" onClick={() => setNotice({ tone: "info", message: `${action} is not connected yet.` })} className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-sm font-semibold text-[#4b5563]">{action}</button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="scroll-x-panel rounded-lg border border-[#e4d7c6] bg-white">
          <table className="data-table min-w-[920px]">
            <thead><tr>{["Team Name", "Team Leader", "Members", "Languages", "Active Projects", "Status", "Actions"].map((head, index) => <th key={head} className={index === 0 || index === 1 || index === 3 ? "th-left" : "th-center"}>{head}</th>)}</tr></thead>
            <tbody>
              {teamRows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, index) => <td key={`${row[0]}-${index}`} className={index === 0 || index === 1 || index === 3 ? "td-left" : "td-center"}>{cell}</td>)}
                  <td className="td-actions"><button type="button" className="rounded-md border border-[#d7cec0] bg-[#fbfaf6] px-2 py-1 text-xs font-semibold text-[#4b5563]">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderActivityLog() {
    return (
      <div className="rounded-lg border border-[#e4d7c6] bg-[#fbfaf6] p-4">
        <SectionTitle title="Activity Log" subtitle="Recent project activity." />
        <div className="mt-4 space-y-2 text-sm text-[#4b5563]">
          {["Project created", "Data source added", "AI template generated", "Annotators assigned", "QA returned one case"].map((item) => (
            <div key={item} className="rounded-lg border border-[#eadfcd] bg-white px-3 py-2">{item}</div>
          ))}
        </div>
      </div>
    );
  }

  function renderMyTasks() {
    return (
      <div className="space-y-4">
        <SectionTitle title="My Tasks" subtitle="Assigned task batches and next actions." />
        <div className="scroll-x-panel rounded-lg border border-[#e4d7c6] bg-white">
          <table className="data-table min-w-[1100px]">
            <thead><tr>{["No", "Project", "Task Batch", "Language", "Total Cases", "My Assigned", "Submitted", "Returned", "Deadline", "Status", "Actions"].map((head, index) => <th key={head} className={index === 1 || index === 2 || index === 3 ? "th-left" : "th-center"}>{head}</th>)}</tr></thead>
            <tbody>
              {workCenterProjects.slice(0, 4).map((project, index) => (
                <tr key={project.id}>
                  <td className="td-center">{index + 1}</td>
                  <td className="td-left">{project.name}</td>
                  <td className="td-left">{project.taskType} Batch</td>
                  <td className="td-left">{project.languages[0]}</td>
                  <td className="td-center">{project.totalCases}</td>
                  <td className="td-center">{role === "Annotator" ? 18 : role === "Team Leader" ? 64 : 22}</td>
                  <td className="td-center">{project.completed}</td>
                  <td className="td-center">{project.returned}</td>
                  <td className="td-center">{project.deadline}</td>
                  <td className="td-center"><Pill className={statusClass(project.status)}>{project.status}</Pill></td>
                  <td className="td-actions">
                    <div className="flex flex-wrap gap-1">
                      {(clientReadOnly
                        ? ["View"]
                        : role === "Team Leader"
                          ? ["Assign to members", "Create team account", "Invite member"]
                          : role === "Annotator"
                            ? ["Start", "Continue", "Submit"]
                            : role === "QA" || role === "QC"
                              ? [`${role} Check`, "Pass", "Return"]
                              : role === "Rechecker"
                                ? ["Final Pass", "Return"]
                                : ["View"]).map((action) => (
                        <button key={action} type="button" onClick={() => action.includes("Start") || action.includes("Continue") ? setActiveTeamModule("task-workspace") : setNotice({ tone: "info", message: `${action} is not connected yet.` })} className="rounded-md border border-[#d7cec0] bg-[#fbfaf6] px-2 py-1 text-xs font-semibold text-[#4b5563]">{action}</button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderReturnedCases() {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {workCenterRecords.filter((record) => record.status === "Returned").map((record) => (
          <div key={record.id} className="rounded-lg border border-[#e4d7c6] bg-[#fbfaf6] p-4">
            <SectionTitle title={record.fileId} subtitle="Returned case feedback and revision work." />
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Field label="Annotator" value={record.annotator} />
              <Field label="Feedback" value="Please revise scoring reason and check structural integrity." />
              <Field label="Status" value={<Pill className={statusClass(record.status)}>{record.status}</Pill>} />
              <Field label="QA / QC" value={`${record.qa} / ${record.qc}`} />
            </div>
            {!clientReadOnly && (role === "Annotator" || role === "Team Leader") ? (
              <button type="button" onClick={() => setActiveTeamModule("task-workspace")} className="mt-4 rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-2 text-sm font-semibold text-white">
                {role === "Annotator" ? "Revise and Resubmit" : "Open Team Case"}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  function renderTeamMembers() {
    const members = [
      ["1", "Maya Chen", "Team Leader", "Japanese", 64, 42, 4, "Active"],
      ["2", "Yamane Risa", "Annotator", "Japanese", 18, 13, 1, "Active"],
      ["3", "Rika Tanaka", "Annotator", "Japanese", 20, 11, 2, "Active"],
      ["4", "Daniel Kim", "QC", "English", 28, 22, 3, "Active"],
    ];
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle title="Team Members" subtitle="Team-scoped working accounts and task ownership." />
          {!clientReadOnly && role === "Team Leader" ? (
            <div className="flex flex-wrap gap-2">
              {["Create Team Account", "Invite Member", "Assign Tasks"].map((action) => (
                <button key={action} type="button" onClick={() => setNotice({ tone: "info", message: `${action} is not connected yet.` })} className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-sm font-semibold text-[#4b5563]">{action}</button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="scroll-x-panel rounded-lg border border-[#e4d7c6] bg-white">
          <table className="data-table min-w-[980px]">
            <thead><tr>{["No", "Name", "Role", "Language", "Assigned Cases", "Submitted", "Returned", "Status", "Actions"].map((head, index) => <th key={head} className={index === 1 || index === 2 || index === 3 ? "th-left" : "th-center"}>{head}</th>)}</tr></thead>
            <tbody>
              {members.map((row) => (
                <tr key={String(row[0])}>
                  {row.map((cell, index) => <td key={`${row[0]}-${index}`} className={index === 1 || index === 2 || index === 3 ? "td-left" : "td-center"}>{cell}</td>)}
                  <td className="td-actions"><button type="button" className="rounded-md border border-[#d7cec0] bg-[#fbfaf6] px-2 py-1 text-xs font-semibold text-[#4b5563]">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderTeamProgress() {
    return (
      <div className="scroll-x-panel rounded-lg border border-[#e4d7c6] bg-white">
        <table className="data-table min-w-[980px]">
          <thead><tr>{["Name", "Role", "Assigned", "Submitted", "QA Passed", "QC Passed", "Returned", "Completion Rate", "Status"].map((head, index) => <th key={head} className={index < 2 ? "th-left" : "th-center"}>{head}</th>)}</tr></thead>
          <tbody>
            {[
              ["Maya Chen", "Team Leader", 64, 42, 38, 31, 4, "66%", "Active"],
              ["Yamane Risa", "Annotator", 18, 13, 10, 8, 1, "72%", "Active"],
              ["Daniel Kim", "QC", 28, 22, 20, 17, 3, "79%", "Active"],
            ].map((row) => (
              <tr key={String(row[0])}>{row.map((cell, index) => <td key={`${row[0]}-${index}`} className={index < 2 ? "td-left" : "td-center"}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderAdminModule() {
    if (clientReadOnly && ["project-setup", "ai-template", "assignments", "accounts", "teams", "admin-tools"].includes(activeAdminModule)) {
      return <PermissionFallback type="no-permission" />;
    }
    if (activeAdminModule === "projects") return renderProjects();
    if (activeAdminModule === "project-setup") return renderSetupInline();
    if (activeAdminModule === "ai-template") return renderTemplateBuilder();
    if (activeAdminModule === "assignments") return renderAssignment();
    if (activeAdminModule === "accounts") return renderAdmins();
    if (activeAdminModule === "teams") return renderTeams();
    if (activeAdminModule === "delivery") return renderDelivery();
    return renderTools();
  }

  function renderTeamModule() {
    if (activeTeamModule === "my-tasks") return renderMyTasks();
    if (activeTeamModule === "records") return renderRecords();
    if (activeTeamModule === "task-workspace") return renderTaskWorkspace();
    if (activeTeamModule === "review") return renderReviewCenter();
    if (activeTeamModule === "returned") return renderReturnedCases();
    if (activeTeamModule === "members") return renderTeamMembers();
    return renderTeamProgress();
  }

  function renderSetupInline() {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 rounded-lg border border-[#e4d7c6] bg-[#fbfaf6] p-2">
          {["Project Info", "Data Source", "Rules / SOP", "AI Template Builder", "Assignment", "Publish"].map((label, index) => (
            <button key={label} type="button" onClick={() => setSetupStep((index + 1) as SetupStep)} className={`rounded-md px-3 py-2 text-sm font-semibold ${setupStep === index + 1 ? "bg-[#1f5c43] text-white" : "bg-white text-[#4b5563]"}`}>{label}</button>
          ))}
        </div>
        {setupStep === 1 ? renderSetupProjectInfo() : null}
        {setupStep === 2 ? renderSetupDataSource() : null}
        {setupStep === 3 ? renderSetupRules() : null}
        {setupStep === 4 ? renderTemplateBuilder() : null}
        {setupStep === 5 ? renderAssignment() : null}
        {setupStep === 6 ? renderPublishStep() : null}
      </div>
    );
  }

  const breadcrumb = selectedProject
    ? `Home / Delivery Hub / Projects / ${selectedProject.name}`
    : activeSection === "admin"
      ? `Home / Delivery Hub / Admin / ${adminModules.find((item) => item.id === activeAdminModule)?.label || "Projects"}`
      : `Home / Delivery Hub / Team / ${teamModules.find((item) => item.id === activeTeamModule)?.label || "My Tasks"}`;

  return (
    <main className="min-h-screen bg-[#f6f0e6] pb-24 pt-6 text-[#1f2937]">
      <div className="mx-auto w-[min(98vw,1880px)]">
        <section className="overflow-hidden rounded-xl border border-[#d0c3b3] bg-[#fbfaf6] shadow-[0_14px_32px_rgba(31,41,51,0.08)]">
          <div className="grid min-h-[860px] lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="border-r border-[#d8cdbc] bg-[#1f2b24] p-4 text-white">
              <div className="mb-5 rounded-lg border border-white/10 bg-white/8 p-3">
                <div className="text-lg font-black">Delivery Hub</div>
                <div className="mt-1 text-xs leading-5 text-white/65">Admin / Team console</div>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-white/8 p-1">
                {(["admin", "team"] as WorkCenterSection[]).map((section) => (
                  <button
                    key={section}
                    type="button"
                    onClick={() => { setActiveSection(section); setSelectedProjectId(null); }}
                    className={`rounded-md px-3 py-2 text-sm font-bold capitalize ${activeSection === section ? "bg-[#d7b46a] text-[#1f2b24]" : "text-white/80 hover:bg-white/10"}`}
                  >
                    {section}
                  </button>
                ))}
              </div>
              <nav className="space-y-1">
                {(activeSection === "admin" ? adminModules : teamModules).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (activeSection === "admin") setActiveAdminModule(item.id as AdminModuleKey);
                      else setActiveTeamModule(item.id as TeamModuleKey);
                      setSelectedProjectId(null);
                    }}
                    className={`w-full rounded-lg px-3 py-3 text-left transition ${
                      (activeSection === "admin" ? activeAdminModule : activeTeamModule) === item.id ? "bg-[#d7b46a] text-[#1f2b24]" : "text-white/82 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-sm font-bold">{item.label}</div>
                    <div className="mt-0.5 text-xs opacity-70">{item.description}</div>
                  </button>
                ))}
              </nav>
            </aside>
            <section className="min-w-0 bg-[#f7f2e8]">
              <header className="border-b border-[#e2d8c8] bg-[#fbfaf6] p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f6256]">{breadcrumb}</div>
                    <h1 className="mt-2 text-3xl font-black text-[#111827]">Delivery Hub</h1>
                    <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#6f6256]">
                      Manage delivery operations and execute project tasks through separate Admin and Team workspaces.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="block">
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#6f6256]">Current Team</div>
                      <select value={currentTeam} onChange={(event) => setCurrentTeam(event.target.value as Team)} className="mt-1 h-10 rounded-lg border border-[#d9d2c7] bg-white px-3 text-sm font-semibold">
                        {teams.map((team) => <option key={team}>{team}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#6f6256]">Current Role / View as</div>
                      <select value={role} onChange={(event) => setRole(event.target.value as Role)} className="mt-1 h-10 rounded-lg border border-[#d9d2c7] bg-white px-3 text-sm font-semibold">
                        {(["PM", "Team Leader", "Annotator", "QA", "QC", "Rechecker"] as Role[]).map((roleItem) => <option key={roleItem}>{roleItem}</option>)}
                      </select>
                    </label>
                  </div>
                </div>
              </header>
              {notice ? (
                <div className={`mx-5 mt-5 rounded-lg border px-4 py-3 text-sm font-semibold ${notice.tone === "success" ? "border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]" : notice.tone === "error" ? "border-[#f5c2c7] bg-[#fff5f5] text-[#b42318]" : "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]"}`}>
                  {notice.message}
                </div>
              ) : null}
              <div className="p-5">
                {activeSection === "admin" ? renderAdminModule() : renderTeamModule()}
              </div>
            </section>
          </div>
        </section>
      </div>
      {setupOpen ? renderSetupModal() : null}
    </main>
  );

  function renderSetupModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 px-4 py-8" onClick={() => setSetupOpen(false)}>
        <div className="scroll-panel max-h-[calc(100vh-64px)] w-[min(98vw,1880px)] rounded-xl border border-[#e4d7c6] bg-[#fbfaf6] p-6 shadow-[0_24px_70px_rgba(17,24,39,0.28)]" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between gap-3">
            <SectionTitle title="Project Setup" subtitle="Configure project data, rules, AI template, assignment, and publish state." />
            <button type="button" onClick={() => setSetupOpen(false)} className="rounded-md border border-[#d7cec0] bg-white px-3 py-1.5 text-sm font-semibold text-[#4b5563]">Close</button>
          </div>
          <div className="mt-5 grid gap-2 md:grid-cols-6">
            {["Project Info", "Data Source", "Rules / SOP", "AI Template Builder", "Assignment", "Publish"].map((label, index) => (
              <button key={label} type="button" onClick={() => setSetupStep((index + 1) as SetupStep)} className={`rounded-lg border p-3 text-left ${setupStep === index + 1 ? "border-[#1f5c43] bg-[#eef7f1]" : "border-[#eadfcd] bg-white"}`}>
                <div className="text-xs font-black text-[#1f5c43]">Step {index + 1}</div>
                <div className="mt-1 text-sm font-bold text-[#111827]">{label}</div>
              </button>
            ))}
          </div>
          <div className="mt-5">
            {setupStep === 1 ? renderSetupProjectInfo() : null}
            {setupStep === 2 ? renderSetupDataSource() : null}
            {setupStep === 3 ? renderSetupRules() : null}
            {setupStep === 4 ? renderTemplateBuilder() : null}
            {setupStep === 5 ? renderAssignment() : null}
            {setupStep === 6 ? renderPublishStep() : null}
          </div>
        </div>
      </div>
    );
  }

  function renderSetupProjectInfo() {
    return (
      <div className="rounded-lg border border-[#e4d7c6] bg-white p-5">
        <SectionTitle title="Step 1 Project Info" />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {["Project Name", "Client", "Team", "Task Type", "Languages", "Deadline"].map((label) => (
            <label key={label} className="block">
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#6f6256]">{label}</div>
              <input className="mt-2 h-10 w-full rounded-lg border border-[#d9d2c7] bg-[#fbfaf6] px-3 text-sm" placeholder={label} />
            </label>
          ))}
        </div>
      </div>
    );
  }

  function renderSetupDataSource() {
    return (
      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-lg border border-[#e4d7c6] bg-white p-5">
          <SectionTitle title="Step 2 Data Source" subtitle="Upload or link source data for setup." />
          <div className="mt-4 grid gap-2">
            {["Upload Excel / CSV", "Add Lark Sheet URL", "URL first", "Embedded Excel image supported later"].map((item) => (
              <button key={item} type="button" onClick={() => setNotice({ tone: "info", message: `${item} is not connected yet.` })} className="rounded-md border border-[#d7cec0] bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-[#4b5563]">
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="scroll-x-panel rounded-lg border border-[#e4d7c6] bg-white">
          <table className="data-table min-w-[760px]">
            <thead><tr>{["session id", "prompt id", "round_number", "Text Prompt", "Image Response URL", "Status"].map((head) => <th key={head} className="th-left">{head}</th>)}</tr></thead>
            <tbody>
              {workCenterCases.slice(0, 3).map((item) => (
                <tr key={item.id}><td>{item.promptId}</td><td>{item.id}</td><td>{item.round}</td><td>{item.prompt}</td><td>No image.</td><td>{item.status}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderSetupRules() {
    return (
      <div className="rounded-lg border border-[#e4d7c6] bg-white p-5">
        <SectionTitle title="Step 3 Rules / SOP" />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {["Upload SOP", "Add rules URL", "Add sample case"].map((item) => (
            <button key={item} type="button" onClick={() => setNotice({ tone: "info", message: `${item} is not connected yet.` })} className="rounded-md border border-[#d7cec0] bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-[#4b5563]">{item}</button>
          ))}
        </div>
      </div>
    );
  }

  function renderTemplateBuilder() {
    return (
      <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_460px]">
        <aside className="rounded-lg border border-[#e4d7c6] bg-white p-4">
          <SectionTitle title="Source Files" />
          <div className="mt-4 space-y-2">
            <Field label="Data" value="Test.xlsx" />
            <Field label="SOP" value="SOP.pdf" />
            <Field label="Sample columns" value="session id, prompt id, final DCG, reason" />
          </div>
        </aside>
        <section className="rounded-lg border border-[#e4d7c6] bg-white p-4">
          <SectionTitle title="AI Chat" subtitle="PM can generate or refine project templates." />
          <textarea value={templateInstruction} onChange={(event) => setTemplateInstruction(event.target.value)} rows={8} className="mt-4 w-full rounded-lg border border-[#d9d2c7] bg-[#fbfaf6] px-3 py-2 text-sm" placeholder="Describe the task or ask AI to generate the task template." />
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={templateLoading} onClick={generateTemplate} className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{templateLoading ? "Generating..." : "Generate Template"}</button>
            <button type="button" disabled={templateLoading} onClick={generateTemplate} className="rounded-md border border-[#d7cec0] bg-white px-4 py-2 text-sm font-semibold text-[#4b5563]">Regenerate</button>
          </div>
        </section>
        <aside className="scroll-panel max-h-[620px] rounded-lg border border-[#e4d7c6] bg-white p-4">
          <SectionTitle title="Template Preview" />
          <div className="mt-4 space-y-3">
            <Field label="Template" value={template.templateName} />
            <Field label="UI Layout" value={`${template.uiLayout.leftPanel} / ${template.uiLayout.centerPanel} / ${template.uiLayout.rightPanel}`} />
            <ListBlock title="Input Fields" items={template.inputSchema.map((field) => field.label)} />
            <ListBlock title="Output Fields" items={template.outputSchema.map((field) => field.label)} />
            <ListBlock title="Validation Rules" items={template.validationRules} />
            <ListBlock title="Workflow Rules" items={template.workflowRules} />
            <ListBlock title="Export Mapping" items={Object.entries(template.exportMapping).map(([key, value]) => `${key} -> ${value}`)} />
          </div>
        </aside>
      </section>
    );
  }

  function renderPublishStep() {
    return (
      <div className="rounded-lg border border-[#e4d7c6] bg-white p-5">
        <SectionTitle title="Step 6 Publish" subtitle="Publish project or save configuration draft." />
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setNotice({ tone: "success", message: "Project publish state saved locally." })} className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white">Publish Project</button>
          <button type="button" onClick={() => setNotice({ tone: "success", message: "Project draft saved." })} className="rounded-md border border-[#d7cec0] bg-white px-4 py-2 text-sm font-semibold text-[#4b5563]">Save Draft</button>
        </div>
      </div>
    );
  }
}

function ImageBox({ title, value }: { title: string; value?: string }) {
  return (
    <div className="rounded-lg border border-[#e4d7c6] bg-white p-3">
      <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#6f6256]">{title}</div>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={title} className="aspect-video w-full rounded-lg object-cover" />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-[#d7cec0] bg-[#fbfaf6] text-sm font-semibold text-[#6f6256]">No image.</div>
      )}
    </div>
  );
}

function ScoreBlock() {
  return (
    <div className="mt-4">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#6f6256]">final DCG</div>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {[0, 1, 2, 3, 4].map((score) => <button key={score} type="button" className="rounded-md border border-[#d7cec0] bg-white py-2 text-sm font-bold text-[#4b5563]">{score}</button>)}
      </div>
      <div className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-[#6f6256]">FRS DCG</div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((score) => <button key={score} type="button" className="rounded-md border border-[#d7cec0] bg-white py-2 text-sm font-bold text-[#4b5563]">{score}</button>)}
      </div>
    </div>
  );
}

function ToggleRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mt-4">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#6f6256]">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => <button key={item} type="button" className="rounded-md border border-[#d7cec0] bg-white px-3 py-2 text-sm font-semibold text-[#4b5563]">{item}</button>)}
      </div>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-[#eadfcd] bg-[#fbfaf6] p-3">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#1f5c43]">{title}</div>
      <ul className="mt-2 space-y-1 text-sm text-[#4b5563]">
        {items.map((item) => <li key={item}>- {item}</li>)}
      </ul>
    </div>
  );
}
