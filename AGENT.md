# Agent Development Guide

## Build/Test/Lint Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to dist/ directory
- `npm run start` - Run production build
- `npm run db:generate` - Generate Drizzle schema migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with test data
- No test runner configured yet

## Architecture
- **Backend**: Hono API server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (Neon serverless)
- **Connection**: Uses `@neondatabase/serverless` with `drizzle-orm/neon-http`
- **Entry point**: `src/index.ts`
- **Schema**: `src/databaase/schema.ts` (currently empty)
- **Migrations**: `src/databaase/migrate.ts`

## Code Style & Conventions
- **TypeScript**: Strict mode enabled, ES modules (`"type": "module"`)
- **Imports**: Use ES module syntax, no file extensions in imports
- **Database**: Follow Neon/Drizzle patterns from .cursorrules
- **API**: Hono framework patterns, use `c.text()`, `c.json()` for responses
- **Error handling**: Throw errors for database connection issues
- **Environment**: Use `.env` for DATABASE_URL and secrets
