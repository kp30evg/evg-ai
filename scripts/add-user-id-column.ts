#!/usr/bin/env tsx
/**
 * Script to add user_id column to entities table
 * Run with: npx tsx scripts/add-user-id-column.ts
 */

import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config({ path: '.env' });

import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

async function addUserIdColumn() {
  try {
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
addUserIdColumn()
  .then(() => {
    console.log('\n🎉 Database schema updated!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });