import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Model } from '@rsc-xray/schemas';

import { generateReport } from '../report';

const VALID_MODEL: Model = {
  version: '0.1',
  routes: [
    {
      route: '/',
      rootNodeId: 'route:/',
      chunks: ['static/chunks/app/page.js'],
      totalBytes: 2048,
    },
  ],
  nodes: {
    'route:/': {
      id: 'route:/',
      kind: 'route',
      children: ['module:app/page.tsx'],
    },
    'module:app/page.tsx': {
      id: 'module:app/page.tsx',
      kind: 'server',
      file: 'app/page.tsx',
      children: ['module:app/components/Island.tsx'],
      bytes: 2048,
    },
    'module:app/components/Island.tsx': {
      id: 'module:app/components/Island.tsx',
      kind: 'client',
      file: 'app/components/Island.tsx',
      bytes: 1024,
      children: [],
    },
  },
  build: {
    nextVersion: '14.2.0',
    timestamp: '2025-09-22T10:00:00.000Z',
  },
};

describe('generateReport', () => {
  it('renders an HTML report from a valid model', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'scx-cli-report-'));
    try {
      const modelPath = join(dir, 'model.json');
      const outputPath = join(dir, 'report.html');
      await writeFile(modelPath, JSON.stringify(VALID_MODEL), 'utf8');

      await generateReport({ modelPath, outputPath });

      const html = await readFile(outputPath, 'utf8');
      expect(html).toContain('RSC XRay Report');
      expect(html).toContain('/');
      expect(html).toContain('app/page.tsx');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('throws when the model JSON is invalid', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'scx-cli-report-invalid-'));
    try {
      const modelPath = join(dir, 'model.json');
      const outputPath = join(dir, 'report.html');
      await writeFile(modelPath, JSON.stringify({ version: '0.1' }), 'utf8');

      await expect(generateReport({ modelPath, outputPath })).rejects.toThrowError(
        /Model schema validation failed/i
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('throws when the model JSON cannot be parsed', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'scx-cli-report-parse-'));
    try {
      const modelPath = join(dir, 'model.json');
      const outputPath = join(dir, 'report.html');
      await writeFile(modelPath, '{ invalid json', 'utf8');

      await expect(generateReport({ modelPath, outputPath })).rejects.toThrowError(
        /Failed to parse model JSON/i
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
