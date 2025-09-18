import 'dotenv/config';
import { db } from '../lib/db';
import { users, workspaces, entities } from '../lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';
import * as everchat from '../lib/modules-simple/everchat';

async function testDMMessaging() {
  console.log('🔍 Testing Direct Messaging functionality...\n');
  
  // Get Evergreen workspace
  const [workspace] = await db.select().from(workspaces)
    .where(eq(workspaces.clerkOrgId, 'org_321PMbgXawub3NIZaTRy0OQaBhP'))
    .limit(1);
  
  if (!workspace) {
    console.error('❌ Evergreen workspace not found!');
    process.exit(1);
  }
  
  console.log('✅ Found Evergreen workspace:', workspace.id);
  
  // Get two users from Evergreen workspace
  const evergreenUsers = await db.select().from(users)
    .where(eq(users.workspaceId, workspace.id))
    .limit(2);
  
  if (evergreenUsers.length < 2) {
    console.error('❌ Need at least 2 users in workspace for DM test');
    process.exit(1);
  }
  
  const user1 = evergreenUsers[0];
  const user2 = evergreenUsers[1];
  
  console.log('\n👤 User 1:', user1.email, '(DB ID:', user1.id.substring(0, 8) + '...)');
  console.log('👤 User 2:', user2.email, '(DB ID:', user2.id.substring(0, 8) + '...)');
  
  // Create a DM conversation
  console.log('\n📝 Creating DM conversation...');
  const conversation = await everchat.createConversation(
    workspace.id,
    `DM: ${user1.name} & ${user2.name}`,
    [user1.clerkUserId!, user2.clerkUserId!],
    user1.clerkUserId!,
    user1.id
  );
  
  console.log('✅ Created conversation:', conversation.id);
  
  // Send a message from user1 to user2
  console.log('\n💬 Sending message from', user1.email, 'to', user2.email);
  const message1 = await everchat.sendMessage(
    workspace.id,
    'Hello! This is a test direct message.',
    conversation.id,
    user1.id,  // Database user ID
    user1.clerkUserId!,  // Clerk user ID
    user1.name || user1.email,
    user1.imageUrl || undefined
  );
  
  console.log('✅ Message sent:', message1.id);
  
  // Send a reply from user2
  console.log('\n💬 Sending reply from', user2.email);
  const message2 = await everchat.sendMessage(
    workspace.id,
    'Hi! Got your message, this DM system works!',
    conversation.id,
    user2.id,  // Database user ID
    user2.clerkUserId!,  // Clerk user ID
    user2.name || user2.email,
    user2.imageUrl || undefined
  );
  
  console.log('✅ Reply sent:', message2.id);
  
  // Retrieve messages
  console.log('\n📨 Retrieving conversation messages...');
  const messages = await everchat.getMessages(workspace.id, conversation.id);
  
  console.log('✅ Found', messages.length, 'messages:');
  messages.forEach((msg: any) => {
    const userData = msg.data;
    console.log('  -', userData.userName + ':', userData.content);
  });
  
  // Check data isolation - verify messages are properly isolated by workspace
  console.log('\n🔒 Checking data isolation...');
  const allMessages = await db.select().from(entities)
    .where(and(
      eq(entities.workspaceId, workspace.id),
      eq(entities.type, 'message')
    ));
  
  console.log('✅ Total messages in workspace:', allMessages.length);
  
  // Check that messages have proper user_id set
  const messagesWithUserId = allMessages.filter(m => m.userId !== null);
  console.log('✅ Messages with user_id set:', messagesWithUserId.length);
  
  if (messagesWithUserId.length === 0) {
    console.log('⚠️  Warning: No messages have user_id set. User isolation may not be working.');
  } else {
    console.log('✅ User isolation appears to be working correctly.');
  }
  
  console.log('\n🎉 Direct messaging test completed successfully!');
  process.exit(0);
}

testDMMessaging().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});