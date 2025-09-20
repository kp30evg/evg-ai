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

async function checkCRMEntities() {
  try {
    console.log('Checking CRM entities...')
    
    // Get all CRM entities
    const crmEntities = await db.execute(sql`
      SELECT id, type, data, workspace_id, user_id 
      FROM entities 
      WHERE type IN ('deal', 'contact', 'company')
      ORDER BY type, created_at DESC
    `)
    
    console.log(`\nFound ${crmEntities.rows.length} CRM entities total`)
    
    // Group by type
    const byType = {
      deal: [] as any[],
      contact: [] as any[],
      company: [] as any[]
    }
    
    for (const entity of crmEntities.rows) {
      byType[entity.type as keyof typeof byType].push(entity)
    }
    
    console.log('\n=== DEALS ===')
    for (const deal of byType.deal) {
      console.log(`ID: ${deal.id}`)
      console.log(`Name: ${deal.data?.name}`)
      console.log(`Workspace: ${deal.workspace_id}`)
      console.log('---')
    }
    
    console.log('\n=== CONTACTS ===')
    for (const contact of byType.contact) {
      console.log(`ID: ${contact.id}`)
      console.log(`Name: ${contact.data?.name || contact.data?.firstName + ' ' + contact.data?.lastName}`)
      console.log(`Workspace: ${contact.workspace_id}`)
      console.log('---')
    }
    
    console.log('\n=== COMPANIES ===')
    for (const company of byType.company) {
      console.log(`ID: ${company.id}`)
      console.log(`Name: ${company.data?.name}`)
      console.log(`Workspace: ${company.workspace_id}`)
      console.log('---')
    }
    
    // Check specific ID that tasks are linked to
    const linkedId = '6a71a841-5187-4e01-81ab-03b80e781961'
    console.log(`\n\nChecking for entity with ID: ${linkedId}`)
    
    const linkedEntity = await db.execute(sql`
      SELECT id, type, data, workspace_id
      FROM entities
      WHERE id = ${linkedId}
    `)
    
    if (linkedEntity.rows.length > 0) {
      console.log('Found linked entity:')
      console.log('Type:', linkedEntity.rows[0].type)
      console.log('Name:', linkedEntity.rows[0].data?.name)
      console.log('Workspace:', linkedEntity.rows[0].workspace_id)
    } else {
      console.log('Entity not found!')
    }
    
  } catch (error) {
    console.error('Error checking CRM entities:', error)
  } finally {
    process.exit(0)
  }
}

checkCRMEntities()