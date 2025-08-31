import 'dotenv/config'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

import { db } from '../lib/db'
import { companies, users, onboardingEvents } from '../lib/db/schema'

async function seedTestData() {
  console.log('🌱 Seeding test data...')
  
  try {
    // Create a test company
    const [company] = await db.insert(companies).values({
      clerkOrgId: 'org_test_' + Date.now(),
      name: 'Test Company',
      slug: 'test-company',
      onboardingCompleted: false,
      onboardingStep: 1,
      onboardingStartedAt: new Date(),
      companySize: '11-50',
      industry: 'saas',
      primaryUseCase: 'sales',
      connectedIntegrations: ['gmail', 'slack']
    }).returning()
    
    console.log('✅ Created test company:', company.name)
    
    // Create a test user
    const [user] = await db.insert(users).values({
      clerkUserId: 'user_test_' + Date.now(),
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      companyId: company.id,
      role: 'admin',
      hasCompletedTour: false,
      firstCommandExecuted: false
    }).returning()
    
    console.log('✅ Created test user:', user.email)
    
    // Create onboarding events
    await db.insert(onboardingEvents).values([
      {
        companyId: company.id,
        userId: user.clerkUserId,
        event: 'step_completed',
        stepName: 'company_profile',
        metadata: { 
          companySize: '11-50',
          industry: 'saas',
          primaryUseCase: 'sales'
        }
      },
      {
        companyId: company.id,
        userId: user.clerkUserId,
        event: 'step_completed',
        stepName: 'connect_tools',
        metadata: { 
          integrations: ['gmail', 'slack']
        }
      }
    ])
    
    console.log('✅ Created onboarding events')
    console.log('\n🎉 Test data seeded successfully!')
    console.log('Check your Neon dashboard to see the data.')
    
  } catch (error) {
    console.error('❌ Error seeding data:', error)
  }
  
  process.exit(0)
}

seedTestData()