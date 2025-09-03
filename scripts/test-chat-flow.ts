import { config } from 'dotenv';
import path from 'path';

// Load environment from .claude/.env BEFORE any imports that use env vars
config({ path: path.join(__dirname, '..', '.claude', '.env') });

// Verify env loaded
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found. Check .claude/.env file');
  process.exit(1);
}

// Now safe to import modules that use env vars
const everchat = require('../lib/modules-simple/everchat');

async function testChatFlow() {
  try {
    console.log('Testing full EverChat flow...\n');
    
    // Get first workspace
    const { db } = require('../lib/db');
    const workspaces = await db.query.workspaces.findMany({ limit: 1 });
    if (workspaces.length === 0) {
      console.error('No workspaces found!');
      process.exit(1);
    }
    
    const workspaceId = workspaces[0].id;
    console.log('Using workspace:', workspaceId);
    
    // Step 1: Create a conversation for #general channel
    console.log('\n1. Creating #general conversation...');
    const generalConv = await everchat.createConversation(
      workspaceId,
      '#general',
      [],
      'test-user'
    );
    console.log('Created conversation:', generalConv.id);
    console.log('Title:', generalConv.data.title);
    console.log('Channel:', generalConv.data.channel);
    
    // Step 2: Send a message to the conversation
    console.log('\n2. Sending message to #general...');
    const message1 = await everchat.sendMessage(
      workspaceId,
      'Hello from the test script!',
      generalConv.id,
      'test-user',
      'Test User',
      null
    );
    console.log('Sent message:', message1.id);
    console.log('Content:', message1.data.content);
    
    // Step 3: Retrieve messages for the conversation
    console.log('\n3. Retrieving messages for #general...');
    const messages = await everchat.getMessages(
      workspaceId,
      generalConv.id,
      10
    );
    console.log('Found', messages.length, 'messages:');
    messages.forEach((msg: any) => {
      console.log(`- ${msg.data.content} (from: ${msg.data.userName || msg.data.from})`);
    });
    
    // Step 4: Get all conversations
    console.log('\n4. Getting all conversations...');
    const allConvs = await everchat.getConversations(workspaceId, 10);
    console.log('Found', allConvs.length, 'conversations:');
    allConvs.forEach((conv: any) => {
      console.log(`- ${conv.data.title} (${conv.data.messageCount || 0} messages)`);
    });
    
    // Step 5: Search for messages
    console.log('\n5. Searching for messages containing "test"...');
    const searchResults = await everchat.searchMessages(workspaceId, 'test', 10);
    console.log('Found', searchResults.length, 'matching messages');
    
    console.log('\n✅ All tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testChatFlow();