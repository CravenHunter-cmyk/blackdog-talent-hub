"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import type { TalentProfileRecord } from "@/types/talent-pool";
import { getStoredAccounts, saveStoredAccounts, type LocalAccount } from "@/lib/localAccounts";

type RoleKey = "super_admin" | "hr_user" | "talent";

const PERMISSION_KEYS = [
  "manageUsers",
  "createUsers",
  "editUsers",
  "disableUsers",
  "resetPasswords",
  "manageRolesPermissions",
  "viewOverview",
  "viewProjects",
  "createEditProjects",
  "assignHrsToProjects",
  "manageProjectScripts",
  "viewHrWorkProgress",
  "viewCandidateQueue",
  "viewMyWorkspace",
  "manageOwnCandidateQueue",
  "viewOwnAssignedProjects",
  "viewOwnSubmissionProgress",
  "viewPluginWorkspace",
  "usePluginWorkspace",
  "syncProjectScriptsToPlugin",
  "submitTalentProfileFromPlugin",
  "viewTalentLibrary",
  "addTalentRecords",
  "editTalentRecords",
  "deleteTalentRecords",
  "exportTalentRecords",
  "viewSensitiveTalentDetails",
  "viewExecutiveDashboard",
  "viewHrPerformance",
  "viewProjectProgressReports",
  "viewLanguageCoverageReports",
  "viewTalentMessages",
  "viewSettings",
  "manageSystemSettings",
  "manageIntegrationSettings",
  "viewOwnWorkspace",
  "viewOwnTasks",
  "viewOwnTaskProgress",
  "viewOwnMessages",
  "sendMessages",
  "uploadTaskFiles",
  "uploadTaskVideos",
  "viewAssignedTaskGuidelines",
] as const;

type PermissionKey = (typeof PERMISSION_KEYS)[number];
type PermissionState = Record<PermissionKey, boolean>;

type PermissionModule = {
  key: string;
  label: string;
  permissions: { key: PermissionKey; label: string; description?: string }[];
};

type AccountRecord = {
  id: string;
  loginAccount: string;
  displayName: string;
  email: string;
  role: RoleKey;
  status: "Active" | "Invited" | "Locked";
  password: string;
  permissions: PermissionState;
  assignedTeams: string[];
  linkedTalentProfile?: string;
  lastLogin: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type AccountDraft = {
  id: string;
  loginAccount: string;
  displayName: string;
  email: string;
  displayNameTouched: boolean;
  tempPassword: string;
  role: RoleKey;
  status: AccountRecord["status"];
  permissions: PermissionState;
  assignedTeams: string;
  linkedTalentProfile: string;
  linkedTalentProfileManuallySelected: boolean;
  lastLogin: string;
  notes: string;
  isNew: boolean;
};

type RoleDefaultSummary = {
  role: RoleKey;
  label: string;
  description: string;
  permissionCount: number;
};

const PERMISSION_MODULES: PermissionModule[] = [
  {
    key: "account-management",
    label: "Account Management",
    permissions: [
      { key: "manageUsers", label: "Manage Users" },
      { key: "createUsers", label: "Create Users" },
      { key: "editUsers", label: "Edit Users" },
      { key: "disableUsers", label: "Disable Users" },
      { key: "resetPasswords", label: "Reset Passwords" },
      { key: "manageRolesPermissions", label: "Manage Roles & Permissions" },
    ],
  },
  {
    key: "recruiting-workbench",
    label: "Recruiting Workbench",
    permissions: [
      { key: "viewOverview", label: "View Overview" },
      { key: "viewProjects", label: "View Projects" },
      { key: "createEditProjects", label: "Create / Edit Projects" },
      { key: "assignHrsToProjects", label: "Assign HRs to Projects" },
      { key: "manageProjectScripts", label: "Manage Project Scripts" },
      { key: "viewHrWorkProgress", label: "View HR Work Progress" },
      { key: "viewCandidateQueue", label: "View Applicant Reviews" },
    ],
  },
  {
    key: "my-workspace",
    label: "My Workspace",
    permissions: [
      { key: "viewMyWorkspace", label: "View My Workspace" },
      { key: "manageOwnCandidateQueue", label: "Manage Own Applicant Reviews" },
      { key: "viewOwnAssignedProjects", label: "View Own Assigned Projects" },
      { key: "viewOwnSubmissionProgress", label: "View Own Submission Progress" },
    ],
  },
  {
    key: "plugin-workspace",
    label: "Plugin Workspace / Extension",
    permissions: [
      { key: "viewPluginWorkspace", label: "View Plugin Workspace" },
      { key: "usePluginWorkspace", label: "Use Plugin Workspace" },
      { key: "syncProjectScriptsToPlugin", label: "Sync Project Scripts to Plugin" },
      { key: "submitTalentProfileFromPlugin", label: "Submit Talent Profile from Plugin" },
    ],
  },
  {
    key: "talent-messages",
    label: "Talent Messages",
    permissions: [{ key: "viewTalentMessages", label: "View Talent Messages" }],
  },
  {
    key: "talent-portal",
    label: "Talent Portal / Talent Access",
    permissions: [
      { key: "viewOwnWorkspace", label: "View Own Workspace" },
      { key: "viewOwnTasks", label: "View Own Tasks" },
      { key: "viewOwnTaskProgress", label: "View Own Task Progress" },
      { key: "viewOwnMessages", label: "View Own Messages" },
      { key: "sendMessages", label: "Send Messages" },
      { key: "uploadTaskFiles", label: "Upload Task Files" },
      { key: "uploadTaskVideos", label: "Upload Task Videos" },
      { key: "viewAssignedTaskGuidelines", label: "View Assigned Task Guidelines" },
    ],
  },
  {
    key: "talent-library",
    label: "Talent Museum",
    permissions: [
      { key: "viewTalentLibrary", label: "View Talent Museum" },
      { key: "addTalentRecords", label: "Add Talent Records" },
      { key: "editTalentRecords", label: "Edit Talent Records" },
      { key: "deleteTalentRecords", label: "Delete Talent Records" },
      { key: "exportTalentRecords", label: "Export Talent Records" },
      { key: "viewSensitiveTalentDetails", label: "View Sensitive Talent Details" },
    ],
  },
  {
    key: "reporting",
    label: "Reporting / Management",
    permissions: [
      { key: "viewExecutiveDashboard", label: "View Executive Dashboard" },
      { key: "viewHrPerformance", label: "View HR Performance" },
      { key: "viewProjectProgressReports", label: "View Project Progress Reports" },
      { key: "viewLanguageCoverageReports", label: "View Language Coverage Reports" },
    ],
  },
  {
    key: "system-settings",
    label: "System Settings",
    permissions: [
      { key: "viewSettings", label: "View Settings" },
      { key: "manageSystemSettings", label: "Manage System Settings" },
      { key: "manageIntegrationSettings", label: "Manage Integration Settings" },
    ],
  },
];

const ROLE_SUMMARIES: RoleDefaultSummary[] = [
  {
    role: "super_admin",
    label: "Super Admin",
    description: "Full platform access with every permission enabled by default.",
    permissionCount: PERMISSION_KEYS.length,
  },
  {
    role: "hr_user",
    label: "HR User",
    description: "Work execution access for assigned projects and the plugin workflow.",
    permissionCount: 11,
  },
  {
    role: "talent",
    label: "Talent",
    description: "Talent-facing access for self-service tasks, messages, and uploads.",
    permissionCount: 8,
  },
];

const ROLE_DEFAULT_KEYS: Record<RoleKey, PermissionKey[]> = {
  super_admin: [...PERMISSION_KEYS],
  hr_user: [
    "viewProjects",
    "viewCandidateQueue",
    "viewMyWorkspace",
    "manageOwnCandidateQueue",
    "viewOwnAssignedProjects",
    "viewOwnSubmissionProgress",
    "viewPluginWorkspace",
    "usePluginWorkspace",
    "submitTalentProfileFromPlugin",
    "manageProjectScripts",
    "viewOwnWorkspace",
    "viewOwnTasks",
    "viewOwnTaskProgress",
    "viewOwnMessages",
    "viewTalentMessages",
  ],
  talent: [
    "viewOwnWorkspace",
    "viewOwnTasks",
    "viewOwnTaskProgress",
    "viewOwnMessages",
    "sendMessages",
    "uploadTaskFiles",
    "uploadTaskVideos",
    "viewAssignedTaskGuidelines",
    "viewTalentMessages",
  ],
};

const INITIAL_ACCOUNTS: AccountRecord[] = [
  {
    id: "acc-julie",
    loginAccount: "julie",
    displayName: "Julie Zhu",
    email: "julie@blackdog.tld",
    role: "super_admin",
    status: "Active",
    password: "123456",
    permissions: buildPermissionState("super_admin"),
    assignedTeams: ["Global Operations", "Platform"],
    lastLogin: "2026-04-27 08:15",
    notes: "Owner of the main recruiting workspace.",
    createdAt: "2026-04-12 09:10",
    updatedAt: "2026-04-27 10:22",
  },
  {
    id: "acc-olivia",
    loginAccount: "hr_japan_01",
    displayName: "Olivia Chen",
    email: "olivia@blackdog.tld",
    role: "hr_user",
    status: "Active",
    password: "123456",
    permissions: {
      ...buildPermissionState("hr_user"),
      viewTalentLibrary: true,
      viewHrPerformance: true,
    },
    assignedTeams: ["Chinese Coverage", "Plugin Workflow"],
    lastLogin: "2026-04-26 17:32",
    notes: "HR coverage for Chinese and plugin submissions.",
    createdAt: "2026-04-16 08:30",
    updatedAt: "2026-04-24 14:05",
  },
  {
    id: "acc-tanchanok",
    loginAccount: "tanchanok_pearl",
    displayName: "Tanchanok Pearl",
    email: "",
    role: "talent",
    status: "Active",
    password: "123456",
    permissions: {
      ...buildPermissionState("talent"),
      viewTalentMessages: true,
    },
    assignedTeams: ["TikTok LLM Evaluation"],
    linkedTalentProfile: "tal_tanchanok-pearl_b7e9e2143200",
    lastLogin: "2026-04-27 09:05",
    notes: "Talent account linked to the Thai evaluator profile.",
    createdAt: "2026-04-18 10:15",
    updatedAt: "2026-04-27 09:30",
  },
  {
    id: "acc-nayara",
    loginAccount: "nayara_ribeiro",
    displayName: "Nayara Ribeiro",
    email: "",
    role: "talent",
    status: "Active",
    password: "123456",
    permissions: {
      ...buildPermissionState("talent"),
      viewTalentMessages: true,
      sendMessages: true,
    },
    assignedTeams: ["Native LLM Evaluator Recruitment"],
    linkedTalentProfile: "tal_nayara-ribeiro_preview",
    lastLogin: "2026-04-27 10:20",
    notes: "Talent account linked to the Chinese evaluator profile.",
    createdAt: "2026-04-18 12:20",
    updatedAt: "2026-04-27 10:22",
  },
  {
    id: "acc-locked-demo",
    loginAccount: "locked_demo",
    displayName: "Locked Demo",
    email: "",
    role: "talent",
    status: "Locked",
    password: "123456",
    permissions: {
      ...buildPermissionState("talent"),
      viewTalentMessages: true,
    },
    assignedTeams: [],
    linkedTalentProfile: undefined,
    lastLogin: "Never",
    notes: "Locked account for login testing.",
    createdAt: "2026-04-27 10:22",
    updatedAt: "2026-04-27 10:22",
  },
];

function buildPermissionState(role: RoleKey): PermissionState {
  const next = Object.fromEntries(PERMISSION_KEYS.map((key) => [key, false])) as PermissionState;
  if (role === "super_admin") {
    PERMISSION_KEYS.forEach((key) => {
      next[key] = true;
    });
    return next;
  }

  ROLE_DEFAULT_KEYS[role].forEach((key) => {
    next[key] = true;
  });
  return next;
}

function createDefaultDraft(role: RoleKey, isNew = true): AccountDraft {
  return {
    id: `acc-${Date.now()}`,
    loginAccount: "",
    displayName: "",
    email: "",
    displayNameTouched: false,
    tempPassword: "",
    role,
    status: "Invited",
    permissions: buildPermissionState(role),
    assignedTeams: "",
    linkedTalentProfile: "",
    linkedTalentProfileManuallySelected: false,
    lastLogin: "Never",
    notes: "",
    isNew,
  };
}

function permissionGroupCount(role: RoleKey, group: PermissionModule) {
  const defaults = buildPermissionState(role);
  const enabled = group.permissions.filter((permission) => defaults[permission.key]).length;
  return { enabled, total: group.permissions.length };
}

function getRoleLabel(role: RoleKey) {
  return ROLE_SUMMARIES.find((item) => item.role === role)?.label ?? "HR User";
}

function getRoleBadgeClass(role: RoleKey) {
  if (role === "super_admin") return "border-[#b38f2d] bg-[#fff4d5] text-[#946200]";
  if (role === "hr_user") return "border-[#2563eb] bg-[#dbeafe] text-[#1d4ed8]";
  return "border-[#c46a1c] bg-[#fff2df] text-[#b45309]";
}

function getTalentProfileOption(value: string, profiles: TalentProfileRecord[]) {
  return profiles.find((option) => option.talentId === value);
}

function getTalentProfileAvatarUrl(option?: Pick<TalentProfileRecord, "avatarUrl">) {
  return option?.avatarUrl || "/blackdog-mascot.jpg";
}

function normalizeTalentProfileQuery(value: string) {
  return value.trim().toLowerCase();
}

function rankTalentProfileOptions(options: TalentProfileRecord[], nameValue: string, searchValue: string) {
  const normalizedName = normalizeTalentProfileQuery(nameValue);
  const normalizedSearch = normalizeTalentProfileQuery(searchValue);

  return [...options].sort((left, right) => {
    const leftName = normalizeTalentProfileQuery(left.candidateName);
    const rightName = normalizeTalentProfileQuery(right.candidateName);

    const leftExactName = normalizedName && leftName === normalizedName;
    const rightExactName = normalizedName && rightName === normalizedName;
    if (leftExactName !== rightExactName) return leftExactName ? -1 : 1;

    const leftPartialName = normalizedName && (leftName.includes(normalizedName) || normalizedName.includes(leftName));
    const rightPartialName = normalizedName && (rightName.includes(normalizedName) || normalizedName.includes(rightName));
    if (leftPartialName !== rightPartialName) return leftPartialName ? -1 : 1;

    const leftSearchCandidate = normalizedSearch && leftName.includes(normalizedSearch);
    const rightSearchCandidate = normalizedSearch && rightName.includes(normalizedSearch);
    if (leftSearchCandidate !== rightSearchCandidate) return leftSearchCandidate ? -1 : 1;

    const leftSearchMeta =
      normalizedSearch &&
      [left.talentId, left.nativeLanguage, left.mainSkill].join(" ").toLowerCase().includes(normalizedSearch);
    const rightSearchMeta =
      normalizedSearch &&
      [right.talentId, right.nativeLanguage, right.mainSkill].join(" ").toLowerCase().includes(normalizedSearch);
    if (leftSearchMeta !== rightSearchMeta) return leftSearchMeta ? -1 : 1;

    return left.candidateName.localeCompare(right.candidateName);
  });
}

function findExactTalentProfilesByName(query: string, profiles: TalentProfileRecord[]) {
  const normalizedQuery = normalizeTalentProfileQuery(query);
  if (!normalizedQuery) return [];

  return profiles.filter((option) => normalizeTalentProfileQuery(option.candidateName) === normalizedQuery);
}

function buildSuggestedLoginAccount(candidateName: string) {
  return candidateName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeLoginAccount(value: string) {
  return value.trim().toLowerCase();
}

function formatAccountDate(value = "") {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value || "Never"
  const pad = (input: number) => String(input).padStart(2, "0")
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
}

function mapStoredAccountToUiAccount(account: LocalAccount): AccountRecord {
  const permissions = {
    ...buildPermissionState(account.role),
    ...account.permissions,
  }

  return {
    id: account.accountId,
    loginAccount: account.loginAccount,
    displayName: account.name,
    email: account.email || "",
    role: account.role,
    status: account.status,
    password: account.password,
    permissions,
    assignedTeams: account.assignedTeams || [],
    linkedTalentProfile: account.linkedTalentProfileId,
    lastLogin: formatAccountDate(account.lastLogin || ""),
    notes: account.notes || "",
    createdAt: formatAccountDate(account.createdAt || ""),
    updatedAt: formatAccountDate(account.updatedAt || ""),
  }
}

function mapUiAccountToStoredAccount(account: AccountRecord): LocalAccount {
  return {
    accountId: account.id,
    loginAccount: account.loginAccount.trim(),
    name: account.displayName.trim(),
    role: account.role,
    status: account.status,
    password: account.password.trim(),
    linkedTalentProfileId: account.linkedTalentProfile?.trim() || undefined,
    permissions: { ...account.permissions },
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    lastLogin: account.lastLogin || undefined,
    email: account.email.trim() || undefined,
    notes: account.notes.trim() || undefined,
    assignedTeams: account.assignedTeams,
  }
}

type UsersPermissionsPageProps = {
  initialTalentProfiles?: TalentProfileRecord[];
};

export function UsersPermissionsPage({ initialTalentProfiles = [] }: UsersPermissionsPageProps) {
  const talentProfiles = useMemo(
    () => initialTalentProfiles.filter((profile) => profile.status !== "deleted"),
    [initialTalentProfiles],
  );
  const [accounts, setAccounts] = useState<AccountRecord[]>(() => INITIAL_ACCOUNTS.map((account) => ({ ...account })));
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(INITIAL_ACCOUNTS[0].id);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [draft, setDraft] = useState<AccountDraft>(() => ({
    ...createDefaultDraft("super_admin", false),
    ...INITIAL_ACCOUNTS[0],
    assignedTeams: INITIAL_ACCOUNTS[0].assignedTeams.join(", "),
    isNew: false,
    tempPassword: "",
    loginAccount: INITIAL_ACCOUNTS[0].loginAccount,
    displayName: INITIAL_ACCOUNTS[0].displayName,
    linkedTalentProfile: "",
    linkedTalentProfileManuallySelected: false,
    displayNameTouched: false,
  }));
  const [editorOpen, setEditorOpen] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [linkedTalentProfileSearch, setLinkedTalentProfileSearch] = useState("");
  const [linkedTalentProfileOpen, setLinkedTalentProfileOpen] = useState(false);
  const [linkedTalentProfileStatus, setLinkedTalentProfileStatus] = useState<"idle" | "multiple" | "none">("idle");
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const linkedTalentSelectorRef = useRef<HTMLDivElement | null>(null);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? accounts[0],
    [accounts, selectedAccountId],
  );

  const selectedAccountPassword = selectedAccount?.password || "Not Set";

  const selectedTalentProfile = useMemo(
    () => (draft.role === "talent" ? getTalentProfileOption(draft.linkedTalentProfile, talentProfiles) : undefined),
    [draft.linkedTalentProfile, draft.role, talentProfiles],
  );

  const filteredTalentProfiles = useMemo(() => {
    if (draft.role !== "talent") return [];
    return rankTalentProfileOptions(talentProfiles, draft.displayName, linkedTalentProfileSearch);
  }, [draft.displayName, draft.role, linkedTalentProfileSearch, talentProfiles]);

  const summaryCards = useMemo(
    () => [
      { label: "Total Users", value: accounts.length, tone: "text-[#111827]", bg: "bg-[#f8f5ec]" },
      { label: "Talent Accounts", value: accounts.filter((account) => account.role === "talent").length, tone: "text-[#b45309]", bg: "bg-[#fdf1e2]" },
      { label: "HR Users", value: accounts.filter((account) => account.role === "hr_user").length, tone: "text-[#1d4ed8]", bg: "bg-[#eaf2ff]" },
      { label: "Company Admins", value: accounts.filter((account) => account.role === "super_admin").length, tone: "text-[#946200]", bg: "bg-[#eff8e8]" },
      { label: "Active Users", value: accounts.filter((account) => account.status === "Active").length, tone: "text-[#1f5c43]", bg: "bg-[#eaf7ee]" },
      { label: "Locked Users", value: accounts.filter((account) => account.status === "Locked").length, tone: "text-[#b42318]", bg: "bg-[#fce8e6]" },
    ],
    [accounts],
  );

  const visibleAccountIds = useMemo(() => accounts.map((account) => account.id), [accounts]);
  const allVisibleSelected = visibleAccountIds.length > 0 && visibleAccountIds.every((id) => selectedAccountIds.includes(id));
  const someVisibleSelected = visibleAccountIds.some((id) => selectedAccountIds.includes(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
    }
  }, [allVisibleSelected, someVisibleSelected]);

  useEffect(() => {
    let cancelled = false

    queueMicrotask(() => {
      if (cancelled) return

      const storedAccounts = getStoredAccounts()
      const uiAccounts = storedAccounts.map(mapStoredAccountToUiAccount)
      setAccounts(uiAccounts)
      setSelectedAccountIds([])
      if (uiAccounts.length) {
        setSelectedAccountId(uiAccounts[0].id)
        setDraft((current) => ({
          ...current,
          ...uiAccounts[0],
          assignedTeams: uiAccounts[0].assignedTeams.join(", "),
          isNew: false,
          tempPassword: "",
          loginAccount: uiAccounts[0].loginAccount,
          displayName: uiAccounts[0].displayName,
          linkedTalentProfile: uiAccounts[0].linkedTalentProfile || "",
          linkedTalentProfileManuallySelected: Boolean(uiAccounts[0].linkedTalentProfile),
          displayNameTouched: false,
        }))
      }
      setAccountsLoaded(true)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!accountsLoaded) return
    saveStoredAccounts(accounts.map(mapUiAccountToStoredAccount))
  }, [accounts, accountsLoaded]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (linkedTalentSelectorRef.current && !linkedTalentSelectorRef.current.contains(event.target as Node)) {
        setLinkedTalentProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function openAccountEditor(account: AccountRecord, overrides: Partial<AccountDraft> = {}) {
    const linkedTalentProfile = account.linkedTalentProfile || "";
    const selectedProfile = getTalentProfileOption(linkedTalentProfile, talentProfiles);
    setSelectedAccountId(account.id);
    setDraft({
      id: account.id,
      loginAccount: account.loginAccount,
      displayName: account.displayName,
      email: account.email,
      displayNameTouched: false,
      role: account.role,
      status: account.status,
      permissions: { ...account.permissions },
      assignedTeams: account.assignedTeams.join(", "),
      linkedTalentProfile,
      linkedTalentProfileManuallySelected: Boolean(linkedTalentProfile),
      lastLogin: account.lastLogin || "Never",
      tempPassword: "",
      notes: account.notes,
      ...overrides,
      isNew: false,
    });
    setLinkedTalentProfileSearch(selectedProfile?.candidateName || "");
    setLinkedTalentProfileOpen(false);
    setLinkedTalentProfileStatus("idle");
    setDraftError("");
    setEditorOpen(true);
  }

  function startCreateAccount() {
    const nextDraft = createDefaultDraft("hr_user", true);
    setSelectedAccountId(nextDraft.id);
    setDraft(nextDraft);
    setLinkedTalentProfileSearch("");
    setLinkedTalentProfileOpen(false);
    setLinkedTalentProfileStatus("idle");
    setDraftError("");
    setEditorOpen(true);
  }

  function updateDraftField(field: keyof Omit<AccountDraft, "permissions" | "isNew">, value: string) {
    setDraft((current) => {
      const nextDraft = {
        ...current,
        [field]: value,
      } as AccountDraft;

      if (field === "displayName") {
        nextDraft.displayNameTouched = true;
      }

      return nextDraft;
    });
  }

  function handleDisplayNameChange(value: string) {
    const trimmedValue = value.trim();
    const isTalentAccount = draft.role === "talent";
    const keepManualSelection = draft.linkedTalentProfileManuallySelected;
    const exactMatches = isTalentAccount && !keepManualSelection ? findExactTalentProfilesByName(value, talentProfiles) : [];
    const rankedMatches = isTalentAccount && !keepManualSelection ? rankTalentProfileOptions(talentProfiles, value, linkedTalentProfileSearch) : [];

    setDraft((current) => ({
      ...current,
      displayName: value,
      displayNameTouched: true,
      ...(isTalentAccount && !keepManualSelection && exactMatches.length === 1
        ? {
            linkedTalentProfile: exactMatches[0].talentId,
            linkedTalentProfileManuallySelected: false,
            loginAccount: current.loginAccount.trim()
              ? current.loginAccount
              : buildSuggestedLoginAccount(exactMatches[0].candidateName),
            displayName: current.displayNameTouched || current.displayName.trim() ? current.displayName : exactMatches[0].candidateName,
          }
        : {}),
      ...(isTalentAccount && !keepManualSelection && !trimmedValue ? { linkedTalentProfile: "" } : {}),
      ...(isTalentAccount && !keepManualSelection && exactMatches.length > 1 ? { linkedTalentProfile: "" } : {}),
    }));

    if (isTalentAccount && !keepManualSelection) {
      if (!trimmedValue) {
        setLinkedTalentProfileSearch("");
        setLinkedTalentProfileOpen(false);
        setLinkedTalentProfileStatus("idle");
        return;
      }

      if (exactMatches.length === 1) {
        selectTalentProfile(exactMatches[0], false);
        return;
      }

      setLinkedTalentProfileSearch(value);
      setLinkedTalentProfileOpen(true);
      setLinkedTalentProfileStatus(rankedMatches.length > 1 ? "multiple" : "none");
    }
  }

  function handleRoleChange(role: RoleKey) {
    setDraft((current) => ({
      ...current,
      role,
      permissions: buildPermissionState(role),
      linkedTalentProfile: role === "talent" ? current.linkedTalentProfile : "",
      linkedTalentProfileManuallySelected: role === "talent" ? current.linkedTalentProfileManuallySelected : false,
      ...(role === "talent" && current.linkedTalentProfile && !current.displayNameTouched
        ? { displayName: getTalentProfileOption(current.linkedTalentProfile, talentProfiles)?.candidateName ?? current.displayName }
        : {}),
    }));

    if (role !== "talent") {
      setLinkedTalentProfileSearch("");
      setLinkedTalentProfileOpen(false);
      setLinkedTalentProfileStatus("idle");
      return;
    }

    const nextName = draft.displayName.trim();
    if (!nextName) {
      setLinkedTalentProfileSearch("");
      setLinkedTalentProfileOpen(false);
      setLinkedTalentProfileStatus("idle");
      return;
    }

    if (draft.linkedTalentProfileManuallySelected) {
      const selectedProfile = getTalentProfileOption(draft.linkedTalentProfile, talentProfiles);
      setLinkedTalentProfileSearch(selectedProfile?.candidateName || nextName);
      setLinkedTalentProfileOpen(false);
      setLinkedTalentProfileStatus("idle");
      return;
    }

    const matchedProfiles = findExactTalentProfilesByName(nextName, talentProfiles);
    if (matchedProfiles.length === 1) {
      selectTalentProfile(matchedProfiles[0], false);
      return;
    }

    setLinkedTalentProfileSearch(nextName);
    setLinkedTalentProfileOpen(true);
    setLinkedTalentProfileStatus(matchedProfiles.length > 1 ? "multiple" : "none");
  }

  function selectTalentProfile(option: TalentProfileRecord, viaManualSelection = true) {
    setDraft((current) => ({
      ...current,
      linkedTalentProfile: option.talentId,
      displayName: current.displayNameTouched || current.displayName.trim() ? current.displayName : option.candidateName,
      loginAccount: current.loginAccount.trim() ? current.loginAccount : buildSuggestedLoginAccount(option.candidateName),
      displayNameTouched: current.displayNameTouched || Boolean(current.displayName.trim()),
      linkedTalentProfileManuallySelected: viaManualSelection,
    }));
    setLinkedTalentProfileSearch(option.candidateName);
    setLinkedTalentProfileOpen(false);
    setLinkedTalentProfileStatus("idle");
  }

  function updatePermission(key: PermissionKey, checked: boolean) {
    setDraft((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [key]: checked,
      },
    }));
  }

  function setGroupPermissions(group: PermissionModule, checked: boolean) {
    setDraft((current) => {
      const nextPermissions = { ...current.permissions };
      group.permissions.forEach((permission) => {
        nextPermissions[permission.key] = checked;
      });
      return {
        ...current,
        permissions: nextPermissions,
      };
    });
  }

  function saveDraft() {
    const cleanedLoginAccount = draft.loginAccount.trim();
    const cleanedDisplayName = draft.displayName.trim();
    const cleanedPassword = draft.tempPassword.trim();
    const normalizedLogin = normalizeLoginAccount(cleanedLoginAccount);
    const hasDuplicate = accounts.some(
      (account) => account.id !== draft.id && normalizeLoginAccount(account.loginAccount) === normalizedLogin,
    );

    if (!cleanedLoginAccount) {
      setDraftError("Login account is required.");
      return;
    }

    if (!cleanedDisplayName) {
      setDraftError("Display name is required.");
      return;
    }

    if (draft.isNew && !cleanedPassword) {
      setDraftError("Please set a temporary password.");
      return;
    }

    if (hasDuplicate) {
      setDraftError("This account already exists. Please use a unique login account.");
      return;
    }

    if (draft.role === "talent" && !draft.linkedTalentProfile.trim()) {
      setDraftError("Please link a Talent Museum profile for this Talent account.");
      return;
    }

    setDraftError("");

    const originalAccount = accounts.find((account) => account.id === draft.id);
    const nextPassword = cleanedPassword || originalAccount?.password || selectedAccount?.password || "";

    const nextAccount: AccountRecord = {
      id: draft.id,
      loginAccount: cleanedLoginAccount,
      displayName: cleanedDisplayName || (draft.isNew ? "New Account" : selectedAccount?.displayName || "Account"),
      email: draft.email.trim(),
      role: draft.role,
      status: draft.status,
      password: nextPassword,
      permissions: { ...draft.permissions },
      assignedTeams: draft.assignedTeams
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      linkedTalentProfile: draft.role === "talent" ? draft.linkedTalentProfile.trim() : undefined,
      lastLogin: draft.isNew ? "Never" : selectedAccount?.lastLogin || "Never",
      notes: draft.notes.trim(),
      createdAt: draft.isNew ? new Date().toISOString().slice(0, 16).replace("T", " ") : selectedAccount?.createdAt || new Date().toISOString().slice(0, 16).replace("T", " "),
      updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    };

    setAccounts((current) => {
      const exists = current.some((account) => account.id === nextAccount.id);
      if (exists) {
        return current.map((account) => (account.id === nextAccount.id ? nextAccount : account));
      }
      return [nextAccount, ...current];
    });
    setSelectedAccountId(nextAccount.id);
    setDraft({
      id: nextAccount.id,
      loginAccount: nextAccount.loginAccount,
      displayName: nextAccount.displayName,
      email: nextAccount.email,
      displayNameTouched: false,
      role: nextAccount.role,
      status: nextAccount.status,
      permissions: { ...nextAccount.permissions },
      assignedTeams: nextAccount.assignedTeams.join(", "),
      linkedTalentProfile: nextAccount.linkedTalentProfile || "",
      linkedTalentProfileManuallySelected: Boolean(nextAccount.linkedTalentProfile),
      lastLogin: nextAccount.lastLogin,
      notes: nextAccount.notes,
      tempPassword: "",
      isNew: false,
    });
    setEditorOpen(false);
  }

  function resetDraftToRoleDefaults() {
    setDraft((current) => ({
      ...current,
      permissions: buildPermissionState(current.role),
      linkedTalentProfile: current.role === "talent" ? current.linkedTalentProfile : "",
    }));
  }

  function resetDraftPassword() {
    const nextPassword = draft.tempPassword.trim()
    if (!nextPassword) {
      setDraftError("Please enter a new password first.");
      return;
    }

    setDraftError("");

    setAccounts((current) =>
      current.map((account) =>
        account.id === draft.id
          ? {
              ...account,
              password: nextPassword,
              updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
            }
          : account,
      ),
    );
    setDraft((current) => ({
      ...current,
      tempPassword: nextPassword,
    }));
  }

  function pauseAccount(account: AccountRecord) {
    setAccounts((current) =>
      current.map((item) =>
        item.id === account.id
          ? {
              ...item,
              status: item.status === "Locked" ? "Active" : "Locked",
              updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
            }
          : item,
      ),
    );
    if (selectedAccountId === account.id) {
      setDraft((current) => ({
        ...current,
        status: account.status === "Locked" ? "Active" : "Locked",
      }));
    }
  }

  function deleteAccount(account: AccountRecord) {
    setAccounts((current) => current.filter((item) => item.id !== account.id));
    setSelectedAccountIds((current) => current.filter((id) => id !== account.id));
    if (selectedAccountId === account.id) {
      const fallback = accounts.find((item) => item.id !== account.id) ?? accounts[0];
      if (fallback) {
        openAccountEditor(fallback);
      } else {
        setEditorOpen(false);
      }
    }
  }

  function toggleAccountSelection(accountId: string, checked: boolean) {
    setSelectedAccountIds((current) => {
      if (checked) {
        return current.includes(accountId) ? current : [...current, accountId];
      }
      return current.filter((id) => id !== accountId);
    });
  }

  function toggleSelectAllVisible(checked: boolean) {
    setSelectedAccountIds(checked ? visibleAccountIds : []);
  }

  function clearSelection() {
    setSelectedAccountIds([]);
  }

  function batchPauseAccounts() {
    setAccounts((current) =>
      current.map((item) =>
        selectedAccountIds.includes(item.id)
          ? {
              ...item,
              status: "Locked",
              updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
            }
          : item,
      ),
    );
    setDraft((current) => (selectedAccountIds.includes(current.id) ? { ...current, status: "Locked" } : current));
  }

  function batchDeleteAccounts() {
    setAccounts((current) => current.filter((item) => !selectedAccountIds.includes(item.id)));
    setSelectedAccountIds([]);
    if (selectedAccountIds.includes(selectedAccountId)) {
      const remaining = accounts.filter((item) => !selectedAccountIds.includes(item.id));
      const fallback = remaining[0];
      if (fallback) {
        openAccountEditor(fallback);
      } else {
        setEditorOpen(false);
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f3ed] pb-24 pt-8 text-[#111827]">
      <div className="page-shell space-y-6">
        <section className="rounded-2xl border border-[#d7dccf] bg-white p-6 shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Command</h1>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {summaryCards.map((card) => (
              <div key={card.label} className={`rounded-xl border border-[#e3dbcd] p-4 ${card.bg}`}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6256]">{card.label}</div>
                <div className={`mt-2 text-3xl font-black tabular-nums ${card.tone}`}>{card.value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#d7dccf] bg-white p-6 shadow-[0_12px_28px_rgba(31,41,51,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Account List</h2>
            </div>
            <button
              type="button"
              onClick={startCreateAccount}
              className="inline-flex items-center rounded-md border border-[#0f9d58] bg-[#0f9d58] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)] hover:bg-[#0d8b4f]"
            >
              Create Account
            </button>
          </div>
          <div className="mt-4 rounded-xl border border-[#e3dbcd] bg-[#fbfaf6] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[#40372f]">
                {selectedAccountIds.length ? `${selectedAccountIds.length} selected` : "No accounts selected"}
              </div>
              {selectedAccountIds.length ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={batchPauseAccounts}
                    className="rounded-md border border-[#c07a00] bg-white px-3 py-1.5 text-xs font-semibold text-[#c07a00] hover:bg-[#fff7e8]"
                  >
                    Batch Lock
                  </button>
                  <button
                    type="button"
                    onClick={batchDeleteAccounts}
                    className="rounded-md border border-[#b42318] bg-white px-3 py-1.5 text-xs font-semibold text-[#b42318] hover:bg-[#fff1ef]"
                  >
                    Batch Delete
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="rounded-md border border-[#d7dccf] bg-[#fffdf8] px-3 py-1.5 text-xs font-semibold text-[#40372f] hover:bg-[#f6f2e8]"
                  >
                    Clear Selection
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="scroll-x-panel mt-4 w-full rounded-xl border border-[#e3dbcd] bg-white shadow-[0_10px_24px_rgba(31,41,51,0.06)]">
            <div className="bg-[#faf7ef] px-2 sm:px-4">
              <div
                className="grid min-w-[1180px] w-full items-center border-b border-[#e8e0d2] bg-[#faf7ef] text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6f6256]"
                style={{ gridTemplateColumns: "56px 64px minmax(180px,1.2fr) minmax(180px,1.2fr) 130px 130px 160px 252px", minHeight: "44px" }}
              >
              <div className="flex justify-center">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={(event) => toggleSelectAllVisible(event.target.checked)}
                  className="h-4 w-4 rounded border-[#c4b49c] text-[#1f5c43]"
                  aria-label="Select all visible accounts"
                />
              </div>
              <div className="text-center">No.</div>
              <div className="text-left">Account</div>
              <div className="text-left">Name</div>
              <div className="text-center">Role</div>
              <div className="text-center">Status</div>
              <div className="text-center">Last Login</div>
              <div className="text-center">Actions</div>
            </div>
            </div>

            <div className="divide-y divide-[#eee7db]">
              {accounts.map((account, index) => {
                const isSelected = account.id === selectedAccountId;
                const isChecked = selectedAccountIds.includes(account.id);
                return (
                  <div
                    key={account.id}
                    className={`px-2 transition-colors hover:bg-[#faf8f1] sm:px-4 ${
                      isSelected ? "bg-[#f2f8f4]" : "bg-white"
                    }`}
                  >
                    <div
                      className="grid min-w-[1180px] w-full items-center"
                      style={{ gridTemplateColumns: "56px 64px minmax(180px,1.2fr) minmax(180px,1.2fr) 130px 130px 160px 252px", minHeight: "56px" }}
                    >
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(event) => toggleAccountSelection(account.id, event.target.checked)}
                          className="h-4 w-4 rounded border-[#c4b49c] text-[#1f5c43]"
                          aria-label={`Select ${account.loginAccount}`}
                        />
                      </div>
                      <div className="whitespace-nowrap text-center tabular-nums text-sm text-[#374151]">{index + 1}</div>
                      <div className="min-w-0 whitespace-nowrap pr-2 font-semibold text-[#111827]">
                        <span className="block truncate" title={account.loginAccount}>
                          {account.loginAccount}
                        </span>
                      </div>
                      <div className="min-w-0 whitespace-nowrap pr-2 text-[#374151]">
                        <span className="block truncate" title={account.displayName}>
                          {account.displayName}
                        </span>
                      </div>
                      <div className="flex justify-center">
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold leading-5 ${getRoleBadgeClass(account.role)}`}>
                          {getRoleLabel(account.role)}
                        </span>
                      </div>
                      <div className="flex justify-center">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold leading-5 ${
                            account.status === "Active"
                              ? "border border-[#b7dfca] bg-[#edf8f1] text-[#1f5c43]"
                              : account.status === "Locked"
                                ? "border border-[#f5c2c7] bg-[#fdecec] text-[#b42318]"
                                : "border border-[#e1d5c6] bg-[#faf6ef] text-[#6f6256]"
                          }`}
                        >
                          {account.status}
                        </span>
                      </div>
                      <div className="whitespace-nowrap text-center text-[#374151]">{account.lastLogin}</div>
                    <div className="flex items-center justify-center">
                      <div className="flex flex-nowrap items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openAccountEditor(account)}
                            className="inline-flex h-8 min-w-[64px] items-center justify-center whitespace-nowrap rounded-md border border-[#1f5c43] bg-white px-3 py-1.5 text-xs font-semibold leading-none text-[#1f5c43] hover:bg-[#f0f7f2]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => pauseAccount(account)}
                            className={`inline-flex h-8 min-w-[64px] items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold leading-none ${
                              account.status === "Locked"
                                ? "border border-[#b42318] bg-[#fff1ef] text-[#b42318] hover:bg-[#ffe7e3]"
                                : "border border-[#c07a00] bg-white text-[#c07a00] hover:bg-[#fff7e8]"
                            }`}
                          >
                            {account.status === "Locked" ? "Locked" : "Pause"}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAccount(account)}
                            className="inline-flex h-8 min-w-[64px] items-center justify-center whitespace-nowrap rounded-md border border-[#b42318] bg-white px-3 py-1.5 text-xs font-semibold leading-none text-[#b42318] hover:bg-[#fff1ef]"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {editorOpen ? (
        <div className="scroll-panel fixed inset-0 z-50 flex items-start justify-center bg-[#111827]/40 px-4 py-8">
          <div className="mt-4 w-full max-w-6xl overflow-hidden rounded-3xl border border-[#d7dccf] bg-white shadow-[0_24px_60px_rgba(17,24,39,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#e8e0d2] px-6 py-5">
              <div>
                <h2 className="mt-2 text-2xl font-black tracking-tight">{draft.isNew ? "New Account" : "Account Setup"}</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditorOpen(false);
                  setDraftError("");
                }}
                className="rounded-md border border-[#d7dccf] bg-[#fffdf8] px-3 py-2 text-sm font-semibold text-[#40372f]"
              >
                Close
              </button>
            </div>

            <div className="grid gap-0 xl:grid-cols-[minmax(0,0.56fr)_minmax(0,0.44fr)]">
              <div className="border-b border-[#e8e0d2] p-6 xl:border-b-0 xl:border-r">
                <div className="space-y-5">
                  <div className="rounded-xl border border-[#e4dbc9] bg-[#fbfaf6] p-4">
                    {draft.role === "talent" && selectedTalentProfile ? (
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 rounded-2xl border border-[#e1d5c6] bg-white p-2">
                          <img
                            src={selectedTalentProfile.avatarUrl || "/blackdog-mascot.jpg"}
                            alt={selectedTalentProfile.candidateName}
                            className="h-20 w-20 rounded-xl object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f5c43]">Talent Profile Preview</div>
                          <div className="mt-2 text-lg font-black text-[#111827]">{selectedTalentProfile.candidateName}</div>
                          <div className="mt-1 text-xs text-[#6f6256]">{selectedTalentProfile.talentId}</div>
                          <div className="mt-3 grid gap-2 text-sm text-[#374151]">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[#6f6256]">Native Language</span>
                              <span className="font-semibold text-[#111827]">{selectedTalentProfile.nativeLanguage}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[#6f6256]">Skill</span>
                              <span className="font-semibold text-[#111827]">{selectedTalentProfile.mainSkill}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[#6f6256]">Profile Status</span>
                              <span className="inline-flex rounded-full border border-[#d7dccf] bg-[#fffdf8] px-2 py-0.5 text-[11px] font-semibold text-[#40372f]">
                                {selectedTalentProfile.status === "submitted" ? "Submitted" : "Deleted"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-h-[132px] flex-col items-center justify-center rounded-xl border border-dashed border-[#d7dccf] bg-white px-4 py-6 text-center">
                        <img src="/blackdog-mascot.jpg" alt="BlackDog mascot" className="h-16 w-16 rounded-xl object-cover" />
                        <div className="mt-3 text-sm font-semibold text-[#40372f]">No talent profile linked</div>
                        <div className="mt-1 max-w-sm text-xs text-[#6f6256]">
                          Select a Talent Museum profile to sync avatar and resume information.
                        </div>
                      </div>
                    )}
                  </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Login Account</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none"
                        value={draft.loginAccount}
                        onChange={(event) => updateDraftField("loginAccount", event.target.value)}
                        placeholder="julie, hr_japan_01, manager01"
                      />
                    </label>
                    <label className="block">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Temporary Password</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none"
                        value={draft.tempPassword}
                        onChange={(event) => updateDraftField("tempPassword", event.target.value)}
                        placeholder="Set or reset password"
                      />
                      <div className="mt-1 text-[11px] text-[#6f6256]">
                        Current Password: <span className="font-mono font-semibold text-[#111827]">{selectedAccountPassword}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-[#6f6256]">
                        Password is shown for local testing only. Hide this before production.
                      </div>
                    </label>
                    <label className="block">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Name</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none"
                        value={draft.displayName}
                        onChange={(event) => handleDisplayNameChange(event.target.value)}
                        placeholder="Julie Zhu"
                      />
                    </label>
                    <label className="block">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Account Type / Role</span>
                      <select
                        className="mt-1 w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none"
                        value={draft.role}
                        onChange={(event) => handleRoleChange(event.target.value as RoleKey)}
                      >
                        {ROLE_SUMMARIES.map((role) => (
                          <option key={role.role} value={role.role}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {draft.role === "talent" ? (
                      <div ref={linkedTalentSelectorRef} className="relative sm:col-span-2">
                        <label className="block">
                          <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Linked Talent Profile</span>
                          <input
                            className="mt-1 w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none"
                            value={linkedTalentProfileSearch}
                            onFocus={() => setLinkedTalentProfileOpen(true)}
                            onChange={(event) => {
                              const value = event.target.value;
                              setLinkedTalentProfileSearch(value);
                              setLinkedTalentProfileOpen(true);
                              setLinkedTalentProfileStatus(value.trim() ? "idle" : "none");
                            }}
                            placeholder="Search talent profile by name, talent ID, language, or skill"
                            aria-autocomplete="list"
                          />
                        </label>

                        {linkedTalentProfileOpen ? (
                          <div className="scroll-panel absolute z-20 mt-2 max-h-72 w-full rounded-xl border border-[#d7dccf] bg-white shadow-[0_18px_40px_rgba(17,24,39,0.16)]">
                            {filteredTalentProfiles.length ? (
                              filteredTalentProfiles.map((option) => (
                                <button
                                    key={option.talentId}
                                    type="button"
                                    onMouseDown={(event) => {
                                      event.preventDefault();
                                      selectTalentProfile(option, true);
                                    }}
                                  className="flex w-full items-start gap-3 border-b border-[#eee7db] px-4 py-3 text-left last:border-b-0 hover:bg-[#f7f5ef]"
                                >
                                  <img
                                    src={getTalentProfileAvatarUrl(option)}
                                    alt={option.candidateName}
                                    className="h-10 w-10 rounded-lg object-cover"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-semibold text-[#111827]">{option.candidateName}</div>
                                    <div className="truncate text-[11px] text-[#6f6256]">{option.talentId}</div>
                                    <div className="mt-1 text-[11px] text-[#374151]">
                                      {option.nativeLanguage} · {option.mainSkill}
                                    </div>
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-4 text-sm text-[#6f6256]">No matching talent profiles found.</div>
                            )}
                          </div>
                        ) : null}

                        {linkedTalentProfileStatus === "multiple" ? (
                          <p className="mt-2 text-xs text-[#b45309]">Multiple matching talent profiles found. Please select one.</p>
                        ) : linkedTalentProfileStatus === "none" ? (
                          <p className="mt-2 text-xs text-[#6f6256]">No matching talent profile found. Search manually if needed.</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                {draftError ? (
                  <div className="mt-4 rounded-xl border border-[#f5c2c7] bg-[#fdecec] px-4 py-3 text-sm text-[#b42318]">
                    {draftError}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={saveDraft}
                      className="inline-flex items-center rounded-md border border-[#0f9d58] bg-[#0f9d58] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)] hover:bg-[#0d8b4f]"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditorOpen(false);
                        setDraftError("");
                      }}
                      className="inline-flex items-center rounded-md border border-[#6b7280] bg-[#6b7280] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5b6170]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={resetDraftToRoleDefaults}
                      className="inline-flex items-center rounded-md border border-[#4f46e5] bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338ca]"
                    >
                      Reset Permissions
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={resetDraftPassword}
                    className="inline-flex items-center rounded-md border border-[#d97706] bg-[#d97706] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c56a00]"
                  >
                    Reset Password
                  </button>
                </div>
              </div>

              <div className="scroll-panel max-h-[75vh] p-6">
                <div className="space-y-5">
                  <div className="rounded-xl border border-[#e4dbc9] bg-[#fbfaf6] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f5c43]">Permission Modules</div>

                    <div className="mt-4 space-y-3">
                      {PERMISSION_MODULES.map((group) => {
                        const enabledCount = group.permissions.filter((permission) => draft.permissions[permission.key]).length;
                        return (
                          <details key={group.key} open className="rounded-xl border border-[#d7dccf] bg-white">
                            <summary className="cursor-pointer list-none px-4 py-3">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-bold text-[#111827]">{group.label}</div>
                                  <div className="mt-1 text-xs text-[#6f6256]">
                                    {enabledCount}/{group.permissions.length} enabled
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      setGroupPermissions(group, true);
                                    }}
                                    className="rounded-md border border-[#d7dccf] bg-[#fffdf8] px-3 py-1.5 text-xs font-semibold text-[#40372f]"
                                  >
                                    Select all
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      setGroupPermissions(group, false);
                                    }}
                                    className="rounded-md border border-[#d7dccf] bg-[#fffdf8] px-3 py-1.5 text-xs font-semibold text-[#40372f]"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                            </summary>

                            <div className="grid gap-2 border-t border-[#ece3d6] px-4 py-4 sm:grid-cols-2">
                              {group.permissions.map((permission) => (
                                <label
                                  key={permission.key}
                                  className="flex items-start gap-3 rounded-lg border border-[#ebe3d5] bg-[#fbfaf6] p-3"
                                >
                                  <input
                                    type="checkbox"
                                    className="mt-1 h-4 w-4 rounded border-[#c4b49c] text-[#1f5c43]"
                                    checked={draft.permissions[permission.key]}
                                    onChange={(event) => updatePermission(permission.key, event.target.checked)}
                                  />
                                  <span>
                                    <span className="block text-sm font-semibold text-[#111827]">{permission.label}</span>
                                    {permission.description ? (
                                      <span className="mt-1 block text-xs text-[#6f6256]">{permission.description}</span>
                                    ) : null}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </div>

                  <details className="rounded-xl border border-[#d7dccf] bg-white">
                    <summary className="cursor-pointer list-none px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-[#111827]">Default Account Type Permission Matrix</div>
                          <div className="mt-1 text-xs text-[#6f6256]">
                            Talent Accounts are linked to Talent Museum profiles and only receive talent-facing permissions by default.
                          </div>
                        </div>
                      </div>
                    </summary>
                    <div className="scroll-x-panel border-t border-[#eee7db] px-4 py-4">
                      <table className="data-table min-w-[960px]">
                        <thead>
                          <tr>
                            <th className="th-left">Account Type</th>
                            {PERMISSION_MODULES.map((group) => (
                              <th key={group.key} className="th-center">
                                {group.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ROLE_SUMMARIES.map((role) => (
                            <tr key={role.role} className="border-b border-[#eee7db] last:border-b-0">
                              <td className="td-left font-semibold">{role.label}</td>
                              {PERMISSION_MODULES.map((group) => {
                                const { enabled, total } = permissionGroupCount(role.role, group);
                                return (
                                  <td key={`${role.role}-${group.key}`} className="td-center">
                                    <span className="rounded-full border border-[#d7dccf] bg-[#fbfaf6] px-2.5 py-1 text-xs font-semibold text-[#1f5c43]">
                                      {role.role === "super_admin" ? "All" : `${enabled}/${total}`}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
