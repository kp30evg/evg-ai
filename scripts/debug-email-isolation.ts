#!/usr/bin/env node

import 'dotenv/config';
import { db } from '@/lib/db';
import { entities, users, workspaces } from '@/lib/db/schema/unified';
import { eq, and, sql } from 'drizzle-orm';

async function debugEmailIsolation() {
  console.log('🔍 Debugging Email Isolation Issue\n');
  
  try {
    // 1. Check all users
    console.log('1. All Users in Database:');
    console.log('----------------------------------------');
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        clerkUserId: users.clerkUserId,
        workspaceId: users.workspaceId
      })
      .from(users);
    
    console.log(`Found ${allUsers.length} users:`);
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id}, Clerk: ${user.clerkUserId})`);
    });
    
    // 2. Check email accounts
    console.log('\n2. Email Accounts in Database:');
    console.log('----------------------------------------');
    const emailAccounts = await db
      .select({
        id: entities.id,
        userId: entities.userId,
        workspaceId: entities.workspaceId,
        data: entities.data
      })
      .from(entities)
      .where(eq(entities.type, 'email_account'));
    
    console.log(`Found ${emailAccounts.length} email accounts:`);
    emailAccounts.forEach(account => {
      const data = account.data as any;
      const matchingUser = allUsers.find(u => u.id === account.userId);
      console.log(`  - ${data.email} (User ID: ${account.userId}, User Email: ${matchingUser?.email || 'UNKNOWN USER'})`);
      if (!matchingUser) {
        console.log(`    ⚠️ WARNING: No matching user found for userId ${account.userId}`);
      }
    });
    
    // 3. Check emails by user
    console.log('\n3. Email Distribution by User:');
    console.log('----------------------------------------');
    
    for (const user of allUsers) {
      const emailCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(entities)
        .where(
          and(
            eq(entities.type, 'email'),
            eq(entities.userId, user.id)
          )
        );
      
      // Get sample emails
      const sampleEmails = await db
        .select({
          id: entities.id,
          data: entities.data
        })
        .from(entities)
        .where(
          and(
            eq(entities.type, 'email'),
            eq(entities.userId, user.id)
          )
        )
        .limit(3);
      
      console.log(`\n  User: ${user.email} (ID: ${user.id})`);
      console.log(`  Total emails: ${emailCount[0].count}`);
      
      if (sampleEmails.length > 0) {
        console.log(`  Sample emails:`);
        sampleEmails.forEach(email => {
          const data = email.data as any;
          console.log(`    - From: ${data.from?.email}, Subject: ${data.subject?.substring(0, 50)}...`);
        });
      }
    }
    
    // 4. Check for emails without proper userId
    console.log('\n4. Checking for Emails with NULL or missing userId:');
    console.log('----------------------------------------');
    const orphanedEmails = await db
      .select({
        id: entities.id,
        userId: entities.userId,
        data: entities.data
      })
      .from(entities)
      .where(
        and(
          eq(entities.type, 'email'),
          sql`${entities.userId} IS NULL`
        )
      )
      .limit(10);
    
    if (orphanedEmails.length > 0) {
      console.log(`⚠️ Found ${orphanedEmails.length} emails with NULL userId!`);
      orphanedEmails.forEach(email => {
        const data = email.data as any;
        console.log(`  - ID: ${email.id}, From: ${data.from?.email}, Subject: ${data.subject}`);
      });
    } else {
      console.log('✅ All emails have proper userId');
    }
    
    // 5. Check for cross-contamination
    console.log('\n5. Checking for Cross-Contamination:');
    console.log('----------------------------------------');
    
    // Find kian@kianpezeshki.com emails
    const kianPezeshkiEmails = await db
      .select({
        id: entities.id,
        userId: entities.userId,
        data: entities.data
      })
      .from(entities)
      .where(
        and(
          eq(entities.type, 'email'),
          sql`data->'from'->>'email' LIKE '%kianpezeshki.com%'`
        )
      )
      .limit(5);
    
    if (kianPezeshkiEmails.length > 0) {
      console.log(`Found ${kianPezeshkiEmails.length} emails from kianpezeshki.com domain:`);
      kianPezeshkiEmails.forEach(email => {
        const data = email.data as any;
        const matchingUser = allUsers.find(u => u.id === email.userId);
        console.log(`  - From: ${data.from?.email}`);
        console.log(`    Stored under user: ${matchingUser?.email || 'UNKNOWN'} (ID: ${email.userId})`);
        
        // Check if this is correct
        if (matchingUser && !matchingUser.email?.includes('kianpezeshki.com')) {
          console.log(`    ❌ CRITICAL: Email from kianpezeshki.com stored under ${matchingUser.email}!`);
        }
      });
    }
    
    // Find kian@evergreengroup.ai emails
    const evergreenEmails = await db
      .select({
        id: entities.id,
        userId: entities.userId,
        data: entities.data
      })
      .from(entities)
      .where(
        and(
          eq(entities.type, 'email'),
          sql`data->'from'->>'email' LIKE '%evergreengroup.ai%'`
        )
      )
      .limit(5);
    
    if (evergreenEmails.length > 0) {
      console.log(`\nFound ${evergreenEmails.length} emails from evergreengroup.ai domain:`);
      evergreenEmails.forEach(email => {
        const data = email.data as any;
        const matchingUser = allUsers.find(u => u.id === email.userId);
        console.log(`  - From: ${data.from?.email}`);
        console.log(`    Stored under user: ${matchingUser?.email || 'UNKNOWN'} (ID: ${email.userId})`);
        
        // Check if this is correct
        if (matchingUser && !matchingUser.email?.includes('evergreengroup.ai')) {
          console.log(`    ❌ CRITICAL: Email from evergreengroup.ai stored under ${matchingUser.email}!`);
        }
      });
    }
    
    console.log('\n✅ Debug complete!');
    
  } catch (error) {
    console.error('\n❌ Debug failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the debug
debugEmailIsolation();