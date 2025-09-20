#!/usr/bin/env node

/**
 * Script to create test imported contacts for demonstration
 */

import 'dotenv/config';
import { db } from '../lib/db';
import { entities } from '../lib/db/schema/unified';
import { eq, and, sql } from 'drizzle-orm';

async function createTestImportedContacts() {
  try {
    console.log('Creating test imported contacts...');
    
    // Get a workspace and user for testing
    const [firstContact] = await db
      .select()
      .from(entities)
      .where(eq(entities.type, 'contact'))
      .limit(1);
    
    if (!firstContact) {
      console.log('No existing contacts found. Please create a contact first.');
      return;
    }
    
    const workspaceId = firstContact.workspaceId;
    const userId = firstContact.userId;
    
    // Test imported contacts (these would typically come from email sync)
    const testImportedContacts = [
      {
        name: 'Newsletter Team',
        email: 'newsletter@techcompany.com',
        company: 'TechCompany',
      },
      {
        name: 'Support Bot',
        email: 'support@automatedservice.com',
        company: 'AutomatedService',
      },
      {
        name: 'Marketing Updates',
        email: 'marketing@brandnews.com',
        company: 'BrandNews',
      },
      {
        name: 'System Notifications',
        email: 'notifications@saasplatform.com',
        company: 'SaaSPlatform',
      },
      {
        name: 'Weekly Digest',
        email: 'digest@contentprovider.com',
        company: 'ContentProvider',
      }
    ];
    
    let createdCount = 0;
    
    for (const contact of testImportedContacts) {
      // Check if already exists
      const existing = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.workspaceId, workspaceId),
            eq(entities.type, 'contact'),
            sql`data->>'email' = ${contact.email}`
          )
        )
        .limit(1);
      
      if (existing.length > 0) {
        console.log(`Contact ${contact.email} already exists, skipping...`);
        continue;
      }
      
      // Create as imported contact
      await db.insert(entities).values({
        workspaceId: workspaceId,
        userId: userId,
        type: 'contact',
        data: {
          name: contact.name,
          email: contact.email,
          company: '',  // No company set for imported contacts initially
          extractedCompany: contact.company,  // Store extracted company for later
          source: 'gmail_import',
          createdFrom: 'email_sync',
          contactSource: 'imported',  // Mark as imported
          importedFrom: 'gmail',
          importedAt: new Date().toISOString(),
          status: 'Cold',
          dealValue: 0,
          lastContact: new Date().toISOString(),
        },
        metadata: {
          autoCreated: true,
          source: 'test_import_script',
          contactSource: 'imported'
        }
      });
      
      createdCount++;
      console.log(`Created imported contact: ${contact.name} (${contact.email})`);
    }
    
    console.log(`\n✅ Created ${createdCount} test imported contacts`);
    
    // Show statistics
    const stats = await db
      .select({
        total: sql<number>`COUNT(*)`,
        manual: sql<number>`COUNT(*) FILTER (WHERE data->>'contactSource' = 'manual')`,
        imported: sql<number>`COUNT(*) FILTER (WHERE data->>'contactSource' = 'imported')`,
        promoted: sql<number>`COUNT(*) FILTER (WHERE data->>'contactSource' = 'promoted')`
      })
      .from(entities)
      .where(
        and(
          eq(entities.type, 'contact'),
          eq(entities.workspaceId, workspaceId)
        )
      );
    
    const stat = stats[0];
    console.log('\n📊 Updated Contact Statistics:');
    console.log(`Total contacts: ${stat.total}`);
    console.log(`My Contacts (manual): ${stat.manual}`);
    console.log(`Imported contacts: ${stat.imported}`);
    console.log(`Promoted contacts: ${stat.promoted}`);
    
  } catch (error) {
    console.error('Failed to create test contacts:', error);
    process.exit(1);
  }
}

// Run the script
console.log('Test Imported Contacts Creation Script');
console.log('=====================================\n');
createTestImportedContacts()
  .then(() => {
    console.log('\n✨ Script complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });