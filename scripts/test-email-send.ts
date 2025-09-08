import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { entities, users } from '../lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function testEmailSend() {
  try {
    console.log('🧪 Testing email send functionality...\n');
    
    // Simulate the exact same queries that sendEmail mutation does
    const clerkUserId = 'user_321PIsZrSDgVtG1YS8G8P9kwfVn'; // kian@evergreengroup.ai
    const workspaceId = '3ebb63b5-61dd-4a7f-b645-1f0a6d214f7f'; // Evergreen workspace
    
    console.log('1️⃣ Looking up database user...');
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    
    if (!dbUser) {
      console.error('❌ User not found');
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${dbUser.email} (ID: ${dbUser.id})\n`);
    
    console.log('2️⃣ Looking up email account...');
    const emailAccount = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspaceId),
          eq(entities.type, 'email_account'),
          eq(entities.userId, dbUser.id)
        )
      )
      .limit(1);
    
    if (!emailAccount || emailAccount.length === 0) {
      console.error('❌ No email account found for this user');
      console.log('\nDebug: Checking all email accounts in workspace...');
      
      const allAccounts = await db
        .select({
          id: entities.id,
          userId: entities.userId,
          type: entities.type,
          userIdMatch: entities.userId
        })
        .from(entities)
        .where(
          and(
            eq(entities.workspaceId, workspaceId),
            eq(entities.type, 'email_account')
          )
        );
      
      console.log('All email accounts:', allAccounts);
      process.exit(1);
    }
    
    const account = emailAccount[0];
    const accountData = account.data as any;
    
    console.log('✅ Found email account:');
    console.log(`   Email: ${accountData.email}`);
    console.log(`   Has Tokens: ${!!accountData.tokens}`);
    console.log(`   Is Active: ${accountData.isActive}`);
    console.log(`   Connected: ${accountData.connectedAt}\n`);
    
    if (!accountData.tokens) {
      console.error('❌ No tokens found in account data');
      process.exit(1);
    }
    
    console.log('3️⃣ Decoding tokens...');
    try {
      const tokens = JSON.parse(Buffer.from(accountData.tokens, 'base64').toString());
      console.log('✅ Tokens decoded successfully');
      console.log(`   Has access_token: ${!!tokens.access_token}`);
      console.log(`   Has refresh_token: ${!!tokens.refresh_token}`);
      console.log(`   Scopes: ${tokens.scope}\n`);
      
      if (!tokens.access_token) {
        console.error('❌ No access token in decoded tokens');
        process.exit(1);
      }
      
      console.log('4️⃣ Testing Gmail API...');
      const { google } = require('googleapis');
      const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/gmail/callback'
      );
      oauth2Client.setCredentials(tokens);
      
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      // Test API access
      const profile = await gmail.users.getProfile({ userId: 'me' });
      console.log('✅ Gmail API access successful');
      console.log(`   Email: ${profile.data.emailAddress}`);
      console.log(`   Messages: ${profile.data.messagesTotal}\n`);
      
      console.log('5️⃣ Creating test email...');
      const testEmail = {
        to: 'kian.pezeshki1@gmail.com',
        subject: 'Test Email from evergreenOS Debug Script',
        body: 'This is a test email sent from the debug script to verify email functionality.'
      };
      
      const messageParts = [
        `From: ${accountData.email}`,
        `To: ${testEmail.to}`,
        `Subject: ${testEmail.subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        testEmail.body
      ].join('\r\n');
      
      const encodedMessage = Buffer.from(messageParts)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      console.log('📧 Sending test email...');
      const sentMessage = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });
      
      console.log('✅ Email sent successfully!');
      console.log(`   Message ID: ${sentMessage.data.id}`);
      console.log(`   Thread ID: ${sentMessage.data.threadId}\n`);
      
      console.log('🎉 All tests passed! Email functionality is working.');
      
    } catch (error: any) {
      console.error('❌ Error during testing:', error.message);
      if (error.response) {
        console.error('API Response:', error.response.data);
      }
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

testEmailSend();