"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TalentProfileRecord } from "@/types/talent-pool";
import { blackDogTools } from "@/lib/tools/toolRegistry";

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
  toolPermissions: Record<string, boolean>;
  assignedTeams: string[];
  linkedTalentProfile?: string;
  lastLogin: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type AccountApiRecord = {
  accountId: string;
  loginAccount: string;
  name: string;
  role: RoleKey;
  status: AccountRecord["status"];
  password?: string;
  email?: string;
  permissions?: Partial<PermissionState>;
  toolPermissions?: Record<string, boolean>;
  createdAt?: string;
  updatedAt?: string;
  assignedTeams?: string[];
  linkedTalentProfileId?: string;
  lastLogin?: string;
  notes?: string;
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
  toolPermissions: Record<string, boolean>;
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

function buildToolPermissionState(role: RoleKey): Record<string, boolean> {
  return Object.fromEntries(blackDogTools.map((tool) => [tool.id, role === "super_admin"])) as Record<string, boolean>;
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
    toolPermissions: buildToolPermissionState(role),
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

function isLocalTestingMode() {
  if (process.env.NODE_ENV === "development") return true;
  if (typeof window === "undefined") return false;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

function mapStoredAccountToUiAccount(account: AccountApiRecord): AccountRecord {
  const permissions = {
    ...buildPermissionState(account.role),
    ...account.permissions,
  }
  const toolPermissions = account.role === "super_admin"
    ? buildToolPermissionState(account.role)
    : {
        ...buildToolPermissionState(account.role),
        ...(account.toolPermissions || {}),
      }

  return {
    id: account.accountId,
    loginAccount: account.loginAccount,
    displayName: account.name,
    email: account.email || "",
    role: account.role,
    status: account.status,
    password: account.password || "",
    permissions,
    toolPermissions,
    assignedTeams: account.assignedTeams || [],
    linkedTalentProfile: account.linkedTalentProfileId,
    lastLogin: formatAccountDate(account.lastLogin || ""),
    notes: account.notes || "",
    createdAt: formatAccountDate(account.createdAt || ""),
    updatedAt: formatAccountDate(account.updatedAt || ""),
  }
}

function mapUiAccountToStoredAccount(account: AccountRecord): AccountApiRecord {
  return {
    accountId: account.id,
    loginAccount: account.loginAccount.trim(),
    name: account.displayName.trim(),
    role: account.role,
    status: account.status,
    password: account.password.trim(),
    linkedTalentProfileId: account.linkedTalentProfile?.trim() || undefined,
    permissions: { ...account.permissions },
    toolPermissions: { ...account.toolPermissions },
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
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [accountsError, setAccountsError] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [draft, setDraft] = useState<AccountDraft>(() => createDefaultDraft("super_admin", true));
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AccountRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [batchDeleteIds, setBatchDeleteIds] = useState<string[]>([]);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);
  const [batchDeleteError, setBatchDeleteError] = useState("");
  const [draftError, setDraftError] = useState("");
  const [linkedTalentProfileSearch, setLinkedTalentProfileSearch] = useState("");
  const [linkedTalentProfileOpen, setLinkedTalentProfileOpen] = useState(false);
  const [linkedTalentProfileStatus, setLinkedTalentProfileStatus] = useState<"idle" | "multiple" | "none">("idle");
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const linkedTalentSelectorRef = useRef<HTMLDivElement | null>(null);
  const accountsLoadStartedRef = useRef(false);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? accounts[0],
    [accounts, selectedAccountId],
  );

  const selectedAccountPassword = selectedAccount?.password || "Not Set";
  const localTestingMode = isLocalTestingMode();

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
  const batchDeleteTargets = useMemo(
    () => accounts.filter((account) => batchDeleteIds.includes(account.id)),
    [accounts, batchDeleteIds],
  );

  const applyLoadedAccounts = useCallback((uiAccounts: AccountRecord[]) => {
    setAccounts(uiAccounts);
    setSelectedAccountIds([]);
    if (uiAccounts.length) {
      setSelectedAccountId((currentSelectedId) => {
        const nextSelected = uiAccounts.find((account) => account.id === currentSelectedId) || uiAccounts[0];
        setDraft((current) => ({
          ...current,
          ...nextSelected,
          assignedTeams: nextSelected.assignedTeams.join(", "),
          toolPermissions: { ...nextSelected.toolPermissions },
          isNew: false,
          tempPassword: "",
          loginAccount: nextSelected.loginAccount,
          displayName: nextSelected.displayName,
          linkedTalentProfile: nextSelected.linkedTalentProfile || "",
          linkedTalentProfileManuallySelected: Boolean(nextSelected.linkedTalentProfile),
          displayNameTouched: false,
        }));
        return nextSelected.id;
      });
      return;
    }
    setSelectedAccountId("");
    setDraft(createDefaultDraft("super_admin", true));
    setEditorOpen(false);
  }, []);

  const refreshAccountsFromSource = useCallback(async () => {
    setAccountsError("");
    const response = await fetch("/api/accounts", { cache: "no-store" }).catch(() => null);
    if (!response) throw new Error("Unable to load accounts.");
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: "Unable to load accounts." })) as { error?: string };
      throw new Error(payload.error || "Unable to load accounts.");
    }

    const remoteAccounts = await response.json() as { accounts?: AccountApiRecord[] };
    const uiAccounts = (remoteAccounts.accounts || []).map(mapStoredAccountToUiAccount);
    applyLoadedAccounts(uiAccounts);
    setAccountsLoaded(true);
    return uiAccounts;
  }, [applyLoadedAccounts]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
    }
  }, [allVisibleSelected, someVisibleSelected]);

  useEffect(() => {
    if (accountsLoadStartedRef.current) return;
    accountsLoadStartedRef.current = true;
    let cancelled = false

    queueMicrotask(async () => {
      if (cancelled) return

      setAccountsLoaded(false);
      try {
        await refreshAccountsFromSource();
      } catch (error) {
        if (cancelled) return;
        applyLoadedAccounts([]);
        setAccountsError(error instanceof Error ? error.message : "Unable to load accounts.");
        setAccountsLoaded(true);
      }
    })

    return () => {
      cancelled = true
    }
  }, [applyLoadedAccounts, refreshAccountsFromSource])

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
      toolPermissions: { ...account.toolPermissions },
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

  function updateDraftField(field: keyof Omit<AccountDraft, "permissions" | "toolPermissions" | "isNew">, value: string) {
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
      toolPermissions: role === "super_admin" ? buildToolPermissionState(role) : current.toolPermissions,
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

  function updateToolPermission(toolId: string, checked: boolean) {
    if (draft.role === "super_admin") return;
    setDraft((current) => ({
      ...current,
      toolPermissions: {
        ...current.toolPermissions,
        [toolId]: checked,
      },
    }));
  }

  function setAllToolPermissions(checked: boolean) {
    if (draft.role === "super_admin") return;
    setDraft((current) => ({
      ...current,
      toolPermissions: Object.fromEntries(blackDogTools.map((tool) => [tool.id, checked])) as Record<string, boolean>,
    }));
  }

  async function saveDraft() {
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
    const updatedAt = new Date().toISOString().slice(0, 16).replace("T", " ");

    const nextAccount: AccountRecord = {
      id: draft.id,
      loginAccount: cleanedLoginAccount,
      displayName: cleanedDisplayName || (draft.isNew ? "New Account" : selectedAccount?.displayName || "Account"),
      email: draft.email.trim(),
      role: draft.role,
      status: draft.status,
      password: nextPassword,
      permissions: { ...draft.permissions },
      toolPermissions: draft.role === "super_admin" ? buildToolPermissionState("super_admin") : { ...draft.toolPermissions },
      assignedTeams: draft.assignedTeams
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      linkedTalentProfile: draft.role === "talent" ? draft.linkedTalentProfile.trim() : undefined,
      lastLogin: draft.isNew ? "Never" : selectedAccount?.lastLogin || "Never",
      notes: draft.notes.trim(),
      createdAt: draft.isNew ? updatedAt : selectedAccount?.createdAt || updatedAt,
      updatedAt,
    };

    const storedPayload = mapUiAccountToStoredAccount(nextAccount);
    const remoteResponse = await fetch(draft.isNew ? "/api/accounts" : `/api/accounts/${encodeURIComponent(nextAccount.id)}`, {
      method: draft.isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...storedPayload,
        displayName: nextAccount.displayName,
        password: cleanedPassword || undefined,
      }),
    }).catch(() => null);

    if (remoteResponse?.ok) {
      const payload = await remoteResponse.json() as { account: AccountApiRecord };
      const remoteAccount = mapStoredAccountToUiAccount(payload.account);
      setAccounts((current) => {
        const exists = current.some((account) => account.id === remoteAccount.id);
        return exists ? current.map((account) => (account.id === remoteAccount.id ? remoteAccount : account)) : [remoteAccount, ...current];
      });
      setSelectedAccountId(remoteAccount.id);
      setDraft({
        id: remoteAccount.id,
        loginAccount: remoteAccount.loginAccount,
        displayName: remoteAccount.displayName,
        email: remoteAccount.email,
        displayNameTouched: false,
        role: remoteAccount.role,
        status: remoteAccount.status,
        permissions: { ...remoteAccount.permissions },
        toolPermissions: { ...remoteAccount.toolPermissions },
        assignedTeams: remoteAccount.assignedTeams.join(", "),
        linkedTalentProfile: remoteAccount.linkedTalentProfile || "",
        linkedTalentProfileManuallySelected: Boolean(remoteAccount.linkedTalentProfile),
        lastLogin: remoteAccount.lastLogin,
        notes: remoteAccount.notes,
        tempPassword: "",
        isNew: false,
      });
      setEditorOpen(false);
      return;
    }

    const payload = await remoteResponse?.json().catch(() => ({ error: "Unable to save account." })) as { error?: string } | undefined;
    setDraftError(payload?.error || "Unable to save account.");
  }

  function resetDraftToRoleDefaults() {
    setDraft((current) => ({
      ...current,
      permissions: buildPermissionState(current.role),
      toolPermissions: buildToolPermissionState(current.role),
      linkedTalentProfile: current.role === "talent" ? current.linkedTalentProfile : "",
    }));
  }

  async function resetDraftPassword() {
    const nextPassword = draft.tempPassword.trim()
    if (!nextPassword) {
      setDraftError("Please enter a new password first.");
      return;
    }

    setDraftError("");

    if (!draft.isNew) {
      const response = await fetch(`/api/accounts/${encodeURIComponent(draft.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: nextPassword }),
      }).catch(() => null);

      if (!response?.ok) {
        const payload = await response?.json().catch(() => ({ error: "Unable to reset password." })) as { error?: string } | undefined;
        setDraftError(payload?.error || "Unable to reset password.");
        return;
      }

      const payload = await response.json() as { account: AccountApiRecord };
      const remoteAccount = mapStoredAccountToUiAccount(payload.account);
      setAccounts((current) => current.map((account) => (account.id === remoteAccount.id ? remoteAccount : account)));
      setDraft((current) => ({ ...current, tempPassword: "" }));
      return;
    }

    setDraft((current) => ({
      ...current,
      tempPassword: nextPassword,
    }));
  }

  async function pauseAccount(account: AccountRecord) {
    setAccountsError("");
    const nextStatus = account.status === "Locked" ? "Active" : "Locked";
    const response = await fetch(`/api/accounts/${encodeURIComponent(account.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    }).catch(() => null);

    if (!response?.ok) {
      const payload = await response?.json().catch(() => ({ error: "Unable to update account status." })) as { error?: string } | undefined;
      setAccountsError(payload?.error || "Unable to update account status.");
      return;
    }

    const payload = await response.json() as { account: AccountApiRecord };
    const remoteAccount = mapStoredAccountToUiAccount(payload.account);
    setAccounts((current) => current.map((item) => (item.id === remoteAccount.id ? remoteAccount : item)));
    if (selectedAccountId === remoteAccount.id) {
      setDraft((current) => ({
        ...current,
        status: remoteAccount.status,
      }));
    }
  }

  function requestDeleteAccount(account: AccountRecord) {
    setDeleteTarget(account);
    setDeleteError("");
  }

  async function confirmDeleteAccount() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError("");

    const remoteResponse = await fetch(`/api/accounts/${encodeURIComponent(deleteTarget.id)}`, {
      method: "DELETE",
    }).catch(() => null);

    if (remoteResponse && !remoteResponse.ok) {
      const payload = await remoteResponse.json().catch(() => ({ error: "Unable to delete account." })) as { error?: string };
      setDeleteError(payload.error || "Unable to delete account.");
      setDeleteLoading(false);
      return;
    }

    if (!remoteResponse && !isLocalTestingMode()) {
      setDeleteError("Unable to delete account.");
      setDeleteLoading(false);
      return;
    }

    try {
      await refreshAccountsFromSource();
      setSelectedAccountIds((current) => current.filter((id) => id !== deleteTarget.id));
    } catch (error) {
      setAccountsError(error instanceof Error ? error.message : "Unable to refresh accounts.");
    }
    setDeleteTarget(null);
    setDeleteLoading(false);
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

  async function retryLoadAccounts() {
    setAccountsLoaded(false);
    setAccountsError("");
    try {
      await refreshAccountsFromSource();
    } catch (error) {
      applyLoadedAccounts([]);
      setAccountsError(error instanceof Error ? error.message : "Unable to load accounts.");
      setAccountsLoaded(true);
    }
  }

  async function batchPauseAccounts() {
    setAccountsError("");
    const failures: string[] = [];
    for (const accountId of selectedAccountIds) {
      const response = await fetch(`/api/accounts/${encodeURIComponent(accountId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Locked" }),
      }).catch(() => null);

      if (!response?.ok) {
        const payload = await response?.json().catch(() => ({ error: "Unable to lock account." })) as { error?: string } | undefined;
        const account = accounts.find((item) => item.id === accountId);
        failures.push(`${account?.loginAccount || accountId}: ${payload?.error || "Unable to lock account."}`);
      }
    }

    try {
      await refreshAccountsFromSource();
    } catch (error) {
      setAccountsError(error instanceof Error ? error.message : "Unable to refresh accounts.");
      return;
    }

    if (failures.length) {
      setAccountsError(`${failures.length} account${failures.length > 1 ? "s" : ""} could not be locked. ${failures.join(" ")}`);
    }
  }

  function requestBatchDeleteAccounts() {
    setBatchDeleteIds(selectedAccountIds);
    setBatchDeleteError("");
  }

  async function confirmBatchDeleteAccounts() {
    if (!batchDeleteIds.length) return;
    setBatchDeleteLoading(true);
    setBatchDeleteError("");

    const failures: string[] = [];
    for (const accountId of batchDeleteIds) {
      const response = await fetch(`/api/accounts/${encodeURIComponent(accountId)}`, {
        method: "DELETE",
      }).catch(() => null);

      if (!response?.ok) {
        const payload = await response?.json().catch(() => ({ error: "Unable to delete account." })) as { error?: string } | undefined;
        const account = accounts.find((item) => item.id === accountId);
        failures.push(`${account?.loginAccount || accountId}: ${payload?.error || "Unable to delete account."}`);
      }
    }

    await refreshAccountsFromSource();
    setBatchDeleteLoading(false);

    if (failures.length) {
      setBatchDeleteError(`${failures.length} account${failures.length > 1 ? "s" : ""} could not be deleted. ${failures.join(" ")}`);
      return;
    }

    setBatchDeleteIds([]);
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
                    onClick={requestBatchDeleteAccounts}
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

          {!accountsLoaded ? (
            <div className="mt-4 rounded-xl border border-[#e3dbcd] bg-white px-5 py-8 text-center text-sm font-semibold text-[#6f6256] shadow-[0_10px_24px_rgba(31,41,51,0.06)]">
              Loading accounts...
            </div>
          ) : accountsError && !accounts.length ? (
            <div className="mt-4 rounded-xl border border-[#f5c2c7] bg-[#fdecec] px-5 py-6 text-center shadow-[0_10px_24px_rgba(31,41,51,0.06)]">
              <div className="text-sm font-bold text-[#b42318]">{accountsError}</div>
              <button
                type="button"
                onClick={retryLoadAccounts}
                className="mt-4 inline-flex items-center rounded-md border border-[#b42318] bg-white px-4 py-2 text-sm font-semibold text-[#b42318] hover:bg-[#fff1ef]"
              >
                Retry
              </button>
            </div>
          ) : (
          <>
          {accountsError ? (
            <div className="mt-4 rounded-xl border border-[#f5c2c7] bg-[#fdecec] px-4 py-3 text-sm font-semibold text-[#b42318]">
              {accountsError}
            </div>
          ) : null}
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
                            onClick={(event) => {
                              event.stopPropagation();
                              requestDeleteAccount(account);
                            }}
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
          </>
          )}
        </section>
      </div>

      {batchDeleteIds.length ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/40 px-4 py-8">
          <section className="w-full max-w-lg rounded-2xl border border-[#f1c7c2] bg-white p-6 shadow-[0_24px_60px_rgba(17,24,39,0.22)]">
            <h2 className="text-xl font-black text-[#111827]">Delete selected accounts?</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6256]">
              Are you sure you want to delete the selected accounts? This action cannot be undone.
            </p>
            <div className="mt-4 max-h-48 overflow-auto rounded-xl border border-[#eadfcd] bg-[#fbfaf6] px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f6256]">
                {batchDeleteIds.length} selected
              </div>
              <div className="mt-2 space-y-2">
                {batchDeleteTargets.map((account) => (
                  <div key={account.id}>
                    <div className="text-sm font-black text-[#111827]">{account.displayName}</div>
                    <div className="text-xs font-semibold text-[#6f6256]">{account.loginAccount}</div>
                  </div>
                ))}
              </div>
            </div>
            {batchDeleteError ? (
              <div className="mt-4 rounded-xl border border-[#f5c2c7] bg-[#fdecec] px-4 py-3 text-sm font-semibold text-[#b42318]">
                {batchDeleteError}
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (batchDeleteLoading) return;
                  setBatchDeleteIds([]);
                  setBatchDeleteError("");
                }}
                disabled={batchDeleteLoading}
                className="inline-flex min-w-24 items-center justify-center rounded-md border border-[#d7dccf] bg-[#fffdf8] px-4 py-2 text-sm font-semibold text-[#40372f] hover:bg-[#f6f2e8] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBatchDeleteAccounts}
                disabled={batchDeleteLoading}
                className="inline-flex min-w-24 items-center justify-center rounded-md border border-[#b42318] bg-[#b42318] px-4 py-2 text-sm font-semibold text-white hover:bg-[#981b1b] disabled:opacity-60"
              >
                {batchDeleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/40 px-4 py-8">
          <section className="w-full max-w-md rounded-2xl border border-[#f1c7c2] bg-white p-6 shadow-[0_24px_60px_rgba(17,24,39,0.22)]">
            <h2 className="text-xl font-black text-[#111827]">Delete account?</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6256]">
              Are you sure you want to delete this account? This action cannot be undone.
            </p>
            <div className="mt-4 rounded-xl border border-[#eadfcd] bg-[#fbfaf6] px-4 py-3">
              <div className="text-sm font-black text-[#111827]">{deleteTarget.displayName}</div>
              <div className="mt-1 text-xs font-semibold text-[#6f6256]">{deleteTarget.loginAccount}</div>
            </div>
            {deleteError ? (
              <div className="mt-4 rounded-xl border border-[#f5c2c7] bg-[#fdecec] px-4 py-3 text-sm font-semibold text-[#b42318]">
                {deleteError}
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (deleteLoading) return;
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
                disabled={deleteLoading}
                className="inline-flex min-w-24 items-center justify-center rounded-md border border-[#d7dccf] bg-[#fffdf8] px-4 py-2 text-sm font-semibold text-[#40372f] hover:bg-[#f6f2e8] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAccount}
                disabled={deleteLoading}
                className="inline-flex min-w-24 items-center justify-center rounded-md border border-[#b42318] bg-[#b42318] px-4 py-2 text-sm font-semibold text-white hover:bg-[#981b1b] disabled:opacity-60"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

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
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f6256]">Email / Login Account</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-[#d7dde2] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none"
                        value={draft.loginAccount}
                        onChange={(event) => updateDraftField("loginAccount", event.target.value)}
                        placeholder="email or login account"
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
                      {localTestingMode ? (
                        <>
                          <div className="mt-1 text-[11px] text-[#6f6256]">
                            Dev-only current password: <span className="font-mono font-semibold text-[#111827]">{selectedAccountPassword}</span>
                          </div>
                          <div className="mt-1 text-[11px] text-[#6f6256]">
                            Local testing only. Production passwords are never displayed.
                          </div>
                        </>
                      ) : (
                        <div className="mt-1 text-[11px] text-[#6f6256]">
                          Password is hidden for security. Use Reset Password to set a new temporary password.
                        </div>
                      )}
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
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f5c43]">BlackDog Tools Access</div>
                        <p className="mt-2 text-xs font-medium leading-5 text-[#6f6256]">
                          Select which tools this account can use.
                        </p>
                      </div>
                      {draft.role === "super_admin" ? (
                        <span className="rounded-full border border-[#c9dfd0] bg-[#edf8f1] px-3 py-1.5 text-xs font-bold text-[#1f5c43]">
                          All tools enabled
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setAllToolPermissions(true)}
                            className="rounded-md border border-[#d7dccf] bg-white px-3 py-1.5 text-xs font-semibold text-[#40372f]"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => setAllToolPermissions(false)}
                            className="rounded-md border border-[#d7dccf] bg-white px-3 py-1.5 text-xs font-semibold text-[#40372f]"
                          >
                            Clear All
                          </button>
                        </div>
                      )}
                    </div>

                    {draft.role === "super_admin" ? (
                      <p className="mt-4 rounded-lg border border-[#d7dccf] bg-white px-3 py-2 text-sm font-semibold text-[#40372f]">
                        Admin accounts have access to all tools.
                      </p>
                    ) : (
                      <div className="mt-4 grid gap-2">
                        {blackDogTools.map((tool) => (
                          <label
                            key={tool.id}
                            className="flex items-start gap-3 rounded-lg border border-[#ebe3d5] bg-white p-3"
                          >
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 rounded border-[#c4b49c] text-[#1f5c43]"
                              checked={Boolean(draft.toolPermissions[tool.id])}
                              onChange={(event) => updateToolPermission(tool.id, event.target.checked)}
                            />
                            <span>
                              <span className="block text-sm font-semibold text-[#111827]">{tool.name}</span>
                              <span className="mt-1 block text-xs leading-5 text-[#6f6256]">{tool.description}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

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
