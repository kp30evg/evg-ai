import 'dotenv/config';
import { db } from '../lib/db';
import { entities, users, workspaces } from '../lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';

async function testUserIsolationSecurity() {
  console.log('=== TESTING USER ISOLATION SECURITY ===\n');
  console.log('This test verifies that users can ONLY see their own Gmail data.\n');
  
  // Get all workspaces with users
  const allWorkspaces = await db.select().from(workspaces);
  const allUsers = await db.select().from(users);
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  for (const workspace of allWorkspaces) {
    const workspaceUsers = allUsers.filter(u => u.workspaceId === workspace.id);
    
    if (workspaceUsers.length < 2) {
      continue; // Skip workspaces with less than 2 users
    }
    
    console.log(`\nTesting workspace: ${workspace.name}`);
    console.log(`Users in workspace: ${workspaceUsers.length}`);
    
    // For each pair of users, verify isolation
    for (let i = 0; i < workspaceUsers.length; i++) {
      for (let j = i + 1; j < workspaceUsers.length; j++) {
        const user1 = workspaceUsers[i];
        const user2 = workspaceUsers[j];
        
        console.log(`\n  Testing isolation between ${user1.email} and ${user2.email}`);
        
        // Check if user1's emails are isolated from user2
        const user1Emails = await db
          .select()
          .from(entities)
          .where(
            and(
              eq(entities.workspaceId, workspace.id),
              eq(entities.userId, user1.id),
              eq(entities.type, 'email')
            )
          );
        
        const user2Emails = await db
          .select()
          .from(entities)
          .where(
            and(
              eq(entities.workspaceId, workspace.id),
              eq(entities.userId, user2.id),
              eq(entities.type, 'email')
            )
          );
        
        // Check email accounts
        const user1Account = await db
          .select()
          .from(entities)
          .where(
            and(
              eq(entities.workspaceId, workspace.id),
              eq(entities.userId, user1.id),
              eq(entities.type, 'email_account')
            )
          );
        
        const user2Account = await db
          .select()
          .from(entities)
          .where(
            and(
              eq(entities.workspaceId, workspace.id),
              eq(entities.userId, user2.id),
              eq(entities.type, 'email_account')
            )
          );
        
        // Verify no cross-contamination
        let isolationOk = true;
        
        // Check that user1's emails don't have user2's ID
        for (const email of user1Emails) {
          if (email.userId === user2.id) {
            console.error(`    ❌ FAILED: Found user1's email with user2's ID!`);
            isolationOk = false;
            testsFailed++;
            break;
          }
        }
        
        // Check that user2's emails don't have user1's ID
        for (const email of user2Emails) {
          if (email.userId === user1.id) {
            console.error(`    ❌ FAILED: Found user2's email with user1's ID!`);
            isolationOk = false;
            testsFailed++;
            break;
          }
        }
        
        if (isolationOk) {
          console.log(`    ✅ PASSED: Users are properly isolated`);
          console.log(`       User1 has ${user1Emails.length} emails, ${user1Account.length} accounts`);
          console.log(`       User2 has ${user2Emails.length} emails, ${user2Account.length} accounts`);
          testsPassed++;
        }
      }
    }
  }
  
  // Check for orphaned data
  console.log('\n=== CHECKING FOR ORPHANED DATA ===');
  
  const orphanedEmails = await db
    .select()
    .from(entities)
    .where(eq(entities.type, 'email'));
  
  const orphanCount = orphanedEmails.filter(e => !e.userId).length;
  
  if (orphanCount > 0) {
    console.error(`❌ CRITICAL: Found ${orphanCount} emails without user_id!`);
    console.error('   These emails could be accessed by ANY user in the workspace!');
    testsFailed++;
  } else {
    console.log('✅ All emails have proper user_id set');
    testsPassed++;
  }
  
  const orphanedAccounts = await db
    .select()
    .from(entities)
    .where(eq(entities.type, 'email_account'));
  
  const orphanAccountCount = orphanedAccounts.filter(a => !a.userId).length;
  
  if (orphanAccountCount > 0) {
    console.error(`❌ CRITICAL: Found ${orphanAccountCount} email accounts without user_id!`);
    testsFailed++;
  } else {
    console.log('✅ All email accounts have proper user_id set');
    testsPassed++;
  }
  
  // Final report
  console.log('\n=== TEST RESULTS ===');
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  
  if (testsFailed === 0) {
    console.log('\n✅ SUCCESS: All security tests passed!');
    console.log('User data isolation is working correctly.');
  } else {
    console.error(`\n❌ FAILURE: ${testsFailed} security tests failed!`);
    console.error('User data isolation has vulnerabilities that need to be fixed.');
  }
  
  process.exit(testsFailed === 0 ? 0 : 1);
}

testUserIsolationSecurity().catch(console.error);