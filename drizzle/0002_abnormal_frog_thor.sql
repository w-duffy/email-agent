CREATE TYPE "public"."agent_action" AS ENUM('email_read', 'email_forwarded', 'draft_created', 'draft_edited', 'draft_approved', 'draft_rejected', 'draft_sent', 'thread_assigned', 'thread_status_changed', 'thread_archived');--> statement-breakpoint
CREATE TABLE "agent_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"email_id" integer,
	"draft_response_id" integer,
	"actor_user_id" integer,
	"action" "agent_action" NOT NULL,
	"metadata" jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "draft_responses" DROP CONSTRAINT "draft_responses_parent_draft_id_draft_responses_id_fk";
--> statement-breakpoint
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_draft_response_id_draft_responses_id_fk" FOREIGN KEY ("draft_response_id") REFERENCES "public"."draft_responses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_actions" ADD CONSTRAINT "agent_actions_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;