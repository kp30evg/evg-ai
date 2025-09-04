import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { entities, users } from '@/lib/db/schema/unified';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get database user
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);
    
    if (!dbUser) {
      return NextResponse.json({ threads: [] });
    }
    
    // Get workspace
    const { workspaces } = await import('@/lib/db/schema/unified');
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.clerkOrgId, orgId))
      .limit(1);
    
    if (!workspace) {
      return NextResponse.json({ threads: [] });
    }
    
    // Get limit from query params
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '5');
    
    // Get recent emails from database (emails stored during sync)
    const emails = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.userId, dbUser.id),
          eq(entities.type, 'email')
        )
      )
      .orderBy(desc(entities.createdAt))
      .limit(limit);
    
    // Format emails as threads
    const threads = emails.map(email => {
      const emailData = email.data as any;
      return {
        id: email.id,
        subject: emailData.subject || '(no subject)',
        from: emailData.from?.name || emailData.from?.email || 'Unknown',
        snippet: emailData.snippet || emailData.body?.snippet || '',
        date: emailData.date || email.createdAt,
        unread: !emailData.isRead,
        starred: emailData.isStarred || false,
        hasAttachment: emailData.hasAttachment || false,
        important: emailData.important || false
      };
    });
    
    return NextResponse.json({ threads });
    
  } catch (error) {
    console.error('Error fetching email threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email threads', threads: [] },
      { status: 500 }
    );
  }
}