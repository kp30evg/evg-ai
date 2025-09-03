import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { entityService } from '@/lib/entities/entity-service';

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all calendar-related entities
    const [events, accounts, settings] = await Promise.all([
      entityService.searchEntities(orgId, 'calendar_event', {}),
      entityService.searchEntities(orgId, 'calendar_account', {}),
      entityService.searchEntities(orgId, 'calendar_settings', {})
    ]);

    // Create export data
    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportedBy: userId,
        orgId,
        version: '1.0'
      },
      accounts: accounts.map(account => ({
        id: account.id,
        email: account.data.email,
        name: account.data.name,
        connected: account.data.connected,
        lastSync: account.data.lastSync,
        calendarCount: account.data.calendarCount,
        createdAt: account.data.createdAt
      })),
      events: events.map(event => ({
        id: event.id,
        title: event.data.title,
        description: event.data.description,
        start: event.data.start,
        end: event.data.end,
        attendees: event.data.attendees,
        location: event.data.location,
        status: event.data.status,
        googleEventId: event.data.googleEventId,
        calendarId: event.data.calendarId,
        accountId: event.data.accountId,
        created: event.data.created,
        updated: event.data.updated,
        syncedAt: event.data.syncedAt
      })),
      settings: settings.length > 0 ? settings[0].data : null,
      statistics: {
        totalAccounts: accounts.length,
        connectedAccounts: accounts.filter(a => a.data.connected).length,
        totalEvents: events.length,
        eventsByStatus: {
          confirmed: events.filter(e => e.data.status === 'confirmed').length,
          cancelled: events.filter(e => e.data.status === 'cancelled').length,
          tentative: events.filter(e => e.data.status === 'tentative').length
        },
        dateRange: events.length > 0 ? {
          earliest: Math.min(...events.map(e => new Date(e.data.start).getTime())),
          latest: Math.max(...events.map(e => new Date(e.data.start).getTime()))
        } : null
      }
    };

    // Create response with JSON file download
    const jsonString = JSON.stringify(exportData, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="calendar-export-${new Date().toISOString().split('T')[0]}.json"`,
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Error exporting calendar data:', error);
    return NextResponse.json({ 
      error: 'Failed to export calendar data' 
    }, { status: 500 });
  }
}