import { config } from 'dotenv';
import path from 'path';

// Load environment from .env
config({ path: path.join(__dirname, '..', '.env') });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found. Check .env file');
  process.exit(1);
}

const { db } = require('../lib/db');
const { entities } = require('../lib/db/schema/unified');
const { eq, and, sql, isNull } = require('drizzle-orm');

async function cleanTestEmails() {
  try {
    const workspaceId = '3ebb63b5-61dd-4a7f-b645-1f0a6d214f7f'; // Evergreen workspace
    
    console.log('🧹 Cleaning test emails - evergreenOS uses REAL DATA ONLY\n');
    
    // Delete all emails that don't have Gmail metadata (i.e., test emails)
    const result = await db
      .delete(entities)
      .where(
        and(
          eq(entities.workspaceId, workspaceId),
          eq(entities.type, 'email'),
          sql`metadata->>'source' IS NULL OR metadata->>'source' != 'gmail'`
        )
      );
    
    console.log('✅ Removed all test emails');
    
    // Count remaining real Gmail emails
    const realEmails = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.workspaceId, workspaceId),
          eq(entities.type, 'email'),
          sql`metadata->>'source' = 'gmail'`
        )
      );
    
    console.log(`\n📧 Real Gmail emails remaining: ${realEmails.length}`);
    
    if (realEmails.length === 0) {
      console.log('\n💡 Next Steps:');
      console.log('1. Go to Mail > Settings');
      console.log('2. Click "Connect Gmail"');
      console.log('3. Authorize evergreenOS');
      console.log('4. Real emails will sync automatically');
      console.log('\nNO MOCK DATA. UNIFIED ARCHITECTURE. REAL GMAIL INTEGRATION.');
    } else {
      console.log('\n✨ You have real Gmail data synced!');
      realEmails.slice(0, 3).forEach((email: any) => {
        console.log(`  - ${email.data.subject || 'No subject'} (from: ${email.data.from?.email})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanTestEmails();