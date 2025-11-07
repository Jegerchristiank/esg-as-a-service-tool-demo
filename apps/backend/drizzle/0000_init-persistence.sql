CREATE TABLE "wizard_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"user_id" text NOT NULL,
	"version" integer NOT NULL,
	"changes" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wizard_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"state" jsonb NOT NULL,
	"profile" jsonb NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"history" jsonb NOT NULL,
	"responsibilities" jsonb NOT NULL,
	"version" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wizard_storage" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"active_profile_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "wizard_audit_log_profile_idx" ON "wizard_audit_log" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "wizard_audit_log_timestamp_idx" ON "wizard_audit_log" USING btree ("timestamp");