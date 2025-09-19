import 'dotenv/config';
import { db } from './lib/db';
import { entities } from './lib/db/schema/unified';
import { eq } from 'drizzle-orm';

async function checkCompanies() {
  try {
    const companies = await db
      .select()
      .from(entities)
      .where(eq(entities.type, 'company'));
    
    console.log(`Total companies in database: ${companies.length}`);
    
    // Show first 10 company names
    console.log('\nFirst 10 companies:');
    companies.slice(0, 10).forEach(company => {
      console.log(`- ${company.data?.name} (${company.id})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkCompanies();
