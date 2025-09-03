import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { entityService } from '@/lib/entities/entity-service';
import { workspaceService } from '@/lib/services/workspace-service';

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      // For development/testing, provide helpful debug info
      return NextResponse.json({ 
        error: 'No active user session',
        debug: {
          userId: userId || 'missing',
          orgId: orgId || 'missing',
          message: 'Please sign in to access calendar accounts'
        },
        accounts: [] // Return empty array for graceful degradation
      }, { status: 401 });
    }

    // Get workspace UUID from Clerk org ID
    const workspaceId = await workspaceService.getWorkspaceIdFromClerkOrg(orgId);
    if (!workspaceId) {
      return NextResponse.json({ 
        error: 'Workspace not found',
        accounts: []
      }, { status: 404 });
    }

    // Get all calendar accounts for the organization
    const accounts = await entityService.find({
      workspaceId,
      type: 'calendar_account'
    });

    // Transform accounts for response
    const accountData = accounts.map(account => ({
      id: account.id,
      email: account.data.email,
      name: account.data.name,
      connected: account.data.connected,
      lastSync: account.data.lastSync,
      calendarCount: account.data.calendarCount || 0,
      lastSyncCount: account.data.lastSyncCount || 0
    }));

    return NextResponse.json({ 
      accounts: accountData,
      total: accountData.length
    });

  } catch (error) {
    console.error('Error fetching calendar accounts:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch calendar accounts' 
    }, { status: 500 });
  }
}