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

async function checkTaskRelationships() {
  try {
    console.log('Checking task relationships...')
    
    // Get all tasks
    const tasks = await db.execute(sql`
      SELECT id, data, relationships, user_id, workspace_id 
      FROM entities 
      WHERE type = 'task'
    `)
    
    console.log(`\nFound ${tasks.rows.length} tasks total`)
    
    // Check each task
    for (const task of tasks.rows) {
      console.log('\n-------------------')
      console.log('Task:', task.data?.title || 'Untitled')
      console.log('User ID:', task.user_id)
      console.log('Workspace ID:', task.workspace_id)
      console.log('Relationships:', JSON.stringify(task.relationships, null, 2))
    }
    
    // Get tasks with linkedEntities
    const linkedTasks = await db.execute(sql`
      SELECT id, data, relationships 
      FROM entities 
      WHERE type = 'task' 
      AND relationships IS NOT NULL
      AND jsonb_array_length(relationships) > 0
    `)
    
    console.log(`\n\nTasks with relationships: ${linkedTasks.rows.length}`)
    
    // Check for tasks linked to CRM entities
    const crmLinkedTasks = await db.execute(sql`
      SELECT t.id, t.data, t.relationships,
        EXISTS (
          SELECT 1 FROM jsonb_array_elements(t.relationships) AS r
          WHERE r->>'type' = 'linked_to'
        ) as has_linked_to
      FROM entities t
      WHERE t.type = 'task'
    `)
    
    console.log('\nTasks with linked_to relationships:')
    for (const task of crmLinkedTasks.rows) {
      if (task.has_linked_to) {
        console.log('- Task:', task.data?.title, 'has linked_to relationships')
      }
    }
    
    // Get CRM entities (deals, contacts, companies)
    const crmEntities = await db.execute(sql`
      SELECT id, type, data 
      FROM entities 
      WHERE type IN ('deal', 'contact', 'company')
    `)
    
    console.log(`\nCRM Entities: ${crmEntities.rows.length}`)
    const entityMap = new Map()
    for (const entity of crmEntities.rows) {
      entityMap.set(entity.id, entity)
      console.log(`- ${entity.type}: ${entity.data?.name || entity.data?.title} (ID: ${entity.id})`)
    }
    
  } catch (error) {
    console.error('Error checking task relationships:', error)
  } finally {
    process.exit(0)
  }
}

checkTaskRelationships()