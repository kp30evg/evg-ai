/**
 * OAuth Connection Check Service
 * Verifies if users have connected their Google accounts
 */

import { db } from '@/lib/db';
import { entities, users } from '@/lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';

export interface OAuthStatus {
  hasGmailConnection: boolean;
  hasCalendarConnection: boolean;
  gmailEmail?: string;
  calendarEmail?: string;
  lastSyncedAt?: Date;
}

/**
 * Check if a user has connected their OAuth accounts
 */
export async function checkOAuthConnections(
  workspaceId: string,
  clerkUserId: string
): Promise<OAuthStatus> {
  try {
    // Get database user
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (!dbUser) {
      return {
        hasGmailConnection: false,
        hasCalendarConnection: false
      };
    }

    // Check for Gmail connection
    const gmailAccounts = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspaceId),
          eq(entities.userId, dbUser.id),
          eq(entities.type, 'email_account')
        )
      )
      .limit(1);

    const gmailAccount = gmailAccounts[0];
    
    // Since Gmail OAuth includes calendar scopes, check if Gmail account has calendar permissions
    const hasCalendarScopes = gmailAccount?.metadata?.scopes?.some((scope: string) => 
      scope.includes('calendar')
    ) || false;

    return {
      hasGmailConnection: !!gmailAccount && gmailAccount.data?.isActive,
      // Calendar is connected if Gmail account exists with calendar scopes
      hasCalendarConnection: !!gmailAccount && gmailAccount.data?.isActive && hasCalendarScopes,
      gmailEmail: gmailAccount?.data?.email,
      calendarEmail: gmailAccount?.data?.email,  // Same email for both since using same OAuth
      lastSyncedAt: gmailAccount?.data?.lastSyncAt ? new Date(gmailAccount.data.lastSyncAt) : undefined
    };
  } catch (error) {
    console.error('Error checking OAuth connections:', error);
    return {
      hasGmailConnection: false,
      hasCalendarConnection: false
    };
  }
}

/**
 * Get Gmail OAuth URL for connection
 */
export function getGmailOAuthUrl(returnPath?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const connectUrl = `${baseUrl}/api/auth/gmail/connect`;
  
  if (returnPath) {
    return `${connectUrl}?return=${encodeURIComponent(returnPath)}`;
  }
  
  return connectUrl;
}

/**
 * Get Google Calendar OAuth URL for connection
 */
export function getCalendarOAuthUrl(returnPath?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const connectUrl = `${baseUrl}/api/auth/calendar/connect`;
  
  if (returnPath) {
    return `${connectUrl}?return=${encodeURIComponent(returnPath)}`;
  }
  
  return connectUrl;
}