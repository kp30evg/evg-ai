#!/usr/bin/env tsx
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import * as everchat from '../lib/modules-simple/everchat';

const TEST_WORKSPACE_ID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_USER_ID = 'test-user';

async function testEverchatDirectly() {
  console.log('\n🧪 Testing everchat functions directly...\n');

  try {
    // 1. Create a conversation
    console.log('1. Creating conversation...');
    const conversation = await everchat.createConversation(
      TEST_WORKSPACE_ID,
      'Test Conversation'
    );
    console.log('✅ Conversation created:', conversation.id);

    // 2. Send a message
    console.log('2. Sending message...');
    const message = await everchat.sendMessage(
      TEST_WORKSPACE_ID,
      'Hello from direct test!',
      conversation.id,
      TEST_USER_ID
    );
    console.log('✅ Message sent:', message.id);

    // 3. Get messages
    console.log('3. Getting messages...');
    const messages = await everchat.getMessages(
      TEST_WORKSPACE_ID,
      conversation.id
    );
    console.log('✅ Retrieved messages:', messages.length);
    
    if (messages.length > 0) {
      console.log('   Latest message:', messages[0].data.content);
    }

  } catch (error) {
    console.error('❌ Error during direct test:', error);
    console.error('Error details:', error.stack);
  }
}

testEverchatDirectly();