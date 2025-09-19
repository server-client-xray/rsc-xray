import { mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';

import { collectClientComponentBundles } from '../clientBundles';

const sizeManifest = JSON.stringify(
  {
    'static/chunks/foo.js': [{ name: 'foo.js', size: 2048 }],
    'static/chunks/bar.js': [{ name: 'bar.js', size: 1024 }],
  },
  null,
  2,
);

const clientManifestTemplate = (projectRoot: string) => {
  const modulePath = `${projectRoot.replace(/\\/g, '\\\\')}/components/Foo.ts`;
  return `globalThis.__RSC_MANIFEST=(globalThis.__RSC_MANIFEST||{});globalThis.__RSC_MANIFEST["/route"]={"clientModules":{"${modulePath}":{"chunks":["static/chunks/foo.js","static/chunks/bar.js"]}}};`;
};

describe('collectClientComponentBundles', () => {
  it('returns chunk sizes per client component', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'scx-client-bundles-'));
    try {
      const nextDir = join(cwd, '.next');
      const serverDir = join(nextDir, 'server', 'app');
      await mkdir(join(nextDir, 'server', 'app'), { recursive: true });
      await writeFile(join(nextDir, 'build-manifest.json.__scx_sizes__'), sizeManifest, 'utf8');
      await writeFile(
        join(serverDir, 'page_client-reference-manifest.js'),
        clientManifestTemplate(cwd),
        'utf8',
      );

      const bundles = await collectClientComponentBundles({ projectRoot: cwd });
      expect(bundles).toEqual([
        {
          filePath: 'components/Foo.ts',
          chunks: ['static/chunks/bar.js', 'static/chunks/foo.js'],
          totalBytes: 3072,
        },
      ]);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
