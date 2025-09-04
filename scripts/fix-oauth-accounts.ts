import dotenv from 'dotenv';
// Load env before any other imports that might use it
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { entities, users } from '../lib/db/schema/unified';
import { eq, and, isNull } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function fixOAuthAccounts() {
  try {
    console.log('Analyzing OAuth accounts issue...\n');
    
    // Get all email_account entities
    const emailAccounts = await db
      .select()
      .from(entities)
      .where(eq(entities.type, 'email_account'));
    
    console.log(`Total email accounts: ${emailAccounts.length}\n`);
    
    // Group by userId
    const accountsByUser = new Map<string | null, typeof emailAccounts>();
    
    for (const account of emailAccounts) {
      const key = account.userId || 'NULL';
      if (!accountsByUser.has(key)) {
        accountsByUser.set(key, []);
      }
      accountsByUser.get(key)!.push(account);
    }
    
    console.log('Accounts grouped by userId:');
    for (const [userId, accounts] of accountsByUser) {
      console.log(`\nUser ID: ${userId}`);
      for (const account of accounts) {
        console.log(`  - ${account.data?.email} (Account ID: ${account.id})`);
      }
    }
    
    // Fix the issue: Match email accounts to correct users based on email
    console.log('\n\nAttempting to fix mismatched accounts...\n');
    
    for (const account of emailAccounts) {
      const gmailEmail = account.data?.email;
      if (!gmailEmail) continue;
      
      // Find the user with matching email
      const [matchingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, gmailEmail))
        .limit(1);
      
      if (matchingUser) {
        if (account.userId !== matchingUser.id) {
          console.log(`Fixing: ${gmailEmail}`);
          console.log(`  Current userId: ${account.userId}`);
          console.log(`  Correct userId: ${matchingUser.id}`);
          console.log(`  Updating...`);
          
          // Update the account with correct userId
          await db
            .update(entities)
            .set({ 
              userId: matchingUser.id,
              updatedAt: new Date()
            })
            .where(eq(entities.id, account.id));
          
          console.log(`  ✓ Fixed!\n`);
        } else {
          console.log(`✓ ${gmailEmail} already has correct userId\n`);
        }
      } else {
        console.log(`⚠️  No user found with email ${gmailEmail}\n`);
      }
    }
    
    console.log('\nVerifying fix...\n');
    
    // Re-check the accounts
    const fixedAccounts = await db
      .select()
      .from(entities)
      .where(eq(entities.type, 'email_account'));
    
    for (const account of fixedAccounts) {
      const user = account.userId ? await db
        .select()
        .from(users)
        .where(eq(users.id, account.userId))
        .limit(1) : [];
      
      console.log(`${account.data?.email}: userId=${account.userId}, user=${user[0]?.email || 'No user'}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

fixOAuthAccounts();