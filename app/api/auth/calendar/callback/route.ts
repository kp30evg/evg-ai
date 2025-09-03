import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { entityService } from '@/lib/entities/entity-service';
import { workspaceService } from '@/lib/services/workspace-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/dashboard/calendar/settings?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      console.error('Missing code or state parameter');
      return NextResponse.redirect(
        new URL('/dashboard/calendar/settings?error=missing_parameters', request.url)
      );
    }

    // Parse state to get user info
    let stateData;
    try {
      stateData = JSON.parse(state);
    } catch (err) {
      console.error('Invalid state parameter:', err);
      return NextResponse.redirect(
        new URL('/dashboard/calendar/settings?error=invalid_state', request.url)
      );
    }

    const { userId, orgId } = stateData;
    if (!userId || !orgId) {
      console.error('Missing userId or orgId in state');
      return NextResponse.redirect(
        new URL('/dashboard/calendar/settings?error=invalid_state', request.url)
      );
    }

    // Get or create workspace UUID from Clerk org ID
    const workspaceId = await workspaceService.createWorkspaceIfNotExists(orgId, `Workspace ${orgId}`);
    if (!workspaceId) {
      console.error('Could not create workspace for org:', orgId);
      return NextResponse.redirect(
        new URL('/dashboard/calendar/settings?error=workspace_error', request.url)
      );
    }

    // Check for required environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/auth/calendar/callback`;

    if (!clientId || !clientSecret) {
      console.error('Missing Google OAuth credentials');
      return NextResponse.redirect(
        new URL('/dashboard/calendar/settings?error=oauth_not_configured', request.url)
      );
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      console.error('No access token received');
      return NextResponse.redirect(
        new URL('/dashboard/calendar/settings?error=no_access_token', request.url)
      );
    }

    // Set credentials to get user info
    oauth2Client.setCredentials(tokens);

    // Get user profile info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    if (!userInfo.data.email) {
      console.error('No email in user info');
      return NextResponse.redirect(
        new URL('/dashboard/calendar/settings?error=no_email', request.url)
      );
    }

    // Get calendar list to count calendars
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    let calendarCount = 0;
    
    try {
      const calendarList = await calendar.calendarList.list();
      calendarCount = calendarList.data.items?.length || 0;
    } catch (err) {
      console.warn('Could not get calendar list:', err);
    }

    // Store calendar account in entities table
    const calendarAccountData = {
      email: userInfo.data.email,
      name: userInfo.data.name || userInfo.data.email,
      picture: userInfo.data.picture,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenType: tokens.token_type || 'Bearer',
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scope: tokens.scope,
      calendarCount,
      connected: true,
      lastSync: null
    };

    // Check if account already exists
    const existingAccounts = await entityService.find({
      workspaceId,
      type: 'calendar_account',
      where: { email: userInfo.data.email }
    });

    let accountEntity;
    
    if (existingAccounts.length > 0) {
      // Update existing account
      accountEntity = await entityService.update(
        workspaceId,
        existingAccounts[0].id,
        {
          ...calendarAccountData,
          lastConnected: new Date()
        }
      );
      console.log('Updated existing calendar account:', userInfo.data.email);
    } else {
      // Create new account
      accountEntity = await entityService.create(
        workspaceId,
        'calendar_account',
        {
          ...calendarAccountData,
          createdAt: new Date(),
          lastConnected: new Date()
        },
        {},
        { userId }
      );
      console.log('Created new calendar account:', userInfo.data.email);
    }

    // Trigger initial sync in background
    try {
      await fetch(`${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/calendar/google/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          accountId: accountEntity.id,
          userId,
          orgId
        })
      });
      console.log('Triggered initial calendar sync');
    } catch (syncError) {
      console.warn('Could not trigger initial sync:', syncError);
    }

    // Redirect to calendar settings with success
    return NextResponse.redirect(
      new URL('/dashboard/calendar/settings?success=connected', request.url)
    );

  } catch (error) {
    console.error('Error in calendar OAuth callback:', error);
    return NextResponse.redirect(
      new URL(`/dashboard/calendar/settings?error=${encodeURIComponent('connection_failed')}`, request.url)
    );
  }
}