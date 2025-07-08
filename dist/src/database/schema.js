import { pgTable, serial, varchar, text, timestamp, boolean, integer, decimal, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
// Define enums first
export const statusEnum = pgEnum('status', ['active', 'closed', 'needs_attention']);
export const directionEnum = pgEnum('direction', ['inbound', 'outbound']);
export const draftStatusEnum = pgEnum('draft_status', ['pending', 'approved', 'rejected', 'sent']);
export const roleEnum = pgEnum('role', ['agent', 'manager', 'admin']);
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
    parent_draft_id: integer('parent_draft_id').references(() => draft_responses.id),
    confidence_score: decimal('confidence_score', { precision: 4, scale: 3 }),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow()
});
// Define relations
export const usersRelations = relations(users, ({ many }) => ({
    draft_responses: many(draft_responses)
}));
export const threadsRelations = relations(threads, ({ many }) => ({
    emails: many(emails),
    draft_responses: many(draft_responses)
}));
export const emailsRelations = relations(emails, ({ one, many }) => ({
    thread: one(threads, {
        fields: [emails.thread_id],
        references: [threads.id]
    }),
    draft_responses: many(draft_responses)
}));
export const draftResponsesRelations = relations(draft_responses, ({ one }) => ({
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
    })
}));
