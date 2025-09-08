import dotenv from 'dotenv';
// Load env before any other imports that might use it
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { entities } from '../lib/db/schema/unified';
import { eq, and, isNull } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function cleanCorruptedOAuth() {
  try {
    console.log('🧹 Cleaning corrupted OAuth email accounts...\n');
    
    // Get all email_account entities
    const emailAccounts = await db
      .select()
      .from(entities)
      .where(eq(entities.type, 'email_account'));
    
    console.log(`Found ${emailAccounts.length} email accounts\n`);
    
    let corruptedCount = 0;
    const toDelete: string[] = [];
    
    for (const account of emailAccounts) {
      const data = account.data as any;
      
      // Check if account data is corrupted
      const isCorrupted = 
        !data?.email || 
        !data?.tokens ||
        data?.email === undefined ||
        data?.isActive === undefined;
      
      if (isCorrupted) {
        console.log(`❌ Corrupted account found:`);
        console.log(`   ID: ${account.id}`);
        console.log(`   Email: ${data?.email || 'undefined'}`);
        console.log(`   Has Tokens: ${!!data?.tokens}`);
        console.log(`   Is Active: ${data?.isActive}`);
        console.log('');
        
        toDelete.push(account.id);
        corruptedCount++;
      } else {
        console.log(`✅ Valid account:`);
        console.log(`   Email: ${data.email}`);
        console.log(`   Connected: ${data.connectedAt}`);
        console.log('');
      }
    }
    
    if (corruptedCount > 0) {
      console.log(`\n⚠️  Found ${corruptedCount} corrupted accounts`);
      console.log('These accounts have invalid data and cannot be used for sending emails.');
      
      // Ask for confirmation
      console.log('\nWould you like to delete these corrupted accounts? (y/n)');
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('', async (answer: string) => {
        if (answer.toLowerCase() === 'y') {
          console.log('\n🗑️  Deleting corrupted accounts...');
          
          for (const id of toDelete) {
            await db
              .delete(entities)
              .where(eq(entities.id, id));
          }
          
          console.log(`✅ Deleted ${corruptedCount} corrupted accounts`);
          console.log('\n📧 Users will need to reconnect their Gmail accounts:');
          console.log('   1. Go to Mail page');
          console.log('   2. You should see a "Connect Gmail" button');
          console.log('   3. Click it to reconnect your account');
        } else {
          console.log('\n❌ Cleanup cancelled');
        }
        
        readline.close();
        process.exit(0);
      });
    } else {
      console.log('✅ No corrupted accounts found!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanCorruptedOAuth();