import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { workspaces, entities } from '@/lib/db/schema/unified'
import { eq } from 'drizzle-orm'

// Helper to create a deterministic UUID from any string ID
const stringToUuid = (str: string): string => {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(str).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32)
  ].join('-');
}

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
      .update(workspaces)
      .set({
        onboardingStep: step,
        updatedAt: new Date()
      })
      .where(eq(workspaces.clerkOrgId, orgId))

    // Get workspace ID for event tracking
    const [workspace] = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.clerkOrgId, orgId))
      .limit(1)

    if (workspace) {
      // Track progress event
      await db.insert(entities).values({
        workspaceId: workspace.id,
        type: 'onboarding_event',
        data: {
          event: 'step_progressed',
          stepName: `step_${step}`,
          ...data
        },
        createdBy: stringToUuid(userId),
        metadata: { source: 'onboarding' }
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