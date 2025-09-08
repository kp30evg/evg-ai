import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { entities, users, workspaces } from '../lib/db/schema/unified';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function checkWorkspaceMismatch() {
  try {
    console.log('🔍 Checking workspace mismatch issue...\n');
    
    // Check all workspaces
    const allWorkspaces = await db.select().from(workspaces);
    console.log('All workspaces in database:');
    allWorkspaces.forEach(w => {
      console.log(`  ID: ${w.id}`);
      console.log(`  Name: ${w.name}`);
      console.log(`  Clerk Org: ${w.clerkOrgId}`);
      console.log('  ---');
    });
    
    // Find the Evergreen workspace
    const evergreenWorkspace = allWorkspaces.find(w => 
      w.name === 'Evergreen' || w.clerkOrgId === 'org_321PMbgXawub3NIZaTRy0OQaBhP'
    );
    
    if (evergreenWorkspace) {
      console.log('\n✅ Found Evergreen workspace:');
      console.log(`  Correct ID: ${evergreenWorkspace.id}`);
      console.log(`  Clerk Org: ${evergreenWorkspace.clerkOrgId}\n`);
    }
    
    // Check user kian@evergreengroup.ai
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'kian@evergreengroup.ai'))
      .limit(1);
      
    if (user) {
      console.log('User kian@evergreengroup.ai:');
      console.log(`  User ID: ${user.id}`);
      console.log(`  Current Workspace ID: ${user.workspaceId}`);
      console.log(`  Clerk User ID: ${user.clerkUserId}`);
      
      const isCorrectWorkspace = user.workspaceId === evergreenWorkspace?.id;
      console.log(`  ✅ Workspace match: ${isCorrectWorkspace ? 'YES' : 'NO - MISMATCH!'}\n`);
    }
    
    // Check Gmail accounts
    const gmailAccounts = await db
      .select()
      .from(entities)
      .where(eq(entities.type, 'email_account'));
      
    console.log('Gmail accounts found:');
    gmailAccounts.forEach(a => {
      const data = a.data as any;
      console.log(`  Account ID: ${a.id}`);
      console.log(`  Workspace: ${a.workspaceId}`);
      console.log(`  User: ${a.userId}`);
      console.log(`  Email: ${data?.email}`);
      
      if (a.userId === user?.id) {
        const isCorrectWorkspace = a.workspaceId === evergreenWorkspace?.id;
        console.log(`  ⚠️  This is kian's account - Workspace correct: ${isCorrectWorkspace ? 'YES' : 'NO'}`);
        
        if (!isCorrectWorkspace && evergreenWorkspace) {
          console.log(`\n  🔧 FIX NEEDED: Update workspace from ${a.workspaceId} to ${evergreenWorkspace.id}`);
        }
      }
      console.log('  ---');
    });
    
    // Check if we need to fix the workspace
    const needsFix = gmailAccounts.some(a => 
      a.userId === user?.id && a.workspaceId !== evergreenWorkspace?.id
    );
    
    if (needsFix && evergreenWorkspace && user) {
      console.log('\n⚠️  WORKSPACE MISMATCH DETECTED!');
      console.log('Gmail account is in wrong workspace.');
      console.log('\nWould you like to fix this? (y/n)');
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('', async (answer: string) => {
        if (answer.toLowerCase() === 'y') {
          console.log('\n🔧 Fixing workspace association...');
          
          // Update the Gmail account to correct workspace
          await db
            .update(entities)
            .set({ workspaceId: evergreenWorkspace.id })
            .where(eq(entities.userId, user.id))
            .where(eq(entities.type, 'email_account'));
          
          console.log('✅ Fixed! Gmail account moved to correct workspace.');
          console.log('\nPlease try sending email again.');
        } else {
          console.log('\n❌ Fix cancelled.');
        }
        
        readline.close();
        process.exit(0);
      });
    } else {
      console.log('\n✅ No workspace mismatch found.');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkWorkspaceMismatch();