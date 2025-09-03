import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db } from '@/lib/db';
import { entities } from '@/lib/db/schema/unified';
import { eq, and, sql } from 'drizzle-orm';
import * as evercore from '@/lib/modules-simple/evercore';

const oauth2Client = new OAuth2Client(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export class GmailSyncService {
  private gmail: any;

  // Helper to create a deterministic UUID from any string ID
  private stringToUuid(str: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(str).digest('hex');
    return [
      hash.substring(0, 8),
      hash.substring(8, 12),
      '4' + hash.substring(13, 16),
      ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
      hash.substring(20, 32)
    ].join('-');
  }

  async connectGmail(authCode: string, workspaceId: string, userId: string) {
    try {
      // Exchange auth code for tokens
      const { tokens } = await oauth2Client.getToken(authCode);
      oauth2Client.setCredentials(tokens);
      
      // Get user's email address
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });
      
      const userUuid = this.stringToUuid(userId);
      
      // Check if email account already exists for this user
      const existing = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.workspaceId, workspaceId),
            eq(entities.type, 'email_account'),
            sql`metadata->>'createdBy' = ${userUuid}`
          )
        )
        .limit(1);
      
      const accountData = {
        email: profile.data.emailAddress,
        messagesTotal: profile.data.messagesTotal,
        threadsTotal: profile.data.threadsTotal,
        historyId: profile.data.historyId,
        tokens: Buffer.from(JSON.stringify(tokens)).toString('base64'), // Simple encryption
        isActive: true,
        lastSyncAt: null
      };
      
      if (existing.length > 0) {
        // Update existing email account
        await db
          .update(entities)
          .set({
            data: accountData,
            updatedAt: new Date()
          })
          .where(eq(entities.id, existing[0].id));
      } else {
        // Create new email account entity
        await db.insert(entities).values({
          workspaceId,
          type: 'email_account',
          data: accountData,
          metadata: {
            provider: 'gmail',
            createdBy: userUuid
          }
        });
      }
      
      return {
        success: true,
        email: profile.data.emailAddress,
        messagesTotal: profile.data.messagesTotal
      };
    } catch (error) {
      console.error('Gmail connection error:', error);
      throw new Error('Failed to connect Gmail account');
    }
  }

  async performInitialSync(workspaceId: string, userId: string) {
    try {
      // Get the email account entity
      const userUuid = this.stringToUuid(userId);
      const account = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.workspaceId, workspaceId),
            eq(entities.type, 'email_account'),
            sql`metadata->>'createdBy' = ${userUuid}`
          )
        )
        .limit(1);
        
      if (!account.length) {
        throw new Error('No Gmail account found for this user');
      }
      
      // Restore tokens
      const tokens = JSON.parse(
        Buffer.from(account[0].data.tokens as string, 'base64').toString()
      );
      oauth2Client.setCredentials(tokens);
      this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      // Fetch recent messages
      let totalSynced = 0;
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: 50, // Start with 50 most recent
        q: 'is:inbox OR is:sent' // Focus on inbox and sent
      });
      
      if (response.data.messages) {
        // Process each message
        for (const msg of response.data.messages) {
          await this.syncMessage(msg.id, workspaceId, userId);
          totalSynced++;
        }
      }
      
      // Update last sync time
      await db
        .update(entities)
        .set({
          data: {
            ...account[0].data,
            lastSyncAt: new Date().toISOString()
          },
          updatedAt: new Date()
        })
        .where(eq(entities.id, account[0].id));
      
      return { success: true, totalSynced };
    } catch (error) {
      console.error('Initial sync error:', error);
      throw error;
    }
  }

  async syncMessage(messageId: string, workspaceId: string, userId: string) {
    try {
      if (!this.gmail) {
        throw new Error('Gmail client not initialized');
      }
      
      // Fetch the full message
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId
      });
      
      const message = response.data;
      
      // Parse message headers
      const headers = message.payload?.headers || [];
      const getHeader = (name: string) => 
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
      
      // Extract email content
      let body = '';
      let snippet = message.snippet || '';
      
      // Extract body from parts (simplified)
      if (message.payload?.body?.data) {
        body = Buffer.from(message.payload.body.data, 'base64').toString();
      } else if (message.payload?.parts) {
        const textPart = message.payload.parts.find((p: any) => p.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString();
        }
      }
      
      // Create a deterministic ID for this email
      const emailId = this.stringToUuid(`gmail-${messageId}`);
      
      // Check if email already exists
      const existing = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.id, emailId),
            eq(entities.workspaceId, workspaceId)
          )
        )
        .limit(1);
      
      const emailData = {
        messageId: messageId,
        threadId: message.threadId,
        subject: getHeader('subject'),
        from: {
          email: getHeader('from').match(/<(.+)>/)?.[1] || getHeader('from'),
          name: getHeader('from').match(/^(.+) </)?.[1] || getHeader('from')
        },
        to: getHeader('to').split(',').map((t: string) => t.trim()),
        date: getHeader('date'),
        timestamp: new Date(parseInt(message.internalDate || '0')),
        body: {
          text: body.substring(0, 10000), // Limit body size
          snippet: snippet
        },
        labels: message.labelIds || [],
        isRead: !message.labelIds?.includes('UNREAD'),
        isImportant: message.labelIds?.includes('IMPORTANT'),
        isStarred: message.labelIds?.includes('STARRED'),
        isDraft: message.labelIds?.includes('DRAFT'),
        attachments: message.payload?.parts?.filter((p: any) => p.filename).map((p: any) => ({
          filename: p.filename,
          mimeType: p.mimeType,
          size: parseInt(p.body?.size || '0')
        })) || []
      };
      
      let emailEntity;
      if (existing.length === 0) {
        // Create new email entity
        const [newEmail] = await db.insert(entities).values({
          id: emailId,
          workspaceId,
          type: 'email',
          data: emailData,
          metadata: {
            source: 'gmail',
            syncedAt: new Date().toISOString(),
            createdBy: this.stringToUuid(userId)
          }
        }).returning();
        emailEntity = newEmail;
        
        // Auto-create contacts from this email
        try {
          await evercore.autoCreateFromEmail(workspaceId, emailEntity);
        } catch (error) {
          console.error('Failed to auto-create contact from email:', error);
          // Continue even if auto-creation fails
        }
      } else {
        // Update existing email
        await db
          .update(entities)
          .set({
            data: emailData,
            updatedAt: new Date()
          })
          .where(eq(entities.id, emailId));
        emailEntity = existing[0];
      }
      
      return { success: true, emailId };
    } catch (error) {
      console.error('Message sync error:', error);
      throw error;
    }
  }
}