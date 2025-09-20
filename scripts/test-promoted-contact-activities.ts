#!/usr/bin/env tsx

/**
 * Script to test promoted contact activities
 * Creates test data to verify that email activities show up after contact promotion
 */

import 'dotenv/config';
import { db } from '../lib/db';
import { entities, activities, users, workspaces } from '../lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';

async function testPromotedContactActivities() {
  console.log('Testing Promoted Contact Activities');
  console.log('====================================\n');

  try {
    // Get the first workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .limit(1);

    if (!workspace) {
      console.error('No workspace found. Please create a workspace first.');
      return;
    }

    console.log(`Using workspace: ${workspace.name} (${workspace.id})`);

    // Get the first user
    const [user] = await db
      .select()
      .from(users)
      .limit(1);

    if (!user) {
      console.error('No user found. Please sync users first.');
      return;
    }

    console.log(`Using user: ${user.email} (${user.id})\n`);

    // Create an imported contact
    console.log('1. Creating imported contact...');
    const [importedContact] = await db.insert(entities).values({
      workspaceId: workspace.id,
      userId: user.id,
      type: 'contact',
      data: {
        name: 'John Test Smith',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@testcompany.com',
        phone: '+1 555-0123',
        company: '', // Empty initially for imported contacts
        companyName: '',
        jobTitle: '',
        source: 'gmail_import',
        createdFrom: 'email_sync',
        contactSource: 'imported',
        importedFrom: 'gmail',
        importedAt: new Date().toISOString(),
        extractedCompany: 'Test Company'
      },
      metadata: {
        autoCreated: true,
        source: 'gmail_sync',
        contactSource: 'imported'
      }
    }).returning();

    console.log(`Created imported contact: ${importedContact.id}`);

    // Create email entities and activities
    console.log('\n2. Creating email history...');
    
    // Email 1
    const [email1] = await db.insert(entities).values({
      workspaceId: workspace.id,
      userId: user.id,
      type: 'email',
      data: {
        gmailId: 'test_email_1',
        threadId: 'thread_1',
        subject: 'Project Proposal Discussion',
        from: {
          name: 'John Smith',
          email: 'john.smith@testcompany.com'
        },
        to: user.email,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        snippet: 'Hi, I wanted to discuss the project proposal we talked about...',
        body: {
          text: 'Hi, I wanted to discuss the project proposal we talked about last week.',
          html: '<p>Hi, I wanted to discuss the project proposal we talked about last week.</p>'
        },
        isRead: true,
        isStarred: false,
        isDraft: false,
        labels: ['INBOX']
      }
    }).returning();

    // Activity for Email 1
    await db.insert(activities).values({
      workspaceId: workspace.id,
      entityId: importedContact.id,
      userId: user.id,
      activityType: 'email_received',
      sourceModule: 'evermail',
      content: {
        subject: 'Project Proposal Discussion',
        from: 'john.smith@testcompany.com',
        to: user.email,
        snippet: 'Hi, I wanted to discuss the project proposal we talked about...',
        emailId: email1.id
      },
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    });

    // Email 2
    const [email2] = await db.insert(entities).values({
      workspaceId: workspace.id,
      userId: user.id,
      type: 'email',
      data: {
        gmailId: 'test_email_2',
        threadId: 'thread_1',
        subject: 'Re: Project Proposal Discussion',
        from: {
          name: user.email?.split('@')[0] || 'User',
          email: user.email
        },
        to: 'john.smith@testcompany.com',
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
        snippet: 'Thanks for reaching out! I\'d be happy to discuss the proposal...',
        body: {
          text: 'Thanks for reaching out! I\'d be happy to discuss the proposal in detail.',
          html: '<p>Thanks for reaching out! I\'d be happy to discuss the proposal in detail.</p>'
        },
        isRead: true,
        isStarred: false,
        isDraft: false,
        labels: ['SENT']
      }
    }).returning();

    // Activity for Email 2
    await db.insert(activities).values({
      workspaceId: workspace.id,
      entityId: importedContact.id,
      userId: user.id,
      activityType: 'email_sent',
      sourceModule: 'evermail',
      content: {
        subject: 'Re: Project Proposal Discussion',
        from: user.email,
        to: 'john.smith@testcompany.com',
        snippet: 'Thanks for reaching out! I\'d be happy to discuss the proposal...',
        emailId: email2.id
      },
      timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    });

    // Email 3
    const [email3] = await db.insert(entities).values({
      workspaceId: workspace.id,
      userId: user.id,
      type: 'email',
      data: {
        gmailId: 'test_email_3',
        threadId: 'thread_1',
        subject: 'Re: Project Proposal Discussion',
        from: {
          name: 'John Smith',
          email: 'john.smith@testcompany.com'
        },
        to: user.email,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        snippet: 'Great! How about we schedule a call for tomorrow?',
        body: {
          text: 'Great! How about we schedule a call for tomorrow at 2 PM?',
          html: '<p>Great! How about we schedule a call for tomorrow at 2 PM?</p>'
        },
        isRead: true,
        isStarred: true,
        isDraft: false,
        labels: ['INBOX', 'STARRED']
      }
    }).returning();

    // Activity for Email 3
    await db.insert(activities).values({
      workspaceId: workspace.id,
      entityId: importedContact.id,
      userId: user.id,
      activityType: 'email_received',
      sourceModule: 'evermail',
      content: {
        subject: 'Re: Project Proposal Discussion',
        from: 'john.smith@testcompany.com',
        to: user.email,
        snippet: 'Great! How about we schedule a call for tomorrow?',
        emailId: email3.id
      },
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });

    console.log('Created 3 emails with activities');

    // Now let's simulate promoting the contact
    console.log('\n3. Simulating contact promotion to "My Contacts"...');
    
    const promotedData = {
      ...importedContact.data as any,
      contactSource: 'promoted',
      promotedAt: new Date().toISOString(),
      promotedBy: user.id,
      company: 'Test Company',
      companyName: 'Test Company',
      jobTitle: 'Project Manager'
    };

    await db
      .update(entities)
      .set({
        data: promotedData,
        updatedAt: new Date()
      })
      .where(eq(entities.id, importedContact.id));

    console.log('Contact promoted successfully');

    // Verify activities are still linked
    console.log('\n4. Verifying activities...');
    
    const linkedActivities = await db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.workspaceId, workspace.id),
          eq(activities.entityId, importedContact.id)
        )
      );

    console.log(`Found ${linkedActivities.length} activities linked to the contact`);
    
    if (linkedActivities.length > 0) {
      console.log('\nActivities:');
      linkedActivities.forEach(activity => {
        console.log(`- ${activity.activityType}: ${activity.content?.subject || 'No subject'}`);
      });
    }

    console.log('\n✅ Test data created successfully!');
    console.log(`Contact ID: ${importedContact.id}`);
    console.log(`Contact Email: john.smith@testcompany.com`);
    console.log('\nYou can now:');
    console.log('1. Go to the CRM Contacts page');
    console.log('2. Look for "John Test Smith" in both "Imported Contacts" and "My Contacts" tabs');
    console.log('3. Click on the contact to view their detail page');
    console.log('4. Check if the email activities are showing in the Activity timeline');

  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

// Run the test
testPromotedContactActivities();