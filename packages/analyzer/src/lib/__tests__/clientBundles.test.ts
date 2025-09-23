import { mkdtemp, writeFile, rm, mkdir, stat } from 'node:fs/promises';
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
  2
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
        'utf8'
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

  it('falls back to chunk file size and decodes encoded paths', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'scx-client-bundles-encoded-'));
    try {
      const nextDir = join(cwd, '.next');
      const serverDir = join(nextDir, 'server', 'app');
      const staticDir = join(nextDir, 'static/chunks/app/(shop)/products/[id]');
      await mkdir(staticDir, { recursive: true });
      await mkdir(serverDir, { recursive: true });

      await writeFile(
        join(serverDir, 'page_client-reference-manifest.js'),
        `globalThis.__RSC_MANIFEST=(globalThis.__RSC_MANIFEST||{});` +
          `globalThis.__RSC_MANIFEST["/products/[id]"]={` +
          `"clientModules":{` +
          `"${cwd.replace(/\\/g, '\\\\')}/components/Encoded.tsx":` +
          `{"chunks":["static/chunks/app/(shop)/products/%5Bid%5D/page.js"]}` +
          `}};`
      );

      const chunkPath = join(staticDir, 'page.js');
      await writeFile(chunkPath, 'console.log("encoded chunk");');
      const { size } = await stat(chunkPath);

      const bundles = await collectClientComponentBundles({ projectRoot: cwd });
      expect(bundles).toEqual([
        {
          filePath: 'components/Encoded.tsx',
          chunks: ['static/chunks/app/(shop)/products/[id]/page.js'],
          totalBytes: size,
        },
      ]);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
