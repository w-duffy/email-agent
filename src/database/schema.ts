import { pgTable, serial, varchar, text, timestamp, boolean, integer, decimal, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums first
export const statusEnum = pgEnum('status', ['active', 'closed', 'needs_attention']);
export const directionEnum = pgEnum('direction', ['inbound', 'outbound']);
export const draftStatusEnum = pgEnum('draft_status', ['pending', 'approved', 'rejected', 'sent']);
export const roleEnum = pgEnum('role', ['agent', 'manager', 'admin']);
export const agentActionEnum = pgEnum('agent_action', [
  'email_read',
  'email_forwarded',
  'draft_created',
  'draft_edited',
  'draft_approved',
  'draft_rejected',
  'draft_sent',
  'thread_assigned',
  'thread_status_changed',
  'thread_archived'
]);

// User Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: roleEnum('role').notNull().default('agent'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Thread Table
export const threads = pgTable('threads', {
  id: serial('id').primaryKey(),
  subject: varchar('subject', { length: 500 }).notNull(),
  participant_emails: jsonb('participant_emails').notNull(),
  status: statusEnum('status').notNull().default('active'),
  last_activity_at: timestamp('last_activity_at').notNull().defaultNow(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Email Table
export const emails = pgTable('emails', {
  id: serial('id').primaryKey(),
  thread_id: integer('thread_id').references(() => threads.id).notNull(),
  from_email: varchar('from_email', { length: 255 }).notNull(),
  to_emails: jsonb('to_emails').notNull(),
  cc_emails: jsonb('cc_emails'),
  bcc_emails: jsonb('bcc_emails'),
  subject: varchar('subject', { length: 500 }).notNull(),
  body_text: text('body_text'),
  body_html: text('body_html'),
  direction: directionEnum('direction').notNull(),
  is_draft: boolean('is_draft').notNull().default(false),
  sent_at: timestamp('sent_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Draft Response Table
export const draft_responses = pgTable('draft_responses', {
  id: serial('id').primaryKey(),
  email_id: integer('email_id').references(() => emails.id).notNull(),
  thread_id: integer('thread_id').references(() => threads.id).notNull(),
  generated_content: text('generated_content').notNull(),
  status: draftStatusEnum('status').notNull().default('pending'),
  created_by_user_id: integer('created_by_user_id').references(() => users.id),
  version: integer('version').notNull().default(1),
  parent_draft_id: integer('parent_draft_id'),
  confidence_score: decimal('confidence_score', { precision: 4, scale: 3 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Agent Actions Table
export const agent_actions = pgTable('agent_actions', {
  id: serial('id').primaryKey(),
  thread_id: integer('thread_id')
    .references(() => threads.id, { onDelete: 'restrict' })
    .notNull(),
  email_id: integer('email_id')
    .references(() => emails.id, { onDelete: 'set null' }),
  draft_response_id: integer('draft_response_id')
    .references(() => draft_responses.id, { onDelete: 'set null' }),
  actor_user_id: integer('actor_user_id')
    .references(() => users.id, { onDelete: 'set null' }),
  action: agentActionEnum('action').notNull(),
  metadata: jsonb('metadata'),
  ip_address: varchar('ip_address', { length: 45 }),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  threadTimelineIdx: index('thread_timeline_idx').on(table.thread_id, table.created_at.desc()),
  actorIdx: index('actor_idx').on(table.actor_user_id)
}));

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  draft_responses: many(draft_responses),
  agent_actions: many(agent_actions)
}));

export const threadsRelations = relations(threads, ({ many }) => ({
  emails: many(emails),
  draft_responses: many(draft_responses),
  agent_actions: many(agent_actions)
}));

export const emailsRelations = relations(emails, ({ one, many }) => ({
  thread: one(threads, {
    fields: [emails.thread_id],
    references: [threads.id]
  }),
  draft_responses: many(draft_responses),
  agent_actions: many(agent_actions)
}));

export const draftResponsesRelations = relations(draft_responses, ({ one, many }) => ({
  email: one(emails, {
    fields: [draft_responses.email_id],
    references: [emails.id]
  }),
  thread: one(threads, {
    fields: [draft_responses.thread_id],
    references: [threads.id]
  }),
  created_by_user: one(users, {
    fields: [draft_responses.created_by_user_id],
    references: [users.id]
  }),
  parent_draft: one(draft_responses, {
    fields: [draft_responses.parent_draft_id],
    references: [draft_responses.id]
  }),
  agent_actions: many(agent_actions)
}));

export const agentActionsRelations = relations(agent_actions, ({ one }) => ({
  thread: one(threads, {
    fields: [agent_actions.thread_id],
    references: [threads.id]
  }),
  email: one(emails, {
    fields: [agent_actions.email_id],
    references: [emails.id]
  }),
  draft_response: one(draft_responses, {
    fields: [agent_actions.draft_response_id],
    references: [draft_responses.id]
  }),
  actor_user: one(users, {
    fields: [agent_actions.actor_user_id],
    references: [users.id]
  })
}));
