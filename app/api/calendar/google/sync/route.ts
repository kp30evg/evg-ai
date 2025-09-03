/**
 * Google Calendar sync endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { entityService } from '@/lib/entities/entity-service';
import { googleCalendarService } from '@/lib/services/google-calendar-service';
import { workspaceService } from '@/lib/services/workspace-service';

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

    const body = await request.json().catch(() => ({}));
    const { accountId } = body;

    let accountsToSync = [];

    if (accountId) {
      // Sync specific account
      const account = await entityService.findById(workspaceId, accountId);
      if (!account || account.type !== 'calendar_account') {
        return NextResponse.json({ 
          error: 'Calendar account not found' 
        }, { status: 404 });
      }
      accountsToSync = [account];
    } else {
      // Sync all connected calendar accounts
      const accounts = await entityService.find({
        workspaceId,
        type: 'calendar_account',
        where: { connected: true }
      });
      
      if (accounts.length === 0) {
        return NextResponse.json({ 
          error: 'No calendar accounts connected. Please connect Google Calendar first.' 
        }, { status: 400 });
      }
      
      accountsToSync = accounts;
    }

    let totalImported = 0;
    let totalUpdated = 0;
    let totalProcessed = 0;
    const syncResults = [];

    // Sync each account
    for (const account of accountsToSync) {
      try {
        console.log(`Syncing calendar account: ${account.data.email}`);
        
        const result = await googleCalendarService.syncCalendarEvents(
          account.id,
          workspaceId,
          {
            syncDays: 90, // Sync 90 days into the future
            calendarId: 'primary'
          }
        );

        totalImported += result.importedCount;
        totalUpdated += result.updatedCount;
        totalProcessed += result.totalProcessed;

        syncResults.push({
          accountId: account.id,
          email: account.data.email,
          ...result
        });

      } catch (accountError) {
        console.error(`Error syncing account ${account.id}:`, accountError);
        syncResults.push({
          accountId: account.id,
          email: account.data.email,
          error: accountError.message
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      importedCount: totalImported,
      updatedCount: totalUpdated,
      totalProcessed,
      accountsProcessed: accountsToSync.length,
      results: syncResults,
      message: `Synced ${totalProcessed} events across ${accountsToSync.length} account(s): ${totalImported} imported, ${totalUpdated} updated`
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

    // Export event to Google Calendar using calendar account
    const calendarAccounts = await entityService.find({
      workspaceId,
      type: 'calendar_account',
      where: { connected: true }
    });
    
    if (calendarAccounts.length === 0) {
      return NextResponse.json({ 
        error: 'No calendar accounts connected' 
      }, { status: 400 });
    }

    const result = await googleCalendarService.createEvent(
      calendarAccounts[0].id,
      workspaceId,
      event.data
    );

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