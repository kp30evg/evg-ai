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
    const { companySize, industry, primaryUseCase } = body

    // Update company profile
    await db
      .update(companies)
      .set({
        companySize,
        industry, 
        primaryUseCase,
        onboardingStep: 1,
        onboardingStartedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(companies.clerkOrgId, orgId))

    // Track onboarding event
    const [company] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.clerkOrgId, orgId))
      .limit(1)

    if (company) {
      await db.insert(onboardingEvents).values({
        companyId: company.id,
        userId: userId,
        event: 'step_completed',
        stepName: 'company_profile',
        metadata: { companySize, industry, primaryUseCase }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving company profile:', error)
    return NextResponse.json(
      { error: 'Failed to save company profile' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const { userId, orgId } = await auth()
    
    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const [company] = await db
      .select({
        companySize: companies.companySize,
        industry: companies.industry,
        primaryUseCase: companies.primaryUseCase,
        onboardingStep: companies.onboardingStep,
        onboardingCompleted: companies.onboardingCompleted
      })
      .from(companies)
      .where(eq(companies.clerkOrgId, orgId))
      .limit(1)

    return NextResponse.json(company || {})
  } catch (error) {
    console.error('Error fetching company profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company profile' },
      { status: 500 }
    )
  }
}