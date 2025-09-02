#!/usr/bin/env tsx
import { config } from 'dotenv'

// Load environment variables first
config({ path: '.env.local' })

// Now import database after env vars are loaded
import { db } from '../lib/db'
import { users, companies } from '../lib/db/schema'

async function checkDatabase() {
  console.log('Checking database...\n')
  
  // Check companies
  const allCompanies = await db.select().from(companies)
  console.log(`Found ${allCompanies.length} companies:`)
  allCompanies.forEach(company => {
    console.log(`  - ${company.name} (${company.clerkOrgId})`)
    console.log(`    Onboarding completed: ${company.onboardingCompleted}`)
    console.log(`    Onboarding step: ${company.onboardingStep}`)
  })
  
  console.log('\n')
  
  // Check users
  const allUsers = await db.select().from(users)
  console.log(`Found ${allUsers.length} users:`)
  allUsers.forEach(user => {
    console.log(`  - ${user.email} (${user.clerkUserId})`)
    console.log(`    Company ID: ${user.companyId}`)
    console.log(`    Has completed tour: ${user.hasCompletedTour}`)
  })
  
  process.exit(0)
}

checkDatabase().catch(console.error)