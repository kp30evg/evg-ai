import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { workspaces, entities } from '@/lib/db/schema/unified'
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

    // Update workspace profile - store in settings JSONB field
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.clerkOrgId, orgId))
      .limit(1)
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }
    
    await db
      .update(workspaces)
      .set({
        settings: {
          ...(workspace.settings as any || {}),
          companySize,
          industry,
          primaryUseCase,
          onboardingStep: 1,
          onboardingStartedAt: new Date().toISOString()
        },
        updatedAt: new Date()
      })
      .where(eq(workspaces.clerkOrgId, orgId))

    // Track onboarding event in entities table
    if (workspace) {
      await db.insert(entities).values({
        workspaceId: workspace.id,
        type: 'onboarding_event',
        data: {
          event: 'step_completed',
          stepName: 'company_profile',
          userId: userId,
          companySize,
          industry,
          primaryUseCase
        },
        metadata: {
          createdBy: userId
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving workspace profile:', error)
    return NextResponse.json(
      { error: 'Failed to save workspace profile' },
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

    const [workspace] = await db
      .select({
        settings: workspaces.settings
      })
      .from(workspaces)
      .where(eq(workspaces.clerkOrgId, orgId))
      .limit(1)
    
    if (!workspace) {
      return NextResponse.json({})
    }
    
    const settings = workspace.settings as any || {}

    return NextResponse.json({
      companySize: settings.companySize,
      industry: settings.industry,
      primaryUseCase: settings.primaryUseCase,
      onboardingStep: settings.onboardingStep,
      onboardingCompleted: settings.onboardingCompleted
    })
  } catch (error) {
    console.error('Error fetching workspace profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workspace profile' },
      { status: 500 }
    )
  }
}