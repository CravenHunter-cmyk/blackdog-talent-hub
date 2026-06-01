import { boolean, index, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export type ToolTaskStatus = "Draft" | "Running" | "Paused" | "Reviewing" | "Completed" | "Archived" | "Deleted";
export type ToolSearchBatchStatus = "Pending" | "Running" | "Succeeded" | "Failed" | "Cancelled";
export type ToolExportType = "csv_all" | "csv_selected" | "csv_filtered";
export type YoutubeDbResultStatus = "Pending" | "Useful" | "Not Useful" | "Processed";
export type YoutubeCollectionUnitStatus = "Pending" | "Ready" | "Running" | "Paused" | "Completed" | "Cancelled" | "Failed";
export type PrimaryUnitSetBy = "system" | "user";
export type YoutubeDuplicateGroupStatus = "Open" | "Reviewed" | "Ignored" | "Keep Separate" | "Applied";
export type YoutubeUserRole = "admin" | "reviewer" | "member";
export type BlackDogAccountRole = "admin" | "reviewer" | "member";
export type BlackDogAccountStatus = "Active" | "Invited" | "Locked" | "Deleted";

export const toolTasks = pgTable(
  "tool_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    toolType: text("tool_type").notNull(),
    name: text("name").notNull(),
    language: text("language").notNull(),
    domain: text("domain").notNull(),
    searchTargets: jsonb("search_targets").$type<string[]>().notNull(),
    targetUniqueResults: integer("target_unique_results"),
    publishedDateRangeLabel: text("published_date_range_label"),
    publishedWithinMonths: integer("published_within_months"),
    status: text("status").$type<ToolTaskStatus>().notNull().default("Draft"),
    notes: text("notes"),
    createdBy: text("created_by"),
    ownerId: text("owner_id"),
    ownerEmail: text("owner_email"),
    visibility: text("visibility").notNull().default("private"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: text("deleted_by"),
    deleteReason: text("delete_reason"),
    restoredAt: timestamp("restored_at", { withTimezone: true }),
    restoredBy: text("restored_by"),
    editingBy: text("editing_by"),
    editingByEmail: text("editing_by_email"),
    editingStartedAt: timestamp("editing_started_at", { withTimezone: true }),
    editingExpiresAt: timestamp("editing_expires_at", { withTimezone: true }),
  },
  (table) => [
    index("tool_tasks_tool_type_idx").on(table.toolType),
    index("tool_tasks_status_idx").on(table.status),
    index("tool_tasks_owner_id_idx").on(table.ownerId),
    index("tool_tasks_visibility_idx").on(table.visibility),
    index("tool_tasks_deleted_at_idx").on(table.deletedAt),
    index("tool_tasks_editing_by_idx").on(table.editingBy),
    index("tool_tasks_created_at_idx").on(table.createdAt),
  ],
);

export const youtubeCollectionUnits = pgTable(
  "youtube_collection_units",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id").notNull().references(() => toolTasks.id),
    unitIndex: integer("unit_index").notNull(),
    language: text("language").notNull(),
    domain: text("domain").notNull(),
    searchTarget: text("search_target").notNull(),
    targetResults: integer("target_results"),
    targetHours: numeric("target_hours", { precision: 10, scale: 2 }),
    status: text("status").$type<YoutubeCollectionUnitStatus>().notNull().default("Pending"),
    selected: boolean("selected").notNull().default(false),
    keywordCount: integer("keyword_count").notNull().default(0),
    selectedKeywordCount: integer("selected_keyword_count").notNull().default(0),
    primaryUniqueCount: integer("primary_unique_count").notNull().default(0),
    matchedSourcesCount: integer("matched_sources_count").notNull().default(0),
    duplicateCount: integer("duplicate_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    runningBy: text("running_by"),
    runningByEmail: text("running_by_email"),
    runningStartedAt: timestamp("running_started_at", { withTimezone: true }),
    runningExpiresAt: timestamp("running_expires_at", { withTimezone: true }),
  },
  (table) => [
    index("youtube_collection_units_task_id_idx").on(table.taskId),
    index("youtube_collection_units_status_idx").on(table.status),
    index("youtube_collection_units_running_by_idx").on(table.runningBy),
    index("youtube_collection_units_task_index_idx").on(table.taskId, table.unitIndex),
    index("youtube_collection_units_dimensions_idx").on(table.taskId, table.language, table.domain, table.searchTarget),
  ],
);

export const toolSearchBatches = pgTable(
  "tool_search_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id").notNull().references(() => toolTasks.id),
    unitId: uuid("unit_id").references(() => youtubeCollectionUnits.id),
    batchName: text("batch_name"),
    status: text("status").$type<ToolSearchBatchStatus>().notNull().default("Pending"),
    requestedCount: integer("requested_count"),
    acceptedCount: integer("accepted_count").notNull().default(0),
    filteredByDateCount: integer("filtered_by_date_count").notNull().default(0),
    returnedCount: integer("returned_count").notNull().default(0),
    duplicateCount: integer("duplicate_count").notNull().default(0),
    uniqueAddedCount: integer("unique_added_count").notNull().default(0),
    keywords: jsonb("keywords").$type<Array<{ keyword: string; source: string; language?: string; domain?: string; searchTarget?: string; groupKey?: string; unitId?: string; unitLabel?: string; publishedWithinMonths?: number | null; publishedDateRangeLabel?: string | null }>>().notNull(),
    publishedDateRangeLabel: text("published_date_range_label"),
    publishedWithinMonths: integer("published_within_months"),
    apifyRunId: text("apify_run_id"),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("tool_search_batches_task_id_idx").on(table.taskId),
    index("tool_search_batches_unit_id_idx").on(table.unitId),
    index("tool_search_batches_status_idx").on(table.status),
    index("tool_search_batches_created_at_idx").on(table.createdAt),
  ],
);

export const youtubeResults = pgTable(
  "youtube_results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id").notNull().references(() => toolTasks.id),
    videoId: text("video_id"),
    videoUrl: text("video_url").notNull(),
    normalizedVideoUrl: text("normalized_video_url"),
    title: text("title"),
    channelName: text("channel_name"),
    channelUrl: text("channel_url"),
    duration: text("duration"),
    viewCount: text("view_count"),
    likeCount: integer("like_count"),
    commentCount: integer("comment_count"),
    publishedDate: text("published_date"),
    videoType: text("video_type"),
    category: text("category"),
    description: text("description"),
    thumbnailUrl: text("thumbnail_url"),
    metadata: jsonb("metadata").$type<{
      youtubeTags?: string[];
      hashtags?: string[];
      category?: string;
      description?: string;
      thumbnailUrl?: string;
      likeCount?: string | number | null;
      commentCount?: string | number | null;
      tagsUnavailable?: boolean;
      raw?: Record<string, unknown>;
    }>(),
    primaryUnitId: uuid("primary_unit_id").references(() => youtubeCollectionUnits.id),
    primaryUnitSetBy: text("primary_unit_set_by").$type<PrimaryUnitSetBy>().notNull().default("system"),
    primaryUnitReason: text("primary_unit_reason"),
    primaryUnitUpdatedAt: timestamp("primary_unit_updated_at", { withTimezone: true }),
    primaryUnitUpdatedBy: text("primary_unit_updated_by"),
    primaryUnitUpdatedByEmail: text("primary_unit_updated_by_email"),
    status: text("status").$type<YoutubeDbResultStatus>().notNull().default("Pending"),
    notes: text("notes"),
    duplicateCount: integer("duplicate_count").notNull().default(0),
    matchedKeywords: jsonb("matched_keywords").$type<string[]>(),
    matchedBatchIds: jsonb("matched_batch_ids").$type<string[]>(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("youtube_results_task_id_idx").on(table.taskId),
    index("youtube_results_primary_unit_id_idx").on(table.primaryUnitId),
    index("youtube_results_video_id_idx").on(table.videoId),
    index("youtube_results_normalized_video_url_idx").on(table.normalizedVideoUrl),
    index("youtube_results_status_idx").on(table.status),
    index("youtube_results_deleted_at_idx").on(table.deletedAt),
  ],
);

export const youtubeResultMatches = pgTable(
  "youtube_result_matches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    resultId: uuid("result_id").notNull().references(() => youtubeResults.id),
    taskId: uuid("task_id").notNull().references(() => toolTasks.id),
    unitId: uuid("unit_id").references(() => youtubeCollectionUnits.id),
    batchId: uuid("batch_id").references(() => toolSearchBatches.id),
    searchKeyword: text("search_keyword").notNull(),
    keyword: text("keyword"),
    keywordSource: text("keyword_source"),
    runId: uuid("run_id"),
    matchReason: text("match_reason"),
    language: text("language"),
    domain: text("domain"),
    searchTarget: text("search_target"),
    matchedAt: timestamp("matched_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("youtube_result_matches_result_id_idx").on(table.resultId),
    index("youtube_result_matches_task_id_idx").on(table.taskId),
    index("youtube_result_matches_unit_id_idx").on(table.unitId),
    index("youtube_result_matches_batch_id_idx").on(table.batchId),
    index("youtube_result_matches_search_keyword_idx").on(table.searchKeyword),
  ],
);

export const youtubeDuplicateGroups = pgTable(
  "youtube_duplicate_groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id").notNull().references(() => toolTasks.id),
    groupKey: text("group_key").notNull(),
    groupType: text("group_type").notNull(),
    reason: text("reason"),
    similarityScore: numeric("similarity_score", { precision: 6, scale: 4 }),
    status: text("status").$type<YoutubeDuplicateGroupStatus>().notNull().default("Open"),
    recommendedKeepResultId: uuid("recommended_keep_result_id").references(() => youtubeResults.id),
    keptResultId: uuid("kept_result_id").references(() => youtubeResults.id),
    decision: text("decision"),
    reviewedBy: text("reviewed_by"),
    reviewedByEmail: text("reviewed_by_email"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    index("youtube_duplicate_groups_task_id_idx").on(table.taskId),
    index("youtube_duplicate_groups_group_key_idx").on(table.taskId, table.groupKey),
    index("youtube_duplicate_groups_status_idx").on(table.status),
  ],
);

export const youtubeDuplicateGroupItems = pgTable(
  "youtube_duplicate_group_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id").notNull().references(() => youtubeDuplicateGroups.id),
    resultId: uuid("result_id").notNull().references(() => youtubeResults.id),
    action: text("action"),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("youtube_duplicate_group_items_group_id_idx").on(table.groupId),
    index("youtube_duplicate_group_items_result_id_idx").on(table.resultId),
  ],
);

export const toolExports = pgTable(
  "tool_exports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id").notNull().references(() => toolTasks.id),
    exportType: text("export_type").$type<ToolExportType>().notNull(),
    rowCount: integer("row_count"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("tool_exports_task_id_idx").on(table.taskId),
    index("tool_exports_export_type_idx").on(table.exportType),
    index("tool_exports_created_at_idx").on(table.createdAt),
  ],
);

export const youtubeAuditLogs = pgTable(
  "youtube_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id").references(() => toolTasks.id),
    resultId: uuid("result_id").references(() => youtubeResults.id),
    unitId: uuid("unit_id").references(() => youtubeCollectionUnits.id),
    action: text("action").notNull(),
    actorId: text("actor_id"),
    actorEmail: text("actor_email"),
    before: jsonb("before").$type<Record<string, unknown> | null>(),
    after: jsonb("after").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("youtube_audit_logs_task_id_idx").on(table.taskId),
    index("youtube_audit_logs_result_id_idx").on(table.resultId),
    index("youtube_audit_logs_unit_id_idx").on(table.unitId),
    index("youtube_audit_logs_action_idx").on(table.action),
    index("youtube_audit_logs_actor_id_idx").on(table.actorId),
    index("youtube_audit_logs_created_at_idx").on(table.createdAt),
  ],
);

export const blackDogAccounts = pgTable(
  "blackdog_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    loginAccount: text("login_account"),
    name: text("name"),
    role: text("role").$type<BlackDogAccountRole>().notNull().default("member"),
    status: text("status").$type<BlackDogAccountStatus>().notNull().default("Active"),
    passwordHash: text("password_hash"),
    passwordUpdatedAt: timestamp("password_updated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("blackdog_accounts_email_unique_idx").on(table.email),
    uniqueIndex("blackdog_accounts_login_account_unique_idx").on(table.loginAccount),
    index("blackdog_accounts_role_idx").on(table.role),
    index("blackdog_accounts_status_idx").on(table.status),
    index("blackdog_accounts_created_at_idx").on(table.createdAt),
  ],
);

export const blackDogSessions = pgTable(
  "blackdog_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull().references(() => blackDogAccounts.id),
    sessionTokenHash: text("session_token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("blackdog_sessions_token_hash_unique_idx").on(table.sessionTokenHash),
    index("blackdog_sessions_account_id_idx").on(table.accountId),
    index("blackdog_sessions_expires_at_idx").on(table.expiresAt),
    index("blackdog_sessions_revoked_at_idx").on(table.revokedAt),
  ],
);

export const blackDogToolPermissions = pgTable(
  "blackdog_tool_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull().references(() => blackDogAccounts.id),
    toolId: text("tool_id").notNull(),
    granted: boolean("granted").notNull().default(true),
    grantedBy: text("granted_by"),
    grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("blackdog_tool_permissions_account_tool_unique_idx").on(table.accountId, table.toolId),
    index("blackdog_tool_permissions_account_id_idx").on(table.accountId),
    index("blackdog_tool_permissions_tool_id_idx").on(table.toolId),
    index("blackdog_tool_permissions_granted_idx").on(table.granted),
  ],
);

export const blackDogAuditLogs = pgTable(
  "blackdog_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    action: text("action").notNull(),
    actorId: text("actor_id"),
    actorEmail: text("actor_email"),
    targetAccountId: uuid("target_account_id").references(() => blackDogAccounts.id),
    targetEmail: text("target_email"),
    toolId: text("tool_id"),
    before: jsonb("before").$type<Record<string, unknown> | null>(),
    after: jsonb("after").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("blackdog_audit_logs_action_idx").on(table.action),
    index("blackdog_audit_logs_actor_id_idx").on(table.actorId),
    index("blackdog_audit_logs_target_account_id_idx").on(table.targetAccountId),
    index("blackdog_audit_logs_tool_id_idx").on(table.toolId),
    index("blackdog_audit_logs_created_at_idx").on(table.createdAt),
  ],
);
