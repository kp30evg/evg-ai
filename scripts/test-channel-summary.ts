#!/usr/bin/env tsx
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testChannelSummary() {
  const baseUrl = 'http://localhost:3000';
  
  // Test sending AI summary to #sales channel
  console.log('\n🧪 Testing: Send AI summary to #sales channel...\n');
  
  const response = await fetch(`${baseUrl}/api/test-command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      command: 'send #sales a message summary on voice agents',
      workspaceId: '123e4567-e89b-12d3-a456-426614174000', // Test workspace ID
    }),
  });

  if (!response.ok) {
    console.error('❌ Request failed:', response.status, response.statusText);
    const text = await response.text();
    console.error('Response:', text);
    return;
  }

  const result = await response.json();
  
  if (result.success) {
    console.log('✅ Success! AI summary sent to #sales channel');
    console.log('\n📬 Message Details:');
    console.log('  Channel:', result.data?.channel);
    console.log('  Topic:', result.data?.summaryTopic);
    console.log('  Conversation ID:', result.data?.conversationId);
    console.log('\n📝 Summary Content:');
    console.log(result.data?.data?.content || 'No content');
  } else {
    console.error('❌ Command failed:', result.error);
  }
}

testChannelSummary().catch(console.error);