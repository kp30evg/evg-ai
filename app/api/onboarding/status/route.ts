import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { workspaces } from '@/lib/db/schema/unified'
import { eq } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { userId, orgId } = await auth()
    
    if (!userId || !orgId) {
      console.log('Onboarding status check - no auth')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Checking onboarding status for org:', orgId)

    // Check if workspace exists  
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.clerkOrgId, orgId))
      .limit(1)

    if (!workspace) {
      console.log('Workspace not found in database for org:', orgId)
      
      // Get organization details from Clerk
      let orgName = 'My Workspace'
      let orgSlug = orgId
      
      try {
        const client = await clerkClient()
        const organization = await client.organizations.getOrganization({
          organizationId: orgId
        })
        orgName = organization.name
        orgSlug = organization.slug || orgId
      } catch (error) {
        console.log('Could not fetch organization details:', error)
      }
      
      // Create the workspace if it doesn't exist
      try {
        await db.insert(workspaces).values({
          clerkOrgId: orgId,
          name: orgName,
          slug: orgSlug
        })
        console.log('Created new workspace record for:', orgId, orgName)
      } catch (error) {
        console.error('Error creating workspace:', error)
      }
      
      // Workspace doesn't exist in database yet - skip onboarding for pure system
      return NextResponse.json({
        needsOnboarding: false,
        onboardingCompleted: true,
        onboardingStep: 0,
        reason: 'New workspace created - using pure single-table architecture'
      })
    }

    // With pure single-table architecture, no onboarding needed
    return NextResponse.json({
      needsOnboarding: false,
      onboardingCompleted: true,
      onboardingStep: 0
    })
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return NextResponse.json(
      { error: 'Failed to check onboarding status' },
      { status: 500 }
    )
  }
}