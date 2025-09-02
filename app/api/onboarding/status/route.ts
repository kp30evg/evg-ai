import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { userId, orgId } = await auth()
    
    if (!userId || !orgId) {
      console.log('Onboarding status check - no auth')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Checking onboarding status for org:', orgId)

    // Check if company exists and has completed onboarding
    const [company] = await db
      .select({
        onboardingCompleted: companies.onboardingCompleted,
        onboardingStep: companies.onboardingStep
      })
      .from(companies)
      .where(eq(companies.clerkOrgId, orgId))
      .limit(1)

    if (!company) {
      console.log('Company not found in database for org:', orgId)
      
      // Get organization details from Clerk
      let orgName = 'My Company'
      let orgSlug = orgId
      
      try {
        const client = await clerkClient()
        const organization = await client.organizations.getOrganization({
          organizationId: orgId
        })
        orgName = organization.name
        orgSlug = organization.slug || orgId
      } catch (error) {
        console.log('Could not fetch organization details:', error)
      }
      
      // Create the company if it doesn't exist
      try {
        await db.insert(companies).values({
          clerkOrgId: orgId,
          name: orgName,
          slug: orgSlug,
          onboardingCompleted: false,
          onboardingStep: 0,
          connectedIntegrations: []
        })
        console.log('Created new company record for:', orgId, orgName)
      } catch (error) {
        console.error('Error creating company:', error)
      }
      
      // Company doesn't exist in database yet - needs onboarding
      return NextResponse.json({
        needsOnboarding: true,
        onboardingCompleted: false,
        onboardingStep: 0,
        reason: 'New company created'
      })
    }

    const needsOnboarding = !company.onboardingCompleted
    console.log('Company onboarding status:', {
      orgId,
      onboardingCompleted: company.onboardingCompleted,
      onboardingStep: company.onboardingStep,
      needsOnboarding
    })

    return NextResponse.json({
      needsOnboarding,
      onboardingCompleted: company.onboardingCompleted || false,
      onboardingStep: company.onboardingStep || 0
    })
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return NextResponse.json(
      { error: 'Failed to check onboarding status' },
      { status: 500 }
    )
  }
}