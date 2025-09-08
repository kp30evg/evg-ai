#!/usr/bin/env node

/**
 * Test to verify email isolation is working
 * This MUST pass or the system is not secure
 */

import 'dotenv/config';
import { db } from '@/lib/db';
import { entities, users, workspaces } from '@/lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';
import { createEmailQuery } from '@/lib/db/secure-query';

async function testEmailIsolation() {
  console.log('🔒 Testing Email Isolation Security\n');
  
  try {
    // Get two different users
    const allUsers = await db
      .select()
      .from(users)
      .limit(2);
    
    if (allUsers.length < 2) {
      console.log('⚠️  Need at least 2 users to test isolation. Skipping test.');
      return;
    }
    
    const user1 = allUsers[0];
    const user2 = allUsers[1];
    
    console.log('Testing with users:');
    console.log('  User 1:', user1.email, '(ID:', user1.id, ')');
    console.log('  User 2:', user2.email, '(ID:', user2.id, ')');
    
    // Get their workspace
    const workspace = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, user1.workspaceId))
      .limit(1);
    
    if (!workspace[0]) {
      console.log('❌ No workspace found');
      return;
    }
    
    // Test 1: Create secure query for user1
    console.log('\n📧 Test 1: Secure query for User 1');
    const query1 = createEmailQuery(workspace[0].id, user1.id);
    const emails1 = await query1.baseQuery().limit(5);
    
    console.log(`  Found ${emails1.length} emails for User 1`);
    
    // Verify all emails belong to user1
    const wrongUser1 = emails1.filter(e => e.userId !== user1.id);
    if (wrongUser1.length > 0) {
      console.error('❌ FAILED: Found', wrongUser1.length, 'emails that don\'t belong to User 1');
      process.exit(1);
    } else {
      console.log('✅ PASSED: All emails belong to User 1');
    }
    
    // Test 2: Create secure query for user2
    console.log('\n📧 Test 2: Secure query for User 2');
    const query2 = createEmailQuery(workspace[0].id, user2.id);
    const emails2 = await query2.baseQuery().limit(5);
    
    console.log(`  Found ${emails2.length} emails for User 2`);
    
    // Verify all emails belong to user2
    const wrongUser2 = emails2.filter(e => e.userId !== user2.id);
    if (wrongUser2.length > 0) {
      console.error('❌ FAILED: Found', wrongUser2.length, 'emails that don\'t belong to User 2');
      process.exit(1);
    } else {
      console.log('✅ PASSED: All emails belong to User 2');
    }
    
    // Test 3: Verify no cross-contamination
    console.log('\n🔐 Test 3: Cross-contamination check');
    
    // Check if any of user1's emails appear in user2's results
    const user1EmailIds = emails1.map(e => e.id);
    const user2EmailIds = emails2.map(e => e.id);
    
    const overlap = user1EmailIds.filter(id => user2EmailIds.includes(id));
    
    if (overlap.length > 0) {
      console.error('❌ CRITICAL FAILURE: Found', overlap.length, 'emails visible to both users!');
      console.error('Overlapping email IDs:', overlap);
      process.exit(1);
    } else {
      console.log('✅ PASSED: No emails are shared between users');
    }
    
    // Test 4: Try to bypass security (this should fail)
    console.log('\n⚠️  Test 4: Attempting to bypass security...');
    
    try {
      // Try to query without using secure wrapper (BAD - should never do this)
      const unsafeEmails = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.workspaceId, workspace[0].id),
            eq(entities.type, 'email')
            // MISSING userId filter - this is the vulnerability we're protecting against
          )
        )
        .limit(10);
      
      console.log('⚠️  WARNING: Unsafe query returned', unsafeEmails.length, 'emails');
      
      // Check how many belong to different users
      const userIds = new Set(unsafeEmails.map(e => e.userId));
      if (userIds.size > 1) {
        console.error('❌ VULNERABILITY CONFIRMED: Unsafe query returned emails from', userIds.size, 'different users');
        console.error('This is why we MUST use secure queries!');
      }
    } catch (error) {
      console.log('Query failed (good if this was blocked)');
    }
    
    console.log('\n✅ All security tests completed!');
    console.log('📌 Remember: ALWAYS use createEmailQuery() or createSecureQuery() for user data');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the test
testEmailIsolation();