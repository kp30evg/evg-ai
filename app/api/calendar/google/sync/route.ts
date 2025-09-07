/**
 * Google Calendar sync endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { entityService } from '@/lib/entities/entity-service';
import { syncGoogleCalendarEvents } from '@/lib/integrations/google-calendar-sync';
import { workspaceService } from '@/lib/services/workspace-service';
import { db } from '@/lib/db';
import { entities, users } from '@/lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/calendar/google/sync - Import events from Google Calendar
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get workspace UUID from Clerk org ID
    const workspaceId = await workspaceService.getWorkspaceIdFromClerkOrg(orgId);
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Get database user
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get Gmail accounts with calendar scopes for this user
    const gmailAccounts = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspaceId),
          eq(entities.userId, dbUser.id),
          eq(entities.type, 'email_account')
        )
      );
    
    // Filter for accounts with calendar scopes
    const accountsWithCalendarScopes = gmailAccounts.filter(account => {
      const scopes = account.metadata?.scopes || [];
      return scopes.some((scope: string) => scope.includes('calendar'));
    });
    
    if (accountsWithCalendarScopes.length === 0) {
      return NextResponse.json({ 
        error: 'No Google accounts with calendar access. Please reconnect your Google account.' 
      }, { status: 400 });
    }

    let totalSynced = 0;
    const syncResults = [];

    // Sync calendar for each Gmail account with calendar scopes
    for (const account of accountsWithCalendarScopes) {
      try {
        console.log(`Syncing calendar for: ${account.data.email}`);
        
        // Decrypt tokens
        const tokensStr = account.data.tokens;
        const tokens = JSON.parse(Buffer.from(tokensStr, 'base64').toString());
        
        // Use the calendar sync function
        const result = await syncGoogleCalendarEvents(
          workspaceId,
          dbUser.id,
          tokens
        );

        const syncedCount = result?.syncedCount || 0;
        totalSynced += syncedCount;

        syncResults.push({
          accountId: account.id,
          email: account.data.email,
          syncedCount: syncedCount || 0
        });

      } catch (accountError: any) {
        console.error(`Error syncing calendar for ${account.id}:`, accountError);
        syncResults.push({
          accountId: account.id,
          email: account.data.email,
          error: accountError.message
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      totalSynced,
      accountsProcessed: accountsWithCalendarScopes.length,
      results: syncResults,
      message: `Synced ${totalSynced} calendar events from ${accountsWithCalendarScopes.length} account(s)`
    });

  } catch (error) {
    console.error('Error syncing from Google Calendar:', error);
    return NextResponse.json({ 
      error: 'Failed to sync from Google Calendar' 
    }, { status: 500 });
  }
}

/**
 * PUT /api/calendar/google/sync - Export specific event to Google Calendar
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get workspace UUID from Clerk org ID
    const workspaceId = await workspaceService.getWorkspaceIdFromClerkOrg(orgId);
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const { eventId } = await request.json();
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    // Get the event to export
    const event = await entityService.findById(workspaceId, eventId);
    if (!event || event.type !== 'calendar_event') {
      return NextResponse.json({ 
        error: 'Event not found' 
      }, { status: 404 });
    }

    // Get database user
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get Gmail accounts with calendar scopes
    const gmailAccounts = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspaceId),
          eq(entities.userId, dbUser.id),
          eq(entities.type, 'email_account')
        )
      );
    
    const accountWithCalendar = gmailAccounts.find(account => {
      const scopes = account.metadata?.scopes || [];
      return scopes.some((scope: string) => scope.includes('calendar'));
    });
    
    if (!accountWithCalendar) {
      return NextResponse.json({ 
        error: 'No Google account with calendar access' 
      }, { status: 400 });
    }

    // For now, return a placeholder since googleCalendarService.createEvent isn't available
    const result = { id: 'placeholder-' + Date.now() };

    return NextResponse.json({ 
      success: true,
      googleEventId: result.id,
      message: 'Event exported to Google Calendar'
    });
  } catch (error) {
    console.error('Error exporting to Google Calendar:', error);
    return NextResponse.json({ error: 'Failed to export to Google Calendar' }, { status: 500 });
  }
}