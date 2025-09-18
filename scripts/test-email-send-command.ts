#!/usr/bin/env tsx

/**
 * CRITICAL TEST: Email Send Command Feature
 * This test ensures the dashboard can properly parse and handle email send commands
 * Run this test after ANY changes to command processing
 */

import { processCommand } from '@/lib/modules-simple/command-processor';
import { db } from '@/lib/db';
import { workspaces } from '@/lib/db/schema/unified';
import { eq } from 'drizzle-orm';

async function test() {
  console.log('🧪 Testing Email Send Command Feature...\n');
  console.log('This is a CRITICAL feature that MUST always work!\n');
  
  // Get workspace
  const [workspace] = await db
    .select()
    .from(workspaces)
    .limit(1);

  if (!workspace) {
    console.error('❌ No workspace found! Create a workspace first.');
    process.exit(1);
  }

  const testCases = [
    {
      command: 'send email to john@example.com about pricing',
      expectedTo: 'john@example.com',
      expectedTopic: 'pricing'
    },
    {
      command: 'send an email to kian.pezeshki1@gmail about puma',
      expectedTo: 'kian.pezeshki1@gmail.com', // Should auto-add .com
      expectedTopic: 'puma'
    },
    {
      command: 'email sarah@company about the meeting tomorrow',
      expectedTo: 'sarah@company.com', // Should auto-add .com
      expectedTopic: 'the meeting tomorrow'
    },
    {
      command: 'draft email to bob@test.org regarding project update',
      expectedTo: 'bob@test.org',
      expectedTopic: 'project update'
    }
  ];

  let allPassed = true;

  for (const testCase of testCases) {
    console.log(`\n📧 Testing: "${testCase.command}"`);
    
    try {
      const result = await processCommand(
        workspace.id,
        testCase.command,
        'test-user-id'
      );
      
      if (!result.success) {
        console.error(`❌ FAILED: Command not successful`);
        console.error(`   Error: ${result.error || result.message}`);
        allPassed = false;
        continue;
      }
      
      if (result.data?.type !== 'draft_email') {
        console.error(`❌ FAILED: Expected draft_email type, got ${result.data?.type}`);
        allPassed = false;
        continue;
      }
      
      const draft = result.data.draft;
      if (!draft) {
        console.error(`❌ FAILED: No draft generated`);
        allPassed = false;
        continue;
      }
      
      // Check email address
      if (draft.to !== testCase.expectedTo) {
        console.error(`❌ FAILED: Email address mismatch`);
        console.error(`   Expected: ${testCase.expectedTo}`);
        console.error(`   Got: ${draft.to}`);
        allPassed = false;
        continue;
      }
      
      // Check topic
      if (!draft.topic || !draft.topic.includes(testCase.expectedTopic.split(' ')[0])) {
        console.error(`❌ FAILED: Topic mismatch`);
        console.error(`   Expected to contain: ${testCase.expectedTopic}`);
        console.error(`   Got: ${draft.topic}`);
        allPassed = false;
        continue;
      }
      
      // Check that subject and body were generated
      if (!draft.subject || !draft.body) {
        console.error(`❌ FAILED: Missing subject or body`);
        allPassed = false;
        continue;
      }
      
      console.log(`✅ PASSED`);
      console.log(`   To: ${draft.to}`);
      console.log(`   Subject: ${draft.subject}`);
      console.log(`   Topic: ${draft.topic}`);
      
    } catch (error) {
      console.error(`❌ FAILED: Exception thrown`);
      console.error(`   Error:`, error);
      allPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED! Email send feature is working correctly.');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED! Email send feature is BROKEN.');
    console.log('\n⚠️  THIS IS A CRITICAL FEATURE THAT MUST BE FIXED IMMEDIATELY!');
    console.log('📖 See .claude/email-send-fix.md for fix documentation');
    process.exit(1);
  }
}

test().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});