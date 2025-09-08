import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { entities } from '../lib/db/schema/unified';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function debugEmailAccount() {
  try {
    console.log('🔍 Debugging email account structure...\n');
    
    // Get all email_account entities
    const emailAccounts = await db
      .select()
      .from(entities)
      .where(eq(entities.type, 'email_account'));
    
    console.log(`Found ${emailAccounts.length} email accounts\n`);
    
    if (emailAccounts.length > 0) {
      const account = emailAccounts[0];
      
      console.log('Full account object (first account):');
      console.log(JSON.stringify(account, null, 2));
      
      console.log('\n--- Analyzing data field ---');
      console.log('Type of data field:', typeof account.data);
      console.log('Data field keys:', account.data ? Object.keys(account.data) : 'null');
      
      // Try to access nested fields
      if (account.data && typeof account.data === 'object') {
        const data = account.data as any;
        console.log('\nTrying to access nested fields:');
        console.log('data.email:', data.email);
        console.log('data.tokens:', data.tokens ? 'Has tokens' : 'No tokens');
        console.log('data.isActive:', data.isActive);
        console.log('data.connectedAt:', data.connectedAt);
        
        // Check if data might be double-nested
        if (data.data) {
          console.log('\n⚠️  Found nested data.data - checking inner structure:');
          console.log('data.data.email:', data.data.email);
          console.log('data.data.tokens:', data.data.tokens ? 'Has tokens' : 'No tokens');
          console.log('data.data.isActive:', data.data.isActive);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

debugEmailAccount();