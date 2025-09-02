import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { companies, users, onboardingEvents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth()
    
    if (!userId || !orgId) {
      console.error('Onboarding complete called without auth:', { userId, orgId })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Completing onboarding for org:', orgId, 'user:', userId)

    // First check if company exists
    const [existingCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.clerkOrgId, orgId))
      .limit(1)

    if (!existingCompany) {
      console.error('Company not found for orgId:', orgId)
      // Create the company if it doesn't exist
      await db.insert(companies).values({
        clerkOrgId: orgId,
        name: 'Unknown Organization', // This will be updated by webhook
        slug: orgId,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        onboardingStep: 5,
        connectedIntegrations: []
      })
      console.log('Created new company record for:', orgId)
    } else {
      // Update existing company
      const result = await db
        .update(companies)
        .set({
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
          onboardingStep: 5,
          updatedAt: new Date()
        })
        .where(eq(companies.clerkOrgId, orgId))
      
      console.log('Updated company onboarding status:', result)
    }

    // Mark user as having completed the tour
    await db
      .update(users)
      .set({
        hasCompletedTour: true,
        updatedAt: new Date()
      })
      .where(eq(users.clerkUserId, userId))

    // Get company ID for event tracking
    const [company] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.clerkOrgId, orgId))
      .limit(1)

    if (company) {
      // Track completion event
      await db.insert(onboardingEvents).values({
        companyId: company.id,
        userId: userId,
        event: 'onboarding_completed',
        stepName: 'complete',
        metadata: {
          completedAt: new Date().toISOString(),
          totalSteps: 5
        }
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Onboarding completed successfully!'
    })
  } catch (error) {
    console.error('Error completing onboarding:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}