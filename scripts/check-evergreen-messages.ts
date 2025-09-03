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
const { entityService } = require('../lib/entities/entity-service');
const everchat = require('../lib/modules-simple/everchat');

async function checkEvergreenMessages() {
  try {
    const workspaceId = '3ebb63b5-61dd-4a7f-b645-1f0a6d214f7f'; // Evergreen workspace
    console.log('Checking messages for Evergreen workspace:', workspaceId);
    
    // Check existing messages
    console.log('\n1. Existing messages:');
    const messages = await entityService.find({
      workspaceId,
      type: 'message',
      limit: 10,
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
    
    console.log('Found', messages.length, 'messages');
    messages.forEach((msg: any) => {
      console.log(`- [${msg.id}] ${msg.data.content || msg.data.text || 'No content'}`);
      console.log(`  From: ${msg.data.userName || msg.data.from || 'unknown'}`);
      console.log(`  Created: ${msg.createdAt}`);
    });
    
    // Check conversations
    console.log('\n2. Existing conversations:');
    const conversations = await entityService.find({
      workspaceId,
      type: 'conversation',
      limit: 10
    });
    
    console.log('Found', conversations.length, 'conversations');
    conversations.forEach((conv: any) => {
      console.log(`- [${conv.id}] ${conv.data.title || 'Untitled'}`);
      console.log(`  Channel: ${conv.data.channel || 'none'}`);
      console.log(`  Messages: ${conv.data.messageCount || 0}`);
    });
    
    // Create a test conversation and message
    console.log('\n3. Creating test data for Evergreen workspace...');
    
    // Check if #general exists
    let generalConv = conversations.find((c: any) => c.data.channel === 'general');
    
    if (!generalConv) {
      console.log('Creating #general conversation...');
      generalConv = await everchat.createConversation(
        workspaceId,
        '#general',
        [],
        'user_321PIsZrSDgVtG1YS8G8P9kwfVn'
      );
      console.log('Created:', generalConv.id);
    } else {
      console.log('Using existing #general:', generalConv.id);
    }
    
    // Send a test message
    console.log('Sending test message...');
    const testMessage = await everchat.sendMessage(
      workspaceId,
      'Test message from script at ' + new Date().toLocaleTimeString(),
      generalConv.id,
      'user_321PIsZrSDgVtG1YS8G8P9kwfVn',
      'Script User',
      null
    );
    console.log('Sent message:', testMessage.id);
    
    // Verify messages for this conversation
    console.log('\n4. Messages in #general:');
    const generalMessages = await everchat.getMessages(
      workspaceId,
      generalConv.id,
      10
    );
    console.log('Found', generalMessages.length, 'messages in #general');
    generalMessages.forEach((msg: any) => {
      console.log(`- ${msg.data.content} (${msg.data.userName || msg.data.from})`);
    });
    
    console.log('\n✅ Data check complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEvergreenMessages();