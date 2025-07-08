import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '../config/env.js';
import * as schema from './schema.js';

const sql = neon(DATABASE_URL);
export const db = drizzle({ client: sql, schema });
