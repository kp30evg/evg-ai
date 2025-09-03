import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { workspaces, invitations, entities } from '@/lib/db/schema/unified'
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

    // Get workspace
    const [workspace] = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.clerkOrgId, orgId))
      .limit(1)

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Create invitations
    const invitationPromises = teamMembers.map(async (member: any) => {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // Expire in 7 days

      return db.insert(invitations).values({
        workspaceId: workspace.id,
        email: member.email,
        role: member.role,
        invitedBy: userId,
        status: 'pending',
        expiresAt
      })
    })

    await Promise.all(invitationPromises)

    // Track event
    await db.insert(entities).values({
      workspaceId: workspace.id,
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