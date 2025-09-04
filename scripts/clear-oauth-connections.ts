import 'dotenv/config';
import { db } from '@/lib/db';
import { entities, users } from '@/lib/db/schema/unified';
import { eq, and, or, sql } from 'drizzle-orm';

async function clearOAuthConnections() {
  console.log('Clearing OAuth Connections for Testing');
  console.log('=======================================\n');
  
  try {
    // Find Kian and Omid users
    const targetUsers = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, 'kian@evergreengroup.ai'),
          eq(users.email, 'omid@evergreengroup.ai')
        )
      );
    
    console.log(`Found ${targetUsers.length} users to clear:`);
    targetUsers.forEach(u => {
      console.log(`  - ${u.email} (ID: ${u.id})`);
    });
    console.log('');
    
    for (const user of targetUsers) {
      console.log(`\nClearing data for ${user.email}:`);
      
      // Delete email accounts
      const deletedAccounts = await db
        .delete(entities)
        .where(
          and(
            eq(entities.type, 'email_account'),
            eq(entities.userId, user.id)
          )
        )
        .returning();
      console.log(`  ✓ Deleted ${deletedAccounts.length} email account(s)`);
      
      // Delete emails
      const deletedEmails = await db
        .delete(entities)
        .where(
          and(
            eq(entities.type, 'email'),
            eq(entities.userId, user.id)
          )
        )
        .returning();
      console.log(`  ✓ Deleted ${deletedEmails.length} email(s)`);
      
      // Delete calendar events
      const deletedEvents = await db
        .delete(entities)
        .where(
          and(
            eq(entities.type, 'calendar_event'),
            eq(entities.userId, user.id)
          )
        )
        .returning();
      console.log(`  ✓ Deleted ${deletedEvents.length} calendar event(s)`);
      
      // Delete contacts
      const deletedContacts = await db
        .delete(entities)
        .where(
          and(
            eq(entities.type, 'contact'),
            eq(entities.userId, user.id)
          )
        )
        .returning();
      console.log(`  ✓ Deleted ${deletedContacts.length} contact(s)`);
    }
    
    console.log('\n\n✅ OAuth connections cleared! Users will need to reconnect.\n');
    
  } catch (error) {
    console.error('Error clearing connections:', error);
  }
  
  process.exit(0);
}

// Run the cleanup
clearOAuthConnections();