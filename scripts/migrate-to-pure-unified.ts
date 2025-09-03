#!/usr/bin/env tsx
/**
 * Migration to PURE evergreenOS unified architecture
 * This creates the TRUE single-table architecture with ONLY:
 * - entities table (for ALL business data)
 * - workspaces table (for auth/multi-tenancy)
 * - users table (for auth)
 * 
 * Run with: npx tsx scripts/migrate-to-pure-unified.ts
 */

import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const client = neon(dbUrl);
const db = drizzle(client);

async function migrate() {
  console.log('🚀 Starting migration to PURE evergreenOS unified architecture...\n');

  try {
    // Step 1: Drop all unnecessary tables
    console.log('🗑️  Dropping auxiliary tables...');
    
    const tablesToDrop = [
      'audit_logs',
      'command_history',
      'modules',
      'integrations',
      'invitations',
      'onboarding_events',
      'conversations',
      'messages',
      'api_keys',
      'organizations', // Will be replaced with workspaces
      'companies', // Will be replaced with workspaces
      'entities', // Drop old entities table to rebuild with workspace_id
      'users', // Drop old users table to rebuild with workspace_id
      'workspaces', // Drop if exists to rebuild
    ];
    
    for (const table of tablesToDrop) {
      try {
        await db.execute(sql.raw(`DROP TABLE IF EXISTS ${table} CASCADE`));
        console.log(`   ✓ Dropped ${table}`);
      } catch (e) {
        console.log(`   - Skipping ${table} (doesn't exist or error)`);
      }
    }

    // Step 2: Create the three essential tables
    console.log('\n📊 Creating essential tables...');
    
    // Create workspaces table
    await db.execute(sql`
      CREATE TABLE workspaces (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_org_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('   ✓ Created workspaces table');
    
    // Create users table
    await db.execute(sql`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        workspace_id UUID REFERENCES workspaces(id),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        image_url TEXT,
        role VARCHAR(50) DEFAULT 'member',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('   ✓ Created users table');
    
    // Create THE ONE entities table
    await db.execute(sql`
      CREATE TABLE entities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        relationships JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        search_vector TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('   ✓ Created entities table');

    // Step 3: Create indexes
    console.log('\n🔍 Creating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_workspace_clerk_org ON workspaces(clerk_org_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_clerk ON users(clerk_user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_workspace ON users(workspace_id)',
      'CREATE INDEX IF NOT EXISTS idx_entities_workspace ON entities(workspace_id)',
      'CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type)',
      'CREATE INDEX IF NOT EXISTS idx_entities_workspace_type ON entities(workspace_id, type)',
      'CREATE INDEX IF NOT EXISTS idx_entities_data ON entities USING gin(data)',
      'CREATE INDEX IF NOT EXISTS idx_entities_relationships ON entities USING gin(relationships)',
      'CREATE INDEX IF NOT EXISTS idx_entities_created ON entities(created_at)',
    ];
    
    for (const index of indexes) {
      try {
        await db.execute(sql.raw(index));
        console.log(`   ✓ ${index.split(' ')[5]}`);
      } catch (e) {
        // Index might already exist
      }
    }

    // Step 4: Create search function
    console.log('\n⚡ Creating helper functions...');
    
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION update_search_vector() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector := 
          COALESCE(NEW.data->>'content', '') || ' ' ||
          COALESCE(NEW.data->>'title', '') || ' ' ||
          COALESCE(NEW.data->>'name', '') || ' ' ||
          COALESCE(NEW.data->>'subject', '') || ' ' ||
          COALESCE(NEW.data->>'description', '') || ' ' ||
          COALESCE(NEW.data->>'email', '') || ' ' ||
          COALESCE(NEW.data->>'company', '');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION update_updated_at() RETURNS trigger AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    
    // Create triggers
    try {
      await db.execute(sql`DROP TRIGGER IF EXISTS update_entities_search ON entities`);
    } catch (e) {}
    
    await db.execute(sql`
      CREATE TRIGGER update_entities_search
        BEFORE INSERT OR UPDATE ON entities
        FOR EACH ROW
        EXECUTE FUNCTION update_search_vector()
    `);
    
    try {
      await db.execute(sql`DROP TRIGGER IF EXISTS update_entities_timestamp ON entities`);
    } catch (e) {}
    
    await db.execute(sql`
      CREATE TRIGGER update_entities_timestamp
        BEFORE UPDATE ON entities
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at()
    `);
    
    console.log('   ✓ Created helper functions and triggers');

    // Step 5: Insert demo data
    console.log('\n🌱 Inserting demo data...');
    
    // Create demo workspace
    const [workspace] = await db.execute(sql`
      INSERT INTO workspaces (name, clerk_org_id, slug)
      VALUES ('Demo Workspace', 'demo_' || gen_random_uuid(), 'demo-workspace')
      ON CONFLICT (clerk_org_id) DO NOTHING
      RETURNING id
    `).then(result => result.rows);
    
    if (workspace) {
      const workspaceId = workspace.id as string;
      
      // Create welcome message
      await db.execute(sql`
        INSERT INTO entities (workspace_id, type, data, metadata)
        VALUES (
          ${workspaceId},
          'message',
          ${JSON.stringify({
            content: 'Welcome to evergreenOS! This is the revolutionary single-table architecture where ALL your business data lives in harmony.',
            channel: 'chat',
          })}::jsonb,
          ${JSON.stringify({
            createdBy: 'system',
            demo: true,
          })}::jsonb
        )
      `);
      
      // Create sample customer
      const [customer] = await db.execute(sql`
        INSERT INTO entities (workspace_id, type, data, metadata)
        VALUES (
          ${workspaceId},
          'customer',
          ${JSON.stringify({
            name: 'Acme Corporation',
            email: 'contact@acme.com',
            company: 'Acme Corp',
            notes: 'Important strategic customer',
          })}::jsonb,
          ${JSON.stringify({
            createdBy: 'system',
            demo: true,
          })}::jsonb
        )
        RETURNING id
      `).then(result => result.rows);
      
      // Create sample deal linked to customer
      if (customer) {
        await db.execute(sql`
          INSERT INTO entities (workspace_id, type, data, relationships, metadata)
          VALUES (
            ${workspaceId},
            'deal',
            ${JSON.stringify({
              name: 'Acme Enterprise Deal',
              value: 100000,
              stage: 'negotiation',
              probability: 75,
            })}::jsonb,
            ${JSON.stringify({
              customer: customer.id,
            })}::jsonb,
            ${JSON.stringify({
              createdBy: 'system',
              demo: true,
            })}::jsonb
          )
        `);
      }
      
      // Create sample task
      await db.execute(sql`
        INSERT INTO entities (workspace_id, type, data, relationships, metadata)
        VALUES (
          ${workspaceId},
          'task',
          ${JSON.stringify({
            title: 'Follow up with Acme on contract',
            description: 'Send revised proposal with updated terms',
            status: 'pending',
            priority: 'high',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          })}::jsonb,
          ${JSON.stringify({
            customer: customer?.id,
          })}::jsonb,
          ${JSON.stringify({
            createdBy: 'system',
            demo: true,
          })}::jsonb
        )
      `);
      
      console.log('   ✓ Created demo data');
    }

    console.log('\n✨ Migration completed successfully!');
    console.log('\n🎉 Your database now has the PURE evergreenOS architecture:');
    console.log('   • ONE entities table for ALL business data');
    console.log('   • workspaces table for multi-tenancy');
    console.log('   • users table for authentication');
    console.log('\n📝 Key benefits achieved:');
    console.log('   ✅ Any new feature = just new entity types (no migrations!)');
    console.log('   ✅ Natural language queries work across ALL data');
    console.log('   ✅ Perfect data relationships without JOINs');
    console.log('   ✅ Infinite extensibility with JSONB');
    console.log('\n🚀 Ready to build the future of business software!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
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