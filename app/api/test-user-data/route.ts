import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { entities, users, workspaces } from '@/lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    
    // Get user
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get user's Gmail account
    const gmailAccount = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.type, 'email_account'),
          eq(entities.userId, dbUser.id)
        )
      )
      .limit(1);
    
    // Get user's emails
    const emails = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.type, 'email'),
          eq(entities.userId, dbUser.id)
        )
      )
      .limit(5);
    
    // Get user's calendar events
    const events = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.type, 'calendar_event'),
          eq(entities.userId, dbUser.id)
        )
      )
      .limit(5);
    
    // Get user's contacts
    const contacts = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.type, 'contact'),
          eq(entities.userId, dbUser.id)
        )
      )
      .limit(5);
    
    return NextResponse.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        clerkUserId: dbUser.clerkUserId
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        clerkOrgId: workspace.clerkOrgId
      },
      gmailAccount: gmailAccount.length > 0 ? {
        connected: true,
        email: (gmailAccount[0].data as any).email || (gmailAccount[0].data as any).userEmail,
        lastSync: (gmailAccount[0].data as any).lastSyncAt
      } : { connected: false },
      stats: {
        emails: emails.length,
        events: events.length,
        contacts: contacts.length
      },
      sampleEmails: emails.slice(0, 3).map(e => ({
        subject: (e.data as any).subject,
        from: (e.data as any).from,
        date: (e.data as any).date
      })),
      sampleEvents: events.slice(0, 3).map(e => ({
        title: (e.data as any).title,
        startTime: (e.data as any).startTime,
        location: (e.data as any).location
      })),
      sampleContacts: contacts.slice(0, 3).map(c => ({
        name: (c.data as any).name,
        email: (c.data as any).email
      }))
    });
  } catch (error: any) {
    console.error('Test user data error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get user data' 
    }, { status: 500 });
  }
}