import 'dotenv/config';
import { db } from '@/lib/db';
import { entities, users, workspaces } from '@/lib/db/schema/unified';
import { eq, and, sql } from 'drizzle-orm';

async function testUserDataIsolation() {
  console.log('Testing User Data Isolation in evergreenOS');
  console.log('===========================================\n');
  
  try {
    // 1. Check workspaces
    const allWorkspaces = await db.select().from(workspaces);
    console.log(`Found ${allWorkspaces.length} workspace(s):`);
    allWorkspaces.forEach(w => {
      console.log(`  - ${w.name} (ID: ${w.id}, Clerk: ${w.clerkOrgId})`);
    });
    console.log('');
    
    // 2. Check users
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} user(s):`);
    allUsers.forEach(u => {
      console.log(`  - ${u.email} (ID: ${u.id}, Workspace: ${u.workspaceId})`);
    });
    console.log('');
    
    // 3. Check email accounts with user isolation
    for (const workspace of allWorkspaces) {
      console.log(`\nWorkspace: ${workspace.name}`);
      console.log('----------------------------');
      
      // Get users in this workspace
      const workspaceUsers = await db
        .select()
        .from(users)
        .where(eq(users.workspaceId, workspace.id));
      
      for (const user of workspaceUsers) {
        console.log(`\n  User: ${user.email}`);
        
        // Check Gmail account
        const gmailAccount = await db
          .select()
          .from(entities)
          .where(
            and(
              eq(entities.workspaceId, workspace.id),
              eq(entities.type, 'email_account'),
              eq(entities.userId, user.id)
            )
          );
        
        if (gmailAccount.length > 0) {
          const account = gmailAccount[0].data as any;
          console.log(`    ✓ Gmail Connected: ${account.email || account.userEmail}`);
          console.log(`      Last Sync: ${account.lastSyncAt || 'Never'}`);
        } else {
          console.log('    ✗ Gmail Not Connected');
        }
        
        // Count emails for this user
        const emailCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(entities)
          .where(
            and(
              eq(entities.workspaceId, workspace.id),
              eq(entities.type, 'email'),
              eq(entities.userId, user.id)
            )
          );
        console.log(`    📧 Emails: ${emailCount[0].count}`);
        
        // Count calendar events for this user
        const eventCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(entities)
          .where(
            and(
              eq(entities.workspaceId, workspace.id),
              eq(entities.type, 'calendar_event'),
              eq(entities.userId, user.id)
            )
          );
        console.log(`    📅 Calendar Events: ${eventCount[0].count}`);
        
        // Count contacts for this user
        const contactCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(entities)
          .where(
            and(
              eq(entities.workspaceId, workspace.id),
              eq(entities.type, 'contact'),
              eq(entities.userId, user.id)
            )
          );
        console.log(`    👥 Contacts: ${contactCount[0].count}`);
      }
    }
    
    // 4. Verify data isolation
    console.log('\n\nData Isolation Verification:');
    console.log('----------------------------');
    
    // Check for entities without userId
    const orphanedEntities = await db
      .select({ count: sql<number>`count(*)`, type: entities.type })
      .from(entities)
      .where(sql`${entities.userId} IS NULL`)
      .groupBy(entities.type);
    
    if (orphanedEntities.length > 0) {
      console.log('⚠️  Found entities without userId (potential security risk):');
      orphanedEntities.forEach(e => {
        console.log(`   - ${e.type}: ${e.count} entities`);
      });
    } else {
      console.log('✅ All entities have userId assigned (good isolation)');
    }
    
    // Check for cross-user data access vulnerability
    const personalDataTypes = ['email', 'calendar_event', 'contact', 'email_account'];
    for (const dataType of personalDataTypes) {
      const entitiesWithUserId = await db
        .select({ count: sql<number>`count(*)` })
        .from(entities)
        .where(
          and(
            eq(entities.type, dataType),
            sql`${entities.userId} IS NOT NULL`
          )
        );
      
      const totalEntities = await db
        .select({ count: sql<number>`count(*)` })
        .from(entities)
        .where(eq(entities.type, dataType));
      
      if (entitiesWithUserId[0].count === totalEntities[0].count) {
        console.log(`✅ ${dataType}: All ${totalEntities[0].count} entities have user isolation`);
      } else {
        const unprotected = totalEntities[0].count - entitiesWithUserId[0].count;
        console.log(`⚠️  ${dataType}: ${unprotected} of ${totalEntities[0].count} entities lack user isolation`);
      }
    }
    
    console.log('\n\n✨ User data isolation test complete!\n');
    
  } catch (error) {
    console.error('Error testing user isolation:', error);
  }
  
  process.exit(0);
}

// Run the test
testUserDataIsolation();