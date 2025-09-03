import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { entityService } from '@/lib/entities/entity-service';
import { workspaceService } from '@/lib/services/workspace-service';

export async function GET(request: NextRequest) {
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

    // Get URL search params for filtering
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Base query for calendar events
    let query: any = {
      workspaceId,
      type: 'calendar_event'
    };

    // Add date filters if provided
    if (startDate || endDate) {
      // For now, get all events and filter in memory
      // In a production system, you'd want database-level filtering
    }

    // Fetch calendar events
    const events = await entityService.find(query);

    // Transform events for the frontend
    const transformedEvents = events.map(event => ({
      id: event.id,
      title: event.data.title || event.data.summary || 'Untitled Event',
      description: event.data.description || '',
      startTime: event.data.startTime || event.data.start?.dateTime || event.data.start?.date,
      endTime: event.data.endTime || event.data.end?.dateTime || event.data.end?.date,
      attendees: event.data.attendees || [],
      location: event.data.location || '',
      status: event.data.status || 'confirmed',
      googleEventId: event.data.googleEventId,
      calendarId: event.data.calendarId,
      created: event.createdAt,
      updated: event.updatedAt
    }));

    // Filter by date range if specified
    let filteredEvents = transformedEvents;
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-12-31');
      
      filteredEvents = transformedEvents.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart >= start && eventStart <= end;
      });
    }

    return NextResponse.json({
      events: filteredEvents,
      total: filteredEvents.length
    });

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch calendar events' 
    }, { status: 500 });
  }
}