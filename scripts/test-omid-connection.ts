import dotenv from 'dotenv';
// Load env before any other imports that might use it
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { entities, users, workspaces } from '../lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function testOmidConnection() {
  try {
    console.log('Testing Omid connection status...\n');
    
    // Find Omid's user record
    const omidClerkId = 'user_327TZuO5dXuPdMCrlsXg8Y21Nhr';
    const [omidUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, omidClerkId))
      .limit(1);
    
    if (!omidUser) {
      console.log('Omid user not found!');
      return;
    }
    
    console.log('Omid user found:');
    console.log('  ID:', omidUser.id);
    console.log('  Email:', omidUser.email);
    console.log('  Workspace ID:', omidUser.workspaceId);
    
    // Get workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, omidUser.workspaceId))
      .limit(1);
    
    console.log('\nWorkspace:', workspace?.name || 'Not found');
    
    // Check email account
    const emailAccounts = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, omidUser.workspaceId),
          eq(entities.userId, omidUser.id),
          eq(entities.type, 'email_account')
        )
      );
    
    console.log(`\nEmail accounts for Omid: ${emailAccounts.length}`);
    
    if (emailAccounts.length > 0) {
      const account = emailAccounts[0];
      console.log('\nEmail account details:');
      console.log('  Gmail email:', account.data?.email);
      console.log('  Is Active:', account.data?.isActive);
      console.log('  Connected At:', account.data?.connectedAt);
      console.log('  Has Tokens:', !!account.data?.tokens);
      console.log('  Has Calendar Scopes:', account.metadata?.scopes?.some((s: string) => s.includes('calendar')));
      
      // This is what getGmailStatus should return
      console.log('\n✅ getGmailStatus should return:');
      console.log('  connected: true');
      console.log('  email:', account.data?.email);
    } else {
      console.log('\n❌ No email account found for Omid!');
      console.log('  This is why the inbox shows "Connect Gmail"');
    }
    
    // Check for any emails
    const emails = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, omidUser.workspaceId),
          eq(entities.userId, omidUser.id),
          eq(entities.type, 'email')
        )
      )
      .limit(5);
    
    console.log(`\nEmails for Omid: ${emails.length}`);
    if (emails.length === 0) {
      console.log('  No emails synced yet - need to run sync after OAuth connection');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

testOmidConnection();