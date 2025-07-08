import type { Config } from 'drizzle-kit';
import { DATABASE_URL } from './src/config/env.js';

export default {
  schema: './src/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
} satisfies Config;
