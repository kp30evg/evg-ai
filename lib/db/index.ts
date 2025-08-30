import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Create the connection
const sql = neon(connectionString);

// Create the drizzle instance
export const db = drizzle(sql, { schema });

export * from './schema';