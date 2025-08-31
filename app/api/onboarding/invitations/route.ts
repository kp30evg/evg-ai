import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { companies, invitations, onboardingEvents } from '@/lib/db/schema'
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
    const { teamMembers } = body

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

    // Create invitations
    const invitationPromises = teamMembers.map(async (member: any) => {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // Expire in 7 days

      return db.insert(invitations).values({
        companyId: company.id,
        email: member.email,
        role: member.role,
        invitedBy: userId,
        status: 'pending',
        expiresAt
      })
    })

    await Promise.all(invitationPromises)

    // Track event
    await db.insert(onboardingEvents).values({
      companyId: company.id,
      userId: userId,
      event: 'team_invited',
      stepName: 'invite_team',
      metadata: { 
        inviteCount: teamMembers.length,
        emails: teamMembers.map((m: any) => m.email)
      }
    })

    // In production, send actual invitation emails here
    // await sendInvitationEmails(teamMembers, organization)

    return NextResponse.json({ 
      success: true,
      message: `${teamMembers.length} invitations sent`
    })
  } catch (error) {
    console.error('Error sending invitations:', error)
    return NextResponse.json(
      { error: 'Failed to send invitations' },
      { status: 500 }
    )
  }
}