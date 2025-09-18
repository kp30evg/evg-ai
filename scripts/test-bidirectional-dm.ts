import 'dotenv/config';
import { db } from '../lib/db';
import { users, workspaces, entities } from '../lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';
import * as everchat from '../lib/modules-simple/everchat';

async function testBidirectionalDM() {
  console.log('🔄 Testing Bidirectional DM Messaging...\n');
  
  // Get Evergreen workspace
  const [workspace] = await db.select().from(workspaces)
    .where(eq(workspaces.clerkOrgId, 'org_321PMbgXawub3NIZaTRy0OQaBhP'))
    .limit(1);
  
  if (!workspace) {
    console.error('❌ Evergreen workspace not found!');
    process.exit(1);
  }
  
  // Get Kian and Omid users
  const [kian] = await db.select().from(users)
    .where(eq(users.clerkUserId, 'user_321PIsZrSDgVtG1YS8G8P9kwfVn'))
    .limit(1);
    
  const [omid] = await db.select().from(users)
    .where(eq(users.clerkUserId, 'user_327TZuO5dXuPdMCrlsXg8Y21Nhr'))
    .limit(1);
  
  if (!kian || !omid) {
    console.error('❌ Users not found!');
    process.exit(1);
  }
  
  console.log('👤 User 1: Kian (', kian.email, ')');
  console.log('👤 User 2: Omid (', omid.email, ')');
  
  // Create or find DM conversation from Kian's perspective
  console.log('\n📝 Kian creates/finds DM with Omid...');
  const kianConversation = await everchat.createConversation(
    workspace.id,
    'DM: Omid Fazeli',
    [kian.clerkUserId!, omid.clerkUserId!],
    kian.clerkUserId!,
    kian.id
  );
  console.log('  Conversation ID:', kianConversation.id.substring(0, 8) + '...');
  
  // Create or find DM conversation from Omid's perspective
  console.log('\n📝 Omid creates/finds DM with Kian...');
  const omidConversation = await everchat.createConversation(
    workspace.id,
    'DM: Kian Pezeshki',
    [omid.clerkUserId!, kian.clerkUserId!],
    omid.clerkUserId!,
    omid.id
  );
  console.log('  Conversation ID:', omidConversation.id.substring(0, 8) + '...');
  
  // Verify they got the same conversation
  if (kianConversation.id === omidConversation.id) {
    console.log('\n✅ SUCCESS: Both users are using the SAME conversation!');
  } else {
    console.log('\n❌ FAILURE: Users have DIFFERENT conversations!');
    console.log('  Kian\'s conversation:', kianConversation.id);
    console.log('  Omid\'s conversation:', omidConversation.id);
  }
  
  // Send test messages
  const timestamp = new Date().toLocaleTimeString();
  
  console.log('\n💬 Sending message from Kian to Omid...');
  await everchat.sendMessage(
    workspace.id,
    `Test from Kian at ${timestamp}`,
    kianConversation.id,
    kian.id,
    kian.clerkUserId!,
    'Kian',
    undefined
  );
  
  console.log('💬 Sending reply from Omid to Kian...');
  await everchat.sendMessage(
    workspace.id,
    `Reply from Omid at ${timestamp}`,
    omidConversation.id,
    omid.id,
    omid.clerkUserId!,
    'Omid',
    undefined
  );
  
  // Check messages in conversation
  console.log('\n📨 Retrieving messages...');
  const messages = await everchat.getMessages(workspace.id, kianConversation.id);
  
  console.log('Found', messages.length, 'messages in conversation:');
  messages.slice(-5).forEach((msg: any) => {
    console.log(`  - ${msg.data.userName}: "${msg.data.content}"`);
  });
  
  console.log('\n🎉 Bidirectional messaging test complete!');
  console.log('\n📝 To verify in browser:');
  console.log('1. Open http://localhost:3000/chat in two browsers');
  console.log('2. Log in as Kian in one, Omid in the other');
  console.log('3. Both should see the same conversation with all messages');
  console.log('4. Messages sent from either side should appear instantly for both');
  
  process.exit(0);
}

testBidirectionalDM().catch(console.error);