# Agentic Email Service

An intelligent email management system that uses LLM agents to automatically draft responses to customer emails based on your company's knowledge base.

## Overview

This service provides a web-based email client where LLM agents analyze incoming emails, generate contextually appropriate draft responses, and manage the approval workflow. The system is designed for single-company use, allowing your team to efficiently handle customer communications with AI assistance.

## Features

- **Thread-based email organization** - View and manage email conversations as organized threads
- **AI-powered draft generation** - LLM agents automatically create response drafts using company knowledge
- **Intelligent review system** - Agents evaluate draft quality and confidence scores
- **Automated approval workflow** - High-confidence drafts can be auto-approved, others escalate to humans
- **Comprehensive tracking** - Full audit trail of agent decisions and performance metrics
- **Real-time processing** - Immediate draft generation as emails arrive

## Tech Stack

- **Backend**: Hono API server
- **Frontend**: React + Vite
- **Database**: PostgreSQL 
- **ORM**: Drizzle ORM
- **LLM Provider**: OpenAI GPT models
- **Authentication**: JWT-based auth

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Email Provider│    │   Hono API      │    │   React Client  │
│   (Gmail, etc.) │◄──►│   Server        │◄──►│   (Vite)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   PostgreSQL    │    │   OpenAI API    │
                       │   Database      │    │   (GPT-4)       │
                       └─────────────────┘    └─────────────────┘
```

## Data Models

### Core Entities

**Thread** - Email conversation container
- Groups related emails together
- Tracks participants and status
- Links to external email provider thread IDs

**Email** - Individual email messages
- Stores message content and metadata
- Distinguishes between inbound/outbound direction
- Maintains connection to email provider

**Draft_Response** - AI-generated email drafts
- Contains LLM-generated response content
- Tracks approval status and confidence scores
- Links to the email being responded to

**User** - System users (company employees)
- Authentication and role management
- Tracks user actions for analytics

### Tracking & Analytics

**User_Actions** - Comprehensive activity log
- Records all system interactions (LLM and human)
- Stores performance metadata (tokens, timing, confidence)
- Enables detailed analytics and QA

**Draft_Response_Reviews** - Draft evaluation records
- Tracks LLM agent decisions on draft quality
- Records confidence scores and evaluation criteria
- Manages escalation triggers

## API Endpoints

### Email Management
```
GET    /api/threads              # List email threads
GET    /api/threads/:id          # Get thread details
GET    /api/threads/:id/emails   # Get emails in thread
POST   /api/emails/send          # Send email
```

### Draft Management
```
POST   /api/drafts/generate      # Generate new draft
GET    /api/drafts/:id           # Get draft details
POST   /api/drafts/:id/approve   # Approve draft
POST   /api/drafts/:id/revise    # Request revision
POST   /api/drafts/:id/evaluate  # LLM evaluation
```

### Analytics
```
GET    /api/analytics/agent-performance    # Agent metrics
GET    /api/analytics/quality-metrics      # Quality stats
GET    /api/actions                        # Activity logs
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
EMAIL_PROVIDER_WEBHOOK_SECRET=webhook-secret
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

1. **Email arrives** - System receives email via webhook or polling
2. **Draft generation** - LLM agent analyzes email and creates response draft
3. **Agent evaluation** - AI evaluates draft quality and assigns confidence score
4. **Approval decision**:
   - High confidence (>0.85): Auto-approve and send
   - Medium confidence (0.6-0.85): Queue for human review
   - Low confidence (<0.6): Escalate with revision request
5. **Tracking** - All actions logged for analytics and QA

### Human Oversight

Users can:
- Review auto-generated drafts before sending
- Override agent decisions
- Provide feedback for model improvement
- Monitor agent performance through analytics dashboard

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

### Email Provider Integration
Currently supports integration with major email providers via:
- IMAP/SMTP for direct email access
- Webhook endpoints for real-time email notifications
- OAuth for secure authentication

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

### Monitoring

The system includes built-in analytics for:
- **Agent Performance**: Response times, token usage, confidence scores
- **Quality Metrics**: Approval rates, revision frequency, escalation patterns
- **User Activity**: Thread views, manual overrides, feedback patterns

## Deployment

### Production Checklist
- [ ] Configure production database
- [ ] Set up email provider webhooks
- [ ] Configure monitoring and logging
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

**Note**: This is an MVP implementation. Future versions will include advanced features like multi-tenant support, custom knowledge base integration, and enhanced AI model fine-tuning capabilities.