#!/usr/bin/env tsx
/**
 * Simplified script to sync Clerk users to Neon database
 * Run with: npx tsx scripts/sync-users-simple.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { createClerkClient } from '@clerk/backend';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, workspaces } from '@/lib/db/schema/unified';
import { eq } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!connectionString || !clerkSecretKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create Clerk client
const clerkClient = createClerkClient({ secretKey: clerkSecretKey });

// Create database connection
const sqlClient = neon(connectionString);
const db = drizzle(sqlClient, { schema: { users, workspaces } });

async function syncUsers() {
  try {
    console.log('🔄 Starting Clerk user sync...\n');

    // First, get all organizations
    const organizations = await clerkClient.organizations.getOrganizationList();
    console.log(`Found ${organizations.totalCount} organizations in Clerk\n`);

    for (const org of organizations.data) {
      console.log(`\n📁 Processing organization: ${org.name} (${org.id})`);
      
      // Check if workspace exists
      const existingWorkspace = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.clerkOrgId, org.id))
        .limit(1);

      let workspaceId: string;
      
      if (existingWorkspace.length === 0) {
        console.log(`  ⚠️  Workspace not found, creating...`);
        const newWorkspace = await db
          .insert(workspaces)
          .values({
            clerkOrgId: org.id,
            name: org.name,
            slug: org.slug || org.name.toLowerCase().replace(/\s+/g, '-'),
            settings: {}
          })
          .returning();
        workspaceId = newWorkspace[0].id;
        console.log(`  ✅ Created workspace: ${workspaceId}`);
      } else {
        workspaceId = existingWorkspace[0].id;
        console.log(`  ✓ Workspace exists: ${workspaceId}`);
      }

      // Get organization members
      const memberships = await clerkClient.organizations.getOrganizationMembershipList({
        organizationId: org.id
      });

      console.log(`  Found ${memberships.totalCount} members`);

      for (const membership of memberships.data) {
        const clerkUser = membership.publicUserData;
        if (!clerkUser?.userId) continue;

        // Check if user exists
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.clerkUserId, clerkUser.userId))
          .limit(1);

        if (existingUser.length === 0) {
          // Create user
          const newUser = await db
            .insert(users)
            .values({
              clerkUserId: clerkUser.userId,
              email: clerkUser.identifier || '',
              workspaceId: workspaceId,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              imageUrl: clerkUser.imageUrl,
              role: membership.role === 'org:admin' ? 'admin' : 'member'
            })
            .returning();
          
          console.log(`    ✅ Created user: ${newUser[0].email} (${newUser[0].id})`);
        } else {
          // Update workspace if needed
          if (existingUser[0].workspaceId !== workspaceId) {
            await db
              .update(users)
              .set({
                workspaceId: workspaceId,
                updatedAt: new Date()
              })
              .where(eq(users.id, existingUser[0].id));
            
            console.log(`    🔄 Updated user workspace: ${existingUser[0].email}`);
          } else {
            console.log(`    ✓ User already synced: ${existingUser[0].email}`);
          }
        }
      }
    }

    // Get total user count
    const totalUsers = await db.select().from(users);
    console.log(`\n✅ Sync complete! Total users in database: ${totalUsers.length}`);

  } catch (error) {
    console.error('❌ Error syncing users:', error);
    process.exit(1);
  }
}

// Run the sync
syncUsers()
  .then(() => {
    console.log('\n🎉 User sync completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });