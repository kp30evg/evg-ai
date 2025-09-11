import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '@/lib/db';
import { entities, users, workspaces } from '@/lib/db/schema/unified';
import { eq, and, desc, or, sql, inArray } from 'drizzle-orm';
import { GmailSyncService } from '@/lib/evermail/gmail-sync-with-isolation';
import { processCommand } from '@/lib/modules-simple/command-processor';
import { GmailClient } from '@/lib/evermail/gmail-client';
import { autoLabelService, type EmailData } from '@/lib/evermail/services/auto-label-service';
import { AUTO_LABELS } from '@/lib/evermail/constants/labels';

// Helper to get workspace ID from Clerk org ID
async function getWorkspaceId(clerkOrgId: string): Promise<string | null> {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.clerkOrgId, clerkOrgId))
    .limit(1);
  
  return workspace?.id || null;
}

// Helper to create a deterministic UUID from any string ID (kept for backward compat)
function stringToUuid(str: string): string {
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

// Email schemas
const sendEmailSchema = z.object({
  to: z.array(z.string()),  // Remove email validation to allow more flexible formats
  cc: z.array(z.string()).optional(),
  bcc: z.array(z.string()).optional(),
  subject: z.string(),
  body: z.string(),
  replyTo: z.string().optional(),
  isDraft: z.boolean().optional()
});

const searchEmailsSchema = z.object({
  query: z.string().optional(),
  folder: z.enum(['inbox', 'sent', 'drafts', 'trash', 'spam', 'starred', 'all']).optional(),
  isRead: z.boolean().optional(),
  isStarred: z.boolean().optional(),
  hasAttachments: z.boolean().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  limit: z.number().default(50),
  cursor: z.string().optional()
});

export const evermailRouter = router({
  // Get Gmail connection status
  getGmailStatus: protectedProcedure.query(async ({ ctx }) => {
    const { orgId, userId } = ctx;
    
    // Get the ACTUAL workspace ID from database, not generated
    const workspaceId = await getWorkspaceId(orgId);
    
    if (!workspaceId) {
      return {
        connected: false,
        lastSyncAt: null,
        emailCount: 0
      };
    }
    
    // Get database user first
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);
    
    if (!dbUser) {
      return {
        connected: false,
        lastSyncAt: null,
        emailCount: 0
      };
    }

    // Check for email_account entity FOR THIS USER ONLY using userId field
    const emailAccount = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspaceId),
          eq(entities.type, 'email_account'),
          eq(entities.userId, dbUser.id) // Use the actual userId field
        )
      )
      .limit(1);

    // If no email account found, return disconnected status
    if (!emailAccount || emailAccount.length === 0) {
      return {
        connected: false,
        lastSyncAt: null,
        emailCount: 0
      };
    }

    // Use email_account entity data
    const accountData = emailAccount[0].data as any;

    // Get email count FOR THIS USER
    const emailCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspaceId),
          eq(entities.userId, dbUser.id), // Count only this user's emails
          eq(entities.type, 'email')
        )
      );

    return {
      connected: accountData.isActive !== false,
      email: accountData.email,
      lastSyncAt: accountData.lastSyncAt || emailAccount[0].updatedAt,
      emailCount: emailCount[0]?.count || 0,
      messagesTotal: accountData.messagesTotal,
      syncError: accountData.syncError
    };
  }),

  // Connect Gmail account
  connectGmail: protectedProcedure
    .input(z.object({
      authCode: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = ctx;
      const workspaceId = stringToUuid(orgId);
      
      const syncService = new GmailSyncService();
      const result = await syncService.connectGmail(input.authCode, workspaceId, userId);
      
      // Start initial sync in background
      syncService.performInitialSync(workspaceId).catch(console.error);
      
      return result;
    }),

  // Disconnect Gmail
  disconnectGmail: protectedProcedure.mutation(async ({ ctx }) => {
    const { orgId, userId } = ctx;
    const workspaceId = stringToUuid(orgId);
    const userUuid = stringToUuid(userId);

    // Find and deactivate email account for this user
    const emailAccount = await db
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

    if (emailAccount && emailAccount.length > 0) {
      const accountData = emailAccount[0].data as any;
      await db
        .update(entities)
        .set({ 
          data: {
            ...accountData,
            isActive: false,
            tokens: null
          },
          updatedAt: new Date()
        })
        .where(eq(entities.id, emailAccount[0].id));
    }

    return { success: true };
  }),

  // Trigger manual sync
  syncEmails: protectedProcedure.mutation(async ({ ctx }) => {
    const { orgId, userId } = ctx;
    
    // Get the actual workspace from database (not stringToUuid)
    const { workspaces } = await import('@/lib/db/schema/unified');
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.clerkOrgId, orgId))
      .limit(1);
    
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    
    const workspaceId = workspace.id;
    
    // Get the actual user from database
    const { users } = await import('@/lib/db/schema/unified');
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);
    
    if (!dbUser) {
      throw new Error('User not found');
    }
    
    try {
      // Get email account with tokens FOR THIS USER ONLY
      const emailAccount = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.workspaceId, workspaceId),
            eq(entities.type, 'email_account'),
            eq(entities.userId, dbUser.id) // Use actual user ID
          )
        )
        .limit(1);

      if (!emailAccount || emailAccount.length === 0) {
        throw new Error('Gmail account not connected');
      }

      const accountData = emailAccount[0].data as any;
      
      if (!accountData.tokens) {
        throw new Error('Gmail tokens not found. Please reconnect your Gmail account.');
      }
      
      // Decrypt tokens (simple base64 decode for now)
      const tokens = JSON.parse(Buffer.from(accountData.tokens, 'base64').toString());
      
      // Use the proper sync service with user isolation
      const { GmailSyncService } = await import('@/lib/evermail/gmail-sync-with-isolation');
      
      const syncService = new GmailSyncService({
        workspaceId: workspaceId,
        userId: dbUser.id, // Use actual database user ID
        tokens: tokens,
        userEmail: accountData.email || accountData.userEmail
      });
      
      // Run the sync with proper user isolation
      const result = await syncService.syncEmails();
      
      return { 
        success: result.success, 
        synced: result.totalSynced, 
        redirectTo: '/mail/inbox' 
      };
    } catch (error: any) {
      console.error('Sync error:', error);
      throw new Error(`Sync failed: ${error.message}`);
    }
  }),

  // Get emails (inbox, sent, drafts, etc.)
  getEmails: protectedProcedure
    .input(searchEmailsSchema)
    .query(async ({ ctx, input }) => {
      const { orgId, userId } = ctx;
      
      // Get the actual workspace from database
      const { workspaces, users } = await import('@/lib/db/schema/unified');
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.clerkOrgId, orgId))
        .limit(1);
      
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      const workspaceId = workspace.id;
      
      // Get the actual user from database
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);
      
      if (!dbUser) {
        throw new Error('User not found');
      }
      
      // CRITICAL: Use secure query wrapper that ALWAYS enforces isolation
      const { createEmailQuery } = await import('@/lib/db/secure-query');
      const secureQuery = createEmailQuery(workspaceId, dbUser.id);

      // Build additional conditions for folder/filter
      const additionalConditions = [];

      // Apply folder filter
      if (input.folder && input.folder !== 'all') {
        if (input.folder === 'inbox') {
          additionalConditions.push(
            sql`(data->>'isDraft')::boolean IS NOT TRUE AND 
                (data->>'isTrash')::boolean IS NOT TRUE AND
                (data->>'isSpam')::boolean IS NOT TRUE AND
                NOT ((data->'labels')::jsonb ? 'SENT') AND
                (data->'from'->>'email' IS NULL OR data->'from'->>'email' != ${dbUser.email})`
          );
        } else if (input.folder === 'sent') {
          additionalConditions.push(
            sql`(data->'labels')::jsonb ? 'SENT' OR 
                (data->'from'->>'email') = ${dbUser.email}`
          );
        } else if (input.folder === 'drafts') {
          additionalConditions.push(sql`(data->>'isDraft')::boolean = true`);
        } else if (input.folder === 'trash') {
          additionalConditions.push(sql`(data->>'isTrash')::boolean = true`);
        } else if (input.folder === 'spam') {
          additionalConditions.push(sql`(data->>'isSpam')::boolean = true`);
        } else if (input.folder === 'starred') {
          additionalConditions.push(sql`(data->>'isStarred')::boolean = true`);
        }
      }

      // Apply other filters
      if (input.isRead !== undefined) {
        additionalConditions.push(sql`(data->>'isRead')::boolean = ${input.isRead}`);
      }
      if (input.isStarred !== undefined) {
        additionalConditions.push(sql`(data->>'isStarred')::boolean = ${input.isStarred}`);
      }
      if (input.hasAttachments) {
        additionalConditions.push(sql`jsonb_array_length(data->'attachments') > 0`);
      }
      if (input.from) {
        additionalConditions.push(sql`data->'from'->>'email' ILIKE ${`%${input.from}%`}`);
      }
      if (input.query) {
        additionalConditions.push(
          sql`(data->>'subject' ILIKE ${`%${input.query}%`} OR 
               data->'body'->>'text' ILIKE ${`%${input.query}%`})`
        );
      }
      
      // Use secure query with additional conditions
      let query = secureQuery.where(...additionalConditions);

      const emails = await query
        .orderBy(desc(entities.createdAt))
        .limit(input.limit);

      // Use secure query's filter to ensure safety (double-check)
      const safeEmails = secureQuery.filterResults(emails);
      
      if (safeEmails.length !== emails.length) {
        console.error('❌❌❌ CRITICAL: Security filter removed', emails.length - safeEmails.length, 'emails');
        // This should never happen with secure query, but if it does, we're protected
      }

      return safeEmails;
    }),

  // Get single email
  getEmail: protectedProcedure
    .input(z.object({
      emailId: z.string().uuid()
    }))
    .query(async ({ ctx, input }) => {
      const { orgId } = ctx;
      const workspaceId = stringToUuid(orgId);

      const email = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.id, input.emailId),
            eq(entities.workspaceId, workspaceId),
            eq(entities.type, 'email')
          )
        )
        .limit(1);

      if (!email || email.length === 0) {
        throw new Error('Email not found');
      }

      // Mark as read
      if (!(email[0].data as any).isRead) {
        await db
          .update(entities)
          .set({
            data: {
              ...email[0].data,
              isRead: true
            },
            updatedAt: new Date()
          })
          .where(eq(entities.id, input.emailId));
      }

      return email[0];
    }),

  // Get email thread
  getThread: protectedProcedure
    .input(z.object({
      threadId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const { orgId } = ctx;
      const workspaceId = stringToUuid(orgId);

      const emails = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.workspaceId, workspaceId),
            eq(entities.type, 'email'),
            sql`data->>'threadId' = ${input.threadId}`
          )
        )
        .orderBy(entities.createdAt);

      return emails;
    }),

  // Send email
  sendEmail: protectedProcedure
    .input(sendEmailSchema)
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = ctx;
      
      // Get the ACTUAL workspace ID from database, not generated
      const workspaceId = await getWorkspaceId(orgId);
      
      if (!workspaceId) {
        throw new Error('Workspace not found');
      }

      console.log('SendEmail Debug:', {
        clerkUserId: userId,
        orgId,
        workspaceId
      });

      try {
        // Get database user first
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.clerkUserId, userId))
          .limit(1);
        
        console.log('Database user lookup:', {
          found: !!dbUser,
          dbUserId: dbUser?.id,
          email: dbUser?.email
        });
        
        if (!dbUser) {
          throw new Error('User not found. Please ensure your account is properly set up.');
        }

        // Get email account with OAuth tokens FOR THIS USER ONLY
        const emailAccount = await db
          .select()
          .from(entities)
          .where(
            and(
              eq(entities.workspaceId, workspaceId),
              eq(entities.type, 'email_account'),
              eq(entities.userId, dbUser.id) // CRITICAL: User-specific - use database user ID
            )
          )
          .limit(1);

        console.log('Email account lookup:', {
          found: emailAccount.length > 0,
          accountId: emailAccount[0]?.id,
          hasTokens: !!(emailAccount[0]?.data as any)?.tokens
        });

        if (!emailAccount || emailAccount.length === 0) {
          // Debug: Check what accounts exist
          const allAccounts = await db
            .select({
              id: entities.id,
              userId: entities.userId,
              workspaceId: entities.workspaceId
            })
            .from(entities)
            .where(eq(entities.type, 'email_account'));
          
          console.log('Debug - All email accounts:', allAccounts);
          console.log('Debug - Looking for userId:', dbUser.id);
          console.log('Debug - Looking for workspaceId:', workspaceId);
          
          throw new Error('Gmail not connected. Please connect your Gmail account in settings.');
        }

        const accountData = emailAccount[0].data as any;
        
        // Decrypt tokens (simple base64 decode for now)
        const tokens = JSON.parse(Buffer.from(accountData.tokens, 'base64').toString());
        
        // Initialize Gmail client
        const { google } = require('googleapis');
        const oauth2Client = new google.auth.OAuth2(
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/gmail/callback'
        );
        oauth2Client.setCredentials(tokens);
        
        // Set up token refresh handler
        oauth2Client.on('tokens', async (newTokens: any) => {
          console.log('Refreshing Gmail tokens...');
          const updatedTokens = { ...tokens, ...newTokens };
          
          // Update stored tokens in database
          await db
            .update(entities)
            .set({
              data: {
                ...accountData,
                tokens: Buffer.from(JSON.stringify(updatedTokens)).toString('base64')
              },
              updatedAt: new Date()
            })
            .where(eq(entities.id, emailAccount[0].id));
        });
        
        // Try to refresh the token if it's expired
        try {
          const { credentials } = await oauth2Client.refreshAccessToken();
          oauth2Client.setCredentials(credentials);
          
          // Update stored tokens
          await db
            .update(entities)
            .set({
              data: {
                ...accountData,
                tokens: Buffer.from(JSON.stringify(credentials)).toString('base64')
              },
              updatedAt: new Date()
            })
            .where(eq(entities.id, emailAccount[0].id));
        } catch (refreshError) {
          console.log('Token refresh attempted, continuing with existing tokens');
        }
        
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        
        // Create email message in RFC 2822 format
        const messageParts = [
          `From: ${accountData.email}`,
          `To: ${input.to.join(', ')}`,
          input.cc?.length ? `Cc: ${input.cc.join(', ')}` : '',
          input.bcc?.length ? `Bcc: ${input.bcc.join(', ')}` : '',
          `Subject: ${input.subject}`,
          'Content-Type: text/html; charset=utf-8',
          '',
          input.body
        ].filter(Boolean).join('\r\n');
        
        const encodedMessage = Buffer.from(messageParts)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        // Send email via Gmail API
        let sentMessage;
        try {
          sentMessage = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
              raw: encodedMessage
            }
          });
        } catch (sendError: any) {
          console.error('Gmail API send error:', sendError);
          
          // Check if it's an authentication error
          if (sendError.message?.includes('invalid_grant') || 
              sendError.code === 401 || 
              sendError.message?.includes('Token has been expired')) {
            throw new Error('Your Gmail session has expired. Please reconnect your Gmail account in Mail Settings.');
          }
          
          // Other errors
          throw new Error(`Failed to send email: ${sendError.message || 'Unknown error'}`);
        }

        // Store in our database
        const [email] = await db.insert(entities).values({
          workspaceId,
          userId: dbUser.id, // Store with user ID for proper isolation
          type: 'email',
          data: {
            messageId: sentMessage.data.id,
            threadId: sentMessage.data.threadId,
            subject: input.subject,
            from: {
              email: accountData.email,
              name: accountData.name || ctx.user?.firstName + ' ' + ctx.user?.lastName
            },
            to: input.to.map(email => ({ email })),
            cc: input.cc?.map(email => ({ email })),
            bcc: input.bcc?.map(email => ({ email })),
            body: {
              text: input.body,
              html: input.body
            },
            isDraft: false,
            isRead: true,
            sentAt: new Date(),
            labels: ['SENT']
          },
          metadata: {
            source: 'evermail',
            createdBy: dbUser.id
          }
        }).returning();

        return email;
      } catch (error: any) {
        console.error('Send email error:', error);
        throw new Error(error.message || 'Failed to send email');
      }
    }),

  // Save draft
  saveDraft: protectedProcedure
    .input(sendEmailSchema)
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = ctx;
      const workspaceId = stringToUuid(orgId);
      const userUuid = stringToUuid(userId);

      const [draft] = await db.insert(entities).values({
        workspaceId,
        type: 'email',
        data: {
          subject: input.subject,
          from: {
            email: ctx.user?.emailAddresses?.[0]?.emailAddress,
            name: `${ctx.user?.firstName} ${ctx.user?.lastName}`
          },
          to: input.to.map(email => ({ email })),
          cc: input.cc?.map(email => ({ email })),
          body: {
            text: input.body,
            html: input.body
          },
          isDraft: true,
          isRead: true,
          createdAt: new Date()
        },
        metadata: {
          createdBy: userUuid
        }
      }).returning();

      return draft;
    }),

  // Process natural language command
  processCommand: protectedProcedure
    .input(z.object({
      command: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = ctx;
      const workspaceId = stringToUuid(orgId);
      
      const result = await processCommand(workspaceId, input.command, userId);
      
      return result;
    }),

  // Mark emails as read/unread
  markAsRead: protectedProcedure
    .input(z.object({
      emailIds: z.array(z.string().uuid()),
      isRead: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId } = ctx;
      const workspaceId = stringToUuid(orgId);

      for (const emailId of input.emailIds) {
        const [email] = await db
          .select()
          .from(entities)
          .where(eq(entities.id, emailId))
          .limit(1);

        if (email) {
          await db
            .update(entities)
            .set({
              data: {
                ...email.data,
                isRead: input.isRead
              },
              updatedAt: new Date()
            })
            .where(eq(entities.id, emailId));
        }
      }

      return { success: true };
    }),

  // Star/unstar emails
  toggleStar: protectedProcedure
    .input(z.object({
      emailId: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = ctx;
      
      // Get the actual workspace from database
      const workspaceId = await getWorkspaceId(orgId);
      if (!workspaceId) {
        throw new Error('Workspace not found');
      }
      
      // Get database user
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);
      
      if (!dbUser) {
        throw new Error('User not found');
      }

      const [email] = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.id, input.emailId),
            eq(entities.workspaceId, workspaceId),
            eq(entities.userId, dbUser.id) // Ensure user owns this email
          )
        )
        .limit(1);

      if (!email) {
        throw new Error('Email not found');
      }

      const data = email.data as any;
      await db
        .update(entities)
        .set({
          data: {
            ...data,
            isStarred: !data.isStarred
          },
          updatedAt: new Date()
        })
        .where(eq(entities.id, input.emailId));

      return { success: true, isStarred: !data.isStarred };
    }),

  // Archive email
  archiveEmail: protectedProcedure
    .input(z.object({
      emailId: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId } = ctx;
      const workspaceId = stringToUuid(orgId);

      const [email] = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.id, input.emailId),
            eq(entities.workspaceId, workspaceId)
          )
        )
        .limit(1);

      if (!email) {
        throw new Error('Email not found');
      }

      await db
        .update(entities)
        .set({
          data: {
            ...email.data,
            labels: ['ARCHIVED']
          },
          updatedAt: new Date()
        })
        .where(eq(entities.id, input.emailId));

      return { success: true };
    }),

  // Delete email (move to trash)
  deleteEmail: protectedProcedure
    .input(z.object({
      emailId: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = ctx;
      
      // Get the actual workspace from database
      const workspaceId = await getWorkspaceId(orgId);
      if (!workspaceId) {
        throw new Error('Workspace not found');
      }
      
      // Get database user
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);
      
      if (!dbUser) {
        throw new Error('User not found');
      }

      const [email] = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.id, input.emailId),
            eq(entities.workspaceId, workspaceId),
            eq(entities.userId, dbUser.id) // Ensure user owns this email
          )
        )
        .limit(1);

      if (!email) {
        throw new Error('Email not found');
      }

      await db
        .update(entities)
        .set({
          data: {
            ...email.data,
            isTrash: true
          },
          updatedAt: new Date()
        })
        .where(eq(entities.id, input.emailId));

      return { success: true };
    }),

  // Save draft email
  saveDraft: protectedProcedure
    .input(z.object({
      id: z.string().optional(),
      to: z.array(z.string()).optional(),
      cc: z.array(z.string()).optional(),
      bcc: z.array(z.string()).optional(),
      subject: z.string(),
      body: z.string(),
      attachments: z.array(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = ctx;
      
      // Get the actual workspace from database
      const workspaceId = await getWorkspaceId(orgId);
      if (!workspaceId) {
        throw new Error('Workspace not found');
      }
      
      // Get database user
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);
      
      if (!dbUser) {
        throw new Error('User not found');
      }

      // Create or update draft
      const draftData = {
        workspaceId,
        userId: dbUser.id, // Use actual database user ID
        type: 'email' as const,
        data: {
          to: input.to?.map(email => ({ email })) || [],
          cc: input.cc?.map(email => ({ email })) || [],
          bcc: input.bcc?.map(email => ({ email })) || [],
          subject: input.subject,
          body: {
            text: input.body,
            html: input.body
          },
          isDraft: true,
          isRead: true,
          from: {
            email: dbUser.email || '',
            name: dbUser.name || '',
          },
          sentAt: null,
          attachments: input.attachments || []
        },
        metadata: {
          source: 'evermail',
          isDraft: true,
          createdBy: dbUser.id
        },
      };

      if (input.id) {
        // Update existing draft
        const [draft] = await db
          .update(entities)
          .set({
            data: draftData.data,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(entities.id, input.id),
              eq(entities.workspaceId, workspaceId),
              eq(entities.userId, dbUser.id),
              eq(entities.type, 'email')
            )
          )
          .returning();

        return draft;
      } else {
        // Create new draft
        const [draft] = await db.insert(entities).values(draftData).returning();
        return draft;
      }
    }),

  // Auto-label endpoints
  
  // Label a single email
  labelEmail: protectedProcedure
    .input(z.object({
      emailId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = ctx;
      
      // Get workspace ID
      const workspaceId = await getWorkspaceId(orgId);
      if (!workspaceId) {
        throw new Error('Workspace not found');
      }
      
      // Get database user
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);
      
      if (!dbUser) {
        throw new Error('User not found');
      }
      
      // Get email entity
      const [email] = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.id, input.emailId),
            eq(entities.workspaceId, workspaceId),
            eq(entities.userId, dbUser.id),
            eq(entities.type, 'email')
          )
        )
        .limit(1);
      
      if (!email) {
        throw new Error('Email not found');
      }
      
      // Convert entity to EmailData format
      const emailData: EmailData = {
        id: email.id,
        from: (email.data as any).from || { email: 'unknown@example.com' },
        to: (email.data as any).to || [],
        subject: (email.data as any).subject || '',
        body: (email.data as any).body || {},
        hasAttachments: (email.data as any).attachments?.length > 0,
        threadId: (email.data as any).threadId,
        sentAt: new Date((email.data as any).sentAt || email.createdAt)
      };
      
      // Label the email
      const result = await autoLabelService.labelEmail(emailData, workspaceId, dbUser.id);
      
      return result;
    }),
  
  // Label multiple emails in batch
  labelBatch: protectedProcedure
    .input(z.object({
      emailIds: z.array(z.string()).optional(),
      limit: z.number().default(100)
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = ctx;
      
      // Get workspace ID
      const workspaceId = await getWorkspaceId(orgId);
      if (!workspaceId) {
        throw new Error('Workspace not found');
      }
      
      // Get database user
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);
      
      if (!dbUser) {
        throw new Error('User not found');
      }
      
      // Get emails to label
      let query = db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.workspaceId, workspaceId),
            eq(entities.userId, dbUser.id),
            eq(entities.type, 'email'),
            // Only label emails without labels
            sql`(metadata->>'autoLabels' IS NULL OR metadata->>'autoLabels' = '[]')`
          )
        )
        .limit(input.limit);
      
      if (input.emailIds?.length) {
        query = query.where(inArray(entities.id, input.emailIds));
      }
      
      const emails = await query;
      
      // Convert to EmailData format
      const emailDataList: EmailData[] = emails.map(email => ({
        id: email.id,
        from: (email.data as any).from || { email: 'unknown@example.com' },
        to: (email.data as any).to || [],
        subject: (email.data as any).subject || '',
        body: (email.data as any).body || {},
        hasAttachments: (email.data as any).attachments?.length > 0,
        threadId: (email.data as any).threadId,
        sentAt: new Date((email.data as any).sentAt || email.createdAt)
      }));
      
      // Label emails in batch
      const results = await autoLabelService.labelBatch(
        emailDataList,
        workspaceId,
        dbUser.id,
        (current, total) => {
          console.log(`Labeling progress: ${current}/${total}`);
        }
      );
      
      return {
        success: true,
        labelled: results.size,
        results: Array.from(results.entries())
      };
    }),
  
  // Get emails by label
  getEmailsByLabel: protectedProcedure
    .input(z.object({
      label: z.string(),
      limit: z.number().default(50),
      cursor: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const { orgId, userId } = ctx;
      
      // Get workspace ID
      const workspaceId = await getWorkspaceId(orgId);
      if (!workspaceId) {
        return [];
      }
      
      // Get database user
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);
      
      if (!dbUser) {
        return [];
      }
      
      // Query emails with the specified label
      const emails = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.workspaceId, workspaceId),
            eq(entities.userId, dbUser.id),
            eq(entities.type, 'email'),
            sql`metadata->'autoLabels' @> ${JSON.stringify([input.label])}::jsonb`
          )
        )
        .orderBy(desc(entities.createdAt))
        .limit(input.limit);
      
      return emails;
    }),
  
  // Get label statistics
  getLabelStats: protectedProcedure
    .query(async ({ ctx }) => {
      const { orgId, userId } = ctx;
      
      // Get workspace ID
      const workspaceId = await getWorkspaceId(orgId);
      if (!workspaceId) {
        return {};
      }
      
      // Get database user
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);
      
      if (!dbUser) {
        return {};
      }
      
      // Get label stats from service
      const stats = await autoLabelService.getLabelStats(workspaceId, dbUser.id);
      
      // Add label metadata
      const enrichedStats = Object.entries(stats).map(([labelId, count]) => ({
        ...AUTO_LABELS[labelId],
        count
      }));
      
      return enrichedStats;
    }),
  
  // Reprocess labels for an email
  reprocessLabels: protectedProcedure
    .input(z.object({
      emailId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = ctx;
      
      // Get workspace ID
      const workspaceId = await getWorkspaceId(orgId);
      if (!workspaceId) {
        throw new Error('Workspace not found');
      }
      
      // Get database user
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);
      
      if (!dbUser) {
        throw new Error('User not found');
      }
      
      // Clear existing labels first
      await db
        .update(entities)
        .set({
          metadata: sql`
            COALESCE(metadata, '{}'::jsonb) - 'autoLabels' - 'labelConfidence' - 'labelledAt' - 'labelVersion'
          `,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(entities.id, input.emailId),
            eq(entities.workspaceId, workspaceId),
            eq(entities.userId, dbUser.id),
            eq(entities.type, 'email')
          )
        );
      
      // Get email and re-label
      const [email] = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.id, input.emailId),
            eq(entities.workspaceId, workspaceId),
            eq(entities.userId, dbUser.id),
            eq(entities.type, 'email')
          )
        )
        .limit(1);
      
      if (!email) {
        throw new Error('Email not found');
      }
      
      // Convert to EmailData format
      const emailData: EmailData = {
        id: email.id,
        from: (email.data as any).from || { email: 'unknown@example.com' },
        to: (email.data as any).to || [],
        subject: (email.data as any).subject || '',
        body: (email.data as any).body || {},
        hasAttachments: (email.data as any).attachments?.length > 0,
        threadId: (email.data as any).threadId,
        sentAt: new Date((email.data as any).sentAt || email.createdAt)
      };
      
      // Re-label the email
      const result = await autoLabelService.labelEmail(emailData, workspaceId, dbUser.id);
      
      return result;
    }),

  // Restore email from trash
  restoreFromTrash: protectedProcedure
    .input(z.object({
      emailId: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = ctx;
      
      const workspaceId = await getWorkspaceId(orgId);
      if (!workspaceId) {
        throw new Error('Workspace not found');
      }
      
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);
      
      if (!dbUser) {
        throw new Error('User not found');
      }

      const [email] = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.id, input.emailId),
            eq(entities.workspaceId, workspaceId),
            eq(entities.userId, dbUser.id)
          )
        )
        .limit(1);

      if (!email) {
        throw new Error('Email not found');
      }

      const data = email.data as any;
      await db
        .update(entities)
        .set({
          data: {
            ...data,
            isTrash: false
          },
          updatedAt: new Date()
        })
        .where(eq(entities.id, input.emailId));

      return { success: true };
    }),

  // Permanently delete email
  permanentlyDelete: protectedProcedure
    .input(z.object({
      emailId: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = ctx;
      
      const workspaceId = await getWorkspaceId(orgId);
      if (!workspaceId) {
        throw new Error('Workspace not found');
      }
      
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);
      
      if (!dbUser) {
        throw new Error('User not found');
      }

      // Verify email belongs to user and is in trash
      const [email] = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.id, input.emailId),
            eq(entities.workspaceId, workspaceId),
            eq(entities.userId, dbUser.id),
            sql`(data->>'isTrash')::boolean = true`
          )
        )
        .limit(1);

      if (!email) {
        throw new Error('Email not found in trash');
      }

      // Permanently delete
      await db
        .delete(entities)
        .where(eq(entities.id, input.emailId));

      return { success: true };
    }),

  // Empty trash
  emptyTrash: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { orgId, userId } = ctx;
      
      const workspaceId = await getWorkspaceId(orgId);
      if (!workspaceId) {
        throw new Error('Workspace not found');
      }
      
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);
      
      if (!dbUser) {
        throw new Error('User not found');
      }

      // Delete all emails in trash for this user
      await db
        .delete(entities)
        .where(
          and(
            eq(entities.workspaceId, workspaceId),
            eq(entities.userId, dbUser.id),
            eq(entities.type, 'email'),
            sql`(data->>'isTrash')::boolean = true`
          )
        );

      return { success: true };
    })
});