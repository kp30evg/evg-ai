import { db } from '../lib/db/index.js';
import { workspaces, users } from '../lib/db/schema/unified.js';
import { eq } from 'drizzle-orm';
import * as everchat from '../lib/modules-simple/everchat.js';
import { entityService } from '../lib/entities/entity-service.js';

async function testDirectSend() {
  try {
    // Get workspace
    const [workspace] = await db.select().from(workspaces)
      .where(eq(workspaces.clerkOrgId, 'org_321PMbgXawub3NIZaTRy0OQaBhP'))
      .limit(1);
    
    if (!workspace) {
      console.error('Workspace not found');
      return;
    }
    
    console.log('Workspace:', workspace.id);
    
    // Test sending to general channel
    console.log('\n1. Testing channel message...');
    
    // First check if general channel conversation exists
    const conversations = await entityService.find({
      workspaceId: workspace.id,
      type: 'conversation',
      limit: 100
    });
    
    let generalConv = conversations.find(c => 
      c.data?.channel === 'general' || c.data?.title === '#general'
    );
    
    if (!generalConv) {
      console.log('Creating #general conversation...');
      generalConv = await everchat.createConversation(
        workspace.id,
        '#general',
        [],
        'user_321PIsZrSDgVtG1YS8G8P9kwfVn' // Kian's Clerk ID
      );
    }
    
    console.log('General conversation:', generalConv.id);
    
    // Send message to general
    const message = await everchat.sendMessage(
      workspace.id,
      'Test message from script to #general',
      generalConv.id,
      'user_321PIsZrSDgVtG1YS8G8P9kwfVn', // Kian's Clerk ID
      'Kian (Script Test)',
      undefined
    );
    
    console.log('Message sent:', message.id);
    console.log('Message content:', message.data?.content);
    
    // Verify message was stored
    const messages = await everchat.getMessages(workspace.id, generalConv.id, 10);
    console.log('\n2. Messages in #general:', messages.length);
    messages.forEach((m: any) => {
      console.log('  -', m.data?.content, '(from:', m.data?.userName || m.data?.from, ')');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

testDirectSend();