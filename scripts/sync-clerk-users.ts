#!/usr/bin/env tsx
/**
 * Script to sync all Clerk users to the Neon database
 * This ensures the users table is populated with all existing Clerk users
 * Run with: npx tsx scripts/sync-clerk-users.ts
 */

import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config({ path: '.env' });

import { clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, workspaces } from '@/lib/db/schema/unified';
import { eq } from 'drizzle-orm';

async function syncClerkUsers() {
  try {
    console.log('🔄 Starting Clerk user sync...\n');

    // Get all organizations from Clerk
    const organizations = await clerkClient.organizations.getOrganizationList();
    console.log(`Found ${organizations.totalCount} organizations in Clerk\n`);

    for (const org of organizations.data) {
      console.log(`\n📁 Processing organization: ${org.name} (${org.id})`);
      
      // Check if workspace exists in database
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.clerkOrgId, org.id))
        .limit(1);

      if (!workspace) {
        console.log(`  ⚠️  Workspace not found in database, creating...`);
        const [newWorkspace] = await db
          .insert(workspaces)
          .values({
            clerkOrgId: org.id,
            name: org.name,
            slug: org.slug || org.name.toLowerCase().replace(/\s+/g, '-'),
            settings: {}
          })
          .returning();
        console.log(`  ✅ Created workspace: ${newWorkspace.id}`);
      }

      // Get the workspace ID
      const [currentWorkspace] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.clerkOrgId, org.id))
        .limit(1);

      // Get all members of this organization
      const memberships = await clerkClient.organizations.getOrganizationMembershipList({
        organizationId: org.id
      });

      console.log(`  Found ${memberships.totalCount} members`);

      for (const membership of memberships.data) {
        const clerkUser = membership.publicUserData;
        if (!clerkUser) continue;

        // Check if user exists in database
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.clerkUserId, clerkUser.userId))
          .limit(1);

        if (!existingUser) {
          // Create user in database
          const [newUser] = await db
            .insert(users)
            .values({
              clerkUserId: clerkUser.userId,
              email: clerkUser.identifier || '',
              workspaceId: currentWorkspace.id,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              imageUrl: clerkUser.imageUrl,
              role: membership.role === 'org:admin' ? 'admin' : 'member'
            })
            .returning();
          
          console.log(`    ✅ Created user: ${newUser.email} (${newUser.id})`);
        } else {
          // Update user's workspace if needed
          if (existingUser.workspaceId !== currentWorkspace.id) {
            await db
              .update(users)
              .set({
                workspaceId: currentWorkspace.id,
                updatedAt: new Date()
              })
              .where(eq(users.id, existingUser.id));
            
            console.log(`    🔄 Updated user workspace: ${existingUser.email}`);
          } else {
            console.log(`    ✓ User already synced: ${existingUser.email}`);
          }
        }
      }
    }

    // Also sync any users not in organizations
    const allClerkUsers = await clerkClient.users.getUserList();
    console.log(`\n👥 Checking ${allClerkUsers.totalCount} total Clerk users...`);

    for (const clerkUser of allClerkUsers.data) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, clerkUser.id))
        .limit(1);

      if (!existingUser) {
        // Create user without workspace (they'll be assigned when they join an org)
        const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
        const [newUser] = await db
          .insert(users)
          .values({
            clerkUserId: clerkUser.id,
            email: email,
            workspaceId: null,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl,
            role: 'member'
          })
          .returning();
        
        console.log(`  ✅ Created unassigned user: ${newUser.email}`);
      }
    }

    // Final verification
    const totalUsers = await db.select().from(users);
    console.log(`\n✅ Sync complete! Total users in database: ${totalUsers.length}`);

  } catch (error) {
    console.error('❌ Error syncing users:', error);
    process.exit(1);
  }
}

// Run the sync
syncClerkUsers()
  .then(() => {
    console.log('\n🎉 User sync completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });