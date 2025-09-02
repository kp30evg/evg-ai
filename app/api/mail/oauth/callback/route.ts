import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GmailSyncService } from '@/lib/evermail/gmail-sync';

export async function GET(req: NextRequest) {
  try {
    // Get the auth code from query params
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    // Check for errors from Google
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL('/mail/settings?error=oauth_denied', req.url)
      );
    }
    
    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(
        new URL('/mail/settings?error=no_code', req.url)
      );
    }
    
    // Get the current user
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      console.error('User not authenticated');
      return NextResponse.redirect(
        new URL('/mail/settings?error=not_authenticated', req.url)
      );
    }
    
    // Initialize the Gmail sync service
    const gmailSync = new GmailSyncService();
    
    // Exchange the code for tokens and connect Gmail
    try {
      await gmailSync.connectGmail(code, orgId, userId);
      
      // Redirect to settings with success message
      return NextResponse.redirect(
        new URL('/mail/settings?success=gmail_connected', req.url)
      );
    } catch (error) {
      console.error('Failed to connect Gmail:', error);
      return NextResponse.redirect(
        new URL('/mail/settings?error=connection_failed', req.url)
      );
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/mail/settings?error=unknown', req.url)
    );
  }
}