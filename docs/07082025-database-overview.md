
# 📊 Agentic Email Service – Database Overview  
*“Explained by Sara, Support-Ops Lead”*

Hi!  I’m Sara from Support-Ops.  
This document is a plain-English tour of the database tables that power our agent-assisted email portal.  I’ll walk you through **what each table stores**, **why its columns exist**, and **how everything links together**.

---

## 1. Users (`users`)

| Column | Why we need it |
|--------|----------------|
| `id` *(serial PK)* | Numeric handle used everywhere else in the DB. |
| `email` *(varchar, unique)* | Primary login & contact. |
| `name` *(varchar)* | Display name in the UI. |
| `role` *(enum: agent / manager / admin)* | Permissions & UI experience differ per role. |
| `created_at` / `updated_at` *(timestamp)* | Account lifecycle tracking & auditing. |

**Key relationships**

* One user **creates many** `draft_responses`.  
* One user **performs many** `agent_actions` (audit log).

---

## 2. Threads (`threads`)

Think of a *thread* like a GitHub repo – it’s the container for one customer conversation.

| Column | Why we need it |
|--------|----------------|
| `id` *(serial PK)* | Anchor for all related emails, drafts & actions. |
| `subject` *(varchar)* | Shown in inbox list. |
| `participant_emails` *(jsonb)* | Who’s involved (customer + our aliases). |
| `status` *(enum: active / closed / needs_attention)* | Enables queue filtering. |
| `last_activity_at` *(timestamp)* | Sort threads by most recent activity. |
| `created_at` / `updated_at` | House-keeping. |

**Key relationships**

* A thread **contains many** `emails`.  
* A thread **contains many** `draft_responses`.  
* Every audit entry in `agent_actions` belongs to a thread.

---

## 3. Emails (`emails`)

Emails are the *files* inside a thread.

| Column | Why we need it |
|--------|----------------|
| `id` *(serial PK)* | Unique identifier. |
| `thread_id` *(FK → threads.id)* | Which conversation this email belongs to. |
| `from_email` / `to_emails` / `cc_emails` / `bcc_emails` *(jsonb)* | Preserve exact addressing. |
| `subject` *(varchar)* | Snapshot of the subject at send/receive time. |
| `body_text` / `body_html` *(text)* | Raw content for AI & display. |
| `direction` *(enum: inbound / outbound)* | Analytic splits & UI grouping. |
| `is_draft` *(boolean)* | Flags unsent outgoing emails. |
| `sent_at` | Real send-time or `NULL` if still a draft. |
| `created_at` / `updated_at` | For completeness. |

**Key relationships**

* One email **has many** `draft_responses` (iterations of replies).  
* Audit rows in `agent_actions` may reference an email (e.g. “email_read”).

---

## 4. Draft Responses (`draft_responses`)

These are AI- or human-created reply drafts to a specific email.

| Column | Why we need it |
|--------|----------------|
| `id` *(serial PK)* | Unique per draft. |
| `email_id` *(FK → emails.id)* | Which email we’re drafting a response to. |
| `thread_id` *(FK → threads.id)* | Redundant but handy for quick thread queries. |
| `generated_content` *(text)* | The actual draft body. |
| `status` *(enum: pending / approved / rejected / sent)* | Workflow state. |
| `created_by_user_id` *(FK → users.id, nullable)* | `NULL` means the LLM created it. |
| `version` *(int)* | 1, 2, 3… for revision history. |
| `parent_draft_id` *(self-FK)* | Points to the previous version when a draft is revised. |
| `confidence_score` *(numeric(4,3))* | LLM’s self-estimated quality (0–1.000). |
| `created_at` / `updated_at` | Audit & ordering. |

**Key relationships**

* Drafts may be **linked by** `parent_draft_id` forming a version chain.  
* Audit rows reference drafts for actions like “draft_created” or “draft_approved”.

---

## 5. Agent Actions (`agent_actions`)  — *The Audit Log*

Every significant event inside a thread lands here.

| Column | Why we need it |
|--------|----------------|
| `id` *(serial PK)* | Sequential log entry. |
| `thread_id` *(FK → threads.id, **RESTRICT** on delete)* | The context for the action. |
| `email_id` *(FK → emails.id, **SET NULL**)* | Present when the action targets a specific email. |
| `draft_response_id` *(FK → draft_responses.id, **SET NULL**)* | Present for draft-related actions. |
| `actor_user_id` *(FK → users.id, **SET NULL**)* | `NULL` if the system/LLM performed the action. |
| `action` *(enum `agent_action`)* | What happened (e.g. `email_read`, `draft_approved`). |
| `metadata` *(jsonb)* | Flexible details (duration, model name, etc.). |
| `ip_address` *(varchar 45)* | Security audit / geo checks. |
| `created_at` *(timestamp NOT NULL)* | When the event occurred. |

**Indexes**

* `thread_timeline_idx`  →  fast per-thread timeline (`ORDER BY created_at DESC`).  
* `actor_idx`            →  filter actions by user quickly.

---

## 6. How the Pieces Fit Together

```
Thread (1) ──▶ (N) Email
   │
   │
   ├──▶ (N) Draft_Response (version chain via parent_draft_id)
   │
   └──▶ (N) Agent_Action
        ├── optional link to Email
        ├── optional link to Draft_Response
        └── optional link to User (NULL = AI)
```

*We keep foreign-key deletes **restrictive or nullable** so that the audit log survives even if someone prunes emails or drafts.*

---

## 7. Typical Lifecycle Walk-through

1. **Customer email arrives**  
   → new row in `emails`; thread’s `last_activity_at` updates.

2. **LLM drafts a reply**  
   → `draft_responses` row (`created_by_user_id = NULL`).  
   → `agent_actions` row with `action = 'draft_created'`, links to the draft & email.

3. **Agent reads the email**  
   → frontend logs `agent_actions` with `action = 'email_read'`, `actor_user_id` set.

4. **Agent approves the draft**  
   → update draft `status = 'approved'`.  
   → new `agent_actions` row `draft_approved`.

Everything you see in the UI’s timeline comes straight from `agent_actions`, joined to threads, emails, drafts, and users for context.


### Questions?

Ping the Support-Ops channel in Slack or look at `src/database/schema.ts` for the source-of-truth definition.
