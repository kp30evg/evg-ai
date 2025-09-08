#!/usr/bin/env node

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, sql } from 'drizzle-orm';

config({ path: '.env' });

const dbClient = neon(process.env.DATABASE_URL!);
const db = drizzle(dbClient);

import { entities } from '../lib/db/schema/unified';

async function checkLabels() {
  const emails = await db
    .select()
    .from(entities)
    .where(
      and(
        eq(entities.type, 'email'),
        sql`metadata->>'autoLabels' IS NOT NULL AND metadata->>'autoLabels' != '[]'`
      )
    )
    .limit(5);

  console.log(`\nFound ${emails.length} emails with labels:\n`);
  
  emails.forEach(email => {
    const data = email.data as any;
    const metadata = email.metadata as any;
    console.log('Subject:', data.subject?.substring(0, 50));
    console.log('Labels:', metadata?.autoLabels);
    console.log('---');
  });
}

checkLabels();