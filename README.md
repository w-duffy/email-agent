# Agentic Email Service

An intelligent email management system that uses LLM agents to automatically draft responses to customer emails based on your company's knowledge base. For the MVP, the system will use simulated email data to allow for core feature development without requiring external email provider integration.

## Overview

This service provides a web-based email client where LLM agents analyze incoming emails, generate contextually appropriate draft responses, and manage the approval workflow. The system is designed for single-company use, allowing your team to efficiently handle customer communications with AI assistance.

## Features

- **Thread-based email organization** - View and manage email conversations as organized threads
- **AI-powered draft generation** - LLM agents automatically create response drafts using company knowledge
- **Intelligent review system** - Agents evaluate draft quality and confidence scores
- **Automated approval workflow** - High-confidence drafts can be auto-approved, others escalate to humans
- **Real-time processing** - Immediate draft generation as emails arrive

## Tech Stack

- **Backend**: Hono API server
- **Frontend**: React + Vite
- **Database**: PostgreSQL 
- **ORM**: Drizzle ORMgit
- **LLM Provider**: OpenAI GPT models
- **Authentication**: JWT-based auth

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Hono API      │    │   React Client  │
│   Server        │◄──►│   (Vite)        │
└─────────────────┘    └─────────────────┘
        │
        ▼
 ┌─────────────────┐    ┌─────────────────┐
 │   PostgreSQL    │    │   OpenAI API    │
 │   Database      │    │   (GPT-4)       │
 └─────────────────┘    └─────────────────┘
```

## Data Models

### Database ER Diagram

```mermaid
erDiagram
    USER {
        INT id PK
        VARCHAR email
        VARCHAR name
        VARCHAR role
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    THREAD {
        INT id PK
        VARCHAR subject
        JSON participant_emails
        ENUM status "active | closed | needs_attention"
        TIMESTAMP last_activity_at
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    EMAIL {
        INT id PK
        INT thread_id FK
        VARCHAR from_email
        JSON to_emails
        JSON cc_emails
        JSON bcc_emails
        VARCHAR subject
        TEXT body_text
        TEXT body_html
        ENUM direction "inbound | outbound"
        BOOLEAN is_draft
        TIMESTAMP sent_at
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    DRAFT_RESPONSE {
        INT id PK
        INT email_id FK
        INT thread_id FK
        TEXT generated_content
        ENUM status "pending | approved | rejected | sent"
        INT created_by_user_id FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
        INT version
        INT parent_draft_id FK
        DECIMAL confidence_score
    }

    USER ||--o{ DRAFT_RESPONSE : "creates"
    THREAD ||--|{ EMAIL : "contains"
    THREAD ||--|{ DRAFT_RESPONSE : "has"
    EMAIL ||--|{ DRAFT_RESPONSE : "reply"
```

### Table Definitions

**User**
- `id` (primary key)
- `email` (unique)
- `name`
- `role` ("agent", "manager", etc.)
- `created_at`, `updated_at`

**Thread**
- `id` (primary key)
- `subject`
- `participant_emails` (JSON array)
- `status` (enum: "active", "closed", "needs_attention")
- `last_activity_at`
- `created_at`, `updated_at`

**Email**
- `id` (primary key)
- `thread_id` (foreign key → Thread.id)
- `from_email`
- `to_emails`, `cc_emails`, `bcc_emails`
- `subject`
- `body_text`, `body_html`
- `direction` (enum: "inbound", "outbound")
- `is_draft` (boolean)
- `sent_at` (nullable)
- `created_at`, `updated_at`

**Draft_Response**
- `id` (primary key)
- `email_id` (foreign key → Email.id)
- `thread_id` (foreign key → Thread.id)
- `generated_content`
- `status` (enum: "pending", "approved", "rejected", "sent")
- `created_by_user_id` (foreign key → User.id, nullable for AI system)
- `version` (integer, default 1)
- `parent_draft_id` (self-referencing FK, nullable)
- `confidence_score` (decimal, nullable)
- `created_at`, `updated_at`

## Agentic Workflow (MVP)

1. **Simulated Email Intake** – A UI button or CLI command inserts a new record into `Email` (and creates a `Thread` if needed).
2. **Draft Generation** – Backend endpoint `POST /api/drafts/generate` creates a `Draft_Response` with status `pending`.
3. **Automated Evaluation** – Agent calls `POST /api/drafts/:id/evaluate` to assign a confidence score and set status to `approved`, `rejected`, or leave `pending`.
4. **Auto-Approval Path** – High confidence (`approved`) drafts automatically transition to "Ready to Send".
5. **Human Review Path** – Users can review drafts, request revisions (`POST /api/drafts/:id/revise`), or approve them.
6. **Send / Export** – Approved drafts are displayed in the UI for copy-paste sending. Future versions will integrate real email sending.

## API Endpoints

### Email Management
```
GET    /api/threads              # List email threads
GET    /api/threads/:id          # Get thread details
GET    /api/threads/:id/emails   # Get emails in thread
POST   /api/emails/send          # Send email (displays in UI for MVP)
```

### Draft Management
```
POST   /api/drafts/generate      # Generate new draft
GET    /api/drafts/:id           # Get draft details
POST   /api/drafts/:id/approve   # Approve draft
POST   /api/drafts/:id/revise    # Request revision
POST   /api/drafts/:id/evaluate  # LLM evaluation
```

## Installation

### Prerequisites
- Node.js 18+ or Bun runtime
- Hono framework
- Drizzle ORM
- PostgreSQL 14+
- OpenAI API key

### Backend Setup
```bash
cd server
npm install
# or with bun: bun install
cp .env.example .env
# Configure database and OpenAI credentials in .env
npx drizzle-kit generate
npx drizzle-kit migrate
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
cp .env.example .env
# Configure API endpoint in .env
npm run dev
```

### Environment Variables

**Backend (.env)**
```
DATABASE_URL=postgresql://user:password@localhost:5432/agentic_email
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secret-key
```

**Drizzle Configuration (drizzle.config.ts)**
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:3000
```

## Usage

### Basic Workflow

1. **Email arrives** - System receives simulated email data via a manual trigger in the UI.
2. **Draft generation** - LLM agent analyzes email and creates response draft
3. **Agent evaluation** - AI evaluates draft quality and assigns confidence score
4. **Approval decision**:
   - High confidence (>0.85): Auto-approve and mark as ready to send
   - Medium confidence (0.6-0.85): Queue for human review
   - Low confidence (<0.6): Escalate with revision request
5. **Sending**: Approved emails are displayed in the UI for the user to copy/paste.

### Human Oversight

Users can:
- Review auto-generated drafts before sending
- Override agent decisions
- Provide feedback for model improvement
- Monitor agent activity by viewing generated drafts and their statuses.

## Configuration

### LLM Agent Settings
```javascript
// config/agent-settings.js
export const agentConfig = {
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 500,
  autoApprovalThreshold: 0.85,
  escalationThreshold: 0.6,
  knowledgeBaseSources: ["docs", "previous-emails", "faq"]
}
```

## Development

### Database Migrations
```bash
# Generate new migration
npx drizzle-kit generate --name migration_name

# Apply migrations
npx drizzle-kit migrate

# View database schema
npx drizzle-kit studio
```

### Testing
```bash
# Backend tests
cd server && npm test
# or with bun: cd server && bun test

# Frontend tests  
cd client && npm test

# E2E tests
npm run test:e2e
```

## Deployment

### Production Checklist
- [ ] Configure production database
- [ ] Set up backup procedures
- [ ] Configure rate limiting
- [ ] Set up SSL certificates

### Docker Deployment
```bash
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions or support, please:
- Check the [Wiki](wiki) for common issues
- Open an issue for bug reports
- Contact the development team for feature requests

---

**Note**: This is an MVP implementation. Future versions will include advanced features like multi-tenant support, custom knowledge base integration, enhanced AI model fine-tuning capabilities, and integration with email providers.