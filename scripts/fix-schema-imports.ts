#!/usr/bin/env tsx
/**
 * Fix all schema imports to use the unified schema
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Get all files that import from '@/lib/db/schema'
const files = execSync("grep -r \"from '@/lib/db/schema'\" --include='*.ts' --include='*.tsx' -l .")
  .toString()
  .trim()
  .split('\n')
  .filter(f => f && !f.includes('node_modules') && !f.includes('.next'));

console.log(`Found ${files.length} files to update`);

const replacements = [
  // Replace schema imports
  {
    from: /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@\/lib\/db\/schema['"]/g,
    to: (match: string, imports: string) => {
      // Parse the imports
      const importList = imports.split(',').map(i => i.trim());
      const mappings: Record<string, string> = {
        'companies': 'workspaces',
        'Company': 'Workspace',
        'NewCompany': 'NewWorkspace',
        'users': 'users',
        'User': 'User',
        'NewUser': 'NewUser',
        'entities': 'entities',
        'Entity': 'Entity',
        'NewEntity': 'NewEntity',
        // Remove old tables
        'integrations': '',
        'Integration': '',
        'invitations': '',
        'Invitation': '',
        'onboardingEvents': '',
        'OnboardingEvent': '',
        'auditLogs': '',
        'AuditLog': '',
        'commandHistory': '',
        'CommandHistory': '',
        'modules': '',
        'Module': ''
      };
      
      const newImports = importList
        .map(imp => mappings[imp] || imp)
        .filter(imp => imp !== '')
        .join(', ');
      
      if (newImports) {
        return `import { ${newImports} } from '@/lib/db/schema/unified'`;
      }
      return '';
    }
  },
  // Replace company references with workspace
  {
    from: /companies\./g,
    to: 'workspaces.'
  },
  {
    from: /company\.clerkOrgId/g,
    to: 'workspace.clerkOrgId'
  },
  {
    from: /company\.onboardingCompleted/g,
    to: 'true /* onboarding not needed in pure architecture */'
  },
  {
    from: /company\.onboardingStep/g,
    to: '0 /* onboarding not needed in pure architecture */'
  },
  {
    from: /workspaceId/g,
    to: 'workspaceId'
  },
  {
    from: /workspace_id/g,
    to: 'workspace_id'
  }
];

files.forEach(file => {
  if (!file) return;
  
  console.log(`Processing: ${file}`);
  let content = readFileSync(file, 'utf-8');
  let modified = false;
  
  replacements.forEach(({ from, to }) => {
    const newContent = typeof to === 'string' 
      ? content.replace(from, to)
      : content.replace(from, to);
    
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  if (modified) {
    writeFileSync(file, content);
    console.log(`  ✓ Updated ${file}`);
  } else {
    console.log(`  - No changes needed for ${file}`);
  }
});

console.log('\n✨ Schema import fixes complete!');