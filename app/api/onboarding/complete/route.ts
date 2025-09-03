import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { workspaces, users, entities } from '@/lib/db/schema/unified'
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

    // First check if workspace exists
    const [existingCompany] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.clerkOrgId, orgId))
      .limit(1)

    if (!existingCompany) {
      console.error('Workspace not found for orgId:', orgId)
      // Create the workspace if it doesn't exist
      await db.insert(workspaces).values({
        clerkOrgId: orgId,
        name: 'Unknown Organization', // This will be updated by webhook
        slug: orgId,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        onboardingStep: 5,
        connectedIntegrations: []
      })
      console.log('Created new workspace record for:', orgId)
    } else {
      // Update existing workspace
      const result = await db
        .update(workspaces)
        .set({
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
          onboardingStep: 5,
          updatedAt: new Date()
        })
        .where(eq(workspaces.clerkOrgId, orgId))
      
      console.log('Updated workspace onboarding status:', result)
    }

    // Mark user as having completed the tour
    await db
      .update(users)
      .set({
        hasCompletedTour: true,
        updatedAt: new Date()
      })
      .where(eq(users.clerkUserId, userId))

    // Get workspace ID for event tracking
    const [workspace] = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.clerkOrgId, orgId))
      .limit(1)

    if (workspace) {
      // Track completion event
      await db.insert(entities).values({
        workspaceId: workspace.id,
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