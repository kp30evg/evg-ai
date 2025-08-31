import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { companies, invitations, onboardingEvents, users } from '@/lib/db/schema'
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
    const { invites } = body

    // Get company and user
    const [company] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.clerkOrgId, orgId))
      .limit(1)

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1)

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Save invitations
    if (invites && invites.length > 0) {
      for (const invite of invites) {
        if (invite.email && invite.email.trim() !== '') {
          await db.insert(invitations).values({
            companyId: company.id,
            email: invite.email,
            role: invite.role || 'member',
            invitedBy: user?.id || null,
            status: 'pending',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          })
        }
      }

      // Track event
      await db.insert(onboardingEvents).values({
        companyId: company.id,
        userId: userId,
        event: 'step_completed',
        stepName: 'team_invites',
        metadata: { inviteCount: invites.filter(i => i.email?.trim()).length }
      })
    }

    // Update onboarding step
    await db
      .update(companies)
      .set({
        onboardingStep: 3,
        updatedAt: new Date()
      })
      .where(eq(companies.clerkOrgId, orgId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending invites:', error)
    return NextResponse.json(
      { error: 'Failed to send invites' },
      { status: 500 }
    )
  }
}