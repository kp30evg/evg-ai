import 'dotenv/config'
import { db } from '../lib/db'
import { entities, users, workspaces } from '../lib/db/schema'
import { everTaskService } from '../lib/modules-simple/evertask'
import { eq, and } from 'drizzle-orm'

async function testEverTask() {
  console.log('🧪 Testing EverTask Project Creation...\n')
  
  try {
    // Get the first workspace (Evergreen)
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.clerkOrgId, 'org_321PMbgXawub3NIZaTRy0OQaBhP'))
      .limit(1)
    
    if (!workspace) {
      console.error('❌ No Evergreen workspace found!')
      return
    }
    
    console.log('✅ Found workspace:', workspace.name)
    
    // Get a user from this workspace
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.workspaceId, workspace.id))
      .limit(1)
    
    if (!user) {
      console.error('❌ No users found in workspace!')
      return
    }
    
    console.log('✅ Found user:', user.email || user.clerkUserId)
    
    // Create a test project
    const projectData = {
      name: 'Test Project from Script',
      description: 'This is a test project created via script',
      privacy: 'public' as const,
      team: 'engineering',
      views: ['board', 'list', 'dashboard'],
      useAI: false,
      members: [user.id]
    }
    
    console.log('\n📦 Creating project with data:', projectData)
    
    const project = await everTaskService.createProject(
      workspace.id,
      user.id,
      projectData
    )
    
    console.log('\n✅ Project created successfully!')
    console.log('   ID:', project.id)
    console.log('   Name:', project.data.name)
    console.log('   URL: http://localhost:3000/dashboard/tasks/' + project.id)
    
    // Verify it was saved
    const [savedProject] = await db
      .select()
      .from(entities)
      .where(eq(entities.id, project.id))
      .limit(1)
    
    if (savedProject) {
      console.log('\n✅ Project verified in database!')
    } else {
      console.error('\n❌ Project not found in database!')
    }
    
    // List all projects for this workspace
    const allProjects = await everTaskService.getProjects(workspace.id, user.id)
    console.log('\n📊 Total projects in workspace:', allProjects.length)
    allProjects.forEach(p => {
      console.log(`   - ${p.data?.name || 'Untitled'} (${p.id})`)
    })
    
  } catch (error) {
    console.error('\n❌ Error:', error)
  } finally {
    process.exit(0)
  }
}

testEverTask()