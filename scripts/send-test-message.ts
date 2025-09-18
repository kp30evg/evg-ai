import 'dotenv/config';
import { db } from '../lib/db';
import { users, workspaces } from '../lib/db/schema/unified';
import { eq } from 'drizzle-orm';
import * as everchat from '../lib/modules-simple/everchat';

async function sendTestMessage() {
  console.log('📨 Sending test message...\n');
  
  // Get Evergreen workspace
  const [workspace] = await db.select().from(workspaces)
    .where(eq(workspaces.clerkOrgId, 'org_321PMbgXawub3NIZaTRy0OQaBhP'))
    .limit(1);
  
  if (!workspace) {
    console.error('❌ Evergreen workspace not found!');
    process.exit(1);
  }
  
  // Get Kian's user
  const [kian] = await db.select().from(users)
    .where(eq(users.email, 'kian@evergreengroup.ai'))
    .limit(1);
  
  if (!kian) {
    console.error('❌ Kian not found!');
    process.exit(1);
  }
  
  // Find or create conversation for general channel
  const conversations = await everchat.getConversations(workspace.id, 100);
  let generalConv = conversations.find((c: any) => c.data?.channel === 'general' || c.data?.title === '#general');
  
  if (!generalConv) {
    console.log('Creating #general conversation...');
    generalConv = await everchat.createConversation(
      workspace.id,
      '#general',
      [],
      kian.clerkUserId!,
      kian.id
    );
  }
  
  console.log('✅ Using conversation:', generalConv.data.title, '(ID:', generalConv.id.substring(0, 8) + '...)');
  
  // Send a test message
  const testMessage = `Test message at ${new Date().toLocaleTimeString()}`;
  console.log('💬 Sending:', testMessage);
  
  const message = await everchat.sendMessage(
    workspace.id,
    testMessage,
    generalConv.id,
    kian.id,
    kian.clerkUserId!,
    'Kian (Test Script)',
    undefined
  );
  
  console.log('✅ Message sent! ID:', message.id);
  console.log('\n📝 To verify:');
  console.log('1. Open http://localhost:3000/chat');
  console.log('2. Click on #general channel');
  console.log('3. You should see the test message');
  
  process.exit(0);
}

sendTestMessage().catch(console.error);