import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { workspaces, users } from '@/lib/db/schema/unified'

export async function GET() {
  try {
    // Check companies
    const allCompanies = await db.select().from(companies)
    
    // Check users
    const allUsers = await db.select().from(users)
    
    return NextResponse.json({
      companies: {
        count: allCompanies.length,
        data: allCompanies.map(c => ({
          name: c.name,
          clerkOrgId: c.clerkOrgId,
          onboardingCompleted: c.onboardingCompleted,
          onboardingStep: c.onboardingStep
        }))
      },
      users: {
        count: allUsers.length,
        data: allUsers.map(u => ({
          email: u.email,
          clerkUserId: u.clerkUserId,
          workspaceId: u.workspaceId,
          hasCompletedTour: u.hasCompletedTour
        }))
      }
    })
  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json(
      { error: 'Failed to check database' },
      { status: 500 }
    )
  }
}