import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { companies, integrations, onboardingEvents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth()
    
    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { integrations: selectedIntegrations } = body

    // Get company
    const [company] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.clerkOrgId, orgId))
      .limit(1)

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Update company with selected integrations and advance onboarding step
    await db
      .update(companies)
      .set({
        connectedIntegrations: selectedIntegrations || [],
        onboardingStep: 2,
        updatedAt: new Date()
      })
      .where(eq(companies.clerkOrgId, orgId))

    // Track event
    if (selectedIntegrations && selectedIntegrations.length > 0) {
      await db.insert(onboardingEvents).values({
        companyId: company.id,
        userId: userId,
        event: 'step_completed',
        stepName: 'connect_tools',
        metadata: { integrations: selectedIntegrations }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error connecting integration:', error)
    return NextResponse.json(
      { error: 'Failed to connect integration' },
      { status: 500 }
    )
  }
}