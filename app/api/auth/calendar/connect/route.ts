import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for required environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/auth/calendar/callback`;

    if (!clientId || !clientSecret) {
      console.error('Missing Google OAuth credentials');
      return NextResponse.json({ 
        error: 'Google OAuth not configured' 
      }, { status: 500 });
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Generate auth URL with calendar scopes
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent', // Force consent to get refresh token
      state: JSON.stringify({
        userId,
        orgId,
        timestamp: Date.now()
      })
    });

    console.log('Generated OAuth URL for calendar connection');
    
    return NextResponse.json({ 
      authUrl,
      redirectUri,
      scopes: SCOPES 
    });

  } catch (error) {
    console.error('Error generating calendar auth URL:', error);
    return NextResponse.json({ 
      error: 'Failed to generate authorization URL' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return OAuth configuration info
    return NextResponse.json({
      scopes: SCOPES,
      redirectUri: `${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/auth/calendar/callback`,
      configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    });

  } catch (error) {
    console.error('Error getting calendar auth config:', error);
    return NextResponse.json({ 
      error: 'Failed to get authorization configuration' 
    }, { status: 500 });
  }
}