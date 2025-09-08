#!/usr/bin/env node
/**
 * Quick email labeling script
 * Labels all unlabeled emails for the current user
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });

// Now import everything else after env is loaded
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { entities, users, workspaces } from '../lib/db/schema/unified';
import { eq, and, sql } from 'drizzle-orm';
import { autoLabelService, type EmailData } from '../lib/evermail/services/auto-label-service';

// Initialize database connection
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const dbClient = neon(dbUrl);
const db = drizzle(dbClient);

async function labelUserEmails(clerkUserId: string) {
  console.log(`🏷️  Starting to label emails for user: ${clerkUserId}\n`);
  
  try {
    // Get user from database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    
    if (!dbUser) {
      console.error('❌ User not found in database');
      console.log('Make sure the user has been synced from Clerk');
      return;
    }
    
    console.log(`✅ Found user: ${dbUser.email || dbUser.id}`);
    console.log(`📁 Workspace: ${dbUser.workspaceId}\n`);
    
    // Get all emails for this user (not just unlabeled, to relabel everything)
    const allEmails = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, dbUser.workspaceId),
          eq(entities.userId, dbUser.id),
          eq(entities.type, 'email')
        )
      )
      .limit(100);
    
    if (allEmails.length === 0) {
      console.log('❌ No emails found for this user');
      return;
    }
    
    console.log(`📧 Found ${allEmails.length} emails to process\n`);
    
    // Convert to EmailData format
    const emailDataList: EmailData[] = allEmails.map(email => ({
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
    console.log('Processing emails:');
    
    // Process emails one by one for better visibility
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < emailDataList.length; i++) {
      const email = emailDataList[i];
      const emailData = allEmails[i].data as any;
      
      try {
        process.stdout.write(`  ${i + 1}/${emailDataList.length}: "${email.subject?.substring(0, 50)}..." `);
        
        const result = await autoLabelService.labelEmail(
          email,
          dbUser.workspaceId,
          dbUser.id
        );
        
        if (result.labels.length > 0) {
          console.log(`✅ [${result.labels.join(', ')}]`);
          successCount++;
        } else {
          console.log(`⚪ [no labels]`);
        }
      } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
        errorCount++;
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 LABELING COMPLETE');
    console.log('='.repeat(50));
    console.log(`✅ Successfully labeled: ${successCount} emails`);
    console.log(`❌ Errors: ${errorCount} emails`);
    
    // Show label distribution
    console.log('\n📈 Fetching label statistics...');
    const labeledEmails = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, dbUser.workspaceId),
          eq(entities.userId, dbUser.id),
          eq(entities.type, 'email'),
          sql`metadata->>'autoLabels' IS NOT NULL AND metadata->>'autoLabels' != '[]'`
        )
      );
    
    const labelCounts: Record<string, number> = {};
    for (const email of labeledEmails) {
      const labels = (email.metadata as any)?.autoLabels || [];
      for (const label of labels) {
        labelCounts[label] = (labelCounts[label] || 0) + 1;
      }
    }
    
    console.log('\n📊 Label Distribution:');
    for (const [label, count] of Object.entries(labelCounts)) {
      console.log(`  - ${label}: ${count} emails`);
    }
    
    console.log('\n✨ All done! Refresh your inbox to see the labels.');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args[0] === '--user' && args[1]) {
  labelUserEmails(args[1]).then(() => process.exit(0));
} else {
  console.log('Usage: npx tsx scripts/quick-label-emails.ts --user <clerkUserId>');
  console.log('Example: npx tsx scripts/quick-label-emails.ts --user user_321PIsZrSDgVtG1YS8G8P9kwfVn');
  process.exit(1);
}