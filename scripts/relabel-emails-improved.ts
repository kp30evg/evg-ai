#!/usr/bin/env node
/**
 * Re-label emails with improved classification logic
 * Clears existing labels and applies new, more accurate labels
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, sql } from 'drizzle-orm';

// Load environment variables FIRST
config({ path: resolve(process.cwd(), '.env') });

// Check for required environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in .env file');
  process.exit(1);
}

// Initialize database
const dbClient = neon(DATABASE_URL);
const db = drizzle(dbClient);

// Import schema and service after env is loaded
import { entities, users, workspaces } from '../lib/db/schema/unified';
import { improvedAutoLabelService, type EmailData } from '../lib/evermail/services/auto-label-service-v2';

async function clearExistingLabels(workspaceId: string, userId: string) {
  console.log('🧹 Clearing existing labels...');
  
  await db
    .update(entities)
    .set({
      metadata: sql`
        COALESCE(metadata, '{}'::jsonb) || 
        jsonb_build_object('autoLabels', '[]'::jsonb)
      `,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(entities.workspaceId, workspaceId),
        eq(entities.userId, userId),
        eq(entities.type, 'email')
      )
    );
  
  console.log('✅ Existing labels cleared\n');
}

async function relabelEmails() {
  const clerkUserId = process.argv[2] || 'user_321PIsZrSDgVtG1YS8G8P9kwfVn';
  
  console.log(`🏷️  Email Re-Labeling with Improved Logic`);
  console.log(`==========================================\n`);
  console.log(`User: ${clerkUserId}\n`);
  
  try {
    // Get user from database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    
    if (!dbUser) {
      console.error('❌ User not found in database');
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${dbUser.email}`);
    console.log(`📁 Workspace: ${dbUser.workspaceId}\n`);
    
    // Clear existing labels first
    await clearExistingLabels(dbUser.workspaceId, dbUser.id);
    
    // Get most recent 50 emails
    const emails = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, dbUser.workspaceId),
          eq(entities.userId, dbUser.id),
          eq(entities.type, 'email')
        )
      )
      .orderBy(sql`created_at DESC`)
      .limit(50);
    
    console.log(`📧 Found ${emails.length} emails to re-label\n`);
    
    if (emails.length === 0) {
      console.log('No emails to label');
      process.exit(0);
    }
    
    // Convert to EmailData format
    const emailDataList: EmailData[] = emails.map(email => {
      const data = email.data as any;
      return {
        id: email.id,
        from: data.from || { email: 'unknown@example.com' },
        to: data.to || [],
        subject: data.subject || '',
        body: data.body || { snippet: data.snippet },
        hasAttachments: data.attachments?.length > 0,
        threadId: data.threadId,
        sentAt: new Date(data.sentAt || email.createdAt),
        headers: data.headers
      };
    });
    
    // Set current user email for self-email detection
    improvedAutoLabelService.setCurrentUser(dbUser.email || '');
    
    console.log('🤖 Starting improved classification...\n');
    console.log('Legend: ✅ Labeled | ⚪ No labels (excluded/low confidence) | 🚫 Self-email\n');
    console.log('Processing emails:\n');
    
    const labelStats: Record<string, number> = {};
    let labeledCount = 0;
    let excludedCount = 0;
    let selfEmailCount = 0;
    
    for (let i = 0; i < emailDataList.length; i++) {
      const email = emailDataList[i];
      const originalData = emails[i].data as any;
      
      process.stdout.write(`  ${i + 1}/${emailDataList.length}: "${originalData.subject?.substring(0, 40) || '(no subject)'}..." `);
      
      // Check if it's a self-email
      const isSelfEmail = originalData.from?.email === dbUser.email && 
                          originalData.to?.length === 1 && 
                          originalData.to[0]?.email === dbUser.email;
      
      if (isSelfEmail) {
        console.log(`🚫 [self-email]`);
        selfEmailCount++;
      } else {
        const result = await improvedAutoLabelService.labelEmail(
          email,
          dbUser.workspaceId,
          dbUser.id,
          dbUser.email
        );
        
        if (result.labels.length > 0) {
          console.log(`✅ [${result.labels.join(', ')}]`);
          labeledCount++;
          for (const label of result.labels) {
            labelStats[label] = (labelStats[label] || 0) + 1;
          }
        } else {
          const reason = result.reasoning || 'low confidence';
          console.log(`⚪ [${reason}]`);
          excludedCount++;
        }
      }
      
      // Small delay between emails
      if (i % 10 === 9) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RE-LABELING COMPLETE');
    console.log('='.repeat(50));
    console.log(`\n📈 Results:`);
    console.log(`  ✅ Labeled: ${labeledCount} emails`);
    console.log(`  ⚪ Excluded: ${excludedCount} emails`);
    console.log(`  🚫 Self-emails: ${selfEmailCount} emails`);
    
    if (Object.keys(labelStats).length > 0) {
      console.log('\n📌 Label Distribution:');
      const sortedLabels = Object.entries(labelStats).sort(([,a], [,b]) => b - a);
      for (const [label, count] of sortedLabels) {
        console.log(`  ${label}: ${count} emails`);
      }
    }
    
    console.log('\n✨ Done! Refresh your inbox to see the improved labels.');
    console.log('💡 Self-emails and test emails are no longer labeled.');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run the relabeling
relabelEmails();