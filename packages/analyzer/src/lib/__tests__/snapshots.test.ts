import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { readFlightSnapshot, readHydrationSnapshot } from '../snapshots';

describe('snapshot readers', () => {
  async function withTempDir(run: (dir: string) => Promise<void>) {
    const dir = await mkdtemp(join(tmpdir(), 'scx-snapshots-'));
    try {
      await run(dir);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  it('returns an empty object when hydration snapshot is missing', async () => {
    await withTempDir(async (dir) => {
      const result = await readHydrationSnapshot(dir);
      expect(result).toEqual({});
    });
  });

  it('throws when hydration snapshot cannot be parsed', async () => {
    await withTempDir(async (dir) => {
      const targetDir = join(dir, '.scx');
      await mkdir(targetDir, { recursive: true });
      await writeFile(join(targetDir, 'hydration.json'), '{ invalid', 'utf8');
      await expect(readHydrationSnapshot(dir)).rejects.toThrow(/Failed to read hydration snapshot/);
    });
  });

  it('throws when flight snapshot json is invalid', async () => {
    await withTempDir(async (dir) => {
      const targetDir = join(dir, '.scx');
      await mkdir(targetDir, { recursive: true });
      await writeFile(join(targetDir, 'flight.json'), '{ invalid', 'utf8');
      await expect(readFlightSnapshot(dir)).rejects.toThrow(/Failed to read Flight snapshot/);
    });
  });
});
