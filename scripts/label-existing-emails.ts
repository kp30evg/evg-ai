#!/usr/bin/env npx tsx
/**
 * Batch classification script for existing emails
 * Labels all unlabeled emails in the database
 */

import { db } from '@/lib/db';
import { entities, users, workspaces } from '@/lib/db/schema/unified';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { autoLabelService, type EmailData } from '@/lib/evermail/services/auto-label-service';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

async function labelExistingEmails() {
  console.log('🏷️  Starting batch email labeling...\n');
  
  try {
    // Get all workspaces
    const allWorkspaces = await db
      .select()
      .from(workspaces)
      .limit(100); // Process up to 100 workspaces
    
    console.log(`Found ${allWorkspaces.length} workspaces to process\n`);
    
    let totalLabeled = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    // Process each workspace
    for (const workspace of allWorkspaces) {
      console.log(`\n📁 Processing workspace: ${workspace.name} (${workspace.id})`);
      
      // Get all users in this workspace
      const workspaceUsers = await db
        .select()
        .from(users)
        .where(eq(users.workspaceId, workspace.id))
        .limit(100); // Process up to 100 users per workspace
      
      console.log(`  Found ${workspaceUsers.length} users`);
      
      // Process each user's emails
      for (const user of workspaceUsers) {
        console.log(`\n  👤 Processing user: ${user.email || user.id}`);
        
        // Get unlabeled emails for this user
        const unlabeledEmails = await db
          .select()
          .from(entities)
          .where(
            and(
              eq(entities.workspaceId, workspace.id),
              eq(entities.userId, user.id),
              eq(entities.type, 'email'),
              // Only get emails without labels
              sql`(metadata->>'autoLabels' IS NULL OR metadata->>'autoLabels' = '[]')`
            )
          )
          .limit(50); // Process up to 50 emails per user at a time
        
        if (unlabeledEmails.length === 0) {
          console.log(`    ✅ No unlabeled emails found`);
          totalSkipped += 1;
          continue;
        }
        
        console.log(`    📧 Found ${unlabeledEmails.length} unlabeled emails`);
        
        // Convert to EmailData format
        const emailDataList: EmailData[] = unlabeledEmails.map(email => ({
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
        console.log(`    🤖 Starting AI classification...`);
        
        try {
          const results = await autoLabelService.labelBatch(
            emailDataList,
            workspace.id,
            user.id,
            (current, total) => {
              // Progress callback
              process.stdout.write(`\r    Processing: ${current}/${total} emails`);
            }
          );
          
          console.log(''); // New line after progress
          
          // Count labeled emails by category
          const labelCounts: Record<string, number> = {};
          for (const [emailId, result] of results.entries()) {
            for (const label of result.labels) {
              labelCounts[label] = (labelCounts[label] || 0) + 1;
            }
          }
          
          console.log(`    📊 Labeling complete:`);
          for (const [label, count] of Object.entries(labelCounts)) {
            console.log(`       - ${label}: ${count} emails`);
          }
          
          totalLabeled += results.size;
        } catch (error) {
          console.error(`    ❌ Error labeling emails:`, error);
          totalErrors += 1;
        }
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 BATCH LABELING COMPLETE');
    console.log('='.repeat(50));
    console.log(`✅ Successfully labeled: ${totalLabeled} emails`);
    console.log(`⏭️  Skipped (already labeled): ${totalSkipped} users`);
    console.log(`❌ Errors: ${totalErrors} users`);
    console.log('\n✨ All done!');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Add option to label emails for a specific user
async function labelUserEmails(clerkUserId: string) {
  console.log(`🏷️  Labeling emails for user: ${clerkUserId}\n`);
  
  try {
    // Get user from database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    
    if (!dbUser) {
      console.error('❌ User not found in database');
      return;
    }
    
    console.log(`Found user: ${dbUser.email || dbUser.id}`);
    console.log(`Workspace: ${dbUser.workspaceId}\n`);
    
    // Get unlabeled emails
    const unlabeledEmails = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, dbUser.workspaceId),
          eq(entities.userId, dbUser.id),
          eq(entities.type, 'email'),
          sql`(metadata->>'autoLabels' IS NULL OR metadata->>'autoLabels' = '[]')`
        )
      )
      .limit(100);
    
    if (unlabeledEmails.length === 0) {
      console.log('✅ No unlabeled emails found');
      return;
    }
    
    console.log(`Found ${unlabeledEmails.length} unlabeled emails\n`);
    
    // Convert and label
    const emailDataList: EmailData[] = unlabeledEmails.map(email => ({
      id: email.id,
      from: (email.data as any).from || { email: 'unknown@example.com' },
      to: (email.data as any).to || [],
      subject: (email.data as any).subject || '',
      body: (email.data as any).body || {},
      hasAttachments: (email.data as any).attachments?.length > 0,
      threadId: (email.data as any).threadId,
      sentAt: new Date((email.data as any).sentAt || email.createdAt)
    }));
    
    console.log('🤖 Starting AI classification...\n');
    
    const results = await autoLabelService.labelBatch(
      emailDataList,
      dbUser.workspaceId,
      dbUser.id,
      (current, total) => {
        process.stdout.write(`\rProcessing: ${current}/${total} emails`);
      }
    );
    
    console.log('\n\n📊 Labeling complete:');
    
    // Show results
    const labelCounts: Record<string, number> = {};
    for (const [emailId, result] of results.entries()) {
      for (const label of result.labels) {
        labelCounts[label] = (labelCounts[label] || 0) + 1;
      }
    }
    
    for (const [label, count] of Object.entries(labelCounts)) {
      console.log(`  - ${label}: ${count} emails`);
    }
    
    console.log('\n✨ Done!');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args[0] === '--user' && args[1]) {
  // Label emails for specific user
  labelUserEmails(args[1]).then(() => process.exit(0));
} else if (args[0] === '--help') {
  console.log('Usage:');
  console.log('  npx tsx scripts/label-existing-emails.ts           # Label all unlabeled emails');
  console.log('  npx tsx scripts/label-existing-emails.ts --user <clerkUserId>  # Label emails for specific user');
  process.exit(0);
} else {
  // Label all emails
  labelExistingEmails().then(() => process.exit(0));
}