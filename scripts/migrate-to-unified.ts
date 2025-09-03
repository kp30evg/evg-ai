#!/usr/bin/env tsx
/**
 * Migration script to transform the database to evergreenOS unified architecture
 * Run with: npx tsx scripts/migrate-to-unified.ts
 */

import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { createHash } from 'crypto';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Initialize database connection
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('   Make sure .env.local contains DATABASE_URL');
  process.exit(1);
}

const client = neon(dbUrl);
const db = drizzle(client);

// Helper to create a deterministic UUID from any string ID
function stringToUuid(str: string): string {
  const hash = createHash('sha256').update(str).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32)
  ].join('-');
}

async function migrate() {
  console.log('🚀 Starting migration to evergreenOS unified architecture...\n');

  try {
    // Step 1: Create the entities table if it doesn't exist
    console.log('📊 Creating unified entities table...');
    
    // Enable extensions (separate command)
    try {
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    } catch (e) {
      // Extension might already exist
    }
    
    // Create the table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS entities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        relationships JSONB[] DEFAULT ARRAY[]::JSONB[],
        metadata JSONB,
        search_vector tsvector,
        created_by UUID,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Step 2: Create indexes
    console.log('🔍 Creating indexes...');
    
    // Try to create each index, ignore if already exists
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_entities_company_id ON entities(company_id)',
      'CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type)',
      'CREATE INDEX IF NOT EXISTS idx_entities_company_type ON entities(company_id, type)',
      'CREATE INDEX IF NOT EXISTS idx_entities_created_at ON entities(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_entities_data_gin ON entities USING gin(data)',
      'CREATE INDEX IF NOT EXISTS idx_entities_relationships_gin ON entities USING gin(relationships)',
      'CREATE INDEX IF NOT EXISTS idx_entities_search_vector ON entities USING gin(search_vector)'
    ];

    for (const index of indexes) {
      try {
        await db.execute(sql.raw(index));
      } catch (e) {
        // Index might already exist, continue
      }
    }

    // Step 3: Create trigger functions
    console.log('⚡ Creating trigger functions...');
    
    await db.execute(sql`
      -- Create function to auto-update search_vector
      CREATE OR REPLACE FUNCTION update_search_vector() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector := to_tsvector('english',
          COALESCE(NEW.data->>'content', '') || ' ' ||
          COALESCE(NEW.data->>'title', '') || ' ' ||
          COALESCE(NEW.data->>'subject', '') || ' ' ||
          COALESCE(NEW.data->>'body', '') || ' ' ||
          COALESCE(NEW.data->>'name', '') || ' ' ||
          COALESCE(NEW.data->>'description', '')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await db.execute(sql`
      -- Create function to auto-update updated_at
      CREATE OR REPLACE FUNCTION update_updated_at() RETURNS trigger AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Step 4: Create triggers
    console.log('🎯 Creating triggers...');
    
    // Drop triggers if they exist (separate commands)
    try {
      await db.execute(sql`DROP TRIGGER IF EXISTS update_entities_search_vector ON entities`);
    } catch (e) {
      // Trigger might not exist
    }
    
    try {
      await db.execute(sql`DROP TRIGGER IF EXISTS update_entities_updated_at ON entities`);
    } catch (e) {
      // Trigger might not exist
    }
    
    // Create triggers
    await db.execute(sql`
      CREATE TRIGGER update_entities_search_vector
        BEFORE INSERT OR UPDATE ON entities
        FOR EACH ROW
        EXECUTE FUNCTION update_search_vector()
    `);

    await db.execute(sql`
      CREATE TRIGGER update_entities_updated_at
        BEFORE UPDATE ON entities
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at()
    `);

    // Step 5: Create organizations table if needed
    console.log('🏢 Ensuring organizations table exists...');
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        clerk_id VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    // Step 6: Insert sample data for demonstration
    console.log('🌱 Inserting sample evergreenOS data...');
    
    // Create a demo organization if none exist
    let companyId: string;
    const orgs = await db.execute(sql`SELECT id FROM organizations LIMIT 1`);
    
    if (orgs.rows.length > 0) {
      companyId = orgs.rows[0].id as string;
    } else {
      // Create a demo organization
      const newOrg = await db.execute(sql`
        INSERT INTO organizations (name, slug, clerk_id)
        VALUES ('Demo Organization', 'demo-org', 'demo_' || gen_random_uuid())
        RETURNING id
      `);
      companyId = newOrg.rows[0].id as string;
      console.log('📁 Created demo organization');
    }
    
    if (companyId) {
      const systemUserId = stringToUuid('system');
      
      // Create a sample conversation
      const conversationId = stringToUuid('welcome-conversation');
      await db.execute(sql`
        INSERT INTO entities (id, company_id, type, data, created_by)
        VALUES (
          ${conversationId},
          ${companyId},
          'conversation',
          ${JSON.stringify({
            title: 'Welcome to evergreenOS',
            status: 'active',
            messageCount: 1
          })}::jsonb,
          ${systemUserId}
        )
        ON CONFLICT (id) DO NOTHING
      `);
      
      // Create a welcome message
      await db.execute(sql`
        INSERT INTO entities (company_id, type, data, relationships, created_by)
        VALUES (
          ${companyId},
          'message',
          ${JSON.stringify({
            content: 'Welcome to evergreenOS! This is your unified business operating system where all your data lives in harmony. Try commands like "show my tasks" or "find emails about deals".',
            role: 'assistant',
            conversationId: conversationId
          })}::jsonb,
          ${JSON.stringify([{
            id: conversationId,
            type: 'belongs_to'
          }])}::jsonb,
          ${systemUserId}
        )
        ON CONFLICT DO NOTHING
      `);
      
      // Create sample task
      await db.execute(sql`
        INSERT INTO entities (company_id, type, data, created_by)
        VALUES (
          ${companyId},
          'task',
          ${JSON.stringify({
            title: 'Explore evergreenOS features',
            description: 'Try natural language commands to interact with your unified data',
            status: 'pending',
            priority: 'medium'
          })}::jsonb,
          ${systemUserId}
        )
        ON CONFLICT DO NOTHING
      `);
      
      console.log('✅ Sample data inserted successfully');
    }

    console.log('\n✨ Migration completed successfully!');
    console.log('🎉 Your database is now using the evergreenOS unified architecture');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your development server');
    console.log('   2. Try natural language commands in the dashboard');
    console.log('   3. All data now lives in the unified entities table');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});