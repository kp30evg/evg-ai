import { db } from '@/lib/db';
import { entities } from '@/lib/db/schema/unified';
import { eq } from 'drizzle-orm';

async function debugEmailAccounts() {
  console.log('=== Debugging Email Accounts ===\n');
  
  // Get all email accounts
  const emailAccounts = await db
    .select({
      id: entities.id,
      workspaceId: entities.workspaceId,
      userId: entities.userId,
      type: entities.type,
      data: entities.data,
      metadata: entities.metadata,
      createdAt: entities.createdAt
    })
    .from(entities)
    .where(eq(entities.type, 'email_account'));
  
  console.log(`Total email accounts found: ${emailAccounts.length}\n`);
  
  for (const account of emailAccounts) {
    const data = account.data as any;
    console.log('--- Email Account ---');
    console.log('ID:', account.id);
    console.log('Workspace ID:', account.workspaceId);
    console.log('User ID:', account.userId);
    console.log('Email:', data.email || data.userEmail);
    console.log('Clerk User ID:', data.clerkUserId);
    console.log('Created At:', account.createdAt);
    console.log('Active:', data.isActive);
    console.log('');
  }
  
  // Check for duplicates or missing user_id
  const noUserIdAccounts = emailAccounts.filter(a => !a.userId);
  if (noUserIdAccounts.length > 0) {
    console.log('⚠️  WARNING: Found accounts without user_id:', noUserIdAccounts.length);
    for (const account of noUserIdAccounts) {
      const data = account.data as any;
      console.log(`  - ${data.email || data.userEmail} (workspace: ${account.workspaceId})`);
    }
  }
  
  // Group by workspace and user
  const grouped = new Map<string, Map<string, any[]>>();
  for (const account of emailAccounts) {
    if (!grouped.has(account.workspaceId)) {
      grouped.set(account.workspaceId, new Map());
    }
    const workspaceMap = grouped.get(account.workspaceId)!;
    const userId = account.userId || 'NO_USER_ID';
    if (!workspaceMap.has(userId)) {
      workspaceMap.set(userId, []);
    }
    workspaceMap.get(userId)!.push(account);
  }
  
  console.log('\n=== Accounts by Workspace and User ===');
  for (const [workspaceId, userMap] of grouped) {
    console.log(`\nWorkspace: ${workspaceId}`);
    for (const [userId, accounts] of userMap) {
      const data = accounts[0].data as any;
      console.log(`  User: ${userId} - ${data.email || data.userEmail} (${accounts.length} account(s))`);
    }
  }
  
  process.exit(0);
}

debugEmailAccounts().catch(console.error);