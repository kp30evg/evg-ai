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
    const { selectedOptions } = body

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

    // Track import event
    if (selectedOptions && selectedOptions.length > 0) {
      await db.insert(entities).values({
        workspaceId: workspace.id,
        userId: userId,
        event: 'step_completed',
        stepName: 'import_data',
        metadata: { importedData: selectedOptions }
      })
    }

    // Update onboarding step
    await db
      .update(workspaces)
      .set({
        onboardingStep: 4,
        updatedAt: new Date()
      })
      .where(eq(workspaces.clerkOrgId, orgId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error importing data:', error)
    return NextResponse.json(
      { error: 'Failed to import data' },
      { status: 500 }
    )
  }
}