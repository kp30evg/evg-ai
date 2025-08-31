import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { companies, onboardingEvents } from '@/lib/db/schema'
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
    const { step, ...data } = body

    // Update onboarding step
    await db
      .update(companies)
      .set({
        onboardingStep: step,
        updatedAt: new Date()
      })
      .where(eq(companies.clerkOrgId, orgId))

    // Get company ID for event tracking
    const [company] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.clerkOrgId, orgId))
      .limit(1)

    if (company) {
      // Track progress event
      await db.insert(onboardingEvents).values({
        companyId: company.id,
        userId: userId,
        event: 'step_progressed',
        stepName: `step_${step}`,
        metadata: data
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving onboarding progress:', error)
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    )
  }
}