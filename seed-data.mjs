import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { config } from 'dotenv'
import { v4 as uuidv4 } from 'uuid'

// Load environment variables
config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL)
const db = drizzle(sql)

async function seedTestData() {
  console.log('🌱 Seeding test data to Neon...')
  
  try {
    // Create a test company
    const companyId = uuidv4()
    const userId = uuidv4()
    
    await sql`
      INSERT INTO companies (
        id, clerk_org_id, name, slug, 
        onboarding_completed, onboarding_step, onboarding_started_at,
        company_size, industry, primary_use_case, connected_integrations
      ) VALUES (
        ${companyId},
        ${'org_test_' + Date.now()},
        'Test Company from Seed',
        'test-company-seed',
        false,
        1,
        NOW(),
        '11-50',
        'saas',
        'sales',
        '["gmail", "slack"]'::jsonb
      )
    `
    
    console.log('✅ Created test company')
    
    // Create a test user
    await sql`
      INSERT INTO users (
        id, clerk_user_id, email, first_name, last_name,
        company_id, role, has_completed_tour, first_command_executed
      ) VALUES (
        ${userId},
        ${'user_test_' + Date.now()},
        'test@example.com',
        'Test',
        'User',
        ${companyId},
        'admin',
        false,
        false
      )
    `
    
    console.log('✅ Created test user')
    
    // Create onboarding events
    await sql`
      INSERT INTO onboarding_events (
        company_id, user_id, event, step_name, metadata
      ) VALUES 
      (
        ${companyId},
        ${userId},
        'step_completed',
        'company_profile',
        '{"companySize": "11-50", "industry": "saas", "primaryUseCase": "sales"}'::jsonb
      ),
      (
        ${companyId},
        ${userId},
        'step_completed',
        'connect_tools',
        '{"integrations": ["gmail", "slack"]}'::jsonb
      )
    `
    
    console.log('✅ Created onboarding events')
    console.log('\n🎉 Test data seeded successfully!')
    console.log('Check your Neon dashboard at: https://console.neon.tech/')
    console.log('You should see data in these tables:')
    console.log('  - companies')
    console.log('  - users')
    console.log('  - onboarding_events')
    
  } catch (error) {
    console.error('❌ Error seeding data:', error)
  }
  
  process.exit(0)
}

seedTestData()