import 'dotenv/config';
import { db } from '../lib/db';
import { entities, users, workspaces } from '../lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';

async function checkCrossWorkspaceContamination() {
  console.log('=== CHECKING CROSS-WORKSPACE CONTAMINATION ===\n');
  
  // Find Victor's account
  const [victor] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'victor@novakindustries.ca'))
    .limit(1);
  
  // Find Kian's account  
  const [kian] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'kian@evergreengroup.ai'))
    .limit(1);
  
  if (!victor || !kian) {
    console.log('Could not find both users');
    process.exit(1);
  }
  
  console.log('Victor:');
  console.log('  ID:', victor.id);
  console.log('  Workspace:', victor.workspaceId);
  console.log('  Clerk ID:', victor.clerkUserId);
  
  console.log('\nKian:');
  console.log('  ID:', kian.id);
  console.log('  Workspace:', kian.workspaceId);
  console.log('  Clerk ID:', kian.clerkUserId);
  
  // Check Victor's emails
  const victorEmails = await db
    .select()
    .from(entities)
    .where(
      and(
        eq(entities.workspaceId, victor.workspaceId),
        eq(entities.userId, victor.id),
        eq(entities.type, 'email')
      )
    )
    .limit(5);
  
  console.log(`\nVictor's emails (${victorEmails.length} found):`);
  for (const email of victorEmails) {
    const data = email.data as any;
    console.log(`  - ${data.subject} from ${data.from?.email}`);
  }
  
  // Check Kian's emails
  const kianEmails = await db
    .select()
    .from(entities)
    .where(
      and(
        eq(entities.workspaceId, kian.workspaceId),
        eq(entities.userId, kian.id),
        eq(entities.type, 'email')
      )
    )
    .limit(5);
  
  console.log(`\nKian's emails (${kianEmails.length} found):`);
  for (const email of kianEmails) {
    const data = email.data as any;
    console.log(`  - ${data.subject} from ${data.from?.email}`);
  }
  
  // Check if Victor's workspace has any of Kian's emails (CRITICAL ISSUE)
  console.log('\n=== CRITICAL CHECK: Cross-workspace contamination ===');
  
  // Check if there are emails in Victor's workspace that belong to Kian
  const wrongWorkspaceEmails = await db
    .select()
    .from(entities)
    .where(
      and(
        eq(entities.workspaceId, victor.workspaceId),
        eq(entities.userId, kian.id),
        eq(entities.type, 'email')
      )
    );
  
  if (wrongWorkspaceEmails.length > 0) {
    console.error(`❌ CRITICAL: Found ${wrongWorkspaceEmails.length} of Kian's emails in Victor's workspace!`);
  }
  
  // Check if there are emails in Kian's workspace that belong to Victor
  const wrongWorkspaceEmails2 = await db
    .select()
    .from(entities)
    .where(
      and(
        eq(entities.workspaceId, kian.workspaceId),
        eq(entities.userId, victor.id),
        eq(entities.type, 'email')
      )
    );
  
  if (wrongWorkspaceEmails2.length > 0) {
    console.error(`❌ CRITICAL: Found ${wrongWorkspaceEmails2.length} of Victor's emails in Kian's workspace!`);
  }
  
  // Check for emails without proper isolation
  console.log('\n=== Checking for emails without user_id in both workspaces ===');
  
  const victorWorkspaceNoUser = await db
    .select()
    .from(entities)
    .where(
      and(
        eq(entities.workspaceId, victor.workspaceId),
        eq(entities.type, 'email')
      )
    );
  
  const noUserCount = victorWorkspaceNoUser.filter(e => !e.userId).length;
  if (noUserCount > 0) {
    console.error(`❌ Victor's workspace has ${noUserCount} emails without user_id!`);
  }
  
  const kianWorkspaceNoUser = await db
    .select()
    .from(entities)
    .where(
      and(
        eq(entities.workspaceId, kian.workspaceId),
        eq(entities.type, 'email')
      )
    );
  
  const noUserCount2 = kianWorkspaceNoUser.filter(e => !e.userId).length;
  if (noUserCount2 > 0) {
    console.error(`❌ Kian's workspace has ${noUserCount2} emails without user_id!`);
    
    // Show some examples
    const examples = kianWorkspaceNoUser.filter(e => !e.userId).slice(0, 3);
    for (const email of examples) {
      const data = email.data as any;
      console.log(`  Example: "${data.subject}" from ${data.from?.email}`);
    }
  }
  
  if (noUserCount === 0 && noUserCount2 === 0 && wrongWorkspaceEmails.length === 0 && wrongWorkspaceEmails2.length === 0) {
    console.log('✅ No cross-workspace contamination detected');
  }
  
  process.exit(0);
}

checkCrossWorkspaceContamination().catch(console.error);