import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GmailSyncService } from '@/lib/evermail/gmail-sync-with-isolation';
import { db } from '@/lib/db';
import { workspaces, users, entities } from '@/lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';

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
    
    // Get the actual user from database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);
    
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // CRITICAL: Get email account with tokens FOR THIS USER ONLY
    console.log(`[SYNC] Looking for email account for user ${dbUser.email} (ID: ${dbUser.id}) in workspace ${workspace.id}`);
    
    const emailAccount = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.type, 'email_account'),
          eq(entities.userId, dbUser.id) // CRITICAL: Use actual user ID, not Clerk ID
        )
      )
      .limit(1);
    
    if (!emailAccount || emailAccount.length === 0) {
      console.log(`[SYNC] No Gmail account found for user ${dbUser.email}`);
      return NextResponse.json(
        { error: 'Gmail account not connected' },
        { status: 400 }
      );
    }
    
    const accountData = emailAccount[0].data as any;
    console.log(`[SYNC] Found Gmail account: ${accountData.email || accountData.userEmail} for user ${dbUser.email}`);
    
    // CRITICAL VALIDATION: Ensure we're syncing the right account
    if (accountData.clerkUserId && accountData.clerkUserId !== userId) {
      console.error(`[SYNC] SECURITY WARNING: Account belongs to different Clerk user!`);
      console.error(`[SYNC] Expected: ${userId}, Found: ${accountData.clerkUserId}`);
      return NextResponse.json(
        { error: 'Security error: Account mismatch' },
        { status: 403 }
      );
    }
    
    // Decrypt tokens (simple base64 decode for now)
    const tokens = JSON.parse(Buffer.from(accountData.tokens, 'base64').toString());

    // Initialize Gmail sync service with user isolation
    const gmailSync = new GmailSyncService({
      workspaceId: workspace.id,
      userId: dbUser.id, // Use actual database user ID
      tokens: tokens,
      userEmail: accountData.email || accountData.userEmail
    });
    
    // Perform initial sync to get real emails
    const result = await gmailSync.syncEmails();
    
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
    
    // Get the actual user from database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);
    
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check Gmail connection status FOR THIS USER
    const gmailAccount = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.type, 'email_account'),
          eq(entities.userId, dbUser.id) // User-specific account
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
    
    // Count synced emails FOR THIS USER
    const emailCount = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.type, 'email'),
          eq(entities.userId, dbUser.id) // User-specific emails
        )
      );
    
    return NextResponse.json({
      connected: true,
      email: accountData.email || accountData.userEmail,
      lastSyncAt: accountData.lastSyncAt,
      totalEmails: emailCount.length,
      message: `Gmail connected: ${accountData.email || accountData.userEmail}`
    });
  } catch (error) {
    console.error('Gmail status error:', error);
    return NextResponse.json(
      { error: 'Failed to check Gmail status' },
      { status: 500 }
    );
  }
}