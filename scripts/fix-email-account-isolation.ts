import 'dotenv/config';
import { db } from '../lib/db';
import { entities, users } from '../lib/db/schema/unified';
import { eq, and, isNull } from 'drizzle-orm';

async function fixEmailAccountIsolation() {
  console.log('=== CRITICAL SECURITY FIX: Email Account Isolation ===\n');
  
  // Step 1: Find all email accounts without user_id
  const accountsWithoutUserId = await db
    .select()
    .from(entities)
    .where(
      and(
        eq(entities.type, 'email_account'),
        isNull(entities.userId)
      )
    );
  
  console.log(`Found ${accountsWithoutUserId.length} email accounts without user_id\n`);
  
  if (accountsWithoutUserId.length > 0) {
    console.log('⚠️  CRITICAL: Found email accounts without proper user isolation!');
    console.log('These accounts could be accessed by ANY user in the workspace.\n');
    
    for (const account of accountsWithoutUserId) {
      const data = account.data as any;
      console.log(`Account: ${data.email || data.userEmail}`);
      console.log(`  Workspace: ${account.workspaceId}`);
      console.log(`  Created: ${account.createdAt}`);
      
      // Try to find the user who should own this account
      if (data.clerkUserId) {
        console.log(`  Has Clerk User ID: ${data.clerkUserId}`);
        
        // Find the database user
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.clerkUserId, data.clerkUserId))
          .limit(1);
        
        if (dbUser) {
          console.log(`  ✅ Found matching user: ${dbUser.email}`);
          console.log(`  Updating account to set user_id = ${dbUser.id}`);
          
          // UPDATE the account to set the user_id
          await db
            .update(entities)
            .set({
              userId: dbUser.id,
              updatedAt: new Date()
            })
            .where(eq(entities.id, account.id));
          
          console.log('  ✅ Account updated with proper user isolation\n');
        } else {
          console.log('  ❌ Could not find matching user in database\n');
        }
      } else if (data.userEmail) {
        // Try to match by email
        console.log(`  Has user email: ${data.userEmail}`);
        
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, data.userEmail))
          .limit(1);
        
        if (dbUser) {
          console.log(`  ✅ Found matching user by email: ${dbUser.email}`);
          console.log(`  Updating account to set user_id = ${dbUser.id}`);
          
          // UPDATE the account
          await db
            .update(entities)
            .set({
              userId: dbUser.id,
              updatedAt: new Date()
            })
            .where(eq(entities.id, account.id));
          
          console.log('  ✅ Account updated with proper user isolation\n');
        } else {
          console.log('  ❌ Could not find matching user by email\n');
        }
      } else {
        console.log('  ❌ No identifying information to match user\n');
      }
    }
  } else {
    console.log('✅ All email accounts have proper user_id set');
  }
  
  // Step 2: Verify all email accounts now have user_id
  const stillMissing = await db
    .select()
    .from(entities)
    .where(
      and(
        eq(entities.type, 'email_account'),
        isNull(entities.userId)
      )
    );
  
  if (stillMissing.length > 0) {
    console.log('\n⚠️  WARNING: Still have ' + stillMissing.length + ' accounts without user_id');
    console.log('These accounts should be manually reviewed or deleted.');
  } else {
    console.log('\n✅ SUCCESS: All email accounts now have proper user isolation!');
  }
  
  // Step 3: Check for any emails without user_id
  const emailsWithoutUserId = await db
    .select()
    .from(entities)
    .where(
      and(
        eq(entities.type, 'email'),
        isNull(entities.userId)
      )
    );
  
  if (emailsWithoutUserId.length > 0) {
    console.log(`\n⚠️  Found ${emailsWithoutUserId.length} emails without user_id`);
    console.log('These emails may be visible to all users in the workspace!');
    
    // Try to fix by matching metadata
    let fixed = 0;
    for (const email of emailsWithoutUserId) {
      const metadata = email.metadata as any;
      if (metadata?.userEmail) {
        // Find user by email
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, metadata.userEmail))
          .limit(1);
        
        if (dbUser) {
          await db
            .update(entities)
            .set({
              userId: dbUser.id,
              updatedAt: new Date()
            })
            .where(eq(entities.id, email.id));
          fixed++;
        }
      }
    }
    
    if (fixed > 0) {
      console.log(`✅ Fixed ${fixed} emails by matching metadata`);
    }
  } else {
    console.log('\n✅ All emails have proper user_id set');
  }
  
  process.exit(0);
}

fixEmailAccountIsolation().catch(console.error);