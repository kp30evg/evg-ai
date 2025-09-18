import 'dotenv/config';
import { db } from '../lib/db';
import { entities, users, workspaces } from '../lib/db/schema/unified';
import { eq, and, desc } from 'drizzle-orm';

async function testRealtimeMessaging() {
  console.log('🔍 Testing Real-time Messaging...\n');
  
  // Get Evergreen workspace
  const [workspace] = await db.select().from(workspaces)
    .where(eq(workspaces.clerkOrgId, 'org_321PMbgXawub3NIZaTRy0OQaBhP'))
    .limit(1);
  
  if (!workspace) {
    console.error('❌ Evergreen workspace not found!');
    process.exit(1);
  }
  
  console.log('✅ Workspace:', workspace.name, '(ID:', workspace.id, ', Clerk:', workspace.clerkOrgId, ')');
  
  // Get recent messages
  const recentMessages = await db.select().from(entities)
    .where(and(
      eq(entities.workspaceId, workspace.id),
      eq(entities.type, 'message')
    ))
    .orderBy(desc(entities.createdAt))
    .limit(10);
  
  console.log('\n📨 Recent messages:', recentMessages.length);
  recentMessages.forEach((msg: any) => {
    const data = msg.data;
    console.log(`  - ${data.userName || 'Unknown'}: "${data.content}" (${new Date(msg.createdAt).toLocaleTimeString()})`);
  });
  
  // Get all conversations
  const conversations = await db.select().from(entities)
    .where(and(
      eq(entities.workspaceId, workspace.id),
      eq(entities.type, 'conversation')
    ))
    .orderBy(desc(entities.updatedAt))
    .limit(10);
  
  console.log('\n💬 Active conversations:', conversations.length);
  conversations.forEach((conv: any) => {
    console.log(`  - ${conv.data.title} (ID: ${conv.id.substring(0, 8)}...)`);
  });
  
  // Check Pusher configuration
  console.log('\n🔔 Pusher Configuration:');
  console.log('  - App Key:', process.env.NEXT_PUBLIC_PUSHER_APP_KEY ? '✅ Set' : '❌ Missing');
  console.log('  - App ID:', process.env.PUSHER_APP_ID ? '✅ Set' : '❌ Missing');
  console.log('  - Secret:', process.env.PUSHER_SECRET ? '✅ Set' : '❌ Missing');
  console.log('  - Cluster:', process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2');
  
  console.log('\n📝 Testing Instructions:');
  console.log('1. Open http://localhost:3000/chat in TWO different browsers or incognito windows');
  console.log('2. Log in as different users (e.g., Kian and Omid)');
  console.log('3. In Kian\'s window, click on Omid to start a DM');
  console.log('4. Send a message from Kian to Omid');
  console.log('5. The message should appear instantly in Omid\'s window');
  console.log('\n🔍 Check browser console for:');
  console.log('  - "Subscribing to channel: private-org-..."');
  console.log('  - "Successfully subscribed to channel: ..."');
  console.log('  - "Received message via Pusher: ..."');
  console.log('\n⚠️  If real-time is not working:');
  console.log('  - Check for "POST /api/pusher/auth 401" errors in server logs');
  console.log('  - Ensure both users are in the same organization');
  console.log('  - Check that Pusher credentials are correct');
  
  process.exit(0);
}

testRealtimeMessaging().catch(console.error);