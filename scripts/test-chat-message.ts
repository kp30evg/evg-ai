import { db } from '../lib/db/index.js';
import { workspaces, users, entities } from '../lib/db/schema/unified.js';
import { eq, and } from 'drizzle-orm';
import * as everchat from '../lib/modules-simple/everchat.js';

async function testMessage() {
  try {
    // Get Evergreen workspace
    const [workspace] = await db.select().from(workspaces)
      .where(eq(workspaces.clerkOrgId, 'org_321PMbgXawub3NIZaTRy0OQaBhP'))
      .limit(1);
    
    if (!workspace) {
      console.error('Workspace not found');
      return;
    }
    
    console.log('Using workspace:', workspace.id, workspace.name);
    
    // Get Kian's user ID
    const [kianUser] = await db.select().from(users)
      .where(eq(users.clerkUserId, 'user_321PIsZrSDgVtG1YS8G8P9kwfVn'))
      .limit(1);
    
    if (!kianUser) {
      console.error('Kian user not found');
      return;
    }
    
    console.log('Kian user:', kianUser.id, kianUser.email);
    
    // Get Luis's user ID
    const [luisUser] = await db.select().from(users)
      .where(eq(users.clerkUserId, 'user_32CFUw8Wp5SI9ruvS0YsxXxH6cQ'))
      .limit(1);
    
    if (!luisUser) {
      console.error('Luis user not found');
      return;
    }
    
    console.log('Luis user:', luisUser.id, luisUser.email);
    
    // Create or find DM conversation
    const conversationTitle = `DM: ${luisUser.name || luisUser.email}`;
    const participants = [kianUser.clerkUserId, luisUser.clerkUserId];
    
    // Check if conversation exists
    const existingConvs = await everchat.getConversations(workspace.id, 100);
    let conversation = existingConvs.find((c: any) => 
      c.data?.title === conversationTitle || 
      (c.data?.participants?.includes(kianUser.clerkUserId) && 
       c.data?.participants?.includes(luisUser.clerkUserId))
    );
    
    if (!conversation) {
      console.log('Creating new DM conversation...');
      conversation = await everchat.createConversation(
        workspace.id,
        conversationTitle,
        participants,
        kianUser.clerkUserId
      );
      console.log('Created conversation:', conversation.id);
    } else {
      console.log('Using existing conversation:', conversation.id);
    }
    
    // Send a test message
    console.log('Sending test message...');
    const message = await everchat.sendMessage(
      workspace.id,
      'Test message from script - Hi Luis!',
      conversation.id,
      kianUser.clerkUserId,
      'Kian Pezeshki',
      undefined
    );
    
    console.log('Message sent successfully:', message.id);
    console.log('Message content:', message.data?.content);
    
    // Verify message was stored
    const messages = await everchat.getMessages(workspace.id, conversation.id, 10);
    console.log('\nMessages in conversation:', messages.length);
    messages.forEach((m: any) => {
      console.log('- Message:', m.data?.content || m.data?.text);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

testMessage();