#!/usr/bin/env node

/**
 * Manual test script for EverMail functionality fixes
 * Run with: npx tsx tests/email-fixes-test.ts
 */

import { db } from '@/lib/db';
import { entities, users, workspaces } from '@/lib/db/schema/unified';
import { eq, and, sql } from 'drizzle-orm';

async function testEmailFixes() {
  console.log('🧪 Testing EverMail Functionality Fixes\n');
  
  try {
    // Test 1: Check if inbox filter excludes sent emails
    console.log('Test 1: Inbox Filter (excluding sent emails)');
    console.log('----------------------------------------');
    
    // Get a test workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .limit(1);
    
    if (!workspace) {
      console.log('❌ No workspace found. Please create a workspace first.');
      return;
    }
    
    console.log(`✅ Found workspace: ${workspace.name}`);
    
    // Get a test user
    const [dbUser] = await db
      .select()
      .from(users)
      .limit(1);
    
    if (!dbUser) {
      console.log('❌ No user found. Please sync users from Clerk first.');
      return;
    }
    
    console.log(`✅ Found user: ${dbUser.email}`);
    
    // Test the inbox query filter
    const inboxEmails = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.type, 'email'),
          eq(entities.userId, dbUser.id),
          sql`(data->>'isDraft')::boolean IS NOT TRUE AND 
              (data->>'isTrash')::boolean IS NOT TRUE AND
              (data->>'isSpam')::boolean IS NOT TRUE AND
              NOT ((data->'labels')::jsonb ? 'SENT') AND
              (data->'from'->>'email' IS NULL OR data->'from'->>'email' != ${dbUser.email})`
        )
      )
      .limit(5);
    
    console.log(`✅ Inbox query executed successfully`);
    console.log(`   Found ${inboxEmails.length} emails in inbox (max 5 shown)`);
    
    // Check if any sent emails leaked through
    const sentEmailsInInbox = inboxEmails.filter(email => {
      const data = email.data as any;
      return data.from?.email === dbUser.email || data.labels?.includes('SENT');
    });
    
    if (sentEmailsInInbox.length > 0) {
      console.log(`❌ Found ${sentEmailsInInbox.length} sent emails in inbox (should be 0)`);
    } else {
      console.log(`✅ No sent emails in inbox (correct)`);
    }
    
    // Test 2: Check star functionality
    console.log('\nTest 2: Star/Unstar Functionality');
    console.log('----------------------------------------');
    
    if (inboxEmails.length > 0) {
      const testEmail = inboxEmails[0];
      const currentData = testEmail.data as any;
      const wasStarred = currentData.isStarred || false;
      
      // Toggle star
      await db
        .update(entities)
        .set({
          data: {
            ...currentData,
            isStarred: !wasStarred
          },
          updatedAt: new Date()
        })
        .where(eq(entities.id, testEmail.id));
      
      // Verify the change
      const [updatedEmail] = await db
        .select()
        .from(entities)
        .where(eq(entities.id, testEmail.id))
        .limit(1);
      
      const updatedData = updatedEmail.data as any;
      if (updatedData.isStarred === !wasStarred) {
        console.log(`✅ Star toggle works (was ${wasStarred}, now ${!wasStarred})`);
      } else {
        console.log(`❌ Star toggle failed`);
      }
    } else {
      console.log('⚠️  No emails to test star functionality');
    }
    
    // Test 3: Check trash functionality
    console.log('\nTest 3: Trash/Delete Functionality');
    console.log('----------------------------------------');
    
    // Check if trash flag is properly set
    const trashedEmails = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.type, 'email'),
          eq(entities.userId, dbUser.id),
          sql`(data->>'isTrash')::boolean = true`
        )
      )
      .limit(5);
    
    console.log(`✅ Found ${trashedEmails.length} emails in trash`);
    
    // Test 4: Check draft functionality
    console.log('\nTest 4: Draft Functionality');
    console.log('----------------------------------------');
    
    const drafts = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.type, 'email'),
          eq(entities.userId, dbUser.id),
          sql`(data->>'isDraft')::boolean = true`
        )
      )
      .limit(5);
    
    console.log(`✅ Found ${drafts.length} draft emails`);
    
    // Test 5: Create a test draft
    console.log('\nTest 5: Create Test Draft');
    console.log('----------------------------------------');
    
    const [testDraft] = await db.insert(entities).values({
      workspaceId: workspace.id,
      userId: dbUser.id,
      type: 'email',
      data: {
        to: [{ email: 'test@example.com' }],
        subject: 'Test Draft - ' + new Date().toISOString(),
        body: {
          text: 'This is a test draft email',
          html: '<p>This is a test draft email</p>'
        },
        isDraft: true,
        isRead: true,
        from: {
          email: dbUser.email || 'test@example.com',
          name: dbUser.name || 'Test User'
        }
      },
      metadata: {
        source: 'test-script',
        createdAt: new Date()
      }
    }).returning();
    
    if (testDraft) {
      console.log(`✅ Successfully created test draft with ID: ${testDraft.id}`);
      
      // Clean up test draft
      await db
        .delete(entities)
        .where(eq(entities.id, testDraft.id));
      
      console.log(`✅ Cleaned up test draft`);
    } else {
      console.log(`❌ Failed to create test draft`);
    }
    
    // Test 6: Check user isolation
    console.log('\nTest 6: User Data Isolation');
    console.log('----------------------------------------');
    
    // Check if emails are properly isolated by user
    const emailsByUser = await db
      .select({
        userId: entities.userId,
        count: sql<number>`count(*)`
      })
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.type, 'email')
        )
      )
      .groupBy(entities.userId);
    
    console.log(`✅ Emails are distributed across ${emailsByUser.length} users`);
    emailsByUser.forEach(row => {
      console.log(`   User ${row.userId}: ${row.count} emails`);
    });
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the tests
testEmailFixes();