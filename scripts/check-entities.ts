#!/usr/bin/env tsx
import * as dotenv from 'dotenv';
import * as path from 'path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { entities } from '../lib/db/schema/unified';
import { desc } from 'drizzle-orm';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const client = neon(dbUrl);
const db = drizzle(client);

(async () => {
  try {
    const results = await db.select()
      .from(entities)
      .orderBy(desc(entities.createdAt))
      .limit(10);
    
    console.log('\n📊 Recent Entities in Database:\n');
    console.log('================================\n');
    
    if (results.length === 0) {
      console.log('No entities found in the database.');
    } else {
      results.forEach((entity, index) => {
        console.log(`Entity #${index + 1}`);
        console.log('  ID:', entity.id);
        console.log('  Type:', entity.type);
        console.log('  Workspace:', entity.workspaceId);
        console.log('  Data:', JSON.stringify(entity.data, null, 2));
        console.log('  Relationships:', JSON.stringify(entity.relationships));
        console.log('  Created:', entity.createdAt);
        console.log('---');
      });
      console.log(`\n✅ Total entities found: ${results.length}`);
    }
    
    // Count entities by type
    const typeCounts: Record<string, number> = {};
    results.forEach(entity => {
      typeCounts[entity.type] = (typeCounts[entity.type] || 0) + 1;
    });
    
    console.log('\n📈 Entity Types:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });
    
  } catch (error) {
    console.error('Error querying database:', error);
    process.exit(1);
  }
  
  process.exit(0);
})();