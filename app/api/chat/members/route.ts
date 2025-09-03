import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization members from Clerk
    const memberships = await (await clerkClient()).organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 100,
    });

    // Format the members data
    const members = await Promise.all(
      memberships.data.map(async (membership) => {
        const user = await (await clerkClient()).users.getUser(membership.publicUserData?.userId || '');
        return {
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unknown',
          email: user.emailAddresses[0]?.emailAddress || '',
          avatar: user.imageUrl || '',
          initials: `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'UN',
          status: 'online', // You can implement real status tracking
          role: membership.role,
        };
      })
    );

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization members' },
      { status: 500 }
    );
  }
}