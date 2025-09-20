import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())
const db = drizzle(neon(process.env.DATABASE_URL!))

async function checkWorkspaceData() {
  const result = await db.execute(sql`
    SELECT 
      w.name,
      w.id,
      COUNT(DISTINCT CASE WHEN e.type='contact' THEN e.id END) as contacts,
      COUNT(DISTINCT CASE WHEN e.type='deal' THEN e.id END) as deals,
      COUNT(DISTINCT CASE WHEN e.type='task' THEN e.id END) as tasks,
      COUNT(DISTINCT CASE WHEN e.type='company' THEN e.id END) as companies
    FROM workspaces w
    LEFT JOIN entities e ON e.workspace_id = w.id
    GROUP BY w.id, w.name
    ORDER BY contacts DESC, deals DESC
    LIMIT 10
  `)
  
  console.log('\nWorkspace Data Summary:')
  console.log('======================')
  console.table(result.rows)
  
  // Find workspace with most data
  const bestWorkspace = result.rows.reduce((best: any, curr: any) => {
    const currScore = Number(curr.contacts) + Number(curr.deals) + Number(curr.tasks)
    const bestScore = best ? Number(best.contacts) + Number(best.deals) + Number(best.tasks) : 0
    return currScore > bestScore ? curr : best
  }, null)
  
  if (bestWorkspace) {
    console.log('\nBest workspace for testing:', bestWorkspace.name)
    console.log('Workspace ID:', bestWorkspace.id)
    
    // Get sample entities from this workspace
    const contacts = await db.execute(sql`
      SELECT id, data FROM entities 
      WHERE workspace_id = ${bestWorkspace.id} 
      AND type = 'contact' 
      LIMIT 3
    `)
    
    const deals = await db.execute(sql`
      SELECT id, data FROM entities 
      WHERE workspace_id = ${bestWorkspace.id} 
      AND type = 'deal' 
      LIMIT 3
    `)
    
    const tasks = await db.execute(sql`
      SELECT id, data, relationships FROM entities 
      WHERE workspace_id = ${bestWorkspace.id} 
      AND type = 'task' 
      LIMIT 5
    `)
    
    console.log('\nSample Contacts:')
    contacts.rows.forEach(c => {
      const name = c.data?.name || `${c.data?.firstName} ${c.data?.lastName}` || 'Unnamed'
      console.log(`  - ${name} (${c.id})`)
    })
    
    console.log('\nSample Deals:')
    deals.rows.forEach(d => {
      console.log(`  - ${d.data?.name || 'Unnamed'} (${d.id})`)
    })
    
    console.log('\nSample Tasks:')
    tasks.rows.forEach(t => {
      const hasLinks = Array.isArray(t.relationships) && 
                      t.relationships.some(r => r.type === 'linked_to')
      console.log(`  - ${t.data?.title || 'Untitled'} ${hasLinks ? '✓ Has CRM links' : ''}`)
    })
  }
  
  process.exit(0)
}

checkWorkspaceData()