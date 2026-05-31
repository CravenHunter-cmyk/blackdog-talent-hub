CREATE TABLE "tool_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"export_type" text NOT NULL,
	"row_count" integer,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_search_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"unit_id" uuid,
	"batch_name" text,
	"status" text DEFAULT 'Pending' NOT NULL,
	"requested_count" integer,
	"accepted_count" integer DEFAULT 0 NOT NULL,
	"filtered_by_date_count" integer DEFAULT 0 NOT NULL,
	"returned_count" integer DEFAULT 0 NOT NULL,
	"duplicate_count" integer DEFAULT 0 NOT NULL,
	"unique_added_count" integer DEFAULT 0 NOT NULL,
	"keywords" jsonb NOT NULL,
	"published_date_range_label" text,
	"published_within_months" integer,
	"apify_run_id" text,
	"error_message" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_type" text NOT NULL,
	"name" text NOT NULL,
	"language" text NOT NULL,
	"domain" text NOT NULL,
	"search_targets" jsonb NOT NULL,
	"target_unique_results" integer,
	"published_date_range_label" text,
	"published_within_months" integer,
	"status" text DEFAULT 'Draft' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "youtube_collection_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "youtube_result_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"result_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"unit_id" uuid,
	"batch_id" uuid,
	"search_keyword" text NOT NULL,
	"keyword" text,
	"keyword_source" text,
	"run_id" uuid,
	"match_reason" text,
	"language" text,
	"domain" text,
	"search_target" text,
	"matched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "youtube_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"video_id" text,
	"video_url" text NOT NULL,
	"normalized_video_url" text,
	"title" text,
	"channel_name" text,
	"channel_url" text,
	"duration" text,
	"view_count" text,
	"published_date" text,
	"video_type" text,
	"metadata" jsonb,
	"primary_unit_id" uuid,
	"primary_unit_set_by" text DEFAULT 'system' NOT NULL,
	"primary_unit_reason" text,
	"primary_unit_updated_at" timestamp with time zone,
	"status" text DEFAULT 'Pending' NOT NULL,
	"notes" text,
	"duplicate_count" integer DEFAULT 0 NOT NULL,
	"matched_keywords" jsonb,
	"matched_batch_ids" jsonb,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tool_exports" ADD CONSTRAINT "tool_exports_task_id_tool_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tool_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_search_batches" ADD CONSTRAINT "tool_search_batches_task_id_tool_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tool_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_search_batches" ADD CONSTRAINT "tool_search_batches_unit_id_youtube_collection_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."youtube_collection_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_collection_units" ADD CONSTRAINT "youtube_collection_units_task_id_tool_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tool_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_result_matches" ADD CONSTRAINT "youtube_result_matches_result_id_youtube_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."youtube_results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_result_matches" ADD CONSTRAINT "youtube_result_matches_task_id_tool_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tool_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_result_matches" ADD CONSTRAINT "youtube_result_matches_unit_id_youtube_collection_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."youtube_collection_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_result_matches" ADD CONSTRAINT "youtube_result_matches_batch_id_tool_search_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."tool_search_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_results" ADD CONSTRAINT "youtube_results_task_id_tool_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tool_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_results" ADD CONSTRAINT "youtube_results_primary_unit_id_youtube_collection_units_id_fk" FOREIGN KEY ("primary_unit_id") REFERENCES "public"."youtube_collection_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tool_exports_task_id_idx" ON "tool_exports" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "tool_exports_export_type_idx" ON "tool_exports" USING btree ("export_type");--> statement-breakpoint
CREATE INDEX "tool_exports_created_at_idx" ON "tool_exports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tool_search_batches_task_id_idx" ON "tool_search_batches" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "tool_search_batches_unit_id_idx" ON "tool_search_batches" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "tool_search_batches_status_idx" ON "tool_search_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tool_search_batches_created_at_idx" ON "tool_search_batches" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tool_tasks_tool_type_idx" ON "tool_tasks" USING btree ("tool_type");--> statement-breakpoint
CREATE INDEX "tool_tasks_status_idx" ON "tool_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tool_tasks_created_at_idx" ON "tool_tasks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "youtube_collection_units_task_id_idx" ON "youtube_collection_units" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "youtube_collection_units_status_idx" ON "youtube_collection_units" USING btree ("status");--> statement-breakpoint
CREATE INDEX "youtube_collection_units_task_index_idx" ON "youtube_collection_units" USING btree ("task_id","unit_index");--> statement-breakpoint
CREATE INDEX "youtube_collection_units_dimensions_idx" ON "youtube_collection_units" USING btree ("task_id","language","domain","search_target");--> statement-breakpoint
CREATE INDEX "youtube_result_matches_result_id_idx" ON "youtube_result_matches" USING btree ("result_id");--> statement-breakpoint
CREATE INDEX "youtube_result_matches_task_id_idx" ON "youtube_result_matches" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "youtube_result_matches_unit_id_idx" ON "youtube_result_matches" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "youtube_result_matches_batch_id_idx" ON "youtube_result_matches" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "youtube_result_matches_search_keyword_idx" ON "youtube_result_matches" USING btree ("search_keyword");--> statement-breakpoint
CREATE INDEX "youtube_results_task_id_idx" ON "youtube_results" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "youtube_results_primary_unit_id_idx" ON "youtube_results" USING btree ("primary_unit_id");--> statement-breakpoint
CREATE INDEX "youtube_results_video_id_idx" ON "youtube_results" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "youtube_results_normalized_video_url_idx" ON "youtube_results" USING btree ("normalized_video_url");--> statement-breakpoint
CREATE INDEX "youtube_results_status_idx" ON "youtube_results" USING btree ("status");--> statement-breakpoint
CREATE INDEX "youtube_results_deleted_at_idx" ON "youtube_results" USING btree ("deleted_at");