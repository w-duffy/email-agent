CREATE TYPE "public"."direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."draft_status" AS ENUM('pending', 'approved', 'rejected', 'sent');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('agent', 'manager', 'admin');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'closed', 'needs_attention');--> statement-breakpoint
CREATE TABLE "draft_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"email_id" integer NOT NULL,
	"thread_id" integer NOT NULL,
	"generated_content" text NOT NULL,
	"status" "draft_status" DEFAULT 'pending' NOT NULL,
	"created_by_user_id" integer,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_draft_id" integer,
	"confidence_score" numeric(3, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"from_email" varchar(255) NOT NULL,
	"to_emails" jsonb NOT NULL,
	"cc_emails" jsonb,
	"bcc_emails" jsonb,
	"subject" varchar(500) NOT NULL,
	"body_text" text,
	"body_html" text,
	"direction" "direction" NOT NULL,
	"is_draft" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" varchar(500) NOT NULL,
	"participant_emails" jsonb NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'agent' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "draft_responses" ADD CONSTRAINT "draft_responses_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_responses" ADD CONSTRAINT "draft_responses_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_responses" ADD CONSTRAINT "draft_responses_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_responses" ADD CONSTRAINT "draft_responses_parent_draft_id_draft_responses_id_fk" FOREIGN KEY ("parent_draft_id") REFERENCES "public"."draft_responses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE no action ON UPDATE no action;