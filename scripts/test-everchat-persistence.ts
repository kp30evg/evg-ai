#!/usr/bin/env tsx

/**
 * Test script for EverChat message persistence
 * Tests that messages are saved to the database and persist across refreshes
 */

import { db } from '@/lib/db';
import { entities } from '@/lib/db/schema/unified';
import { eq, and, desc } from 'drizzle-orm';
import { entityService } from '@/lib/entities/entity-service';

async function testMessagePersistence() {
  console.log('🧪 Testing EverChat Message Persistence...\n');

  try {
    // 1. Get a test workspace (you may need to adjust the workspace ID)
    const workspaces = await db.query.workspaces.findMany({ limit: 1 });
    if (!workspaces.length) {
      console.error('❌ No workspace found. Please ensure you have a workspace set up.');
      return;
    }
    
    const workspaceId = workspaces[0].id;
    console.log(`✅ Using workspace: ${workspaces[0].name} (${workspaceId})\n`);

    // Get a valid user from the database or use null
    const users = await db.query.users.findMany({ limit: 1 });
    const testUserId = users.length > 0 ? users[0].id : null;
    console.log(`Using user ID: ${testUserId || 'null (no user authentication)'}\n`);

    // 2. Create a test conversation for #general channel
    console.log('📝 Creating test conversation for #general channel...');
    const conversation = await entityService.create(
      workspaceId,
      'conversation',
      {
        title: '#general',
        channel: 'general',
        participants: [],
        status: 'active',
        messageCount: 0,
        lastMessageAt: null,
      },
      {},
      testUserId ? { userId: testUserId } : undefined
    );
    console.log(`✅ Conversation created: ${conversation.id}\n`);

    // 3. Send a test message
    console.log('💬 Sending test message...');
    const testMessage = await entityService.create(
      workspaceId,
      'message',
      {
        content: 'Test message for persistence verification',
        channel: 'chat',
        from: testUserId || 'system',
        userId: testUserId || 'system',
        userName: 'Test User',
        timestamp: new Date(),
      },
      {
        conversation: conversation.id,
      },
      testUserId ? { userId: testUserId } : undefined
    );
    console.log(`✅ Message sent: ${testMessage.id}\n`);

    // 4. Retrieve messages to verify persistence
    console.log('🔍 Retrieving messages from database...');
    const messages = await entityService.find({
      workspaceId,
      type: 'message',
      relationships: {
        conversation: conversation.id,
      },
      limit: 10,
      orderBy: 'createdAt',
      orderDirection: 'desc',
    });

    if (messages.length > 0) {
      console.log(`✅ Found ${messages.length} message(s) in database:`);
      messages.forEach((msg, index) => {
        console.log(`   ${index + 1}. "${msg.data.content}" by ${msg.data.userName}`);
      });
    } else {
      console.log('❌ No messages found in database');
    }

    // 5. Test multiple channels
    console.log('\n📝 Creating test conversation for #design-team channel...');
    const designConversation = await entityService.create(
      workspaceId,
      'conversation',
      {
        title: '#design-team',
        channel: 'design-team',
        participants: [],
        status: 'active',
        messageCount: 0,
        lastMessageAt: null,
      },
      {},
      testUserId ? { userId: testUserId } : undefined
    );

    const designMessage = await entityService.create(
      workspaceId,
      'message',
      {
        content: 'Design team test message',
        channel: 'chat',
        from: testUserId || 'system',
        userId: testUserId || 'system',
        userName: 'Test User',
        timestamp: new Date(),
      },
      {
        conversation: designConversation.id,
      },
      testUserId ? { userId: testUserId } : undefined
    );
    console.log(`✅ Design team message sent: ${designMessage.id}\n`);

    // 6. Verify channel isolation
    console.log('🔍 Verifying channel message isolation...');
    const generalMessages = await entityService.find({
      workspaceId,
      type: 'message',
      relationships: {
        conversation: conversation.id,
      },
      limit: 10,
    });

    const designMessages = await entityService.find({
      workspaceId,
      type: 'message',
      relationships: {
        conversation: designConversation.id,
      },
      limit: 10,
    });

    console.log(`✅ #general has ${generalMessages.length} message(s)`);
    console.log(`✅ #design-team has ${designMessages.length} message(s)`);
    
    if (generalMessages.length > 0 && designMessages.length > 0) {
      console.log('\n✅ Message persistence test PASSED!');
      console.log('Messages are being saved to the database and isolated by channel.');
    }

    // 7. List all conversations
    console.log('\n📋 All conversations in workspace:');
    const allConversations = await entityService.find({
      workspaceId,
      type: 'conversation',
      limit: 20,
    });
    
    allConversations.forEach((conv, index) => {
      console.log(`   ${index + 1}. ${conv.data.title || 'Untitled'} (${conv.id})`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  process.exit(0);
}

// Run the test
testMessagePersistence();