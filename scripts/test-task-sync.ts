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

async function testTaskSync() {
  try {
    console.log('Testing Task-CRM Synchronization...')
    console.log('====================================\n')
    
    // 1. Get a sample workspace and user
    const workspaceResult = await db.execute(sql`
      SELECT id, name FROM workspaces LIMIT 1
    `)
    
    if (!workspaceResult.rows.length) {
      console.log('No workspaces found')
      return
    }
    
    const workspace = workspaceResult.rows[0]
    
    const userResult = await db.execute(sql`
      SELECT id, email FROM users WHERE workspace_id = ${workspace.id} LIMIT 1
    `)
    
    const user = userResult.rows[0]
    
    console.log('Workspace:', workspace.name, workspace.id)
    if (user) {
      console.log('User:', user.email, user.id)
    } else {
      console.log('No users found in workspace')
    }
    console.log()
    
    // 2. Check all tasks in the workspace
    const allTasks = await db.execute(sql`
      SELECT id, data, relationships, user_id
      FROM entities
      WHERE workspace_id = ${workspace.id}
      AND type = 'task'
      ORDER BY created_at DESC
    `)
    
    console.log(`Total tasks in workspace: ${allTasks.rows.length}`)
    console.log()
    
    // 3. Check tasks with CRM relationships
    const tasksWithCRM = allTasks.rows.filter(task => {
      if (!task.relationships) return false
      const rels = Array.isArray(task.relationships) ? task.relationships : []
      return rels.some(r => r.type === 'linked_to')
    })
    
    console.log(`Tasks linked to CRM entities: ${tasksWithCRM.length}`)
    
    // 4. Check CRM entities
    const crmEntities = await db.execute(sql`
      SELECT id, type, data
      FROM entities
      WHERE workspace_id = ${workspace.id}
      AND type IN ('contact', 'company', 'deal')
    `)
    
    const entityMap = new Map()
    crmEntities.rows.forEach(e => entityMap.set(e.id, e))
    
    console.log('\nCRM Entity Summary:')
    console.log(`  Contacts: ${crmEntities.rows.filter(e => e.type === 'contact').length}`)
    console.log(`  Companies: ${crmEntities.rows.filter(e => e.type === 'company').length}`)
    console.log(`  Deals: ${crmEntities.rows.filter(e => e.type === 'deal').length}`)
    console.log()
    
    // 5. Verify task linkages
    console.log('\nTask-CRM Linkages:')
    console.log('===================')
    
    for (const task of tasksWithCRM) {
      console.log(`\nTask: "${task.data?.title || 'Untitled'}" (${task.id})`)
      console.log(`  Created by user: ${task.user_id}`)
      
      const relationships = Array.isArray(task.relationships) ? task.relationships : []
      const linkedEntities = relationships.filter(r => r.type === 'linked_to')
      
      for (const link of linkedEntities) {
        const entity = entityMap.get(link.targetId)
        if (entity) {
          const name = entity.data?.name || 
                       `${entity.data?.firstName} ${entity.data?.lastName}` ||
                       'Unnamed'
          console.log(`  → Linked to ${entity.type}: "${name}" (${link.targetId})`)
        } else {
          console.log(`  ⚠ Linked to missing entity: ${link.targetId}`)
        }
      }
    }
    
    // 6. Check for orphaned relationships
    console.log('\n\nOrphaned Relationships Check:')
    console.log('==============================')
    
    let orphanedCount = 0
    for (const task of tasksWithCRM) {
      const relationships = Array.isArray(task.relationships) ? task.relationships : []
      const linkedEntities = relationships.filter(r => r.type === 'linked_to')
      
      for (const link of linkedEntities) {
        if (!entityMap.has(link.targetId)) {
          orphanedCount++
          console.log(`Task "${task.data?.title}" links to non-existent entity: ${link.targetId}`)
        }
      }
    }
    
    if (orphanedCount === 0) {
      console.log('✅ No orphaned relationships found!')
    } else {
      console.log(`⚠️ Found ${orphanedCount} orphaned relationships`)
    }
    
    // 7. Test activities logging
    console.log('\n\nActivity Logging Check:')
    console.log('=======================')
    
    const activities = await db.execute(sql`
      SELECT entity_id, type, source_module, metadata
      FROM activities
      WHERE workspace_id = ${workspace.id}
      AND source_module = 'evertask'
      ORDER BY created_at DESC
      LIMIT 10
    `)
    
    console.log(`Found ${activities.rows.length} recent task-related activities`)
    
    for (const activity of activities.rows) {
      const entity = entityMap.get(activity.entity_id)
      if (entity) {
        const name = entity.data?.name || `${entity.data?.firstName} ${entity.data?.lastName}` || 'Unnamed'
        console.log(`  ${activity.type} for ${entity.type} "${name}": ${activity.metadata?.title || ''}`)
      }
    }
    
  } catch (error) {
    console.error('Error testing task sync:', error)
  } finally {
    process.exit(0)
  }
}

testTaskSync()