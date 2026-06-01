import Link from "next/link";
import { BlackDogBrainTaskWorkspace } from "./BlackDogBrainTaskWorkspace";

type BrainTrackId = "business" | "personal";
type BusinessModuleId = "brain-studio" | "project-lab" | "talent-workspace" | "workflow-monitor" | "deployment-center";
type PersonalModuleId =
  | "personal-need-studio"
  | "lifestyle-workflow-builder"
  | "private-app-builder"
  | "personal-data-vault"
  | "continuous-optimization";
type BrainModuleId = BusinessModuleId | PersonalModuleId;

type BrainModule = {
  id: BrainModuleId;
  name: string;
  path: string;
  positioning: string;
  description: string;
  roles: string[];
  features: string[];
  status: Array<[string, string]>;
  note?: string;
};

type BrainTrack = {
  id: BrainTrackId;
  name: string;
  path: string;
  audience: string;
  summary: string;
  description: string;
  loop: string[];
  assets: string[];
  modules: BrainModule[];
};

const businessModules: BrainModule[] = [
  {
    id: "brain-studio",
    name: "Brain Studio",
    path: "/blackdog-brain/business/brain-studio",
    positioning: "PM and BlackDog Brain collaboration space for evaluation logic design.",
    description: "Where PMs and solution designers turn client requirements into evaluation logic, scoring rules, QC standards, and delivery outputs.",
    roles: ["PM", "Solution Designer", "Evaluation Lead"],
    features: ["Requirement Interpreter", "Capability Breakdown", "Evaluation Method Design", "Rule Drafting", "QC Standard Designer", "Delivery Output Planner"],
    status: [["Requirement packs", "8 active"], ["Rule drafts", "14 versions"], ["QC standards", "6 ready"]],
  },
  {
    id: "project-lab",
    name: "Project Lab",
    path: "/blackdog-brain/business/project-lab",
    positioning: "Project builder for workbenches, pilots, calibration, and launch readiness.",
    description: "Convert evaluation logic into executable projects, dedicated workbenches, pilot batches, calibration rooms, and launch-ready workflows.",
    roles: ["PM", "QA Lead", "Project Owner", "Client Reviewer"],
    features: ["Project Setup", "Workbench Builder", "Field & Schema Builder", "Pilot Batch", "Calibration Room", "Guideline Versioning", "Launch Checklist"],
    status: [["Pilot batches", "5 running"], ["Guideline versions", "12 tracked"], ["Launch checks", "92% ready"]],
  },
  {
    id: "talent-workspace",
    name: "Talent Workspace",
    path: "/blackdog-brain/business/talent-workspace",
    positioning: "Execution workspace where expert talent completes model evaluation work.",
    description: "A dedicated workspace where evaluators and reviewers read guidelines, complete calibration, execute tasks, receive QA feedback, and build quality records.",
    roles: ["Evaluator", "Reviewer", "Resource Team", "QA"],
    features: ["Talent Matching", "Assignment Board", "Guideline Room", "Calibration Training", "Task Workbench", "Review & Feedback", "Quality Scorecard", "Workload Records"],
    status: [["Matched experts", "286"], ["Calibration pass", "87%"], ["QA feedback loops", "42 open"]],
    note: "Let talent focus on judgment. BlackDog handles structure, validation, formatting, feedback, and model-ready outputs.",
  },
  {
    id: "workflow-monitor",
    name: "Workflow Monitor",
    path: "/blackdog-brain/business/workflow-monitor",
    positioning: "Transparent project layer for progress, quality, risk, decisions, and delivery.",
    description: "A transparent delivery layer for tracking milestones, production, QC, risks, client decisions, and final model-ready packages.",
    roles: ["Client", "PM", "Delivery Team", "QA Lead"],
    features: ["Project Timeline", "Milestone Tracker", "Production Dashboard", "QC Dashboard", "Issue & Decision Log", "Client Confirmation", "Final Delivery Package"],
    status: [["Live projects", "18"], ["Risk items", "7 watched"], ["Client confirmations", "11 pending"]],
  },
  {
    id: "deployment-center",
    name: "Deployment Center",
    path: "/blackdog-brain/business/deployment-center",
    positioning: "Hosted, client-side, API, security, and handover center.",
    description: "Support both BlackDog-hosted operations and client-side deployment, connecting evaluation workbenches to client APIs and secure data environments.",
    roles: ["Client", "PM", "Technical Integration", "Delivery Team"],
    features: ["Hosted on BlackDog", "Client-side Deployment", "API Connection", "Data Security Settings", "Export Schema", "Handover Package"],
    status: [["Hosted workspaces", "9"], ["API handovers", "4 scoped"], ["Security modes", "3 templates"]],
  },
];

const personalModules: BrainModule[] = [
  {
    id: "personal-need-studio",
    name: "Personal Need Studio",
    path: "/blackdog-brain/personal/personal-need-studio",
    positioning: "Entry point for understanding personal needs, life scenarios, habits, and privacy boundaries.",
    description: "Understand what the individual needs, how they live, what they prefer, and what privacy boundaries should protect their data.",
    roles: ["Individual User", "Personal AI Designer"],
    features: ["Need Interview", "Lifestyle Scenario Mapping", "Habit Collection", "Goal Confirmation", "Privacy Boundary Setup"],
    status: [["Need maps", "12 drafted"], ["Privacy profiles", "8 ready"], ["Goal sets", "24 captured"]],
  },
  {
    id: "lifestyle-workflow-builder",
    name: "Lifestyle Workflow Builder",
    path: "/blackdog-brain/personal/lifestyle-workflow-builder",
    positioning: "Convert personal life needs into practical AI workflows.",
    description: "Turn daily life needs into assistant workflows, recommendation logic, reminder systems, feedback loops, and personal routines.",
    roles: ["Personal AI Designer", "Individual User"],
    features: ["Daily Routine Designer", "Recommendation Logic", "Reminder Flow", "Feedback Loop", "Personal Routine Map"],
    status: [["Routine flows", "18 active"], ["Reminders", "42 tuned"], ["Feedback loops", "9 learning"]],
  },
  {
    id: "private-app-builder",
    name: "Private App Builder",
    path: "/blackdog-brain/personal/private-app-builder",
    positioning: "Build private AI assistant apps, web apps, or mini app interfaces.",
    description: "Build a private AI app interface around the individual’s needs, connecting AI capability with personal context and daily use.",
    roles: ["Personal AI Designer", "Individual User", "Technical Builder"],
    features: ["App Interface Builder", "AI Assistant Setup", "Personal Feature Modules", "Device & Channel Settings", "App Preview"],
    status: [["App drafts", "6"], ["Feature modules", "21"], ["Preview builds", "4 ready"]],
  },
  {
    id: "personal-data-vault",
    name: "Personal Data Vault",
    path: "/blackdog-brain/personal/personal-data-vault",
    positioning: "Private vault for preferences, habits, feedback, and permission control.",
    description: "Protect personal preferences, habits, history, feedback, and permission settings in a secure private data vault.",
    roles: ["Individual User", "Privacy Owner"],
    features: ["Preference Profile", "Habit Memory", "Feedback History", "Permission Control", "Data Export / Delete"],
    status: [["Preference records", "156"], ["Permission sets", "5"], ["Export requests", "0 pending"]],
  },
  {
    id: "continuous-optimization",
    name: "Continuous Optimization",
    path: "/blackdog-brain/personal/continuous-optimization",
    positioning: "Improve the private assistant through feedback, behavior patterns, and personal goal updates.",
    description: "Continuously improve the assistant through user feedback, behavior patterns, usage review, and personal goal updates.",
    roles: ["Individual User", "Personal AI Designer"],
    features: ["Feedback Review", "Habit Update", "Assistant Behavior Tuning", "Usage Review", "Optimization Timeline"],
    status: [["Optimization cycles", "11"], ["Behavior updates", "34"], ["Goal reviews", "7 scheduled"]],
  },
];

const brainTracks: Record<BrainTrackId, BrainTrack> = {
  business: {
    id: "business",
    name: "Business Brain",
    path: "/blackdog-brain/business",
    audience: "For AI companies, model teams, data teams, and enterprise clients.",
    summary: "Turn AI model evaluation needs into structured workflows, dedicated workbenches, expert talent operations, quality control, and model-ready delivery.",
    description: "Build AI model evaluation systems for enterprise clients — from requirement interpretation and workflow design to talent execution, QC, deployment, and model-ready delivery.",
    loop: ["Client Requirement", "Brain Studio", "Project Lab", "Talent Workspace", "Workflow Monitor", "Deployment Center", "Reusable Business Assets"],
    assets: ["Evaluation Workflow Assets", "Rule & Standard Assets", "Workbench Assets", "Talent Operation Assets", "Delivery & Feedback Assets"],
    modules: businessModules,
  },
  personal: {
    id: "personal",
    name: "Personal Brain",
    path: "/blackdog-brain/personal",
    audience: "For individuals who want private AI apps built around their own life.",
    summary: "Turn personal needs into private AI assistants, lifestyle workflows, secure data vaults, and continuously optimized personalized apps.",
    description: "Build private AI assistants and personalized apps for individuals — turning personal needs, habits, preferences, and privacy boundaries into secure AI-powered life systems.",
    loop: ["Personal Need", "Personal Need Studio", "Lifestyle Workflow Builder", "Private App Builder", "Personal Data Vault", "Continuous Optimization", "Personal Intelligence Assets"],
    assets: ["Personal Preference Assets", "Lifestyle Workflow Assets", "Private App Assets", "Habit & Feedback Assets", "Personal Data Assets"],
    modules: personalModules,
  },
};

const sharedCapabilities = [
  "Understanding needs",
  "Designing workflows",
  "Generating interfaces",
  "Coordinating AI and human expertise",
  "Protecting data",
  "Improving through feedback",
];

const outfitTags = ["Wardrobe Memory", "Weather-aware Outfit", "Occasion Styling", "Travel Packing", "Preference Learning", "Private Data"];
const personalExamples = ["Fitness & Diet Assistant", "Study Assistant", "Work Productivity Assistant", "Family Assistant", "Travel Planner", "Habit & Mood Assistant"];

function moduleIntroText(track: BrainTrack, workspace: BrainModule) {
  if (track.id === "business") {
    return "Structured workspace entry for standards, ownership, validation, and project memory.";
  }
  if (workspace.id === "personal-data-vault") {
    return "Private workspace entry for consent, permissions, preference memory, and data control.";
  }
  return "Personal system entry for translating life context into useful assistant behavior.";
}

export function BlackDogBrainHome() {
  return (
    <main className="min-h-screen bg-[#f8f5ec] pb-24 pt-6 text-[#111827]">
      <div className="page-shell space-y-6">
        <section className="overflow-hidden rounded-2xl border border-[#d0c3b3] bg-[#fbfaf6] shadow-[0_18px_46px_rgba(31,41,51,0.10)]">
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
            <div className="border-b border-[#e2d8c8] p-5 sm:p-6 xl:border-b-0 xl:border-r">
              <div className="inline-flex rounded-full border border-[#d7cec0] bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#9a6a35]">
                Loyal to the task. Sharp with the standard. Reliable through delivery.
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-[#111827] md:text-5xl">BlackDog Brain</h1>
              <div className="mt-2 max-w-4xl text-sm font-black uppercase leading-6 tracking-[0.14em] text-[#1f5c43]">
                The brain that turns human needs into AI-powered workflows, workspaces, and personalized operating systems.
              </div>
              <p className="mt-5 max-w-4xl text-lg font-bold leading-7 text-[#1f5c43]">
                For businesses, BlackDog Brain builds AI model evaluation workflows and delivery systems. For individuals, it builds private AI assistants and personalized apps.
              </p>
              <p className="mt-4 max-w-4xl text-sm font-medium leading-6 text-[#6f6256]">
                BlackDog Brain transforms complex needs into usable systems: understanding requirements, designing workflows, generating interfaces, coordinating AI and human expertise, and continuously improving through feedback.
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Shared brain capabilities</div>
              <div className="grid gap-2">
                {sharedCapabilities.map((capability, index) => (
                  <div key={capability} className="grid grid-cols-[34px_minmax(0,1fr)] items-center gap-3 rounded-xl border border-[#e2d8c8] bg-white px-3 py-2.5 shadow-[0_8px_18px_rgba(31,41,51,0.04)]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f5c43] font-mono text-xs font-black text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-black text-[#111827]">{capability}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          {Object.values(brainTracks).map((track) => (
            <Link key={track.id} href={track.path} className="group flex min-h-[360px] flex-col rounded-2xl border border-[#d0c3b3] bg-white p-5 shadow-[0_14px_32px_rgba(31,41,51,0.08)] transition hover:-translate-y-0.5 hover:border-[#1f5c43] hover:bg-[#fbfaf6] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full border border-[#d7cec0] bg-[#fbfaf6] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#9a6a35]">
                  {track.id === "business" ? "Enterprise systems" : "Private life systems"}
                </span>
                <span className="rounded-full border border-[#c9dfd0] bg-[#edf8f1] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#1f5c43]">
                  Enter {track.id === "business" ? "Business Brain" : "Personal Brain"}
                </span>
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-[#111827]">{track.name}</h2>
              <p className="mt-3 text-sm font-black uppercase leading-5 tracking-[0.12em] text-[#1f5c43]">{track.audience}</p>
              <p className="mt-4 text-base font-bold leading-7 text-[#40372f]">{track.summary}</p>
              <div className="mt-6 grid gap-2">
                {track.loop.slice(0, 5).map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] px-3 py-2.5">
                    <span className="font-mono text-xs font-black text-[#9a6a35]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="text-sm font-black text-[#111827]">{step}</span>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-5 text-sm font-black text-[#1f5c43] group-hover:underline">
                {track.id === "business" ? "Enter Business Brain" : "Enter Personal Brain"}
              </div>
            </Link>
          ))}
        </section>

        <section className="rounded-2xl border border-[#d0c3b3] bg-[#fbfaf6] p-5 shadow-[0_10px_24px_rgba(31,41,51,0.06)] sm:p-6">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">One brain, two operating tracks</div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sharedCapabilities.map((capability) => (
              <div key={capability} className="rounded-xl border border-[#e2d8c8] bg-white p-4 shadow-[0_8px_18px_rgba(31,41,51,0.04)]">
                <div className="text-sm font-black text-[#111827]">{capability}</div>
                <p className="mt-2 text-xs font-medium leading-5 text-[#6f6256]">
                  Applied to enterprise evaluation systems and private AI life systems without mixing their data, audience, or operating boundaries.
                </p>
              </div>
            ))}
          </div>
        </section>

        <BlackDogBrainTaskWorkspace />
      </div>
    </main>
  );
}

export function BlackDogBrainTrackPage({ trackId }: { trackId: BrainTrackId }) {
  const track = brainTracks[trackId];

  return (
    <main className="min-h-screen bg-[#f8f5ec] pb-24 pt-6 text-[#111827]">
      <div className="page-shell space-y-6">
        <section className="rounded-2xl border border-[#d0c3b3] bg-[#fbfaf6] p-5 shadow-[0_18px_46px_rgba(31,41,51,0.10)] sm:p-6">
          <Link href="/blackdog-brain" className="text-xs font-black uppercase tracking-[0.16em] text-[#1f5c43]">
            Back to BlackDog Brain
          </Link>
          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
            <div>
              <div className="inline-flex rounded-full border border-[#d7cec0] bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#9a6a35]">
                {track.id === "business" ? "Business operating track" : "Personal operating track"}
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-[#111827]">{track.name}</h1>
              <p className="mt-4 max-w-4xl text-lg font-bold leading-7 text-[#1f5c43]">{track.description}</p>
              <p className="mt-3 max-w-4xl text-sm font-medium leading-6 text-[#6f6256]">{track.summary}</p>
            </div>
            <div className="rounded-xl border border-[#e2d8c8] bg-white p-4 shadow-[0_10px_24px_rgba(31,41,51,0.06)]">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">{track.name} loop</div>
              <div className="mt-3 grid gap-2">
                {track.loop.map((step, index) => (
                  <div key={step} className="grid grid-cols-[34px_minmax(0,1fr)] items-center gap-3 rounded-lg border border-[#e2d8c8] bg-[#fbfaf6] px-3 py-2">
                    <span className="font-mono text-xs font-black text-[#9a6a35]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="text-sm font-black text-[#111827]">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#d0c3b3] bg-white p-5 shadow-[0_14px_32px_rgba(31,41,51,0.08)] sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Workspaces</div>
              <h2 className="mt-2 text-2xl font-black text-[#111827]">Enter a {track.name} module</h2>
            </div>
            <p className="max-w-2xl text-sm font-medium leading-6 text-[#6f6256]">
              Each module opens as a focused work page with role context, functional entries, and status signals.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            {track.modules.map((workspace, index) => (
              <Link key={workspace.id} href={workspace.path} className="flex min-h-[230px] flex-col rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] p-4 shadow-[0_12px_24px_rgba(31,41,51,0.06)] transition hover:-translate-y-0.5 hover:border-[#1f5c43] hover:bg-[#edf8f1]">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-black text-[#9a6a35]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="rounded-full border border-[#d7cec0] bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#6f6256]">Open</span>
                </div>
                <h3 className="mt-4 text-lg font-black leading-6 text-[#111827]">{workspace.name}</h3>
                <p className="mt-3 text-sm font-medium leading-5 text-[#6f6256]">{workspace.positioning}</p>
                <div className="mt-auto pt-4 text-xs font-black text-[#1f5c43]">View workspace</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-5">
          {track.assets.map((asset) => (
            <div key={asset} className="rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] p-5 shadow-[0_10px_24px_rgba(31,41,51,0.06)]">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Asset layer</div>
              <h3 className="mt-2 text-base font-black leading-6 text-[#111827]">{asset}</h3>
            </div>
          ))}
        </section>

        {track.id === "personal" ? <PersonalBrainExample /> : null}
      </div>
    </main>
  );
}

export function BlackDogBrainModulePage({ trackId = "business", moduleId }: { trackId?: BrainTrackId; moduleId: BrainModuleId }) {
  const track = brainTracks[trackId];
  const currentModule = track.modules.find((item) => item.id === moduleId) ?? track.modules[0];
  const relatedModules = track.modules.filter((item) => item.id !== currentModule.id);

  return (
    <main className="min-h-screen bg-[#f8f5ec] pb-24 pt-6 text-[#111827]">
      <div className="page-shell space-y-6">
        <section className="rounded-2xl border border-[#d0c3b3] bg-[#fbfaf6] p-5 shadow-[0_18px_46px_rgba(31,41,51,0.10)] sm:p-6">
          <Link href={track.path} className="text-xs font-black uppercase tracking-[0.16em] text-[#1f5c43]">
            Back to {track.name}
          </Link>
          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
            <div>
              <div className="inline-flex rounded-full border border-[#d7cec0] bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#9a6a35]">
                {track.name}
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-[#111827]">{currentModule.name}</h1>
              <p className="mt-4 max-w-4xl text-lg font-bold leading-7 text-[#1f5c43]">{currentModule.positioning}</p>
              <p className="mt-3 max-w-4xl text-sm font-medium leading-6 text-[#6f6256]">{currentModule.description}</p>
              {currentModule.note ? (
                <p className="mt-4 rounded-xl border border-[#c9dfd0] bg-[#edf8f1] px-4 py-3 text-sm font-bold leading-6 text-[#1f5c43]">
                  {currentModule.note}
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-[#e2d8c8] bg-white p-4 shadow-[0_10px_24px_rgba(31,41,51,0.06)]">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Using roles</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {currentModule.roles.map((role) => (
                  <span key={role} className="rounded-full border border-[#d7cec0] bg-[#fbfaf6] px-3 py-1 text-xs font-bold text-[#6f6256]">{role}</span>
                ))}
              </div>
              <div className="mt-5 grid gap-2">
                {currentModule.status.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-[#e2d8c8] bg-[#fbfaf6] px-3 py-2">
                    <span className="text-xs font-bold text-[#6f6256]">{label}</span>
                    <span className="font-mono text-sm font-black text-[#1f5c43]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#d0c3b3] bg-white p-5 shadow-[0_14px_32px_rgba(31,41,51,0.08)] sm:p-6">
          <div className="mb-5">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Functional entries</div>
            <h2 className="mt-2 text-2xl font-black text-[#111827]">Work areas inside {currentModule.name}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {currentModule.features.map((feature) => (
              <div key={feature} className="rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] p-4 shadow-[0_10px_22px_rgba(31,41,51,0.05)]">
                <div className="text-sm font-black text-[#111827]">{feature}</div>
                <p className="mt-2 text-xs font-medium leading-5 text-[#6f6256]">{moduleIntroText(track, currentModule)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#d0c3b3] bg-[#fbfaf6] p-5 shadow-[0_10px_24px_rgba(31,41,51,0.06)] sm:p-6">
          <div className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Connected {track.name} workspaces</div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {relatedModules.slice(0, 4).map((item) => (
              <Link key={item.id} href={item.path} className="rounded-xl border border-[#e2d8c8] bg-white p-4 text-sm font-black text-[#111827] shadow-[0_8px_18px_rgba(31,41,51,0.04)] hover:border-[#1f5c43]">
                {item.name}
              </Link>
            ))}
          </div>
        </section>

        {track.id === "personal" ? <PersonalBrainExample compact /> : null}
      </div>
    </main>
  );
}

function PersonalBrainExample({ compact = false }: { compact?: boolean }) {
  return (
    <section className="rounded-2xl border border-[#d0c3b3] bg-white p-5 shadow-[0_14px_32px_rgba(31,41,51,0.08)] sm:p-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.16em] text-[#6f6256]">Example scenario</div>
          <h2 className="mt-2 text-2xl font-black text-[#111827]">Private Outfit Assistant</h2>
          <p className="mt-3 text-sm font-medium leading-6 text-[#6f6256]">
            A personal AI assistant that understands wardrobe items, body type, style preferences, weather, schedule, mood, and occasion — then recommends outfits, travel packing lists, and learns from user feedback.
          </p>
          <p className="mt-3 text-xs font-bold leading-5 text-[#9a6a35]">
            This is only one example. Personal Brain can also extend to fitness, study, productivity, family, travel, habits, and mood systems.
          </p>
        </div>
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            {outfitTags.map((tag) => (
              <span key={tag} className="rounded-full border border-[#d7cec0] bg-[#fbfaf6] px-3 py-1 text-xs font-bold text-[#6f6256]">{tag}</span>
            ))}
          </div>
          {!compact ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {personalExamples.map((example) => (
                <div key={example} className="rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] px-3 py-2 text-sm font-black text-[#111827]">
                  {example}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
