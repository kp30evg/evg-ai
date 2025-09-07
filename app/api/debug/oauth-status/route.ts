import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { entities, users, workspaces } from '@/lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId, orgId } = await auth();
    
    if (!clerkUserId || !orgId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.clerkOrgId, orgId))
      .limit(1);
    
    if (!workspace) {
      return NextResponse.json({ 
        error: 'Workspace not found',
        orgId,
        hasWorkspace: false 
      });
    }
    
    // Get database user
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    
    if (!dbUser) {
      return NextResponse.json({ 
        error: 'User not found',
        clerkUserId,
        hasUser: false 
      });
    }
    
    // Check for email_account
    const emailAccounts = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.userId, dbUser.id),
          eq(entities.type, 'email_account')
        )
      );
    
    // Get all email_accounts in workspace for debugging
    const allWorkspaceAccounts = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.type, 'email_account')
        )
      );
    
    const accountData = emailAccounts[0]?.data as any;
    
    return NextResponse.json({
      debug: {
        clerkUserId,
        orgId,
        workspaceId: workspace.id,
        dbUserId: dbUser.id,
        userEmail: dbUser.email
      },
      emailAccount: {
        found: emailAccounts.length > 0,
        count: emailAccounts.length,
        isActive: accountData?.isActive,
        email: accountData?.email,
        hasTokens: !!accountData?.tokens,
        connectedAt: accountData?.connectedAt,
        lastSyncAt: accountData?.lastSyncAt
      },
      workspaceAccounts: {
        total: allWorkspaceAccounts.length,
        accounts: allWorkspaceAccounts.map((acc: any) => ({
          userId: acc.userId,
          email: acc.data?.email,
          isActive: acc.data?.isActive
        }))
      }
    });
    
  } catch (error) {
    console.error('OAuth status debug error:', error);
    return NextResponse.json(
      { error: 'Failed to check OAuth status', details: error },
      { status: 500 }
    );
  }
}