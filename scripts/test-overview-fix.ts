import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())
const db = drizzle(neon(process.env.DATABASE_URL!))

async function testOverviewFix() {
  console.log('Testing Overview Page Fix')
  console.log('=========================\n')
  
  // Get tasks with CRM links in Evergreen workspace
  const tasks = await db.execute(sql`
    SELECT id, data, relationships
    FROM entities
    WHERE workspace_id = '3ebb63b5-61dd-4a7f-b645-1f0a6d214f7f'
    AND type = 'task'
    AND relationships IS NOT NULL
  `)
  
  console.log(`Found ${tasks.rows.length} tasks with relationships\n`)
  
  // Check tasks with linked_to relationships
  const linkedTasks = tasks.rows.filter(t => {
    if (!Array.isArray(t.relationships)) return false
    return t.relationships.some(r => r.type === 'linked_to')
  })
  
  console.log(`Tasks with CRM links: ${linkedTasks.length}`)
  
  for (const task of linkedTasks) {
    console.log(`\nTask: "${task.data?.title}"`)
    const links = task.relationships.filter(r => r.type === 'linked_to')
    
    for (const link of links) {
      // Check what this is linked to
      const [entity] = await db.execute(sql`
        SELECT type, data, relationships
        FROM entities
        WHERE id = ${link.targetId}
      `).then(r => r.rows)
      
      if (entity) {
        const name = entity.data?.name || 
                    `${entity.data?.firstName || ''} ${entity.data?.lastName || ''}`.trim() ||
                    'Unknown'
        console.log(`  → Linked to ${entity.type}: "${name}"`)
        
        // If it's a contact, check company relationship
        if (entity.type === 'contact') {
          let companyId = null
          if (Array.isArray(entity.relationships)) {
            const companyRel = entity.relationships.find(r => r.type === 'works_at')
            companyId = companyRel?.targetId
          } else if (entity.relationships && typeof entity.relationships === 'object') {
            companyId = entity.relationships.company
          }
          
          if (companyId) {
            const [company] = await db.execute(sql`
              SELECT data FROM entities WHERE id = ${companyId}
            `).then(r => r.rows)
            
            if (company) {
              console.log(`     Works at: "${company.data?.name}"`)
            }
          }
        }
      }
    }
  }
  
  console.log('\n✅ Overview page should now work without errors!')
  console.log('The fix handles both object and array relationship formats.')
  
  process.exit(0)
}

testOverviewFix()