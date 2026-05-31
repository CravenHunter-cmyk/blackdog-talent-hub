CREATE TABLE "youtube_duplicate_group_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"result_id" uuid NOT NULL,
	"action" text,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "youtube_duplicate_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"group_key" text NOT NULL,
	"group_type" text NOT NULL,
	"reason" text,
	"similarity_score" numeric(6, 4),
	"status" text DEFAULT 'Open' NOT NULL,
	"recommended_keep_result_id" uuid,
	"kept_result_id" uuid,
	"decision" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "youtube_results" ADD COLUMN "like_count" integer;--> statement-breakpoint
ALTER TABLE "youtube_results" ADD COLUMN "comment_count" integer;--> statement-breakpoint
ALTER TABLE "youtube_results" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "youtube_results" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "youtube_results" ADD COLUMN "thumbnail_url" text;--> statement-breakpoint
ALTER TABLE "youtube_duplicate_group_items" ADD CONSTRAINT "youtube_duplicate_group_items_group_id_youtube_duplicate_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."youtube_duplicate_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_duplicate_group_items" ADD CONSTRAINT "youtube_duplicate_group_items_result_id_youtube_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."youtube_results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_duplicate_groups" ADD CONSTRAINT "youtube_duplicate_groups_task_id_tool_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tool_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_duplicate_groups" ADD CONSTRAINT "youtube_duplicate_groups_recommended_keep_result_id_youtube_results_id_fk" FOREIGN KEY ("recommended_keep_result_id") REFERENCES "public"."youtube_results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "youtube_duplicate_groups" ADD CONSTRAINT "youtube_duplicate_groups_kept_result_id_youtube_results_id_fk" FOREIGN KEY ("kept_result_id") REFERENCES "public"."youtube_results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "youtube_duplicate_group_items_group_id_idx" ON "youtube_duplicate_group_items" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "youtube_duplicate_group_items_result_id_idx" ON "youtube_duplicate_group_items" USING btree ("result_id");--> statement-breakpoint
CREATE INDEX "youtube_duplicate_groups_task_id_idx" ON "youtube_duplicate_groups" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "youtube_duplicate_groups_group_key_idx" ON "youtube_duplicate_groups" USING btree ("task_id","group_key");--> statement-breakpoint
CREATE INDEX "youtube_duplicate_groups_status_idx" ON "youtube_duplicate_groups" USING btree ("status");