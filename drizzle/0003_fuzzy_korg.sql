CREATE TABLE "blackdog_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blackdog_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"actor_id" text,
	"actor_email" text,
	"target_account_id" uuid,
	"target_email" text,
	"tool_id" text,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blackdog_tool_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"tool_id" text NOT NULL,
	"granted" boolean DEFAULT true NOT NULL,
	"granted_by" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blackdog_audit_logs" ADD CONSTRAINT "blackdog_audit_logs_target_account_id_blackdog_accounts_id_fk" FOREIGN KEY ("target_account_id") REFERENCES "public"."blackdog_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blackdog_tool_permissions" ADD CONSTRAINT "blackdog_tool_permissions_account_id_blackdog_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."blackdog_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "blackdog_accounts_email_unique_idx" ON "blackdog_accounts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "blackdog_accounts_role_idx" ON "blackdog_accounts" USING btree ("role");--> statement-breakpoint
CREATE INDEX "blackdog_accounts_status_idx" ON "blackdog_accounts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blackdog_accounts_created_at_idx" ON "blackdog_accounts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "blackdog_audit_logs_action_idx" ON "blackdog_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "blackdog_audit_logs_actor_id_idx" ON "blackdog_audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "blackdog_audit_logs_target_account_id_idx" ON "blackdog_audit_logs" USING btree ("target_account_id");--> statement-breakpoint
CREATE INDEX "blackdog_audit_logs_tool_id_idx" ON "blackdog_audit_logs" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "blackdog_audit_logs_created_at_idx" ON "blackdog_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "blackdog_tool_permissions_account_tool_unique_idx" ON "blackdog_tool_permissions" USING btree ("account_id","tool_id");--> statement-breakpoint
CREATE INDEX "blackdog_tool_permissions_account_id_idx" ON "blackdog_tool_permissions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "blackdog_tool_permissions_tool_id_idx" ON "blackdog_tool_permissions" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "blackdog_tool_permissions_granted_idx" ON "blackdog_tool_permissions" USING btree ("granted");