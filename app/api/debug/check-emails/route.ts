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
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }
    
    // Get current user
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Count emails for this user
    const userEmails = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.userId, dbUser.id),
          eq(entities.type, 'email')
        )
      );
    
    // Check email account
    const [emailAccount] = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.userId, dbUser.id),
          eq(entities.type, 'email_account')
        )
      )
      .limit(1);
    
    // Count all emails in workspace (for debugging)
    const allWorkspaceEmails = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.type, 'email')
        )
      );
    
    // Sample first few emails if they exist
    const sampleEmails = userEmails.slice(0, 3).map(email => {
      const data = email.data as any;
      return {
        id: email.id,
        subject: data.subject,
        from: data.from,
        date: data.date,
        userId: email.userId
      };
    });
    
    return NextResponse.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        clerkUserId: dbUser.clerkUserId
      },
      workspace: {
        id: workspace.id,
        name: workspace.name
      },
      emailAccount: emailAccount ? {
        connected: true,
        email: (emailAccount.data as any)?.email,
        lastSyncAt: (emailAccount.data as any)?.lastSyncAt
      } : { connected: false },
      emailStats: {
        userEmailCount: userEmails.length,
        workspaceEmailCount: allWorkspaceEmails.length,
        sampleEmails
      }
    });
    
  } catch (error) {
    console.error('Debug check error:', error);
    return NextResponse.json(
      { error: 'Failed to check emails' },
      { status: 500 }
    );
  }
}