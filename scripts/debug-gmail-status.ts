import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { entities, users, workspaces } from '../lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Simulate what the getGmailStatus endpoint does
async function debugGmailStatus() {
  try {
    // Simulate the endpoint with Omid's credentials
    const clerkUserId = 'user_327TZuO5dXuPdMCrlsXg8Y21Nhr';
    const clerkOrgId = 'org_321PMbgXawub3NIZaTRy0OQaBhP';
    
    console.log('Simulating getGmailStatus for Omid...\n');
    console.log('Clerk User ID:', clerkUserId);
    console.log('Clerk Org ID:', clerkOrgId);
    
    // Get workspace ID from org
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.clerkOrgId, clerkOrgId))
      .limit(1);
    
    console.log('\nWorkspace found:', workspace?.id);
    
    // Get database user
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);
    
    console.log('Database user found:', dbUser?.id, dbUser?.email);
    
    if (!dbUser || !workspace) {
      console.log('\n❌ User or workspace not found - this would return connected: false');
      return;
    }
    
    // Check for email_account entity
    const emailAccount = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspace.id),
          eq(entities.type, 'email_account'),
          eq(entities.userId, dbUser.id)
        )
      );
    
    console.log(`\nEmail accounts found: ${emailAccount.length}`);
    
    if (emailAccount.length === 0) {
      console.log('❌ No email account - getGmailStatus returns connected: false');
    } else {
      const account = emailAccount[0];
      const accountData = account.data as any;
      console.log('\n✅ Email account found!');
      console.log('  Email:', accountData.email);
      console.log('  Is Active:', accountData.isActive);
      console.log('  Would return connected:', accountData.isActive !== false);
    }
    
    // Also check what stringToUuid would generate for the workspace
    const crypto = require('crypto');
    function stringToUuid(str: string): string {
      const hash = crypto.createHash('sha256').update(str).digest('hex');
      return [
        hash.substring(0, 8),
        hash.substring(8, 12),
        '4' + hash.substring(13, 16),
        ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
        hash.substring(20, 32)
      ].join('-');
    }
    
    const uuidFromString = stringToUuid(clerkOrgId);
    console.log('\n⚠️  ISSUE CHECK:');
    console.log('  Real workspace ID:', workspace.id);
    console.log('  stringToUuid generates:', uuidFromString);
    console.log('  Match:', workspace.id === uuidFromString ? '✅ YES' : '❌ NO - THIS IS THE BUG!');
    
    if (workspace.id !== uuidFromString) {
      console.log('\n🔥 FOUND THE BUG!');
      console.log('The evermail router is using stringToUuid() to generate workspace ID');
      console.log('But the real workspace ID in database is different!');
      console.log('This causes getGmailStatus to search with wrong workspace ID');
      console.log('So it never finds the email account even though it exists!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

debugGmailStatus();