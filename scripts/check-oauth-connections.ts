import dotenv from 'dotenv';
// Load env before any other imports that might use it
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { entities, users } from '../lib/db/schema/unified';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function checkOAuthConnections() {
  try {
    console.log('Checking OAuth connections in database...\n');
    
    // Get all email_account entities
    const emailAccounts = await db
      .select()
      .from(entities)
      .where(eq(entities.type, 'email_account'));
    
    console.log(`Found ${emailAccounts.length} email accounts:\n`);
    
    for (const account of emailAccounts) {
      const user = account.userId ? await db
        .select()
        .from(users)
        .where(eq(users.id, account.userId))
        .limit(1) : [];
      
      console.log('---');
      console.log('Account ID:', account.id);
      console.log('Entity User ID:', account.userId || 'NULL');
      console.log('User Email from users table:', user[0]?.email || 'No user found');
      console.log('Gmail Email in entity:', account.data?.email);
      console.log('Clerk User ID in data:', account.data?.clerkUserId);
      console.log('Is Active:', account.data?.isActive);
      console.log('Connected At:', account.data?.connectedAt);
      console.log('Has Tokens:', !!account.data?.tokens);
      console.log('Has Calendar Scopes:', account.metadata?.scopes?.some((s: string) => s.includes('calendar')));
      console.log('---\n');
    }
    
    // Check all users
    const allUsers = await db.select().from(users);
    console.log(`\nTotal users in database: ${allUsers.length}`);
    
    // Check specifically for user omid@evergreengroup.ai  
    const omidUser = allUsers.find(u => u.email === 'omid@evergreengroup.ai');
    if (omidUser) {
      console.log('\nChecking Omid specifically:');
      console.log('User ID:', omidUser.id);
      console.log('Clerk User ID:', omidUser.clerkUserId);
      
      const omidAccounts = await db
        .select()
        .from(entities)
        .where(eq(entities.userId, omidUser.id))
        .where(eq(entities.type, 'email_account'));
      
      console.log('Number of email accounts for Omid:', omidAccounts.length);
      if (omidAccounts.length > 0) {
        console.log('Account details:', omidAccounts[0].data?.email, 'Active:', omidAccounts[0].data?.isActive);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkOAuthConnections();