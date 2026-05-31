CREATE TABLE "blackdog_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"session_token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "blackdog_accounts" ADD COLUMN "login_account" text;--> statement-breakpoint
ALTER TABLE "blackdog_accounts" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "blackdog_sessions" ADD CONSTRAINT "blackdog_sessions_account_id_blackdog_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."blackdog_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "blackdog_sessions_token_hash_unique_idx" ON "blackdog_sessions" USING btree ("session_token_hash");--> statement-breakpoint
CREATE INDEX "blackdog_sessions_account_id_idx" ON "blackdog_sessions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "blackdog_sessions_expires_at_idx" ON "blackdog_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "blackdog_sessions_revoked_at_idx" ON "blackdog_sessions" USING btree ("revoked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "blackdog_accounts_login_account_unique_idx" ON "blackdog_accounts" USING btree ("login_account");