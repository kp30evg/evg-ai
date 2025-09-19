#!/usr/bin/env tsx

/**
 * Migration script to populate company names for existing contacts
 * Extracts company names from email addresses and updates the database
 */

import 'dotenv/config';
import { db } from '@/lib/db';
import { entities } from '@/lib/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { extractCompanyFromEmail } from '@/lib/modules-simple/evercore';

async function fixContactCompanies() {
  console.log('🔧 Starting company extraction for existing contacts...\n');
  
  try {
    // Fetch all contacts that have an email but no company
    const contactsWithoutCompany = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.type, 'contact'),
          sql`data->>'email' IS NOT NULL`,
          sql`(data->>'company' IS NULL OR data->>'company' = '' OR data->>'companyName' IS NULL OR data->>'companyName' = '')`
        )
      );
    
    console.log(`Found ${contactsWithoutCompany.length} contacts without companies\n`);
    
    if (contactsWithoutCompany.length === 0) {
      console.log('✅ All contacts already have companies!');
      return;
    }
    
    let updated = 0;
    let skipped = 0;
    
    for (const contact of contactsWithoutCompany) {
      const email = contact.data?.email;
      
      if (!email) {
        skipped++;
        continue;
      }
      
      // Extract company from email
      const extractedCompany = extractCompanyFromEmail(email);
      
      if (extractedCompany) {
        // Update the contact with the extracted company
        const updatedData = {
          ...contact.data,
          company: extractedCompany,
          companyName: extractedCompany
        };
        
        await db
          .update(entities)
          .set({ 
            data: updatedData,
            updatedAt: new Date()
          })
          .where(eq(entities.id, contact.id));
        
        updated++;
        console.log(`✅ Updated ${contact.data?.name || email} → Company: "${extractedCompany}"`);
      } else {
        skipped++;
        console.log(`⚠️  Skipped ${email} (personal email or no company extracted)`);
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log(`\n✨ Migration complete!`);
    console.log(`   Updated: ${updated} contacts`);
    console.log(`   Skipped: ${skipped} contacts (personal emails)`);
    console.log(`   Total processed: ${contactsWithoutCompany.length} contacts\n`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  fixContactCompanies()
    .then(() => {
      console.log('🎉 Company extraction completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}