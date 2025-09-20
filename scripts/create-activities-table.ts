import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import { loadEnvConfig } from '@next/env'

// Load environment variables
const projectDir = process.cwd()
loadEnvConfig(projectDir)

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set')
}

const client = neon(databaseUrl)
const db = drizzle(client)

async function createActivitiesTable() {
  try {
    console.log('Creating activities table...')
    
    // Create the activities table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL,
        user_id UUID,
        entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
        activity_type VARCHAR(50) NOT NULL,
        source_module VARCHAR(50),
        content JSONB DEFAULT '{}',
        participants UUID[],
        metadata JSONB DEFAULT '{}',
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    
    console.log('Creating indexes...')
    
    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_activities_workspace ON activities(workspace_id)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_id)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp DESC)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id)`)
    
    console.log('✅ Activities table created successfully!')
    
    // Verify the table exists
    const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'activities'
      ORDER BY ordinal_position
    `)
    
    console.log('\nTable structure:')
    console.log(result.rows)
    
  } catch (error) {
    console.error('Error creating activities table:', error)
  } finally {
    process.exit(0)
  }
}

createActivitiesTable()