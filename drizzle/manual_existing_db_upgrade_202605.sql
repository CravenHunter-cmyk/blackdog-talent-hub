-- Manual existing Neon development database upgrade for YouTube Speech Link Collector.
-- This file is intentionally additive only.
-- Do not run this against production without review.

CREATE TABLE IF NOT EXISTS "youtube_collection_units" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "task_id" uuid NOT NULL REFERENCES "public"."tool_tasks"("id"),
  "unit_index" integer NOT NULL,
  "language" text NOT NULL,
  "domain" text NOT NULL,
  "search_target" text NOT NULL,
  "target_results" integer,
  "target_hours" numeric(10, 2),
  "status" text DEFAULT 'Pending' NOT NULL,
  "selected" boolean DEFAULT false NOT NULL,
  "keyword_count" integer DEFAULT 0 NOT NULL,
  "selected_keyword_count" integer DEFAULT 0 NOT NULL,
  "primary_unique_count" integer DEFAULT 0 NOT NULL,
  "matched_sources_count" integer DEFAULT 0 NOT NULL,
  "duplicate_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "started_at" timestamp with time zone,
  "paused_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "cancelled_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "youtube_duplicate_groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "task_id" uuid NOT NULL REFERENCES "public"."tool_tasks"("id"),
  "group_key" text NOT NULL,
  "group_type" text NOT NULL,
  "reason" text,
  "similarity_score" numeric(6, 4),
  "status" text DEFAULT 'Open' NOT NULL,
  "recommended_keep_result_id" uuid REFERENCES "public"."youtube_results"("id"),
  "kept_result_id" uuid REFERENCES "public"."youtube_results"("id"),
  "decision" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "reviewed_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "youtube_duplicate_group_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "group_id" uuid NOT NULL REFERENCES "public"."youtube_duplicate_groups"("id"),
  "result_id" uuid NOT NULL REFERENCES "public"."youtube_results"("id"),
  "action" text,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "youtube_audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "task_id" uuid REFERENCES "public"."tool_tasks"("id"),
  "result_id" uuid REFERENCES "public"."youtube_results"("id"),
  "unit_id" uuid REFERENCES "public"."youtube_collection_units"("id"),
  "action" text NOT NULL,
  "actor_id" text,
  "actor_email" text,
  "before" jsonb,
  "after" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "blackdog_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "login_account" text,
  "name" text,
  "role" text DEFAULT 'member' NOT NULL,
  "status" text DEFAULT 'Active' NOT NULL,
  "password_hash" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "blackdog_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL REFERENCES "public"."blackdog_accounts"("id"),
  "session_token_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_seen_at" timestamp with time zone,
  "revoked_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "blackdog_tool_permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL REFERENCES "public"."blackdog_accounts"("id"),
  "tool_id" text NOT NULL,
  "granted" boolean DEFAULT true NOT NULL,
  "granted_by" text,
  "granted_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "blackdog_audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "action" text NOT NULL,
  "actor_id" text,
  "actor_email" text,
  "target_account_id" uuid REFERENCES "public"."blackdog_accounts"("id"),
  "target_email" text,
  "tool_id" text,
  "before" jsonb,
  "after" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "blackdog_accounts" ADD COLUMN IF NOT EXISTS "login_account" text;
ALTER TABLE "blackdog_accounts" ADD COLUMN IF NOT EXISTS "password_hash" text;

ALTER TABLE "tool_tasks" ADD COLUMN IF NOT EXISTS "published_date_range_label" text;
ALTER TABLE "tool_tasks" ADD COLUMN IF NOT EXISTS "published_within_months" integer;
ALTER TABLE "tool_tasks" ADD COLUMN IF NOT EXISTS "created_by" text;
ALTER TABLE "tool_tasks" ADD COLUMN IF NOT EXISTS "owner_id" text;
ALTER TABLE "tool_tasks" ADD COLUMN IF NOT EXISTS "owner_email" text;
ALTER TABLE "tool_tasks" ADD COLUMN IF NOT EXISTS "visibility" text DEFAULT 'private' NOT NULL;
ALTER TABLE "tool_tasks" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;
ALTER TABLE "tool_tasks" ADD COLUMN IF NOT EXISTS "deleted_by" text;
ALTER TABLE "tool_tasks" ADD COLUMN IF NOT EXISTS "delete_reason" text;
ALTER TABLE "tool_tasks" ADD COLUMN IF NOT EXISTS "restored_at" timestamp with time zone;
ALTER TABLE "tool_tasks" ADD COLUMN IF NOT EXISTS "restored_by" text;
ALTER TABLE "tool_tasks" ADD COLUMN IF NOT EXISTS "editing_by" text;
ALTER TABLE "tool_tasks" ADD COLUMN IF NOT EXISTS "editing_by_email" text;
ALTER TABLE "tool_tasks" ADD COLUMN IF NOT EXISTS "editing_started_at" timestamp with time zone;
ALTER TABLE "tool_tasks" ADD COLUMN IF NOT EXISTS "editing_expires_at" timestamp with time zone;

ALTER TABLE "tool_search_batches" ADD COLUMN IF NOT EXISTS "unit_id" uuid;
ALTER TABLE "tool_search_batches" ADD COLUMN IF NOT EXISTS "requested_count" integer;
ALTER TABLE "tool_search_batches" ADD COLUMN IF NOT EXISTS "returned_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "tool_search_batches" ADD COLUMN IF NOT EXISTS "accepted_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "tool_search_batches" ADD COLUMN IF NOT EXISTS "filtered_by_date_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "tool_search_batches" ADD COLUMN IF NOT EXISTS "duplicate_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "tool_search_batches" ADD COLUMN IF NOT EXISTS "unique_added_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "tool_search_batches" ADD COLUMN IF NOT EXISTS "published_date_range_label" text;
ALTER TABLE "tool_search_batches" ADD COLUMN IF NOT EXISTS "published_within_months" integer;
ALTER TABLE "tool_search_batches" ADD COLUMN IF NOT EXISTS "apify_run_id" text;
ALTER TABLE "tool_search_batches" ADD COLUMN IF NOT EXISTS "started_at" timestamp with time zone;
ALTER TABLE "tool_search_batches" ADD COLUMN IF NOT EXISTS "finished_at" timestamp with time zone;

ALTER TABLE "youtube_results" ADD COLUMN IF NOT EXISTS "primary_unit_id" uuid;
ALTER TABLE "youtube_results" ADD COLUMN IF NOT EXISTS "primary_unit_set_by" text DEFAULT 'system' NOT NULL;
ALTER TABLE "youtube_results" ADD COLUMN IF NOT EXISTS "primary_unit_reason" text;
ALTER TABLE "youtube_results" ADD COLUMN IF NOT EXISTS "primary_unit_updated_at" timestamp with time zone;
ALTER TABLE "youtube_results" ADD COLUMN IF NOT EXISTS "primary_unit_updated_by" text;
ALTER TABLE "youtube_results" ADD COLUMN IF NOT EXISTS "primary_unit_updated_by_email" text;
ALTER TABLE "youtube_results" ADD COLUMN IF NOT EXISTS "metadata" jsonb;
ALTER TABLE "youtube_results" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE "youtube_results" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "youtube_results" ADD COLUMN IF NOT EXISTS "thumbnail_url" text;
ALTER TABLE "youtube_results" ADD COLUMN IF NOT EXISTS "like_count" integer;
ALTER TABLE "youtube_results" ADD COLUMN IF NOT EXISTS "comment_count" integer;

ALTER TABLE "youtube_result_matches" ADD COLUMN IF NOT EXISTS "unit_id" uuid;
ALTER TABLE "youtube_result_matches" ADD COLUMN IF NOT EXISTS "keyword" text;
ALTER TABLE "youtube_result_matches" ADD COLUMN IF NOT EXISTS "keyword_source" text;
ALTER TABLE "youtube_result_matches" ADD COLUMN IF NOT EXISTS "run_id" uuid;
ALTER TABLE "youtube_result_matches" ADD COLUMN IF NOT EXISTS "match_reason" text;
ALTER TABLE "youtube_result_matches" ADD COLUMN IF NOT EXISTS "language" text;
ALTER TABLE "youtube_result_matches" ADD COLUMN IF NOT EXISTS "domain" text;
ALTER TABLE "youtube_result_matches" ADD COLUMN IF NOT EXISTS "search_target" text;
ALTER TABLE "youtube_result_matches" ADD COLUMN IF NOT EXISTS "matched_at" timestamp with time zone DEFAULT now() NOT NULL;

ALTER TABLE "youtube_collection_units" ADD COLUMN IF NOT EXISTS "running_by" text;
ALTER TABLE "youtube_collection_units" ADD COLUMN IF NOT EXISTS "running_by_email" text;
ALTER TABLE "youtube_collection_units" ADD COLUMN IF NOT EXISTS "running_started_at" timestamp with time zone;
ALTER TABLE "youtube_collection_units" ADD COLUMN IF NOT EXISTS "running_expires_at" timestamp with time zone;

ALTER TABLE "youtube_duplicate_groups" ADD COLUMN IF NOT EXISTS "reviewed_by" text;
ALTER TABLE "youtube_duplicate_groups" ADD COLUMN IF NOT EXISTS "reviewed_by_email" text;
ALTER TABLE "youtube_duplicate_groups" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp with time zone;
ALTER TABLE "youtube_duplicate_groups" ADD COLUMN IF NOT EXISTS "decision" text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tool_search_batches_unit_id_youtube_collection_units_id_fk'
  ) THEN
    ALTER TABLE "tool_search_batches"
      ADD CONSTRAINT "tool_search_batches_unit_id_youtube_collection_units_id_fk"
      FOREIGN KEY ("unit_id") REFERENCES "public"."youtube_collection_units"("id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'youtube_results_primary_unit_id_youtube_collection_units_id_fk'
  ) THEN
    ALTER TABLE "youtube_results"
      ADD CONSTRAINT "youtube_results_primary_unit_id_youtube_collection_units_id_fk"
      FOREIGN KEY ("primary_unit_id") REFERENCES "public"."youtube_collection_units"("id");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'youtube_result_matches_unit_id_youtube_collection_units_id_fk'
  ) THEN
    ALTER TABLE "youtube_result_matches"
      ADD CONSTRAINT "youtube_result_matches_unit_id_youtube_collection_units_id_fk"
      FOREIGN KEY ("unit_id") REFERENCES "public"."youtube_collection_units"("id");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "youtube_collection_units_task_id_idx" ON "youtube_collection_units" USING btree ("task_id");
CREATE INDEX IF NOT EXISTS "youtube_collection_units_status_idx" ON "youtube_collection_units" USING btree ("status");
CREATE INDEX IF NOT EXISTS "youtube_collection_units_running_by_idx" ON "youtube_collection_units" USING btree ("running_by");
CREATE INDEX IF NOT EXISTS "youtube_collection_units_task_index_idx" ON "youtube_collection_units" USING btree ("task_id", "unit_index");
CREATE INDEX IF NOT EXISTS "youtube_collection_units_dimensions_idx" ON "youtube_collection_units" USING btree ("task_id", "language", "domain", "search_target");

CREATE INDEX IF NOT EXISTS "tool_tasks_owner_id_idx" ON "tool_tasks" USING btree ("owner_id");
CREATE INDEX IF NOT EXISTS "tool_tasks_created_by_idx" ON "tool_tasks" USING btree ("created_by");
CREATE INDEX IF NOT EXISTS "tool_tasks_visibility_idx" ON "tool_tasks" USING btree ("visibility");
CREATE INDEX IF NOT EXISTS "tool_tasks_deleted_at_idx" ON "tool_tasks" USING btree ("deleted_at");
CREATE INDEX IF NOT EXISTS "tool_tasks_editing_by_idx" ON "tool_tasks" USING btree ("editing_by");

CREATE INDEX IF NOT EXISTS "tool_search_batches_unit_id_idx" ON "tool_search_batches" USING btree ("unit_id");
CREATE INDEX IF NOT EXISTS "tool_search_batches_status_idx" ON "tool_search_batches" USING btree ("status");
CREATE INDEX IF NOT EXISTS "tool_search_batches_created_at_idx" ON "tool_search_batches" USING btree ("created_at");

CREATE INDEX IF NOT EXISTS "youtube_results_primary_unit_id_idx" ON "youtube_results" USING btree ("primary_unit_id");
CREATE INDEX IF NOT EXISTS "youtube_results_video_id_idx" ON "youtube_results" USING btree ("video_id");
CREATE INDEX IF NOT EXISTS "youtube_results_normalized_video_url_idx" ON "youtube_results" USING btree ("normalized_video_url");
CREATE INDEX IF NOT EXISTS "youtube_results_status_idx" ON "youtube_results" USING btree ("status");
CREATE INDEX IF NOT EXISTS "youtube_results_deleted_at_idx" ON "youtube_results" USING btree ("deleted_at");

CREATE INDEX IF NOT EXISTS "youtube_result_matches_result_id_idx" ON "youtube_result_matches" USING btree ("result_id");
CREATE INDEX IF NOT EXISTS "youtube_result_matches_task_id_idx" ON "youtube_result_matches" USING btree ("task_id");
CREATE INDEX IF NOT EXISTS "youtube_result_matches_unit_id_idx" ON "youtube_result_matches" USING btree ("unit_id");
CREATE INDEX IF NOT EXISTS "youtube_result_matches_batch_id_idx" ON "youtube_result_matches" USING btree ("batch_id");
CREATE INDEX IF NOT EXISTS "youtube_result_matches_search_keyword_idx" ON "youtube_result_matches" USING btree ("search_keyword");
CREATE INDEX IF NOT EXISTS "youtube_result_matches_matched_at_idx" ON "youtube_result_matches" USING btree ("matched_at");

CREATE INDEX IF NOT EXISTS "youtube_duplicate_group_items_group_id_idx" ON "youtube_duplicate_group_items" USING btree ("group_id");
CREATE INDEX IF NOT EXISTS "youtube_duplicate_group_items_result_id_idx" ON "youtube_duplicate_group_items" USING btree ("result_id");
CREATE INDEX IF NOT EXISTS "youtube_duplicate_groups_task_id_idx" ON "youtube_duplicate_groups" USING btree ("task_id");
CREATE INDEX IF NOT EXISTS "youtube_duplicate_groups_group_key_idx" ON "youtube_duplicate_groups" USING btree ("task_id", "group_key");
CREATE INDEX IF NOT EXISTS "youtube_duplicate_groups_status_idx" ON "youtube_duplicate_groups" USING btree ("status");

CREATE INDEX IF NOT EXISTS "youtube_audit_logs_task_id_idx" ON "youtube_audit_logs" USING btree ("task_id");
CREATE INDEX IF NOT EXISTS "youtube_audit_logs_result_id_idx" ON "youtube_audit_logs" USING btree ("result_id");
CREATE INDEX IF NOT EXISTS "youtube_audit_logs_unit_id_idx" ON "youtube_audit_logs" USING btree ("unit_id");
CREATE INDEX IF NOT EXISTS "youtube_audit_logs_action_idx" ON "youtube_audit_logs" USING btree ("action");
CREATE INDEX IF NOT EXISTS "youtube_audit_logs_actor_id_idx" ON "youtube_audit_logs" USING btree ("actor_id");
CREATE INDEX IF NOT EXISTS "youtube_audit_logs_created_at_idx" ON "youtube_audit_logs" USING btree ("created_at");

CREATE UNIQUE INDEX IF NOT EXISTS "blackdog_accounts_email_unique_idx" ON "blackdog_accounts" USING btree ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "blackdog_accounts_login_account_unique_idx" ON "blackdog_accounts" USING btree ("login_account");
CREATE INDEX IF NOT EXISTS "blackdog_accounts_role_idx" ON "blackdog_accounts" USING btree ("role");
CREATE INDEX IF NOT EXISTS "blackdog_accounts_status_idx" ON "blackdog_accounts" USING btree ("status");
CREATE INDEX IF NOT EXISTS "blackdog_accounts_created_at_idx" ON "blackdog_accounts" USING btree ("created_at");

CREATE UNIQUE INDEX IF NOT EXISTS "blackdog_tool_permissions_account_tool_unique_idx" ON "blackdog_tool_permissions" USING btree ("account_id", "tool_id");
CREATE INDEX IF NOT EXISTS "blackdog_tool_permissions_account_id_idx" ON "blackdog_tool_permissions" USING btree ("account_id");
CREATE INDEX IF NOT EXISTS "blackdog_tool_permissions_tool_id_idx" ON "blackdog_tool_permissions" USING btree ("tool_id");
CREATE INDEX IF NOT EXISTS "blackdog_tool_permissions_granted_idx" ON "blackdog_tool_permissions" USING btree ("granted");

CREATE UNIQUE INDEX IF NOT EXISTS "blackdog_sessions_token_hash_unique_idx" ON "blackdog_sessions" USING btree ("session_token_hash");
CREATE INDEX IF NOT EXISTS "blackdog_sessions_account_id_idx" ON "blackdog_sessions" USING btree ("account_id");
CREATE INDEX IF NOT EXISTS "blackdog_sessions_expires_at_idx" ON "blackdog_sessions" USING btree ("expires_at");
CREATE INDEX IF NOT EXISTS "blackdog_sessions_revoked_at_idx" ON "blackdog_sessions" USING btree ("revoked_at");

CREATE INDEX IF NOT EXISTS "blackdog_audit_logs_action_idx" ON "blackdog_audit_logs" USING btree ("action");
CREATE INDEX IF NOT EXISTS "blackdog_audit_logs_actor_id_idx" ON "blackdog_audit_logs" USING btree ("actor_id");
CREATE INDEX IF NOT EXISTS "blackdog_audit_logs_target_account_id_idx" ON "blackdog_audit_logs" USING btree ("target_account_id");
CREATE INDEX IF NOT EXISTS "blackdog_audit_logs_tool_id_idx" ON "blackdog_audit_logs" USING btree ("tool_id");
CREATE INDEX IF NOT EXISTS "blackdog_audit_logs_created_at_idx" ON "blackdog_audit_logs" USING btree ("created_at");
