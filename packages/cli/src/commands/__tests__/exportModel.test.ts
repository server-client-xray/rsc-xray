import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Model } from '@server-client-xray/schemas';

vi.mock('@server-client-xray/analyzer', () => ({
  analyzeProject: vi.fn(),
}));

const mockAnalyzeProject = async (): Promise<Model> => ({
  version: '0.1',
  routes: [
    { route: '/', rootNodeId: 'route:/' },
  ],
  nodes: {
    'route:/': {
      id: 'route:/',
      kind: 'route',
      name: '/',
      children: ['module:app/page.tsx'],
    },
  },
  build: {
    nextVersion: '14.2.0',
    timestamp: '2025-09-20T10:00:00.000Z',
  },
});

import { analyzeProject } from '@server-client-xray/analyzer';
import { exportModel } from '../exportModel';

beforeEach(() => {
  (analyzeProject as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockAnalyzeProject());
});

describe('exportModel', () => {
  it('writes the model to disk and returns it', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'scx-export-model-'));
    try {
      const outputPath = join(dir, 'model.json');

      const model = await exportModel({
        projectRoot: dir,
        outputPath,
        pretty: true,
      });

      expect(model.routes).toHaveLength(1);
      const raw = await readFile(outputPath, 'utf8');
      const parsed = JSON.parse(raw) as Model;
      expect(parsed.routes[0]?.route).toBe('/');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
