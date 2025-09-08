import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { entities, users } from '@/lib/db/schema/unified';
import { eq, and, sql } from 'drizzle-orm';

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
      return NextResponse.json({
        totalInbox: 0,
        unread: 0,
        sent: 0,
        drafts: 0,
        starred: 0,
        responseRate: 0,
        avgResponseTime: 0
      });
    }
    
    // Get workspace
    const { workspaces } = await import('@/lib/db/schema/unified');
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.clerkOrgId, orgId))
      .limit(1);
    
    if (!workspace) {
      return NextResponse.json({
        totalInbox: 0,
        unread: 0,
        sent: 0,
        drafts: 0,
        starred: 0,
        responseRate: 0,
        avgResponseTime: 0
      });
    }
    
    // Get email stats
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        unread: sql<number>`count(*) filter (where (data->>'isRead')::boolean = false or data->>'isRead' is null)`,
        starred: sql<number>`count(*) filter (where (data->>'isStarred')::boolean = true)`,
        drafts: sql<number>`count(*) filter (where (data->>'isDraft')::boolean = true)`
      })
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.userId, dbUser.id),
          eq(entities.type, 'email')
        )
      );
    
    // Get sent emails count (emails where from matches user's email)
    const [sentStats] = await db
      .select({
        sent: sql<number>`count(*)`
      })
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.userId, dbUser.id),
          eq(entities.type, 'email'),
          sql`data->'from'->>'email' = ${dbUser.email}`
        )
      );
    
    // CRITICAL: Set cache headers to prevent cross-user data leaks
    const response = NextResponse.json({
      totalInbox: stats?.total || 0,
      unread: stats?.unread || 0,
      sent: sentStats?.sent || 0,
      drafts: stats?.drafts || 0,
      starred: stats?.starred || 0,
      responseRate: 0, // Calculate based on replies/received
      avgResponseTime: 0 // Calculate based on reply timestamps
    });
    
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
    
  } catch (error) {
    console.error('Error fetching email stats:', error);
    return NextResponse.json(
      {
        totalInbox: 0,
        unread: 0,
        sent: 0,
        drafts: 0,
        starred: 0,
        responseRate: 0,
        avgResponseTime: 0
      },
      { status: 500 }
    );
  }
}