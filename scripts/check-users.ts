import { config } from 'dotenv';
import path from 'path';

// Load environment from .claude/.env BEFORE any imports that use env vars
config({ path: path.join(__dirname, '..', '.claude', '.env') });

// Verify env loaded
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found. Check .claude/.env file');
  process.exit(1);
}

// Now safe to import modules that use env vars
const { db } = require('../lib/db');
const { sql } = require('drizzle-orm');

async function checkUsers() {
  try {
    console.log('Checking users and workspaces...\n');
    
    // Check users table
    const users = await db.execute(sql`SELECT * FROM users LIMIT 5`);
    console.log('Users:', users.rows.length);
    if (users.rows.length > 0) {
      users.rows.forEach((user: any) => {
        console.log(`- User: ${user.clerk_user_id} (${user.email || 'no email'})`);
      });
    }
    
    // Check workspaces
    console.log('\nWorkspaces:');
    const workspaces = await db.execute(sql`SELECT * FROM workspaces`);
    workspaces.rows.forEach((ws: any) => {
      console.log(`- Workspace: ${ws.id} (org: ${ws.clerk_org_id}, name: ${ws.name})`);
    });
    
    // Check if clerk org IDs match
    console.log('\nChecking Clerk org ID from environment:');
    // This would be the org ID from the user's session
    console.log('Current test org: org_321PMbgXawub3NIZaTRy0OQaBhP (from dev server logs)');
    
    const matchingWorkspace = workspaces.rows.find(
      (ws: any) => ws.clerk_org_id === 'org_321PMbgXawub3NIZaTRy0OQaBhP'
    );
    
    if (matchingWorkspace) {
      console.log('✅ Found matching workspace:', matchingWorkspace.id);
    } else {
      console.log('❌ No workspace found for current org');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();