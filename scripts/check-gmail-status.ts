import { config } from 'dotenv';
import path from 'path';

// Load environment from .env
config({ path: path.join(__dirname, '..', '.env') });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found. Check .env file');
  process.exit(1);
}

const { db } = require('../lib/db');
const { entities } = require('../lib/db/schema/unified');
const { eq, and, sql } = require('drizzle-orm');

async function checkGmailStatus() {
  try {
    const workspaceId = '3ebb63b5-61dd-4a7f-b645-1f0a6d214f7f'; // Evergreen workspace
    
    console.log('🔍 Checking Gmail status for Evergreen workspace...\n');
    
    // Check for Gmail account connection
    const gmailAccounts = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspaceId),
          eq(entities.type, 'email_account')
        )
      );
    
    if (gmailAccounts.length > 0) {
      console.log('✅ Gmail Account Found:');
      gmailAccounts.forEach((account: any) => {
        const data = account.data;
        console.log(`  Email: ${data.email}`);
        console.log(`  Active: ${data.isActive}`);
        console.log(`  Last Sync: ${data.lastSyncAt || 'Never'}`);
        console.log(`  Total Messages: ${data.messagesTotal}`);
      });
    } else {
      console.log('❌ No Gmail account connected');
      console.log('  To connect: Go to Mail > Settings > Connect Gmail');
    }
    
    console.log('\n📧 Checking Real Emails in Database...\n');
    
    // Count real emails
    const emails = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspaceId),
          eq(entities.type, 'email')
        )
      )
      .orderBy(sql`created_at DESC`)
      .limit(10);
    
    console.log(`Total Emails: ${emails.length}`);
    
    if (emails.length > 0) {
      console.log('\nRecent Emails:');
      emails.forEach((email: any) => {
        const data = email.data;
        console.log(`\n  Subject: ${data.subject || 'No subject'}`);
        console.log(`  From: ${data.from?.email || data.from || 'Unknown'}`);
        console.log(`  Date: ${data.date || data.timestamp || email.createdAt}`);
        console.log(`  Labels: ${data.labels?.join(', ') || 'None'}`);
        console.log(`  Source: ${email.metadata?.source || 'Unknown'}`);
      });
    } else {
      console.log('\n  No emails found. Need to sync Gmail first.');
    }
    
    console.log('\n💡 UNIFIED ARCHITECTURE:');
    console.log('  - All emails stored in single entities table');
    console.log('  - Type: "email" for messages');
    console.log('  - Type: "email_account" for Gmail connection');
    console.log('  - NO separate tables, NO mock data');
    console.log('  - REAL Gmail integration with OAuth2');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkGmailStatus();