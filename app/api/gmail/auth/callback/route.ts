import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GmailSyncService } from '@/lib/evermail/gmail-sync';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization code from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    // Check for errors from Google OAuth
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL('/mail/settings?error=auth_failed', request.url)
      );
    }
    
    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(
        new URL('/mail/settings?error=no_code', request.url)
      );
    }
    
    // Get the authenticated user
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.redirect(
        new URL('/sign-in', request.url)
      );
    }
    
    // Create a deterministic UUID from the orgId
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(orgId).digest('hex');
    const companyId = [
      hash.substring(0, 8),
      hash.substring(8, 12),
      '4' + hash.substring(13, 16),
      ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
      hash.substring(20, 32)
    ].join('-');
    
    // Connect Gmail using the authorization code
    const gmailSync = new GmailSyncService();
    await gmailSync.connectGmail(code, companyId, userId);
    
    // Redirect back to settings with success message
    return NextResponse.redirect(
      new URL('/mail/settings?success=connected', request.url)
    );
  } catch (error) {
    console.error('Gmail OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/mail/settings?error=connection_failed', request.url)
    );
  }
}