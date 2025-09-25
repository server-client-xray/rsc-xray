import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';

import { describe, expect, it } from 'vitest';

import type { Model } from '@rsc-xray/schemas';

import { printSuggestions } from '../printSuggestions';

describe('printSuggestions', () => {
  it('prints a table of suggestions', async () => {
    const model: Model = {
      version: '0.1',
      build: { nextVersion: '14.2.0', timestamp: new Date().toISOString() },
      routes: [
        {
          route: '/demo',
          rootNodeId: 'route:/demo',
        },
      ],
      nodes: {
        'route:/demo': {
          id: 'route:/demo',
          kind: 'route',
          name: '/demo',
          children: ['module:app/demo/page.tsx'],
        },
        'module:app/demo/page.tsx': {
          id: 'module:app/demo/page.tsx',
          kind: 'server',
          file: 'app/demo/page.tsx',
          children: ['module:app/demo/ClientIsland.tsx'],
          suggestions: [
            {
              rule: 'server-promise-all',
              level: 'info',
              message: 'Consider Promise.all for parallel awaits.',
              loc: { file: 'app/demo/page.tsx', line: 8, col: 5 },
            },
          ],
        },
        'module:app/demo/ClientIsland.tsx': {
          id: 'module:app/demo/ClientIsland.tsx',
          kind: 'client',
          file: 'app/demo/ClientIsland.tsx',
          suggestions: [
            {
              rule: 'client-hoist-fetch',
              level: 'warn',
              message: 'Move fetch logic to a server component.',
              loc: { file: 'app/demo/ClientIsland.tsx', line: 5, col: 3 },
            },
          ],
          children: [],
        },
      },
    };

    const dir = await mkdtemp(join(tmpdir(), 'scx-cli-suggestions-'));
    try {
      const modelPath = join(dir, 'model.json');
      await writeFile(modelPath, JSON.stringify(model, null, 2), 'utf8');

      const output = new PassThrough();
      let result = '';
      output.on('data', (chunk) => {
        result += chunk.toString();
      });

      await printSuggestions({ modelPath, output });

      expect(result).toContain('CLIENT');
      expect(result).toContain('client-hoist-fetch');
      expect(result).toContain('app/demo/ClientIsland.tsx:5:3');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('prints helper text when no suggestions are present', async () => {
    const model: Model = {
      version: '0.1',
      build: { nextVersion: '14.2.0', timestamp: new Date().toISOString() },
      routes: [],
      nodes: {},
    };

    const dir = await mkdtemp(join(tmpdir(), 'scx-cli-suggestions-'));
    try {
      const modelPath = join(dir, 'model.json');
      await writeFile(modelPath, JSON.stringify(model, null, 2), 'utf8');

      const output = new PassThrough();
      let result = '';
      output.on('data', (chunk) => {
        result += chunk.toString();
      });

      await printSuggestions({ modelPath, output });

      expect(result.trim()).toBe('No suggestions found');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
