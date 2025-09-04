#!/usr/bin/env tsx
/**
 * Script to add user_id column to entities table
 * Run with: npx tsx scripts/run-migration.ts
 */

import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

// Load environment variables
dotenv.config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function runMigration() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Create connection
    const sqlClient = neon(connectionString);
    const db = drizzle(sqlClient);

    console.log('🔄 Adding user_id column to entities table...\n');

    // Add user_id column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE entities ADD COLUMN IF NOT EXISTS user_id UUID;
    `);
    console.log('✅ Added user_id column');

    // Create indexes for efficient querying
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_entities_user ON entities(user_id);
    `);
    console.log('✅ Created user index');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_entities_workspace_user ON entities(workspace_id, user_id);
    `);
    console.log('✅ Created workspace-user composite index');

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('\n🎉 Database schema updated!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });