# Database Setup Instructions for Agentic Email Service

## Context
You are setting up a PostgreSQL database with Drizzle ORM for an email management system. The project uses Neon serverless PostgreSQL with the `@neondatabase/serverless` driver.

## Current Project Structure
```
src/
  database/          # Note: intentional typo in folder name
    migrate.ts        # Migration runner (exists)
    schema.ts         # Database schema (needs to be created)
  index.ts            # Main Hono server
```

## Required Tasks

### 1. Create Database Schema File
Create `src/database/schema.ts` with the following tables using Drizzle ORM syntax:

**Tables to implement:**
- `users` - User management
- `threads` - Email conversation threads  
- `emails` - Individual email messages
- `draft_responses` - AI-generated draft responses

**Schema Requirements:**

```typescript
// Use these imports
import { pgTable, serial, varchar, text, timestamp, boolean, integer, decimal, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums first
export const statusEnum = pgEnum('status', ['active', 'closed', 'needs_attention']);
export const directionEnum = pgEnum('direction', ['inbound', 'outbound']);
export const draftStatusEnum = pgEnum('draft_status', ['pending', 'approved', 'rejected', 'sent']);
export const roleEnum = pgEnum('role', ['agent', 'manager', 'admin']);
```

**User Table:**
- `id` (serial, primary key)
- `email` (varchar(255), unique, not null)
- `name` (varchar(255), not null)
- `role` (roleEnum, not null, default 'agent')
- `created_at` (timestamp, default now())
- `updated_at` (timestamp, default now())

**Thread Table:**
- `id` (serial, primary key)
- `subject` (varchar(500), not null)
- `participant_emails` (jsonb, not null) - Array of email addresses
- `status` (statusEnum, not null, default 'active')
- `last_activity_at` (timestamp, not null, default now())
- `created_at` (timestamp, default now())
- `updated_at` (timestamp, default now())

**Email Table:**
- `id` (serial, primary key)
- `thread_id` (integer, foreign key to threads.id, not null)
- `from_email` (varchar(255), not null)
- `to_emails` (jsonb, not null) - Array of email addresses
- `cc_emails` (jsonb) - Array of email addresses, nullable
- `bcc_emails` (jsonb) - Array of email addresses, nullable
- `subject` (varchar(500), not null)
- `body_text` (text)
- `body_html` (text)
- `direction` (directionEnum, not null)
- `is_draft` (boolean, not null, default false)
- `sent_at` (timestamp) - nullable
- `created_at` (timestamp, default now())
- `updated_at` (timestamp, default now())

**Draft Response Table:**
- `id` (serial, primary key)
- `email_id` (integer, foreign key to emails.id, not null)
- `thread_id` (integer, foreign key to threads.id, not null)
- `generated_content` (text, not null)
- `status` (draftStatusEnum, not null, default 'pending')
- `created_by_user_id` (integer, foreign key to users.id) - nullable for AI system
- `version` (integer, not null, default 1)
- `parent_draft_id` (integer, self-referencing foreign key) - nullable
- `confidence_score` (decimal(3,2)) - nullable, range 0.00-1.00
- `created_at` (timestamp, default now())
- `updated_at` (timestamp, default now())

### 2. Define Table Relations
Add Drizzle relations for:
- `users` → `draft_responses` (one-to-many)
- `threads` → `emails` (one-to-many)
- `threads` → `draft_responses` (one-to-many)
- `emails` → `draft_responses` (one-to-many)
- `draft_responses` → `draft_responses` (self-referencing for parent_draft_id)

### 3. Create Drizzle Configuration
Create `drizzle.config.ts` in the project root:

```typescript
import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: '.env' });

export default {
  schema: './src/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### 4. Update Package.json Scripts
The package.json already has the correct scripts, but verify they point to the right paths:

```json
{
  "db:generate": "drizzle-kit generate --dialect=postgresql --schema=src/database/schema.ts --out=./drizzle",
  "db:migrate": "tsx ./src/database/migrate.ts",
  "db:seed": "tsx ./src/database/seed.ts"
}
```

### 5. Create Seed Data File
Create `src/database/seed.ts` with sample data:

```typescript
// Import your schema and create sample users, threads, emails, and draft responses
// Include at least:
// - 2-3 sample users with different roles
// - 2-3 email threads with different statuses
// - 4-6 emails (mix of inbound/outbound)
// - 3-4 draft responses with various statuses and confidence scores
```

### 6. Database Connection Helper
Create `src/database/db.ts` for database connection:

```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

## Environment Setup
Ensure `.env` file has:
```
DATABASE_URL=your_neon_database_connection_string
```

## Execution Steps
1. Create all the files above
2. Run `npm run db:generate` to create migration files
3. Run `npm run db:migrate` to apply migrations  
4. Run `npm run db:seed` to populate with sample data

## Validation
After setup, the database should have:
- 4 tables with proper relationships
- Appropriate indexes on foreign keys
- Sample data for testing
- All constraints and defaults properly applied

## Important Notes
- The folder is named `database` (with extra 'a') - maintain this naming
- Use `@neondatabase/serverless` driver, not standard PostgreSQL
- All timestamps should use PostgreSQL's `timestamp` type with default `now()`
- JSON fields should use `jsonb` for better performance
- Confidence scores are decimals between 0.00 and 1.00

## Error Handling
If migration fails:
1. Check DATABASE_URL is correctly formatted for Neon
2. Ensure all foreign key references are correct
3. Verify enum values match exactly
4. Check that nullable fields are properly marked