import 'dotenv/config';
import { db } from '../lib/db';
import { users, workspaces } from '../lib/db/schema/unified';
import { eq } from 'drizzle-orm';

async function checkEvergreenUsers() {
  // Get Evergreen workspace
  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.clerkOrgId, 'org_321PMbgXawub3NIZaTRy0OQaBhP')).limit(1);
  console.log('Evergreen workspace:', workspace?.id);

  if (!workspace) {
    console.error('Evergreen workspace not found!');
    process.exit(1);
  }

  // Get users in Evergreen workspace  
  const evergreenUsers = await db.select().from(users).where(eq(users.workspaceId, workspace.id));
  console.log('\nUsers in Evergreen workspace:');
  evergreenUsers.forEach(u => {
    console.log('- ', u.email, '(DB ID:', u.id.substring(0, 8) + '...', ', Clerk ID:', u.clerkUserId?.substring(0, 10) + '...)');
  });
  
  console.log('\nTotal users:', evergreenUsers.length);
  process.exit(0);
}

checkEvergreenUsers().catch(console.error);