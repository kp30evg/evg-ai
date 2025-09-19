/**
 * Script to link contacts to their companies based on company names
 * This will create company entities where they don't exist and establish proper relationships
 */

import 'dotenv/config';
import { db } from '../lib/db';
import { entities } from '../lib/db/schema/unified';
import { eq, and, ilike } from 'drizzle-orm';
import { entityService } from '../lib/entities/entity-service';

async function linkContactsToCompanies() {
  console.log('🔗 Linking contacts to companies...\n');

  try {
    // Get all contacts from database
    const allContacts = await db
      .select()
      .from(entities)
      .where(eq(entities.type, 'contact'));
    
    console.log(`Found ${allContacts.length} contacts\n`);

    // Get all companies from database
    const allCompanies = await db
      .select()
      .from(entities)
      .where(eq(entities.type, 'company'));
    
    console.log(`Found ${allCompanies.length} existing companies\n`);

    // Create a map of company names to company entities
    const companyMap = new Map<string, any>();
    allCompanies.forEach(company => {
      const name = company.data?.name;
      if (name) {
        companyMap.set(name.toLowerCase(), company);
      }
    });

    let linkedCount = 0;
    let createdCompanies = 0;

    // Process each contact
    for (const contact of allContacts) {
      const companyName = contact.data?.company || contact.data?.companyName;
      
      if (companyName && typeof companyName === 'string' && companyName.trim()) {
        console.log(`\nProcessing contact: ${contact.data?.name || contact.data?.email}`);
        console.log(`  Company name: ${companyName}`);

        let companyEntity = companyMap.get(companyName.toLowerCase());

        // If company doesn't exist, create it
        if (!companyEntity) {
          console.log(`  Creating new company: ${companyName}`);
          
          // Determine domain from company name if possible
          const domain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
          
          companyEntity = await entityService.create(
            contact.workspaceId,
            'company',
            {
              name: companyName,
              domain: domain,
              healthScore: 50,
              industry: 'Unknown', // Will be enriched later
              size: '1-10'
            },
            {},
            {
              autoCreated: true,
              source: 'contact_import'
            }
          );
          
          companyMap.set(companyName.toLowerCase(), companyEntity);
          createdCompanies++;
          console.log(`  ✓ Created company with ID: ${companyEntity.id}`);
        } else {
          console.log(`  Found existing company with ID: ${companyEntity.id}`);
        }

        // Update the contact's relationships field to link to company
        const updatedRelationships = {
          ...(contact.relationships || {}),
          company: companyEntity.id
        };

        // Also update the contact's data with companyId for direct reference
        const updatedData = {
          ...(contact.data || {}),
          companyId: companyEntity.id,
          companyName: companyEntity.data?.name
        };

        await db
          .update(entities)
          .set({
            data: updatedData,
            relationships: updatedRelationships,
            updatedAt: new Date()
          })
          .where(eq(entities.id, contact.id));

        linkedCount++;
        console.log(`  ✓ Linked contact to company`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ COMPLETED');
    console.log('='.repeat(60));
    console.log(`Created ${createdCompanies} new companies`);
    console.log(`Linked ${linkedCount} contacts to companies`);
    console.log(`Total companies: ${companyMap.size}`);

    // Now let's also link deals to companies
    console.log('\n🎯 Processing deals...\n');
    
    const allDeals = await db
      .select()
      .from(entities)
      .where(eq(entities.type, 'deal'));
    
    console.log(`Found ${allDeals.length} deals to process\n`);

    let linkedDeals = 0;
    for (const deal of allDeals) {
      const companyName = deal.data?.company || deal.data?.companyName;
      
      if (companyName && typeof companyName === 'string') {
        const companyEntity = companyMap.get(companyName.toLowerCase());
        
        if (companyEntity) {
          // Update the deal's relationships and data fields
          const updatedDealRelationships = {
            ...(deal.relationships || {}),
            company: companyEntity.id
          };

          await db
            .update(entities)
            .set({
              relationships: updatedDealRelationships,
              data: {
                ...(deal.data || {}),
                companyId: companyEntity.id,
                companyName: companyEntity.data?.name
              },
              updatedAt: new Date()
            })
            .where(eq(entities.id, deal.id));

          linkedDeals++;
          console.log(`✓ Linked deal "${deal.data?.name}" to company "${companyName}"`);
        }
      }
    }

    console.log(`\n✅ Linked ${linkedDeals} deals to companies`);

  } catch (error) {
    console.error('❌ Error linking contacts to companies:', error);
  }

  process.exit(0);
}

linkContactsToCompanies();