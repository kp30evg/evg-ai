import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const authData = await auth()
    const { userId, orgId: organizationId } = authData
    
    if (!userId || !organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch organization members from Clerk
    const clerk = await clerkClient()
    const memberships = await clerk.organizations.getOrganizationMembershipList({
      organizationId,
      limit: 100
    })

    // Map to a simpler format for the frontend
    const members = memberships.data.map(membership => ({
      id: membership.id,
      userId: membership.publicUserData.userId,
      firstName: membership.publicUserData.firstName,
      lastName: membership.publicUserData.lastName,
      email: membership.publicUserData.identifier || '',
      imageUrl: membership.publicUserData.imageUrl,
      role: membership.role
    }))

    return NextResponse.json(members)
  } catch (error) {
    console.error('Failed to fetch organization members:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}