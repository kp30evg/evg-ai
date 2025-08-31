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
    const { selectedOptions } = body

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

    // Track import event
    if (selectedOptions && selectedOptions.length > 0) {
      await db.insert(onboardingEvents).values({
        companyId: company.id,
        userId: userId,
        event: 'step_completed',
        stepName: 'import_data',
        metadata: { importedData: selectedOptions }
      })
    }

    // Update onboarding step
    await db
      .update(companies)
      .set({
        onboardingStep: 4,
        updatedAt: new Date()
      })
      .where(eq(companies.clerkOrgId, orgId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error importing data:', error)
    return NextResponse.json(
      { error: 'Failed to import data' },
      { status: 500 }
    )
  }
}