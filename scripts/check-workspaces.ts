import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function checkWorkspaces() {
  try {
    const result = await db.execute(sql`SELECT * FROM workspaces`);
    console.log('Number of workspaces:', result.rows.length);
    console.log('Workspaces:', result.rows);
    
    // Check for duplicate clerk_org_id
    const clerkOrgIds = result.rows.map((row: any) => row.clerk_org_id);
    const duplicates = clerkOrgIds.filter((item, index) => clerkOrgIds.indexOf(item) !== index);
    
    if (duplicates.length > 0) {
      console.log('Duplicate clerk_org_ids found:', duplicates);
    } else {
      console.log('No duplicate clerk_org_ids found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkWorkspaces();