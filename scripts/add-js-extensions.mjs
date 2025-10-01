#!/usr/bin/env node
/**
 * Comprehensive script to add .js extensions to all relative imports in TypeScript files.
 * This fixes ES module resolution issues in Node.js.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const PACKAGES_DIR = 'packages/analyzer/src';

// Recursively find all .ts files, excluding tests
function findTsFiles(dir, files = []) {
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (entry !== '__tests__' && entry !== 'node_modules') {
        findTsFiles(fullPath, files);
      }
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

const files = findTsFiles(PACKAGES_DIR);

console.log(`📝 Found ${files.length} source files to process\n`);

let totalChanges = 0;

files.forEach((filePath) => {
  let content = readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Pattern 1: import ... from './xyz'  →  import ... from './xyz.js'
  // Pattern 2: import ... from '../xyz'  →  import ... from '../xyz.js'
  // But skip if already has .js extension

  // Match import/export statements with relative paths
  const patterns = [
    // import { x } from './path' or '../path'
    {
      regex: /(import\s+(?:type\s+)?(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"])(\.[^'"]+)(['"])/g,
      description: 'import statements',
    },
    // export ... from './path'
    {
      regex: /(export\s+(?:\*|{[^}]+})\s+from\s+['"])(\.[^'"]+)(['"])/g,
      description: 'export statements',
    },
  ];

  patterns.forEach(({ regex, description }) => {
    content = content.replace(regex, (match, prefix, path, suffix) => {
      // Skip if already has .js extension
      if (path.endsWith('.js')) {
        return match;
      }

      // Skip type-only imports from types directory that reference .ts files
      if (path.includes('/types/') && !path.endsWith('.ts')) {
        return match;
      }

      // Remove any .ts extension if present (TypeScript source files should import as .js)
      if (path.endsWith('.ts')) {
        path = path.slice(0, -3);
      }

      // Add .js extension
      return `${prefix}${path}.js${suffix}`;
    });
  });

  if (content !== originalContent) {
    writeFileSync(filePath, content, 'utf8');
    const changes = (originalContent.match(/from/g) || []).length -
      (content.match(/from/g) || []).length;
    console.log(`✅ ${filePath} (${Math.abs(changes)} imports fixed)`);
    totalChanges++;
  }
});

console.log(`\n✨ Fixed ${totalChanges} files with missing .js extensions`);

if (totalChanges === 0) {
  console.log('🎉 No files needed fixing - all imports already have .js extensions!');
  process.exit(0);
}

console.log('\n🧪 Run tests to verify the changes...');

