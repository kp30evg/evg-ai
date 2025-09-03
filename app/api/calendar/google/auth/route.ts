/**
 * Google Calendar OAuth integration endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAuthUrl, exchangeCodeForTokens } from '@/lib/integrations/google-calendar';
import { entityService } from '@/lib/entities/entity-service';

/**
 * GET /api/calendar/google/auth - Get Google OAuth URL
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUrl = getAuthUrl();
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error getting Google auth URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/calendar/google/auth - Exchange code for tokens
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Authorization code required' }, { status: 400 });
    }

    // Exchange code for tokens
    const credentials = await exchangeCodeForTokens(code);

    // Store credentials in the entities table as a user integration
    await entityService.create(
      orgId,
      'integration',
      {
        provider: 'google_calendar',
        credentials: credentials,
        userId: userId,
        isActive: true,
        connectedAt: new Date()
      },
      { user: userId },
      { userId }
    );

    return NextResponse.json({ 
      success: true,
      message: 'Google Calendar connected successfully'
    });
  } catch (error) {
    console.error('Error exchanging Google auth code:', error);
    return NextResponse.json({ error: 'Failed to connect Google Calendar' }, { status: 500 });
  }
}