import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { processCommand } from '@/lib/modules-simple/command-processor';
import { db } from '@/lib/db';
import { workspaces } from '@/lib/db/schema/unified';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { command } = await request.json();

    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    // Get workspace from org ID
    const workspace = await db.select()
      .from(workspaces)
      .where(eq(workspaces.clerkOrgId, orgId))
      .limit(1);

    if (!workspace.length) {
      // Create workspace if it doesn't exist
      const user = await currentUser();
      const newWorkspace = await db.insert(workspaces).values({
        clerkOrgId: orgId,
        name: user?.organizationMemberships?.[0]?.organization?.name || 'My Workspace',
        slug: orgId.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      }).returning();
      
      const workspaceId = newWorkspace[0].id;
      
      // Process command with the new unified system
      const result = await processCommand(workspaceId, command, userId);
      
      return NextResponse.json({
        ...result,
        timestamp: new Date().toISOString(),
      });
    }

    // Process command with the unified system
    const result = await processCommand(workspace[0].id, command, userId);

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Command processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process command' },
      { status: 500 }
    );
  }
}