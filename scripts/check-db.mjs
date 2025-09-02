import 'dotenv/config'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from '../lib/db/schema.js'

const sql = neon(process.env.DATABASE_URL)
const db = drizzle(sql, { schema })

async function checkDatabase() {
  console.log('Checking database...\n')
  
  try {
    // Check companies
    const allCompanies = await db.select().from(schema.companies)
    console.log(`Found ${allCompanies.length} companies:`)
    allCompanies.forEach(company => {
      console.log(`  - ${company.name} (${company.clerkOrgId})`)
      console.log(`    Onboarding completed: ${company.onboardingCompleted}`)
      console.log(`    Onboarding step: ${company.onboardingStep}`)
    })
    
    console.log('\n')
    
    // Check users
    const allUsers = await db.select().from(schema.users)
    console.log(`Found ${allUsers.length} users:`)
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.clerkUserId})`)
      console.log(`    Company ID: ${user.companyId}`)
      console.log(`    Has completed tour: ${user.hasCompletedTour}`)
    })
  } catch (error) {
    console.error('Error:', error)
  }
  
  process.exit(0)
}

checkDatabase()