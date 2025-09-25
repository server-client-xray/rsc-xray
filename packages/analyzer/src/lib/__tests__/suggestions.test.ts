import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Suggestion } from '@rsc-xray/schemas';

import { collectSuggestions, collectSuggestionsForSource } from '../suggestions';

describe('collectSuggestionsForSource', () => {
  it('recommends hoisting fetch in client components', () => {
    const source = `'use client';\nexport default async function Demo() {\n  const data = await fetch('/api/data');\n  return <pre>{JSON.stringify(data)}</pre>;\n}`;
    const suggestions = collectSuggestionsForSource({
      filePath: 'app/components/Button.tsx',
      sourceText: source,
      kind: 'client',
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      rule: 'client-hoist-fetch',
      level: 'warn',
    });
  });

  it('suggests Promise.all when multiple awaits exist', () => {
    const source = `export default async function Demo() {\n  const a = await getA();\n  const b = await getB();\n  return { a, b };\n}`;
    const suggestions = collectSuggestionsForSource({
      filePath: 'app/data/fetchers.ts',
      sourceText: source,
      kind: 'server',
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      rule: 'server-promise-all',
      level: 'info',
    });
  });

  it('ignores awaits already wrapped in Promise.all', () => {
    const source = `export default async function Demo() {\n  const [a, b] = await Promise.all([getA(), getB()]);\n  return { a, b };\n}`;
    const suggestions = collectSuggestionsForSource({
      filePath: 'app/data/fetchers.ts',
      sourceText: source,
      kind: 'server',
    });

    expect(suggestions).toEqual([]);
  });
});

describe('collectSuggestions', () => {
  it('aggregates suggestions per file', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-suggestions-'));
    try {
      await mkdir(join(projectRoot, 'components'), { recursive: true });
      await mkdir(join(projectRoot, 'data'), { recursive: true });

      await writeFile(
        join(projectRoot, 'components/Client.tsx'),
        `'use client';\nexport default async function Demo() {\n  await fetch('/api/data');\n  return null;\n}`,
        { encoding: 'utf8', flag: 'w' }
      );
      await writeFile(
        join(projectRoot, 'data/fetchers.ts'),
        `export async function loader() {\n  const a = await getA();\n  const b = await getB();\n  return { a, b };\n}`,
        { encoding: 'utf8', flag: 'w' }
      );

      const result = await collectSuggestions({
        projectRoot,
        classifiedFiles: [
          { filePath: 'components/Client.tsx', kind: 'client' },
          { filePath: 'data/fetchers.ts', kind: 'server' },
        ],
      });

      expect(Object.keys(result)).toEqual(['components/Client.tsx', 'data/fetchers.ts']);

      const clientSuggestions = result['components/Client.tsx'] as Suggestion[];
      expect(clientSuggestions[0]?.rule).toBe('client-hoist-fetch');

      const serverSuggestions = result['data/fetchers.ts'] as Suggestion[];
      expect(serverSuggestions[0]?.rule).toBe('server-promise-all');
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });
});
