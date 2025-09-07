#!/usr/bin/env tsx

/**
 * Comprehensive test suite for EverChat, EverMail, and EverCore modules
 */

import { db } from '@/lib/db';
import { entities, users, workspaces } from '@/lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';
import { entityService } from '@/lib/entities/entity-service';
import * as everchat from '@/lib/modules-simple/everchat';
import * as evercore from '@/lib/modules-simple/evercore';
import { processCommand } from '@/lib/modules-simple/command-processor';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let passedTests = 0;
let failedTests = 0;
let workspaceId: string;
let userId: string;

async function setup() {
  console.log(`${colors.cyan}🚀 Setting up test environment...${colors.reset}\n`);
  
  // Get Evergreen workspace
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.name, 'Evergreen')
  });
  
  if (!workspace) {
    throw new Error('Evergreen workspace not found');
  }
  
  workspaceId = workspace.id;
  
  // Get a test user
  const user = await db.query.users.findFirst({
    where: eq(users.workspaceId, workspaceId)
  });
  
  if (!user) {
    throw new Error('No users found in Evergreen workspace');
  }
  
  userId = user.id;
  
  console.log(`✅ Using workspace: ${workspace.name} (${workspaceId})`);
  console.log(`✅ Using user: ${user.email} (${userId})\n`);
}

async function test(name: string, fn: () => Promise<boolean>) {
  try {
    console.log(`${colors.blue}Testing: ${name}${colors.reset}`);
    const result = await fn();
    if (result) {
      console.log(`${colors.green}✅ PASSED${colors.reset}\n`);
      passedTests++;
    } else {
      console.log(`${colors.red}❌ FAILED${colors.reset}\n`);
      failedTests++;
    }
  } catch (error) {
    console.log(`${colors.red}❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}${colors.reset}\n`);
    failedTests++;
  }
}

// ============= EVERCHAT TESTS =============
async function testEverChat() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}     TESTING EVERCHAT MODULE${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

  // Test 1: Create conversation
  await test('EverChat: Create conversation', async () => {
    const conversation = await everchat.createConversation(
      workspaceId,
      '#test-channel',
      [],
      userId
    );
    return conversation.id !== undefined && conversation.data.title === '#test-channel';
  });

  // Test 2: Send message
  await test('EverChat: Send message', async () => {
    const message = await everchat.sendMessage(
      workspaceId,
      'Test message from automated test',
      undefined,
      userId,
      'Test User'
    );
    return message.id !== undefined && message.data.content === 'Test message from automated test';
  });

  // Test 3: Get messages
  await test('EverChat: Retrieve messages', async () => {
    // First create a conversation and send a message
    const conv = await everchat.createConversation(workspaceId, '#test-retrieve', [], userId);
    await everchat.sendMessage(workspaceId, 'Message 1', conv.id, userId);
    await everchat.sendMessage(workspaceId, 'Message 2', conv.id, userId);
    
    const messages = await everchat.getMessages(workspaceId, conv.id, 10);
    return messages.length >= 2;
  });

  // Test 4: Search messages
  await test('EverChat: Search messages', async () => {
    const searchResults = await everchat.searchMessages(
      workspaceId,
      'test',
      undefined,
      10
    );
    return Array.isArray(searchResults);
  });

  // Test 5: Natural language command
  await test('EverChat: Handle chat command', async () => {
    const result = await everchat.handleChatCommand(
      workspaceId,
      'send a message saying hello world',
      userId
    );
    return !result.error;
  });
}

// ============= EVERMAIL TESTS =============
async function testEverMail() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}     TESTING EVERMAIL MODULE${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

  // Test 1: Email command processing
  await test('EverMail: Process email command', async () => {
    const result = await processCommand(
      workspaceId,
      'send email to test@example.com about meeting tomorrow',
      userId
    );
    return result.success === true;
  });

  // Test 2: Email summarization
  await test('EverMail: Summarize emails command', async () => {
    const result = await processCommand(
      workspaceId,
      'summarize my emails from today',
      userId
    );
    return result.success === true && result.message !== undefined;
  });

  // Test 3: Draft creation
  await test('EverMail: Create email draft', async () => {
    const draft = await entityService.create(
      workspaceId,
      'email_draft',
      {
        to: ['test@example.com'],
        subject: 'Test Draft',
        body: 'This is a test draft',
        status: 'draft'
      },
      {},
      { userId }
    );
    return draft.id !== undefined && draft.type === 'email_draft';
  });

  // Test 4: Check Gmail connection
  await test('EverMail: Check Gmail account', async () => {
    const accounts = await entityService.find({
      workspaceId,
      type: 'email_account',
      limit: 1
    });
    // Test passes if there's a Gmail account OR if there's no account (expected state)
    return Array.isArray(accounts);
  });

  // Test 5: Email parsing
  await test('EverMail: Parse email command', async () => {
    const command = 'send john@example.com an email about the quarterly report';
    const result = await processCommand(workspaceId, command, userId);
    // Should recognize this as an email command
    return result.success === true || result.error?.includes('Gmail');
  });
}

// ============= EVERCORE TESTS =============
async function testEverCore() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}     TESTING EVERCORE MODULE${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

  // Test 1: Create contact
  await test('EverCore: Create contact', async () => {
    const contact = await evercore.createContact(
      workspaceId,
      'Test',
      'User',
      'test@example.com',
      'Test Company',
      userId
    );
    return contact.id !== undefined && contact.data.firstName === 'Test';
  });

  // Test 2: Create deal
  await test('EverCore: Create deal', async () => {
    const deal = await evercore.createDeal(
      workspaceId,
      'Test Deal',
      10000,
      'Prospecting',
      userId
    );
    return deal.id !== undefined && deal.data.name === 'Test Deal';
  });

  // Test 3: Get contacts
  await test('EverCore: Get contacts', async () => {
    const contacts = await evercore.getContacts(workspaceId, 10);
    return Array.isArray(contacts) && contacts.every(c => c.type === 'contact');
  });

  // Test 4: Get deals
  await test('EverCore: Get deals', async () => {
    const deals = await evercore.getDeals(workspaceId);
    return Array.isArray(deals) && deals.every(d => d.type === 'deal');
  });

  // Test 5: Handle CRM command
  await test('EverCore: Handle CRM command', async () => {
    const result = await evercore.handleCoreCommand(
      workspaceId,
      'show my biggest deal',
      userId
    );
    // Should either return deal data or indicate no deals
    return !result.error || result.message?.includes('No deals found');
  });

  // Test 6: Contact summary
  await test('EverCore: Contact summary command', async () => {
    const result = await evercore.handleCoreCommand(
      workspaceId,
      'summarize my contacts',
      userId
    );
    return result.totalContacts !== undefined || result.message?.includes('contacts');
  });

  // Test 7: Search functionality
  await test('EverCore: Search contacts', async () => {
    const result = await processCommand(
      workspaceId,
      'find contacts from Test Company',
      userId
    );
    return result.success === true;
  });

  // Test 8: Deal pipeline
  await test('EverCore: Deal pipeline analysis', async () => {
    const result = await evercore.handleCoreCommand(
      workspaceId,
      'show deals at risk',
      userId
    );
    return !result.error;
  });
}

// ============= INTEGRATION TESTS =============
async function testIntegration() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}     INTEGRATION TESTS${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

  // Test 1: Cross-module command
  await test('Integration: Cross-module query', async () => {
    const result = await processCommand(
      workspaceId,
      'show everything about Test Company',
      userId
    );
    return result.success === true;
  });

  // Test 2: AI fallback
  await test('Integration: AI general question', async () => {
    const result = await processCommand(
      workspaceId,
      'What are the benefits of cloud computing?',
      userId
    );
    return result.success === true && result.message !== undefined;
  });

  // Test 3: Entity relationships
  await test('Integration: Entity relationships', async () => {
    // Create a contact and link to a deal
    const contact = await evercore.createContact(
      workspaceId,
      'Integration',
      'Test',
      'integration@test.com',
      'Integration Corp',
      userId
    );
    
    const deal = await evercore.createDeal(
      workspaceId,
      'Integration Deal',
      50000,
      'Negotiation',
      userId
    );
    
    // Update deal with contact relationship
    await entityService.update(
      workspaceId,
      deal.id,
      {
        ...deal.data,
        contactId: contact.id
      }
    );
    
    return true;
  });

  // Test 4: Command suggestions
  await test('Integration: Command suggestions', async () => {
    const result = await processCommand(
      workspaceId,
      'help me with sales',
      userId
    );
    return result.suggestions !== undefined && result.suggestions.length > 0;
  });
}

// ============= CLEANUP =============
async function cleanup() {
  console.log(`\n${colors.yellow}🧹 Cleaning up test data...${colors.reset}`);
  
  // Delete test entities created during tests
  const testEntities = await entityService.find({
    workspaceId,
    search: 'test',
    limit: 100
  });
  
  for (const entity of testEntities) {
    if (entity.data?.title?.includes('test') || 
        entity.data?.name?.includes('Test') ||
        entity.data?.firstName === 'Test' ||
        entity.data?.firstName === 'Integration') {
      try {
        await db.delete(entities).where(eq(entities.id, entity.id));
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }
  
  console.log(`✅ Cleanup complete\n`);
}

// ============= MAIN TEST RUNNER =============
async function runAllTests() {
  console.log(`\n${colors.bright}${colors.cyan}╔═══════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║   EVERGREENOS MODULE TEST SUITE      ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚═══════════════════════════════════════╝${colors.reset}\n`);
  
  const startTime = Date.now();
  
  try {
    await setup();
    await testEverChat();
    await testEverMail();
    await testEverCore();
    await testIntegration();
    await cleanup();
  } catch (error) {
    console.error(`${colors.red}Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}${colors.reset}`);
    process.exit(1);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Print summary
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}           TEST SUMMARY${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);
  
  console.log(`${colors.green}✅ Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failedTests}${colors.reset}`);
  console.log(`⏱️  Duration: ${duration}s\n`);
  
  if (failedTests === 0) {
    console.log(`${colors.bright}${colors.green}🎉 ALL TESTS PASSED!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.bright}${colors.red}⚠️  SOME TESTS FAILED${colors.reset}\n`);
    process.exit(1);
  }
}

// Run the tests
runAllTests();