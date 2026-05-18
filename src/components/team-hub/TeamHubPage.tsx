"use client";

import { useMemo, useState } from "react";
import { isClient, isRootOwner, readPlatformUser } from "@/lib/permissions";
import { ProjectDeliverySwimlane } from "@/components/team-hub/ProjectDeliverySwimlane";

type TeamHubTab = "Overview" | "Managers" | "Teams" | "Profiles" | "Groups" | "Performance";

type ManagerRole = "Project Manager" | "Resource Manager" | "POC Manager";

type ManagerProfile = {
  id: string;
  name: string;
  role: ManagerRole;
  region: string;
  languages: string[];
  specialties: string[];
  projectsDelivered: number;
  currentLoad: string;
  availability: "Available" | "Limited" | "Busy";
  rating: number;
  responseTime: string;
  workStyle: string;
  representativeProjects: string[];
  avatarColor: string;
};

type DeliveryTeam = {
  id: string;
  name: string;
  displayName: string;
  projectManager: string;
  resourceManager: string;
  pocManager: string;
  languages: string[];
  bestFit: string[];
  availability: "Available" | "Limited" | "Busy";
  overviewStatus: "Recommended" | "Available" | "Limited" | "Backup";
  deliveredProjects: number;
  rating: number;
};

type ProjectGroup = {
  name: string;
  project: string;
  client: string;
  projectManager: string;
  resourceManager: string;
  pocManager: string;
  members: number;
  lastActivity: string;
  status: string;
};

const tabs: TeamHubTab[] = ["Overview", "Managers", "Teams", "Profiles", "Groups", "Performance"];

const managers: ManagerProfile[] = [
  {
    id: "julie",
    name: "Julie Zhu",
    role: "Project Manager",
    region: "APAC",
    languages: ["Japanese", "Korean", "English"],
    specialties: ["LLM Evaluation", "QA Review", "Multilingual Ranking"],
    projectsDelivered: 38,
    currentLoad: "68%",
    availability: "Available",
    rating: 4.9,
    responseTime: "< 1h",
    workStyle: "Structured delivery owner with strong client cadence and risk tracking.",
    representativeProjects: ["Japanese LLM Evaluation", "Korean Safety Ranking", "APAC QA Review"],
    avatarColor: "bg-[#1f5c43]",
  },
  {
    id: "maya",
    name: "Maya Chen",
    role: "Resource Manager",
    region: "Global",
    languages: ["Japanese", "Korean", "English"],
    specialties: ["Native Talent Matching", "Backup Pools", "Availability Planning"],
    projectsDelivered: 31,
    currentLoad: "61%",
    availability: "Available",
    rating: 4.8,
    responseTime: "< 2h",
    workStyle: "Fast resource planner focused on stable native capacity and backup coverage.",
    representativeProjects: ["TikTok LLM Evaluation", "Gaming Localization QA", "Korean Ranking Pool"],
    avatarColor: "bg-[#2f6f73]",
  },
  {
    id: "daniel",
    name: "Daniel Kim",
    role: "POC Manager",
    region: "APAC",
    languages: ["English", "Japanese", "Korean"],
    specialties: ["Client Updates", "Feedback Loops", "Issue Routing"],
    projectsDelivered: 27,
    currentLoad: "54%",
    availability: "Available",
    rating: 4.8,
    responseTime: "< 1h",
    workStyle: "Clear communicator who keeps client feedback organized and actionable.",
    representativeProjects: ["Japanese LLM Eval", "Korean QA Sprint", "Client Feedback Ops"],
    avatarColor: "bg-[#9a6a35]",
  },
  {
    id: "aisha",
    name: "Aisha Khan",
    role: "Project Manager",
    region: "MENA",
    languages: ["Arabic MENA", "Arabic RoW", "English"],
    specialties: ["OCR Labeling", "Dialect Review", "Risk Control"],
    projectsDelivered: 24,
    currentLoad: "76%",
    availability: "Limited",
    rating: 4.7,
    responseTime: "< 2h",
    workStyle: "Careful delivery manager for complex Arabic language review programs.",
    representativeProjects: ["Arabic OCR Delivery", "MENA Dialect Review", "Document QA"],
    avatarColor: "bg-[#7c3f22]",
  },
  {
    id: "omar",
    name: "Omar Hassan",
    role: "Resource Manager",
    region: "MENA",
    languages: ["Arabic MENA", "Arabic RoW", "English"],
    specialties: ["Reviewer Pools", "Dialect Coverage", "Capacity Backup"],
    projectsDelivered: 22,
    currentLoad: "72%",
    availability: "Limited",
    rating: 4.7,
    responseTime: "< 2h",
    workStyle: "Strong at matching dialect-specific reviewers with short delivery windows.",
    representativeProjects: ["Arabic OCR Pool", "Dialect Safety Eval", "Arabic QA Review"],
    avatarColor: "bg-[#b7791f]",
  },
  {
    id: "lina",
    name: "Lina Farouk",
    role: "POC Manager",
    region: "MENA",
    languages: ["Arabic", "English", "French"],
    specialties: ["Meeting Notes", "Client Escalation", "Feedback Tracking"],
    projectsDelivered: 19,
    currentLoad: "64%",
    availability: "Available",
    rating: 4.7,
    responseTime: "< 2h",
    workStyle: "Concise POC with strong bilingual client communication and issue routing.",
    representativeProjects: ["Arabic OCR Client Ops", "MENA Feedback Desk", "QA Return Loop"],
    avatarColor: "bg-[#8b5cf6]",
  },
  {
    id: "camila",
    name: "Camila Tonin",
    role: "Project Manager",
    region: "LATAM",
    languages: ["Portuguese-BR", "Spanish-MX", "English"],
    specialties: ["Translation QA", "Localization Review", "Content Evaluation"],
    projectsDelivered: 35,
    currentLoad: "58%",
    availability: "Available",
    rating: 4.9,
    responseTime: "< 1h",
    workStyle: "Editorially sharp PM for localization quality and multi-market delivery.",
    representativeProjects: ["LATAM Localization", "Portuguese QA", "Spanish Content Eval"],
    avatarColor: "bg-[#2563eb]",
  },
];

const deliveryTeams: DeliveryTeam[] = [
  {
    id: "jk-llm",
    name: "Japan-Korea LLM Evaluation Team",
    displayName: "Japan-Korea LLM Evaluation Team",
    projectManager: "Julie Zhu",
    resourceManager: "Maya Chen",
    pocManager: "Daniel Kim",
    languages: ["Japanese", "Korean", "English"],
    bestFit: ["LLM Evaluation", "QA Review", "Multilingual Ranking"],
    availability: "Available",
    overviewStatus: "Recommended",
    deliveredProjects: 18,
    rating: 4.8,
  },
  {
    id: "arabic-ocr",
    name: "Arabic OCR Delivery Team",
    displayName: "Arabic OCR Delivery Team",
    projectManager: "Aisha Khan",
    resourceManager: "Omar Hassan",
    pocManager: "Lina Farouk",
    languages: ["Arabic MENA", "Arabic RoW", "English"],
    bestFit: ["OCR Labeling", "Arabic Dialect Review"],
    availability: "Limited",
    overviewStatus: "Available",
    deliveredProjects: 14,
    rating: 4.7,
  },
  {
    id: "latam-loc",
    name: "LATAM Localization Team",
    displayName: "LATAM Localization Team",
    projectManager: "Camila Tonin",
    resourceManager: "Jose Zambrano",
    pocManager: "Natalia Valente",
    languages: ["Portuguese-BR", "Spanish-MX", "English"],
    bestFit: ["Translation QA", "Localization Review", "Content Evaluation"],
    availability: "Available",
    overviewStatus: "Backup",
    deliveredProjects: 21,
    rating: 4.9,
  },
];

const groups: ProjectGroup[] = [
  {
    name: "TikTok LLM Evaluation Client Group",
    project: "Multimodal Image Evaluation",
    client: "TikTok",
    projectManager: "Julie Zhu",
    resourceManager: "Maya Chen",
    pocManager: "Daniel Kim",
    members: 14,
    lastActivity: "12 min ago",
    status: "Active",
  },
  {
    name: "Arabic OCR Delivery Group",
    project: "Minority Language OCR Review",
    client: "ByteDance",
    projectManager: "Aisha Khan",
    resourceManager: "Omar Hassan",
    pocManager: "Lina Farouk",
    members: 11,
    lastActivity: "1h ago",
    status: "Active",
  },
  {
    name: "LATAM Localization Review Group",
    project: "Translation Review Project",
    client: "SpeedX",
    projectManager: "Camila Tonin",
    resourceManager: "Jose Zambrano",
    pocManager: "Natalia Valente",
    members: 16,
    lastActivity: "Yesterday",
    status: "Monitoring",
  },
];

const snapshotCards = [
  ["Total Managers", "42"],
  ["Project Managers", "12"],
  ["Resource Managers", "15"],
  ["POC Managers", "15"],
  ["Active Delivery Teams", "18"],
  ["Languages Covered", "87"],
  ["Projects Delivered", "126"],
  ["Average Response Time", "< 2h"],
];

export function TeamHubPage() {
  const [activeTab, setActiveTab] = useState<TeamHubTab>("Overview");
  const [notice, setNotice] = useState("");
  const user = readPlatformUser();
  const clientMode = isClient(user);
  const canManage = Boolean(isRootOwner(user) || user?.role === "super_admin" || user?.role === "hr");

  const roleLabel = user?.role ? user.role.replace(/_/g, " ") : "viewer";
  const filteredManagers = useMemo(() => managers, []);

  function showMockNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  }

  return (
    <main className="min-h-screen bg-transparent pb-24 text-[#111827]">
      <section className="page-shell pt-8">
        <header className="rounded-2xl border border-[#e2d8c8] bg-[#fbfaf6] p-6 shadow-[0_18px_44px_rgba(31,41,51,0.08)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6a35]">PM Hub</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#111827] md:text-4xl">
                BlackDog PM Hub
              </h1>
              <p className="mt-3 max-w-3xl text-base font-medium leading-7 text-[#64748b]">
                Manage delivery teams, role assignments, and project collaboration.
              </p>
            </div>
            <div className="rounded-xl border border-[#e2d8c8] bg-white px-4 py-3 text-sm shadow-[0_8px_20px_rgba(31,41,51,0.06)]">
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#6f6256]">Current Access</div>
              <div className="mt-1 font-bold capitalize text-[#1f5c43]">{roleLabel}</div>
              <div className="mt-1 text-xs text-[#64748b]">{clientMode ? "Client read-only view" : canManage ? "Management actions enabled" : "Team visibility"}</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? "bg-[#1f5c43] text-white shadow-[0_10px_22px_rgba(31,92,67,0.18)]"
                    : "border border-[#e2d8c8] bg-white text-[#6f6256] hover:bg-[#f5efe5] hover:text-[#111827]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        {notice ? (
          <div className="mt-4 rounded-xl border border-[#c9dfd0] bg-[#edf8f1] px-4 py-3 text-sm font-semibold text-[#1f5c43]">
            {notice}
          </div>
        ) : null}

        <section className="mt-6">
          {activeTab === "Overview" ? (
            <OverviewTab
              managers={filteredManagers}
              canManage={canManage}
              clientMode={clientMode}
              onNotice={showMockNotice}
            />
          ) : null}
          {activeTab === "Managers" ? <ManagersTab managers={filteredManagers} canManage={canManage} clientMode={clientMode} onNotice={showMockNotice} /> : null}
          {activeTab === "Teams" ? <TeamsTab canManage={canManage} clientMode={clientMode} onNotice={showMockNotice} /> : null}
          {activeTab === "Profiles" ? <ProfilesTab managers={filteredManagers} canManage={canManage} onNotice={showMockNotice} /> : null}
          {activeTab === "Groups" ? <GroupsTab canManage={canManage} clientMode={clientMode} onNotice={showMockNotice} /> : null}
          {activeTab === "Performance" ? <PerformanceTab /> : null}
        </section>
      </section>
    </main>
  );
}

function OverviewTab({
  managers,
  canManage,
  clientMode,
  onNotice,
}: {
  managers: ManagerProfile[];
  canManage: boolean;
  clientMode: boolean;
  onNotice: (message: string) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#e2d8c8] bg-white p-5 shadow-[0_12px_28px_rgba(31,41,51,0.07)]">
        <div className="mb-4">
          <h2 className="text-xl font-black text-[#111827]">Team Capability Snapshot</h2>
          <p className="mt-1 text-sm leading-6 text-[#64748b]">
            Track delivery capacity, role coverage, and team readiness.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {snapshotCards.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] p-4 shadow-[0_12px_28px_rgba(31,41,51,0.07)]">
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-[#6f6256]">{label}</div>
              <div className="mt-3 font-mono text-3xl font-black tabular-nums text-[#1f5c43]">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#e2d8c8] bg-white p-5 shadow-[0_12px_28px_rgba(31,41,51,0.07)]">
        <div className="mb-4">
          <h2 className="text-xl font-black text-[#111827]">Project Delivery Workflow</h2>
          <p className="mt-1 text-sm leading-6 text-[#64748b]">
            Track how each project moves from request to delivery review.
          </p>
        </div>
        <ProjectDeliverySwimlane />
      </section>

      <section className="rounded-xl border border-[#e2d8c8] bg-white p-5 shadow-[0_12px_28px_rgba(31,41,51,0.07)]">
        <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-end">
          <div>
            <h2 className="text-xl font-black text-[#111827]">Team List</h2>
            <p className="mt-1 text-sm leading-6 text-[#64748b]">
              Review team combinations by language coverage, managers, and project experience.
            </p>
          </div>
          <div className="rounded-full border border-[#e2d8c8] bg-[#fbfaf6] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#6f6256]">
            {deliveryTeams.length} teams shown
          </div>
        </div>
        <TableShell minWidth="1180px">
          <thead>
            <tr>
              {["Team Name", "Language / Coverage", "POC Manager", "Project Manager", "Resource Manager", "Project Experience", "Status"].map((head, index) => (
                <th key={head} className={index === 6 ? "th-center" : "th-left"}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deliveryTeams.map((team) => (
              <tr key={team.id}>
                <td className="td-left font-semibold text-[#111827]">{team.displayName}</td>
                <td className="td-left">{team.languages.join(", ")}</td>
                <td className="td-left">{team.pocManager}</td>
                <td className="td-left">{team.projectManager}</td>
                <td className="td-left">{team.resourceManager}</td>
                <td className="td-left">{team.bestFit.join(" / ")}</td>
                <td className="td-center"><StatusBadge value={team.overviewStatus} /></td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </section>

      <section className="rounded-xl border border-[#e2d8c8] bg-white p-5 shadow-[0_12px_28px_rgba(31,41,51,0.07)]">
        <div className="mb-4">
          <div>
            <h2 className="text-xl font-black text-[#111827]">Manager List</h2>
            <p className="mt-1 text-sm leading-6 text-[#64748b]">
              Review managers by role, language coverage, availability, and delivery record.
            </p>
          </div>
        </div>
        <TableShell minWidth="1180px">
          <thead>
            <tr>
              {["Name", "Role", "Region", "Languages", "Specialties", "Projects", "Availability", "Rating", "Actions"].map((head, index) => (
                <th key={head} className={index < 5 ? "th-left" : "th-center"}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {managers.map((manager) => (
              <tr key={manager.id}>
                <td className="td-left font-semibold text-[#111827]">{manager.name}</td>
                <td className="td-left">{manager.role}</td>
                <td className="td-left">{manager.region}</td>
                <td className="td-left">{manager.languages.join(", ")}</td>
                <td className="td-left">{manager.specialties.slice(0, 2).join(", ")}</td>
                <td className="td-center font-mono font-bold">{manager.projectsDelivered}</td>
                <td className="td-center"><StatusBadge value={manager.availability} /></td>
                <td className="td-center font-bold">{manager.rating.toFixed(1)}</td>
                <td className="td-center">
                  <ActionGroup actions={clientMode ? ["View Profile", "Shortlist", "Contact"] : canManage ? ["View Profile", "Add to Team", "Message", "Edit"] : ["View Profile"]} onClick={onNotice} />
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </section>
    </div>
  );
}

function ManagersTab({ managers, canManage, clientMode, onNotice }: { managers: ManagerProfile[]; canManage: boolean; clientMode: boolean; onNotice: (message: string) => void }) {
  return (
    <Panel title="Managers" subtitle="Compare managers by coverage, availability, and delivery record.">
      <div className="mb-4 grid gap-3 md:grid-cols-5">
        {["Role", "Region", "Language Coverage", "Availability", "Specialty"].map((filter) => (
          <div key={filter} className="rounded-lg border border-[#e2d8c8] bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-[#6f6256]">
            {filter}: All
          </div>
        ))}
      </div>
      <TableShell minWidth="1180px">
        <thead>
          <tr>
            {["Name", "Role", "Region", "Languages", "Specialties", "Projects Delivered", "Current Load", "Availability", "Rating", "Actions"].map((head, index) => (
              <th key={head} className={index < 5 ? "th-left" : "th-center"}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {managers.map((manager) => (
            <tr key={manager.id}>
              <td className="td-left font-semibold text-[#111827]">{manager.name}</td>
              <td className="td-left">{manager.role}</td>
              <td className="td-left">{manager.region}</td>
              <td className="td-left">{manager.languages.join(", ")}</td>
              <td className="td-left">{manager.specialties.slice(0, 2).join(", ")}</td>
              <td className="td-center font-mono font-bold">{manager.projectsDelivered}</td>
              <td className="td-center">{manager.currentLoad}</td>
              <td className="td-center"><StatusBadge value={manager.availability} /></td>
              <td className="td-center font-bold">{manager.rating.toFixed(1)}</td>
              <td className="td-center">
                <ActionGroup actions={clientMode ? ["View Profile", "Shortlist"] : canManage ? ["View Profile", "Add to Team", "Message", "Edit"] : ["View Profile", "Message"]} onClick={onNotice} />
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </Panel>
  );
}

function TeamsTab({ canManage, clientMode, onNotice }: { canManage: boolean; clientMode: boolean; onNotice: (message: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] p-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-black text-[#111827]">Team Combinations</h2>
          <p className="mt-1 text-sm text-[#64748b]">Each project team combines one Project Manager, one Resource Manager, and one POC Manager.</p>
        </div>
        {canManage ? <button type="button" onClick={() => onNotice("Create team is not connected yet.")} className="rounded-md bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white">Create Team</button> : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {deliveryTeams.map((team) => (
          <article key={team.id} className="rounded-xl border border-[#e2d8c8] bg-white p-5 shadow-[0_12px_28px_rgba(31,41,51,0.07)]">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-black leading-6 text-[#111827]">{team.displayName}</h3>
              <StatusBadge value={team.availability} />
            </div>
            <div className="mt-4 space-y-2 text-sm text-[#4b5563]">
              <InfoLine label="Project Manager" value={team.projectManager} compact />
              <InfoLine label="Resource Manager" value={team.resourceManager} compact />
              <InfoLine label="POC Manager" value={team.pocManager} compact />
              <InfoLine label="Languages" value={team.languages.join(", ")} compact />
              <InfoLine label="Best-fit" value={team.bestFit.join(", ")} compact />
              <InfoLine label="Delivered" value={`${team.deliveredProjects} projects`} compact />
              <InfoLine label="Client Rating" value={team.rating.toFixed(1)} compact />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {(clientMode ? ["View Team", "Compare", "Select Team", "Contact"] : canManage ? ["View Team", "Compare", "Select Team", "Contact", "Edit Team", "Assign"] : ["View Team", "Compare", "Contact"]).map((action) => (
                <button key={action} type="button" onClick={() => onNotice(action === "Select Team" ? "Team selection request saved locally." : `${action} is not connected yet.`)} className="rounded-md border border-[#d7cec0] bg-[#fbfaf6] px-3 py-1.5 text-xs font-semibold text-[#4b5563] hover:bg-[#f4efe2]">
                  {action}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ProfilesTab({ managers, canManage, onNotice }: { managers: ManagerProfile[]; canManage: boolean; onNotice: (message: string) => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {managers.slice(0, 6).map((manager) => (
        <article key={manager.id} className="rounded-xl border border-[#e2d8c8] bg-white p-5 shadow-[0_12px_28px_rgba(31,41,51,0.07)]">
          <div className="flex gap-4">
            <Avatar name={manager.name} color={manager.avatarColor} />
            <div className="min-w-0">
              <h3 className="text-xl font-black text-[#111827]">{manager.name}</h3>
              <p className="mt-1 text-sm font-semibold text-[#1f5c43]">{manager.role} · {manager.region}</p>
              <p className="mt-3 text-sm leading-6 text-[#64748b]">{manager.workStyle}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
            <InfoLine label="Languages" value={manager.languages.join(", ")} compact />
            <InfoLine label="Specialties" value={manager.specialties.join(", ")} compact />
            <InfoLine label="Projects Delivered" value={String(manager.projectsDelivered)} compact />
            <InfoLine label="Current Load" value={manager.currentLoad} compact />
            <InfoLine label="Availability" value={manager.availability} compact />
            <InfoLine label="Response Time" value={manager.responseTime} compact />
          </div>
          <div className="mt-4 rounded-lg bg-[#fbfaf6] p-3 text-sm text-[#4b5563]">
            <span className="font-semibold text-[#111827]">Representative Projects: </span>{manager.representativeProjects.join(", ")}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => onNotice("Contact is not connected yet.")} className="rounded-md bg-[#1f5c43] px-3 py-1.5 text-xs font-semibold text-white">Contact</button>
            <button type="button" onClick={() => onNotice("Message is not connected yet.")} className="rounded-md border border-[#d7cec0] bg-white px-3 py-1.5 text-xs font-semibold text-[#4b5563]">Message</button>
            {canManage ? <button type="button" onClick={() => onNotice("Edit profile is not connected yet.")} className="rounded-md border border-[#d7cec0] bg-white px-3 py-1.5 text-xs font-semibold text-[#4b5563]">Edit</button> : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function GroupsTab({ canManage, clientMode, onNotice }: { canManage: boolean; clientMode: boolean; onNotice: (message: string) => void }) {
  return (
    <Panel title="Client Project Groups" subtitle="Review project communication groups for selected delivery teams.">
      {canManage ? <button type="button" onClick={() => onNotice("Create group is not connected yet.")} className="mb-4 rounded-md bg-[#1f5c43] px-4 py-2 text-sm font-semibold text-white">Create Group</button> : null}
      <TableShell minWidth="1160px">
        <thead>
          <tr>
            {["Group Name", "Related Project", "Client", "Project Manager", "Resource Manager", "POC Manager", "Members", "Last Activity", "Status", "Actions"].map((head, index) => (
              <th key={head} className={index < 6 ? "th-left" : "th-center"}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.name}>
              <td className="td-left font-semibold">{group.name}</td>
              <td className="td-left">{group.project}</td>
              <td className="td-left">{group.client}</td>
              <td className="td-left">{group.projectManager}</td>
              <td className="td-left">{group.resourceManager}</td>
              <td className="td-left">{group.pocManager}</td>
              <td className="td-center font-mono font-bold">{group.members}</td>
              <td className="td-center">{group.lastActivity}</td>
              <td className="td-center"><StatusBadge value={group.status} /></td>
              <td className="td-center">
                <ActionGroup actions={clientMode ? ["View Group"] : canManage ? ["View Group", "Message", "Manage"] : ["View Group", "Message"]} onClick={onNotice} />
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </Panel>
  );
}

function PerformanceTab() {
  return (
    <Panel title="Team Performance" subtitle="Track quality, response speed, risk, and capacity by team.">
      <div className="mb-4 grid gap-4 md:grid-cols-4">
        {["94% on-time rate", "97% QA pass rate", "4.8 avg client rating", "2 teams at risk"].map((item) => (
          <div key={item} className="rounded-xl border border-[#e2d8c8] bg-[#fbfaf6] p-4 text-sm font-bold text-[#111827]">{item}</div>
        ))}
      </div>
      <TableShell minWidth="980px">
        <thead>
          <tr>
            {["Team Name", "Projects Delivered", "On-time Rate", "QA Pass Rate", "Client Rating", "Avg Response Time", "Current Load", "Risk Level"].map((head, index) => (
              <th key={head} className={index === 0 ? "th-left" : "th-center"}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {deliveryTeams.map((team, index) => (
            <tr key={team.id}>
              <td className="td-left font-semibold">{team.displayName}</td>
              <td className="td-center font-mono font-bold">{team.deliveredProjects}</td>
              <td className="td-center">{index === 1 ? "91%" : "96%"}</td>
              <td className="td-center">{index === 1 ? "94%" : "98%"}</td>
              <td className="td-center font-bold">{team.rating.toFixed(1)}</td>
              <td className="td-center">{index === 0 ? "< 1h" : "< 2h"}</td>
              <td className="td-center">{index === 1 ? "76%" : "62%"}</td>
              <td className="td-center"><StatusBadge value={index === 1 ? "Watch" : "Low"} /></td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </Panel>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#e2d8c8] bg-white p-5 shadow-[0_12px_28px_rgba(31,41,51,0.07)]">
      <div className="mb-5">
        <h2 className="text-xl font-black text-[#111827]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[#64748b]">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function TableShell({ minWidth, children }: { minWidth: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e2d8c8]">
      <div className="overflow-x-auto">
        <table className="data-table" style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  );
}

function InfoLine({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={compact ? "text-sm" : "mt-4 text-sm"}>
      <div className="font-bold text-[#6f6256]">{label}</div>
      <div className="mt-1 leading-6 text-[#111827]">{value}</div>
    </div>
  );
}

function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2);
  return (
    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${color} text-lg font-black text-white shadow-[0_10px_24px_rgba(31,41,51,0.16)]`}>
      {initials}
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const positive = ["Available", "Active", "Low"];
  const caution = ["Limited", "Monitoring", "Watch"];
  const className = positive.includes(value)
    ? "border-[#c9dfd0] bg-[#edf8f1] text-[#1f5c43]"
    : caution.includes(value)
      ? "border-[#ead7ae] bg-[#fff7ea] text-[#9a6a35]"
      : "border-[#e2d8c8] bg-[#fbfaf6] text-[#6f6256]";
  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${className}`}>{value}</span>;
}

function ActionGroup({ actions, onClick }: { actions: string[]; onClick: (message: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {actions.map((action) => (
        <button key={action} type="button" onClick={() => onClick(`${action} is not connected yet.`)} className="rounded-md border border-[#d7cec0] bg-[#fbfaf6] px-2.5 py-1.5 text-xs font-semibold text-[#4b5563] hover:bg-[#f4efe2]">
          {action}
        </button>
      ))}
    </div>
  );
}
