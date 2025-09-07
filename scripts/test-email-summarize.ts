#!/usr/bin/env tsx

import { processCommand } from '@/lib/modules-simple/command-processor';
import { db } from '@/lib/db';
import { workspaces } from '@/lib/db/schema/unified';
import { eq } from 'drizzle-orm';

async function test() {
  console.log('Testing email summarization...\n');
  
  // Get workspace
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.name, 'Evergreen'))
    .limit(1);

  if (!workspace) {
    console.error('No Evergreen workspace found!');
    process.exit(1);
  }

  console.log('Testing: "summarize my emails"');
  const result = await processCommand(
    workspace.id,
    'summarize my emails'
  );
  
  console.log('\nResult:', {
    success: result.success,
    message: result.message?.substring(0, 200),
    hasData: !!result.data
  });
  
  if (result.error) {
    console.error('Error:', result.error);
  }
  
  process.exit(result.success ? 0 : 1);
}

test().catch(console.error);