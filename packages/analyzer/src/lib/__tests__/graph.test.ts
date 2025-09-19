import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildGraph } from '../graph';
import { classifyFiles } from '../classifyFiles';

async function collectTsFiles(root: string): Promise<string[]> {
  async function walk(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await walk(fullPath)));
      } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  return walk(root);
}

describe('buildGraph', () => {
  it('constructs route and component nodes with relationships', async () => {
    const projectRoot = join(__dirname, '__fixtures__', 'graph-basic');
    const filePaths = await collectTsFiles(projectRoot);
    const classified = await classifyFiles({ projectRoot, filePaths });

    const graph = await buildGraph({ projectRoot, classifiedFiles: classified });

    expect(graph.routes).toEqual([
      { route: '/', rootNodeId: 'route:/' },
      { route: '/products', rootNodeId: 'route:/products' },
    ]);

    expect(graph.nodes['route:/']).toMatchObject({
      id: 'route:/',
      kind: 'route',
      children: ['module:app/page.tsx'],
    });

    expect(graph.nodes['module:app/page.tsx']).toMatchObject({
      id: 'module:app/page.tsx',
      kind: 'server',
      children: expect.arrayContaining([
        'module:app/components/Button.tsx',
        'module:app/components/ServerMessage.tsx',
      ]),
    });

    expect(graph.nodes['module:app/components/Button.tsx']).toMatchObject({
      kind: 'client',
      children: [],
    });

    expect(graph.nodes['route:/products']).toMatchObject({
      children: ['module:app/(shop)/products/page.tsx'],
    });
  });
});
