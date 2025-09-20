import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { workspaces, users, entities } from '@/lib/db/schema/unified'
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

    // Get workspace and user
    const [workspace] = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.clerkOrgId, orgId))
      .limit(1)

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1)

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Save invitations in entities table
    if (invites && invites.length > 0) {
      for (const invite of invites) {
        if (invite.email && invite.email.trim() !== '') {
          await db.insert(entities).values({
            workspaceId: workspace.id,
            userId: user?.id || undefined,
            type: 'invitation',
            data: {
              email: invite.email,
              role: invite.role || 'member',
              invitedBy: userId,
              status: 'pending',
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            metadata: { source: 'onboarding' }
          })
        }
      }

      // Track event
      await db.insert(entities).values({
        workspaceId: workspace.id,
        type: 'event',
        data: {
          event: 'step_completed',
          stepName: 'team_invites',
          userId: userId
        },
        metadata: { inviteCount: invites.filter((i: any) => i.email?.trim()).length }
      })
    }

    // Update onboarding step (if this field exists)
    // await db
    //   .update(workspaces)
    //   .set({
    //     onboardingStep: 3,
    //     updatedAt: new Date()
    //   })
    //   .where(eq(workspaces.clerkOrgId, orgId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending invites:', error)
    return NextResponse.json(
      { error: 'Failed to send invites' },
      { status: 500 }
    )
  }
}