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
const { db } = require('../lib/db');
const { entities } = require('../lib/db/schema/unified');
const { eq, and, desc } = require('drizzle-orm');
const { entityService } = require('../lib/entities/entity-service');

async function testMessagePersistence() {
  try {
    console.log('Testing message persistence...\n');
    
    // Get first workspace
    const workspaces = await db.query.workspaces.findMany({ limit: 1 });
    if (workspaces.length === 0) {
      console.error('No workspaces found!');
      process.exit(1);
    }
    
    const workspaceId = workspaces[0].id;
    console.log('Using workspace:', workspaceId);
    
    // Check existing messages
    const existingMessages = await entityService.find({
      workspaceId,
      type: 'message',
      limit: 5,
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
    
    console.log('\nExisting messages:', existingMessages.length);
    existingMessages.forEach((msg: any) => {
      console.log(`- [${msg.id}] ${msg.data.content || msg.data.text || 'No content'} (from: ${msg.data.from || msg.data.userId || 'unknown'})`);
    });
    
    // Create a test message
    console.log('\nCreating test message...');
    const testMessage = await entityService.create(
      workspaceId,
      'message',
      {
        content: `Test message at ${new Date().toISOString()}`,
        channel: 'chat',
        from: 'test-script',
        userId: 'test-script',
        userName: 'Test Script',
        timestamp: new Date(),
      },
      {
        conversation: 'test-conversation'
      },
      {
        userId: 'test-script'
      }
    );
    
    console.log('Created message:', testMessage.id);
    console.log('Message data:', testMessage.data);
    
    // Verify it was saved
    const verifyMessage = await entityService.findById(workspaceId, testMessage.id);
    if (verifyMessage) {
      console.log('\n✅ Message persisted successfully!');
      console.log('Retrieved data:', verifyMessage.data);
    } else {
      console.log('\n❌ Message not found after creation!');
    }
    
    // Check conversations
    console.log('\nExisting conversations:');
    const conversations = await entityService.find({
      workspaceId,
      type: 'conversation',
      limit: 5
    });
    
    conversations.forEach((conv: any) => {
      console.log(`- [${conv.id}] ${conv.data.title || 'Untitled'} (channel: ${conv.data.channel || 'none'})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testMessagePersistence();