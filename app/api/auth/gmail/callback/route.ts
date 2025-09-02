import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { google } from 'googleapis';
import { db } from '@/lib/db';
import { entities } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

// Helper function to convert string to UUID
function stringToUuid(str: string): string {
  const hash = crypto.createHash('sha256').update(str).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32)
  ].join('-');
}

// Simple encryption/decryption (in production, use proper encryption)
function encryptTokens(tokens: any): string {
  return Buffer.from(JSON.stringify(tokens)).toString('base64');
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Handle Google OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/mail/settings?error=${error}`, req.url)
      );
    }
    
    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(
        new URL('/mail/settings?error=no_code', req.url)
      );
    }
    
    // Decode and verify state
    let stateData: any = {};
    if (state) {
      try {
        stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      } catch (e) {
        console.error('Invalid state parameter');
      }
    }
    
    // Get current user from Clerk (fallback if state doesn't have it)
    const { userId, orgId } = await auth();
    const finalUserId = stateData.userId || userId;
    const finalOrgId = stateData.orgId || orgId;
    
    if (!finalUserId || !finalOrgId) {
      console.error('User not authenticated');
      return NextResponse.redirect(
        new URL('/mail/settings?error=not_authenticated', req.url)
      );
    }
    
    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/gmail/callback'
    );
    
    try {
      console.log('Attempting token exchange with:', {
        code: code?.substring(0, 20) + '...',
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/gmail/callback'
      });

      // Exchange authorization code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      console.log('Token exchange successful, tokens received:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        scope: tokens.scope
      });
      
      oauth2Client.setCredentials(tokens);
      
      // Get user info for email address (doesn't require Gmail API)
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      console.log('User info retrieved:', {
        email: userInfo.data.email,
        name: userInfo.data.name
      });
      
      // Skip Gmail profile for now if Gmail API is not enabled
      let profileData = {
        messagesTotal: 0,
        threadsTotal: 0,
        historyId: null
      };
      
      try {
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const profile = await gmail.users.getProfile({ userId: 'me' });
        profileData = {
          messagesTotal: profile.data.messagesTotal || 0,
          threadsTotal: profile.data.threadsTotal || 0,
          historyId: profile.data.historyId || null
        };
        console.log('Gmail profile retrieved successfully');
      } catch (gmailError: any) {
        console.warn('Gmail API not available yet, skipping profile:', gmailError.message);
        // Continue without Gmail profile data
      }
      
      const companyId = stringToUuid(finalOrgId);
      const userId = stringToUuid(finalUserId);
      
      // Check if email account already exists
      const existingAccount = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.companyId, companyId),
            eq(entities.type, 'email_account')
            // Note: Can't directly query JSONB field in where clause with Drizzle
            // Will check email match after fetching
          )
        )
        .limit(10); // Get recent email accounts and filter in JS
      
      // Filter for matching email
      const matchingAccount = existingAccount.find(
        (acc: any) => acc.data?.email === userInfo.data.email
      );
      
      const accountData = {
        companyId,
        type: 'email_account' as const,
        data: {
          provider: 'gmail',
          email: userInfo.data.email,
          name: userInfo.data.name,
          picture: userInfo.data.picture,
          tokens: encryptTokens(tokens),
          messagesTotal: profileData.messagesTotal,
          threadsTotal: profileData.threadsTotal,
          historyId: profileData.historyId,
          connectedAt: new Date().toISOString(),
          lastSyncAt: null,
          isActive: true
        },
        createdBy: userId,
        metadata: {
          source: 'oauth',
          scopes: tokens.scope?.split(' ') || []
        }
      };
      
      if (matchingAccount) {
        // Update existing account
        await db
          .update(entities)
          .set({
            data: accountData.data,
            metadata: accountData.metadata,
            updatedAt: new Date()
          })
          .where(eq(entities.id, matchingAccount.id));
        
        console.log('Updated existing Gmail account:', userInfo.data.email);
      } else {
        // Create new account
        await db.insert(entities).values(accountData);
        console.log('Connected new Gmail account:', userInfo.data.email);
      }
      
      // Trigger initial sync in the background (optional)
      // You can implement a queue system or background job here
      
      // Redirect back to settings with success message
      return NextResponse.redirect(
        new URL('/mail/settings?success=gmail_connected', req.url)
      );
      
    } catch (tokenError: any) {
      console.error('Token exchange error details:', {
        message: tokenError.message,
        code: tokenError.code,
        status: tokenError.status,
        response: tokenError.response?.data,
        config: {
          url: tokenError.config?.url,
          data: tokenError.config?.data
        }
      });
      
      // Check for specific error types
      if (tokenError.message?.includes('Gmail API has not been used')) {
        return NextResponse.redirect(
          new URL('/mail/settings?error=gmail_api_disabled', req.url)
        );
      }
      
      return NextResponse.redirect(
        new URL('/mail/settings?error=token_exchange_failed', req.url)
      );
    }
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/mail/settings?error=callback_failed', req.url)
    );
  }
}