# Archived Data Model Ideas (Beyond MVP)

The sections below were moved out of the main docs to avoid confusion while we focus on the four-table MVP. Keep these handy for post-MVP planning.

---

## Stand-Alone Tables
- **Attachments** → just reference `email_id`
- **Templates** → standalone with optional `created_by_user_id`
- **Knowledge_Base_Articles** → standalone
- **Audit_Logs** → track all system actions
- **Email_Labels/Tags** → many-to-many with threads

## Multi-Tenancy (Future)
- Add `company_id` to Thread, User, Draft_Response
- Introduce **Company** table

## Workflow Management
- **Escalation_Rules** table
- **Approval_Workflow** states

## Provider / Integration Layer
- **Email_Account** & **Integration** tables for multiple email providers

## Real-Time Collaboration
- **Draft_Versions**, **Edit_Locks**, **Collaborative_Edits** tables

## Advanced AI Context
- **Conversation_Context**, **AI_Training_Data**, **Model_Versions** tables

## Agent Logging & Review
- **User_Actions** (enhanced)
- **Draft_Response_Reviews** (enhanced)

> Original SQL snippets and analytics queries can be found in docs/DATA_MODELS_2.md prior to this archive. 