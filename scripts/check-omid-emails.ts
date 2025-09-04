import { db } from '@/lib/db';
import { entities, users, workspaces } from '@/lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';

async function checkOmidEmails() {
  console.log('\n=== Checking Omid\'s Email Data ===\n');
  
  // Find Omid's user record
  const omidUser = await db
    .select()
    .from(users)
    .where(eq(users.email, 'omid@evergreengroup.ai'))
    .limit(1);
  
  if (!omidUser.length) {
    console.log('❌ Omid user not found in database');
    return;
  }
  
  const user = omidUser[0];
  console.log('✅ Found Omid:', {
    id: user.id,
    email: user.email,
    clerkUserId: user.clerkUserId,
    workspaceId: user.workspaceId
  });
  
  // Check if Omid has an email_account entity
  const emailAccount = await db
    .select()
    .from(entities)
    .where(
      and(
        eq(entities.workspaceId, user.workspaceId),
        eq(entities.userId, user.id),
        eq(entities.type, 'email_account')
      )
    );
  
  console.log(`\n📧 Email account entities: ${emailAccount.length}`);
  if (emailAccount.length > 0) {
    const account = emailAccount[0];
    console.log('Account details:', {
      id: account.id,
      email: (account.data as any)?.email,
      isActive: (account.data as any)?.isActive,
      lastSyncAt: (account.data as any)?.lastSyncAt
    });
  }
  
  // Count emails for Omid
  const emails = await db
    .select()
    .from(entities)
    .where(
      and(
        eq(entities.workspaceId, user.workspaceId),
        eq(entities.userId, user.id),
        eq(entities.type, 'email')
      )
    );
  
  console.log(`\n📬 Total emails for Omid: ${emails.length}`);
  
  if (emails.length > 0) {
    console.log('\nFirst 3 emails:');
    emails.slice(0, 3).forEach(email => {
      const data = email.data as any;
      console.log(`- Subject: ${data.subject}`);
      console.log(`  From: ${data.from?.email || data.from?.name}`);
      console.log(`  Date: ${data.date}`);
      console.log('---');
    });
  }
  
  // Check if there are emails without userId (wrong isolation)
  const emailsWithoutUser = await db
    .select()
    .from(entities)
    .where(
      and(
        eq(entities.workspaceId, user.workspaceId),
        eq(entities.type, 'email'),
        eq(entities.userId, null as any)
      )
    );
  
  console.log(`\n⚠️  Emails without userId: ${emailsWithoutUser.length}`);
  
  // Count all emails in workspace
  const allWorkspaceEmails = await db
    .select()
    .from(entities)
    .where(
      and(
        eq(entities.workspaceId, user.workspaceId),
        eq(entities.type, 'email')
      )
    );
  
  console.log(`\n📊 Total emails in workspace: ${allWorkspaceEmails.length}`);
  
  // Group by userId to see distribution
  const userCounts = new Map<string | null, number>();
  allWorkspaceEmails.forEach(email => {
    const userId = email.userId;
    userCounts.set(userId, (userCounts.get(userId) || 0) + 1);
  });
  
  console.log('\nEmail distribution by user:');
  userCounts.forEach((count, userId) => {
    console.log(`- User ${userId || 'NULL'}: ${count} emails`);
  });
  
  process.exit(0);
}

checkOmidEmails().catch(console.error);