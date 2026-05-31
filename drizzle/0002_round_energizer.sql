CREATE TABLE "youtube_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid,
	"result_id" uuid,
	"unit_id" uuid,
	"action" text NOT NULL,
	"actor_id" text,
	"actor_email" text,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tool_tasks" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "tool_tasks" ADD COLUMN "owner_email" text;--> statement-breakpoint
ALTER TABLE "tool_tasks" ADD COLUMN "visibility" text DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "tool_tasks" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tool_tasks" ADD COLUMN "deleted_by" text;--> statement-breakpoint
ALTER TABLE "tool_tasks" ADD COLUMN "delete_reason" text;--> statement-breakpoint
ALTER TABLE "tool_tasks" ADD COLUMN "restored_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tool_tasks" ADD COLUMN "restored_by" text;--> statement-breakpoint
ALTER TABLE "tool_tasks" ADD COLUMN "editing_by" text;--> statement-breakpoint
ALTER TABLE "tool_tasks" ADD COLUMN "editing_by_email" text;--> statement-breakpoint
ALTER TABLE "tool_tasks" ADD COLUMN "editing_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tool_tasks" ADD COLUMN "editing_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "youtube_collection_units" ADD COLUMN "running_by" text;--> statement-breakpoint
ALTER TABLE "youtube_collection_units" ADD COLUMN "running_by_email" text;--> statement-breakpoint
ALTER TABLE "youtube_collection_units" ADD COLUMN "running_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "youtube_collection_units" ADD COLUMN "running_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "youtube_duplicate_groups" ADD COLUMN "reviewed_by" text;--> statement-breakpoint
ALTER TABLE "youtube_duplicate_groups" ADD COLUMN "reviewed_by_email" text;--> statement-breakpoint
ALTER TABLE "youtube_results" ADD COLUMN "primary_unit_updated_by" text;--> statement-breakpoint
ALTER TABLE "youtube_results" ADD COLUMN "primary_unit_updated_by_email" text;--> statement-breakpoint
ALTER TABLE "youtube_audit_logs" ADD CONSTRAINT "youtube_audit_logs_task_id_tool_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tool_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_audit_logs" ADD CONSTRAINT "youtube_audit_logs_result_id_youtube_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."youtube_results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_audit_logs" ADD CONSTRAINT "youtube_audit_logs_unit_id_youtube_collection_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."youtube_collection_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "youtube_audit_logs_task_id_idx" ON "youtube_audit_logs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "youtube_audit_logs_result_id_idx" ON "youtube_audit_logs" USING btree ("result_id");--> statement-breakpoint
CREATE INDEX "youtube_audit_logs_unit_id_idx" ON "youtube_audit_logs" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "youtube_audit_logs_action_idx" ON "youtube_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "youtube_audit_logs_actor_id_idx" ON "youtube_audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "youtube_audit_logs_created_at_idx" ON "youtube_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tool_tasks_owner_id_idx" ON "tool_tasks" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "tool_tasks_visibility_idx" ON "tool_tasks" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "tool_tasks_deleted_at_idx" ON "tool_tasks" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "tool_tasks_editing_by_idx" ON "tool_tasks" USING btree ("editing_by");--> statement-breakpoint
CREATE INDEX "youtube_collection_units_running_by_idx" ON "youtube_collection_units" USING btree ("running_by");