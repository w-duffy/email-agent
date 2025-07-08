import { config } from 'dotenv';

// Load environment variables once at startup
config({ path: '.env' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const DATABASE_URL = databaseUrl;

export const NODE_ENV = process.env.NODE_ENV || 'development';
