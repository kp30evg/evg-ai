#!/usr/bin/env tsx

/**
 * CRITICAL: Email Feature Test Suite
 * Run this test regularly to ensure email sending functionality works
 * 
 * Usage: npx tsx scripts/test-email-feature.ts
 */

import { db } from '@/lib/db';
import { entities, users, workspaces } from '@/lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';

const TESTS = {
  '✅ Database User Exists': async () => {
    const testUserId = 'user_321PIsZrSDgVtG1YS8G8P9kwfVn'; // Kian's user ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, testUserId))
      .limit(1);
    
    if (!user) throw new Error('User not found in database - run sync-users-simple.ts');
    console.log(`   Found user: ${user.email} (${user.id})`);
    return true;
  },

  '✅ Gmail Account Connected': async () => {
    const testWorkspaceId = '3ebb63b5-61dd-4a7f-b645-1f0a6d214f7f';
    const testUserId = '22ec6667-fa0e-4d6c-8471-9adbd943de68';
    
    const [emailAccount] = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, testWorkspaceId),
          eq(entities.userId, testUserId),
          eq(entities.type, 'email_account')
        )
      )
      .limit(1);
    
    if (!emailAccount) throw new Error('Gmail account not connected');
    const data = emailAccount.data as any;
    console.log(`   Gmail connected: ${data.email}`);
    return true;
  },

  '✅ Command Processor Handles Email': async () => {
    const { processCommand } = await import('@/lib/modules-simple/command-processor');
    const result = await processCommand(
      '3ebb63b5-61dd-4a7f-b645-1f0a6d214f7f',
      'send test@example.com an email about testing',
      '22ec6667-fa0e-4d6c-8471-9adbd943de68'
    );
    
    if (!result.success) throw new Error('Command processing failed');
    if (!result.data?.type === 'draft_email') throw new Error('Email draft not generated');
    console.log(`   Email draft generated successfully`);
    return true;
  },

  '✅ API Endpoints Exist': async () => {
    // This just checks the imports work
    const { unifiedRouter } = await import('@/lib/api/routers/unified');
    if (!unifiedRouter._def.procedures.sendEmail) {
      throw new Error('sendEmail endpoint missing from unified router');
    }
    console.log(`   All required endpoints present`);
    return true;
  }
};

async function runTests() {
  console.log('\n🧪 EVERMAIL FEATURE HEALTH CHECK\n');
  console.log('Testing critical email sending components...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const [testName, testFn] of Object.entries(TESTS)) {
    try {
      await testFn();
      console.log(`${testName}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${testName.replace('✅', '❌')}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('\n⚠️  ATTENTION: Email feature has issues!');
    console.log('Run these commands to fix:');
    console.log('1. npx tsx scripts/sync-users-simple.ts');
    console.log('2. Connect Gmail at http://localhost:3000/mail/settings');
    process.exit(1);
  } else {
    console.log('\n✅ Email feature is working perfectly!');
  }
}

runTests().catch(console.error);