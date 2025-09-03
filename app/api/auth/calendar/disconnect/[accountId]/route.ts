import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { entityService } from '@/lib/entities/entity-service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const { userId, orgId } = auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId } = params;

    // Get the calendar account
    const account = await entityService.getEntity(accountId, { userId, orgId });
    
    if (!account || account.type !== 'calendar_account') {
      return NextResponse.json({ error: 'Calendar account not found' }, { status: 404 });
    }

    // Mark account as disconnected (keep for data integrity)
    await entityService.updateEntity(
      accountId,
      {
        ...account.data,
        connected: false,
        accessToken: null,
        refreshToken: null,
        disconnectedAt: new Date()
      },
      { userId, orgId }
    );

    // Optionally, you could also mark all related calendar events as archived
    const relatedEvents = await entityService.searchEntities(
      orgId,
      'calendar_event',
      { accountId }
    );

    for (const event of relatedEvents) {
      await entityService.updateEntity(
        event.id,
        {
          ...event.data,
          archived: true,
          archivedAt: new Date()
        },
        { userId, orgId }
      );
    }

    console.log(`Disconnected calendar account ${accountId} and archived ${relatedEvents.length} events`);

    return NextResponse.json({ 
      success: true, 
      message: 'Calendar account disconnected successfully',
      eventsArchived: relatedEvents.length
    });

  } catch (error) {
    console.error('Error disconnecting calendar account:', error);
    return NextResponse.json({ 
      error: 'Failed to disconnect calendar account' 
    }, { status: 500 });
  }
}