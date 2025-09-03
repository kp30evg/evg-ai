#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';

const filesToFix = [
  '/app/api/onboarding/invitations/route.ts',
  '/app/api/onboarding/company/route.ts',
  '/app/api/onboarding/import/route.ts',
  '/app/api/onboarding/invites/route.ts',
  '/app/api/onboarding/complete/route.ts',
  '/app/api/onboarding/progress/route.ts',
];

const projectRoot = path.join(process.cwd());

function fixFile(filePath: string) {
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  let modified = false;
  
  // Fix imports
  if (content.includes('onboardingEvents')) {
    content = content.replace(
      /import\s*{([^}]*)\}\s*from\s*['"]@\/lib\/db\/schema\/unified['"]/g,
      (match, imports) => {
        // Remove onboardingEvents from imports
        const importList = imports
          .split(',')
          .map((i: string) => i.trim())
          .filter((i: string) => i !== 'onboardingEvents')
          .join(', ');
        
        // If entities is not already imported, add it
        if (!importList.includes('entities')) {
          return `import { ${importList}, entities } from '@/lib/db/schema/unified'`;
        }
        return `import { ${importList} } from '@/lib/db/schema/unified'`;
      }
    );
    
    // Replace onboardingEvents usage with entities
    content = content.replace(
      /await\s+db\.insert\(onboardingEvents\)\.values\(/g,
      'await db.insert(entities).values('
    );
    
    // Update the values to include type and proper structure
    content = content.replace(
      /\.values\(\s*{\s*workspaceId:([^,]+),\s*userId:([^,]+),\s*event:([^,]+),\s*stepName:([^,]+),?\s*metadata:([^}]+)?\s*}\s*\)/g,
      (match, workspaceId, userId, event, stepName, metadata) => {
        const metadataValue = metadata ? metadata.trim() : '{}';
        return `.values({
        workspaceId:${workspaceId},
        type: 'onboarding_event',
        data: {
          event:${event},
          stepName:${stepName},
          ...${metadataValue}
        },
        createdBy: stringToUuid(${userId.trim()}),
        metadata: { source: 'onboarding' }
      })`;
      }
    );
    
    // Add stringToUuid helper if not present
    if (content.includes('stringToUuid') && !content.includes('const stringToUuid')) {
      const helperCode = `
// Helper to create a deterministic UUID from any string ID
const stringToUuid = (str: string): string => {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(str).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32)
  ].join('-');
}
`;
      // Insert helper after imports
      const importEndIndex = content.lastIndexOf('import');
      const lineAfterImports = content.indexOf('\n', importEndIndex) + 1;
      content = content.slice(0, lineAfterImports) + helperCode + content.slice(lineAfterImports);
    }
    
    modified = true;
  }
  
  // Fix companies -> workspaces
  if (content.includes('companies')) {
    content = content.replace(/\bcompanies\b/g, 'workspaces');
    content = content.replace(/\bcompany\b/g, 'workspace');
    content = content.replace(/\bCompany\b/g, 'Workspace');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`  ✅ Fixed: ${filePath}`);
  } else {
    console.log(`  ⏭️  No changes needed: ${filePath}`);
  }
}

console.log('🔧 Fixing onboarding imports...\n');

for (const file of filesToFix) {
  fixFile(file);
}

console.log('\n✨ Done!');