#!/usr/bin/env node

/**
 * Migration script to add contactSource field to existing contacts
 * Sets all existing contacts as 'manual' since they were created before the import feature
 */

import 'dotenv/config';
import { db } from '../lib/db';
import { entities } from '../lib/db/schema/unified';
import { eq, and, isNull, sql } from 'drizzle-orm';

async function migrateContactSources() {
  try {
    console.log('Starting contact source migration...');
    
    // Get all contact entities that don't have a contactSource
    const contacts = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.type, 'contact'),
          sql`(data->>'contactSource') IS NULL`
        )
      );
    
    console.log(`Found ${contacts.length} contacts without contactSource`);
    
    if (contacts.length === 0) {
      console.log('No contacts need migration');
      return;
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const contact of contacts) {
      const data = contact.data as any;
      
      // Determine the contact source based on existing metadata
      let contactSource = 'manual'; // Default to manual
      
      // Check if it was imported from Gmail
      if (data.source === 'gmail_import' || 
          data.createdFrom === 'email_sync' ||
          contact.metadata?.source === 'gmail_sync') {
        contactSource = 'imported';
      }
      
      // Update the contact with the new field
      try {
        await db
          .update(entities)
          .set({
            data: {
              ...data,
              contactSource: contactSource,
              // Add import metadata if it's an imported contact
              ...(contactSource === 'imported' && {
                importedFrom: 'gmail',
                importedAt: contact.createdAt || new Date().toISOString()
              })
            }
          })
          .where(eq(entities.id, contact.id));
        
        migratedCount++;
        
        // Log progress every 10 contacts
        if (migratedCount % 10 === 0) {
          console.log(`Migrated ${migratedCount} contacts...`);
        }
      } catch (error) {
        console.error(`Failed to migrate contact ${contact.id}:`, error);
        skippedCount++;
      }
    }
    
    console.log('\n✅ Migration completed!');
    console.log(`Successfully migrated: ${migratedCount} contacts`);
    console.log(`Skipped/Failed: ${skippedCount} contacts`);
    
    // Verify the migration
    const verifyQuery = await db
      .select({
        total: sql<number>`COUNT(*)`,
        manual: sql<number>`COUNT(*) FILTER (WHERE data->>'contactSource' = 'manual')`,
        imported: sql<number>`COUNT(*) FILTER (WHERE data->>'contactSource' = 'imported')`,
        promoted: sql<number>`COUNT(*) FILTER (WHERE data->>'contactSource' = 'promoted')`
      })
      .from(entities)
      .where(eq(entities.type, 'contact'));
    
    const stats = verifyQuery[0];
    console.log('\n📊 Contact Statistics:');
    console.log(`Total contacts: ${stats.total}`);
    console.log(`Manual contacts: ${stats.manual}`);
    console.log(`Imported contacts: ${stats.imported}`);
    console.log(`Promoted contacts: ${stats.promoted}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
console.log('Contact Source Migration Script');
console.log('================================\n');
migrateContactSources()
  .then(() => {
    console.log('\n✨ Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });