import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  console.log('Gmail connect route called');
  console.log('Request URL:', req.url);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  try {
    // Verify user is authenticated
    const { userId, orgId } = await auth();
    console.log('Auth result:', { userId, orgId });
    
    if (!userId || !orgId) {
      return NextResponse.redirect(
        new URL('/sign-in', req.url)
      );
    }
    
    // Get OAuth configuration from environment variables
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_GMAIL_REDIRECT_URI || 'http://localhost:3000/api/auth/gmail/callback';
    
    if (!clientId) {
      console.error('Google Client ID not configured');
      return NextResponse.redirect(
        new URL('/mail/settings?error=config_error', req.url)
      );
    }
    
    // Get return URL from query params
    const searchParams = req.nextUrl.searchParams;
    const returnUrl = searchParams.get('return') || '/mail';
    
    // Gmail and Calendar scopes for full functionality
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ].join(' ');
    
    // Create state parameter to prevent CSRF attacks and store return URL
    const state = Buffer.from(JSON.stringify({
      userId,
      orgId,
      timestamp: Date.now(),
      returnUrl
    })).toString('base64');
    
    // Build Google OAuth URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline', // Request refresh token
      prompt: 'consent', // Force consent screen to get refresh token
      state: state
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    
    console.log('Redirecting to Google OAuth:', authUrl);
    
    // Redirect to Google OAuth consent screen
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('OAuth initiation error:', error);
    return NextResponse.redirect(
      new URL('/mail/settings?error=oauth_init_failed', req.url)
    );
  }
}