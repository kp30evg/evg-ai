import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GmailSyncService } from '@/lib/evermail/gmail-sync-simple';
import { db } from '@/lib/db';
import { workspaces } from '@/lib/db/schema/unified';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.clerkOrgId, orgId))
      .limit(1);
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Initialize Gmail sync service
    const gmailSync = new GmailSyncService();
    
    // Perform initial sync to get real emails
    const result = await gmailSync.performInitialSync(workspace.id, userId);
    
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${result.totalSynced} emails from Gmail`,
      totalSynced: result.totalSynced
    });
  } catch (error) {
    console.error('Gmail sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync Gmail' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.clerkOrgId, orgId))
      .limit(1);
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Check Gmail connection status
    const { entities } = await import('@/lib/db/schema/unified');
    const { and, sql } = await import('drizzle-orm');
    
    const gmailAccount = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.type, 'email_account'),
          sql`data->>'isActive' = 'true'`
        )
      )
      .limit(1);
    
    if (!gmailAccount.length) {
      return NextResponse.json({
        connected: false,
        message: 'Gmail not connected. Please connect your Gmail account first.'
      });
    }
    
    const accountData = gmailAccount[0].data as any;
    
    // Count synced emails
    const emailCount = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.type, 'email')
        )
      );
    
    return NextResponse.json({
      connected: true,
      email: accountData.email,
      lastSyncAt: accountData.lastSyncAt,
      totalEmails: emailCount.length,
      message: `Gmail connected: ${accountData.email}`
    });
  } catch (error) {
    console.error('Gmail status error:', error);
    return NextResponse.json(
      { error: 'Failed to check Gmail status' },
      { status: 500 }
    );
  }
}