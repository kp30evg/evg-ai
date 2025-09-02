import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '@/lib/db';
import { entities, integrations } from '@/lib/db/schema';
import { eq, and, desc, or, sql, inArray } from 'drizzle-orm';
import { GmailSyncService } from '@/lib/evermail/gmail-sync';
import { EmailCommandProcessor } from '@/lib/evermail/command-processor';
import { GmailClient } from '@/lib/evermail/gmail-client';

// Helper to create a deterministic UUID from any string ID
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
  folder: z.enum(['inbox', 'sent', 'drafts', 'trash', 'spam', 'all']).optional(),
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
    const { orgId } = ctx;
    const companyId = stringToUuid(orgId);

    // Check for email_account entity (new OAuth flow)
    const emailAccount = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.companyId, companyId),
          eq(entities.type, 'email_account')
        )
      )
      .limit(1);

    // Fallback to check integrations table (old flow)
    if (!emailAccount || emailAccount.length === 0) {
      const integration = await db
        .select()
        .from(integrations)
        .where(
          and(
            eq(integrations.companyId, companyId),
            eq(integrations.provider, 'gmail')
          )
        )
        .limit(1);

      if (!integration || integration.length === 0) {
        return {
          connected: false,
          lastSyncAt: null,
          emailCount: 0
        };
      }

      // Get email count
      const emailCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(entities)
        .where(
          and(
            eq(entities.companyId, companyId),
            eq(entities.type, 'email')
          )
        );

      return {
        connected: integration[0].status === 'connected',
        lastSyncAt: integration[0].lastSyncAt,
        emailCount: emailCount[0]?.count || 0,
        syncError: integration[0].syncError
      };
    }

    // Use email_account entity data
    const accountData = emailAccount[0].data as any;

    // Get email count
    const emailCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(entities)
      .where(
        and(
          eq(entities.companyId, companyId),
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
      const companyId = stringToUuid(orgId);
      
      const syncService = new GmailSyncService();
      const result = await syncService.connectGmail(input.authCode, companyId, userId);
      
      // Start initial sync in background
      syncService.performInitialSync(companyId).catch(console.error);
      
      return result;
    }),

  // Disconnect Gmail
  disconnectGmail: protectedProcedure.mutation(async ({ ctx }) => {
    const { orgId } = ctx;
    const companyId = stringToUuid(orgId);

    await db
      .update(integrations)
      .set({ 
        status: 'disconnected',
        credentials: null,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(integrations.companyId, companyId),
          eq(integrations.provider, 'gmail')
        )
      );

    return { success: true };
  }),

  // Trigger manual sync
  syncEmails: protectedProcedure.mutation(async ({ ctx }) => {
    const { orgId } = ctx;
    const companyId = stringToUuid(orgId);
    
    try {
      // Get email account with tokens
      const emailAccount = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.companyId, companyId),
            eq(entities.type, 'email_account')
          )
        )
        .limit(1);

      if (!emailAccount || emailAccount.length === 0) {
        throw new Error('Gmail account not connected');
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
      
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      // Fetch messages (start with recent 50)
      const messagesResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 50,
        q: 'in:inbox OR in:sent OR in:drafts'
      });
      
      if (!messagesResponse.data.messages) {
        return { success: true, synced: 0 };
      }
      
      // Fetch full message details for each message
      let syncedCount = 0;
      const messagePromises = messagesResponse.data.messages.slice(0, 20).map(async (msg: any) => {
        try {
          const fullMessage = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'full'
          });
          
          // Parse message data
          const headers = fullMessage.data.payload.headers.reduce((acc: any, header: any) => {
            acc[header.name.toLowerCase()] = header.value;
            return acc;
          }, {});
          
          // Extract body
          let textBody = '';
          let htmlBody = '';
          
          const extractBody = (parts: any[]) => {
            for (const part of parts || []) {
              if (part.mimeType === 'text/plain' && part.body.data) {
                textBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
              } else if (part.mimeType === 'text/html' && part.body.data) {
                htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
              } else if (part.parts) {
                extractBody(part.parts);
              }
            }
          };
          
          if (fullMessage.data.payload.parts) {
            extractBody(fullMessage.data.payload.parts);
          } else if (fullMessage.data.payload.body?.data) {
            textBody = Buffer.from(fullMessage.data.payload.body.data, 'base64').toString('utf-8');
          }
          
          // Parse recipients
          const parseRecipients = (field: string) => {
            if (!field) return [];
            return field.split(',').map((r: string) => {
              const match = r.match(/(.*?)<(.+?)>/);
              if (match) {
                return { name: match[1].trim(), email: match[2].trim() };
              }
              return { email: r.trim() };
            });
          };
          
          const emailData = {
            messageId: fullMessage.data.id,
            threadId: fullMessage.data.threadId,
            subject: headers.subject || '(No subject)',
            from: parseRecipients(headers.from)[0] || { email: '' },
            to: parseRecipients(headers.to),
            cc: parseRecipients(headers.cc),
            bcc: parseRecipients(headers.bcc),
            body: {
              text: textBody,
              html: htmlBody || textBody,
              snippet: fullMessage.data.snippet
            },
            labels: fullMessage.data.labelIds || [],
            isRead: !fullMessage.data.labelIds?.includes('UNREAD'),
            isStarred: fullMessage.data.labelIds?.includes('STARRED'),
            isDraft: fullMessage.data.labelIds?.includes('DRAFT'),
            isTrash: fullMessage.data.labelIds?.includes('TRASH'),
            isSpam: fullMessage.data.labelIds?.includes('SPAM'),
            sentAt: new Date(parseInt(fullMessage.data.internalDate)),
            attachments: []
          };
          
          // Check if email already exists
          const existing = await db
            .select()
            .from(entities)
            .where(
              and(
                eq(entities.companyId, companyId),
                eq(entities.type, 'email'),
                sql`data->>'messageId' = ${fullMessage.data.id}`
              )
            )
            .limit(1);
          
          if (existing.length === 0) {
            // Create new email entity
            await db.insert(entities).values({
              companyId,
              type: 'email',
              data: emailData,
              createdBy: stringToUuid(ctx.userId),
              metadata: {
                source: 'gmail_sync'
              }
            });
            syncedCount++;
          } else {
            // Update existing email
            await db
              .update(entities)
              .set({
                data: emailData,
                updatedAt: new Date()
              })
              .where(eq(entities.id, existing[0].id));
          }
        } catch (err) {
          console.error('Error syncing message:', err);
        }
      });
      
      await Promise.all(messagePromises);
      
      // Update last sync time
      await db
        .update(entities)
        .set({
          data: {
            ...accountData,
            lastSyncAt: new Date().toISOString()
          },
          updatedAt: new Date()
        })
        .where(eq(entities.id, emailAccount[0].id));
      
      return { success: true, synced: syncedCount, redirectTo: '/mail/inbox' };
    } catch (error: any) {
      console.error('Sync error:', error);
      throw new Error(`Sync failed: ${error.message}`);
    }
  }),

  // Get emails (inbox, sent, drafts, etc.)
  getEmails: protectedProcedure
    .input(searchEmailsSchema)
    .query(async ({ ctx, input }) => {
      const { orgId } = ctx;
      const companyId = stringToUuid(orgId);

      let query = db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.companyId, companyId),
            eq(entities.type, 'email')
          )
        );

      // Apply folder filter
      if (input.folder && input.folder !== 'all') {
        // Filter based on email data fields
        if (input.folder === 'inbox') {
          query = query.where(
            sql`(data->>'isDraft')::boolean IS NOT TRUE AND 
                (data->>'isTrash')::boolean IS NOT TRUE AND
                (data->>'isSpam')::boolean IS NOT TRUE AND
                (data->'to')::jsonb @> ${JSON.stringify([{ email: ctx.user?.emailAddresses?.[0]?.emailAddress }])}`
          );
        } else if (input.folder === 'sent') {
          query = query.where(
            sql`(data->'from'->>'email') = ${ctx.user?.emailAddresses?.[0]?.emailAddress}`
          );
        } else if (input.folder === 'drafts') {
          query = query.where(sql`(data->>'isDraft')::boolean = true`);
        } else if (input.folder === 'trash') {
          query = query.where(sql`(data->>'isTrash')::boolean = true`);
        } else if (input.folder === 'spam') {
          query = query.where(sql`(data->>'isSpam')::boolean = true`);
        }
      }

      // Apply other filters
      if (input.isRead !== undefined) {
        query = query.where(sql`(data->>'isRead')::boolean = ${input.isRead}`);
      }
      if (input.isStarred !== undefined) {
        query = query.where(sql`(data->>'isStarred')::boolean = ${input.isStarred}`);
      }
      if (input.hasAttachments) {
        query = query.where(sql`jsonb_array_length(data->'attachments') > 0`);
      }
      if (input.from) {
        query = query.where(sql`data->'from'->>'email' ILIKE ${`%${input.from}%`}`);
      }
      if (input.query) {
        query = query.where(
          sql`(data->>'subject' ILIKE ${`%${input.query}%`} OR 
               data->'body'->>'text' ILIKE ${`%${input.query}%`})`
        );
      }

      const emails = await query
        .orderBy(desc(entities.createdAt))
        .limit(input.limit);

      return emails;
    }),

  // Get single email
  getEmail: protectedProcedure
    .input(z.object({
      emailId: z.string().uuid()
    }))
    .query(async ({ ctx, input }) => {
      const { orgId } = ctx;
      const companyId = stringToUuid(orgId);

      const email = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.id, input.emailId),
            eq(entities.companyId, companyId),
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
      const companyId = stringToUuid(orgId);

      const emails = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.companyId, companyId),
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
      const companyId = stringToUuid(orgId);
      const userUuid = stringToUuid(userId);

      try {
        // Get email account with OAuth tokens
        const emailAccount = await db
          .select()
          .from(entities)
          .where(
            and(
              eq(entities.companyId, companyId),
              eq(entities.type, 'email_account')
            )
          )
          .limit(1);

        if (!emailAccount || emailAccount.length === 0) {
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
        const sentMessage = await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedMessage
          }
        });

        // Store in our database
        const [email] = await db.insert(entities).values({
          companyId,
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
          createdBy: userUuid,
          metadata: {
            source: 'evermail'
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
      const companyId = stringToUuid(orgId);
      const userUuid = stringToUuid(userId);

      const [draft] = await db.insert(entities).values({
        companyId,
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
        createdBy: userUuid,
        metadata: {}
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
      const companyId = stringToUuid(orgId);
      
      const processor = new EmailCommandProcessor();
      const result = await processor.processCommand(input.command, {
        companyId,
        userId,
        userEmail: ctx.user?.emailAddresses?.[0]?.emailAddress || ''
      });
      
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
      const companyId = stringToUuid(orgId);

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
      const { orgId } = ctx;
      const companyId = stringToUuid(orgId);

      const [email] = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.id, input.emailId),
            eq(entities.companyId, companyId)
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
      const companyId = stringToUuid(orgId);

      const [email] = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.id, input.emailId),
            eq(entities.companyId, companyId)
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
      const { orgId } = ctx;
      const companyId = stringToUuid(orgId);

      const [email] = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.id, input.emailId),
            eq(entities.companyId, companyId)
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
      to: z.array(z.object({ email: z.string().email() })),
      cc: z.array(z.object({ email: z.string().email() })).optional(),
      bcc: z.array(z.object({ email: z.string().email() })).optional(),
      subject: z.string(),
      body: z.object({
        text: z.string(),
        html: z.string().optional(),
      }),
      attachments: z.array(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId } = ctx;
      const companyId = stringToUuid(orgId);
      const userId = stringToUuid(ctx.user.id);

      // Create or update draft
      const draftData = {
        companyId,
        type: 'email' as const,
        data: {
          ...input,
          folder: 'drafts',
          isDraft: true,
          isRead: true,
          from: {
            email: ctx.user.email || '',
            name: ctx.user.name || '',
          },
          sentAt: null,
          gmailId: null,
        },
        createdBy: userId,
        metadata: {
          source: 'evermail',
          isDraft: true,
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
              eq(entities.companyId, companyId),
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
    })
});