import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { entities, users, workspaces } from '@/lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    // Get all headers
    const headers = Object.fromEntries(req.headers.entries());
    console.log('=== REQUEST HEADERS ===');
    console.log('Cookie:', headers.cookie?.substring(0, 100) + '...');
    
    // Get Clerk auth context
    const authResult = await auth();
    const { userId: clerkUserId, orgId: clerkOrgId } = authResult;
    
    console.log('=== DEBUG USER CONTEXT ===');
    console.log('Full auth result:', authResult);
    console.log('Clerk User ID:', clerkUserId);
    console.log('Clerk Org ID:', clerkOrgId);
    
    if (!clerkUserId || !clerkOrgId) {
      return NextResponse.json({ error: 'Not authenticated' });
    }
    
    // Get workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.clerkOrgId, clerkOrgId))
      .limit(1);
    
    console.log('Workspace:', workspace?.id, workspace?.name);
    
    // Get database user
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    
    console.log('Database User:', dbUser?.id, dbUser?.email);
    
    if (!workspace || !dbUser) {
      return NextResponse.json({ 
        error: 'User or workspace not found',
        clerkUserId,
        clerkOrgId,
        workspace: workspace?.name,
        dbUser: dbUser?.email
      });
    }
    
    // Check what email accounts this user has
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
    
    console.log('Email accounts for user:', emailAccounts.length);
    
    // Check how many emails this user has
    const emails = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.userId, dbUser.id),
          eq(entities.type, 'email')
        )
      );
    
    console.log('Emails for user:', emails.length);
    
    // Sample some emails to see what's there
    const sampleEmails = emails.slice(0, 3).map(e => {
      const data = e.data as any;
      return {
        subject: data.subject,
        from: data.from?.email,
        userId: e.userId,
        workspaceId: e.workspaceId
      };
    });
    
    return NextResponse.json({
      debug: {
        clerkUserId,
        clerkOrgId,
        workspace: {
          id: workspace.id,
          name: workspace.name,
          clerkOrgId: workspace.clerkOrgId
        },
        dbUser: {
          id: dbUser.id,
          email: dbUser.email,
          clerkUserId: dbUser.clerkUserId,
          workspaceId: dbUser.workspaceId
        },
        emailAccounts: emailAccounts.map(a => {
          const data = a.data as any;
          return {
            email: data.email || data.userEmail,
            userId: a.userId,
            isActive: data.isActive
          };
        }),
        emailCount: emails.length,
        sampleEmails
      }
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Debug failed', details: error });
  }
}