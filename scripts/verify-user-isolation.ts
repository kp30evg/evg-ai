import 'dotenv/config';
import { db } from '../lib/db';
import { entities, users, workspaces } from '../lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';

async function verifyUserIsolation() {
  console.log('=== VERIFYING USER DATA ISOLATION ===\n');
  
  // Get all users
  const allUsers = await db.select().from(users);
  console.log(`Total users in database: ${allUsers.length}`);
  
  if (allUsers.length === 0) {
    console.error('❌ CRITICAL: No users in database! Run sync-users-simple.ts first!');
    process.exit(1);
  }
  
  // Get all workspaces
  const allWorkspaces = await db.select().from(workspaces);
  console.log(`Total workspaces: ${allWorkspaces.length}\n`);
  
  // For each workspace, check user isolation
  for (const workspace of allWorkspaces) {
    console.log(`\nWorkspace: ${workspace.name} (${workspace.id})`);
    console.log(`Clerk Org ID: ${workspace.clerkOrgId}`);
    
    // Get users in this workspace
    const workspaceUsers = allUsers.filter(u => u.workspaceId === workspace.id);
    console.log(`  Users in workspace: ${workspaceUsers.length}`);
    
    for (const user of workspaceUsers) {
      console.log(`\n  User: ${user.email} (${user.id})`);
      console.log(`    Clerk ID: ${user.clerkUserId}`);
      
      // Check email accounts
      const emailAccounts = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.workspaceId, workspace.id),
            eq(entities.userId, user.id),
            eq(entities.type, 'email_account')
          )
        );
      
      if (emailAccounts.length > 0) {
        const accountData = emailAccounts[0].data as any;
        console.log(`    ✅ Has Gmail account: ${accountData.email || accountData.userEmail}`);
      } else {
        console.log(`    ⚠️  No Gmail account connected`);
      }
      
      // Check emails
      const emailCount = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.workspaceId, workspace.id),
            eq(entities.userId, user.id),
            eq(entities.type, 'email')
          )
        );
      
      console.log(`    📧 Emails synced: ${emailCount.length}`);
      
      // Check for emails WITHOUT user_id (security issue)
      const orphanEmails = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.workspaceId, workspace.id),
            eq(entities.type, 'email')
          )
        );
      
      const orphanCount = orphanEmails.filter(e => !e.userId).length;
      if (orphanCount > 0) {
        console.log(`    ❌ SECURITY ISSUE: ${orphanCount} emails without user_id!`);
      }
    }
  }
  
  // Check for cross-contamination
  console.log('\n=== CHECKING FOR CROSS-CONTAMINATION ===\n');
  
  // Get all email accounts
  const allEmailAccounts = await db
    .select()
    .from(entities)
    .where(eq(entities.type, 'email_account'));
  
  console.log(`Total email accounts: ${allEmailAccounts.length}`);
  
  // Check if any accounts are missing user_id
  const accountsWithoutUser = allEmailAccounts.filter(a => !a.userId);
  if (accountsWithoutUser.length > 0) {
    console.error(`❌ CRITICAL: ${accountsWithoutUser.length} email accounts without user_id!`);
    for (const account of accountsWithoutUser) {
      const data = account.data as any;
      console.error(`  - ${data.email || data.userEmail} in workspace ${account.workspaceId}`);
    }
  } else {
    console.log('✅ All email accounts have user_id set');
  }
  
  // Check for duplicate Gmail accounts (same email, different users)
  const emailMap = new Map<string, any[]>();
  for (const account of allEmailAccounts) {
    const data = account.data as any;
    const email = data.email || data.userEmail;
    if (email) {
      if (!emailMap.has(email)) {
        emailMap.set(email, []);
      }
      emailMap.get(email)!.push(account);
    }
  }
  
  for (const [email, accounts] of emailMap) {
    if (accounts.length > 1) {
      console.log(`\n⚠️  Gmail account ${email} is connected to ${accounts.length} different users:`);
      for (const account of accounts) {
        const user = allUsers.find(u => u.id === account.userId);
        console.log(`  - User: ${user?.email || 'UNKNOWN'} (${account.userId}) in workspace ${account.workspaceId}`);
      }
    }
  }
  
  console.log('\n=== VERIFICATION COMPLETE ===');
  process.exit(0);
}

verifyUserIsolation().catch(console.error);