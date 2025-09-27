import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { printManifest } from '../printManifest';

const FIXTURE_ROOT = join(__dirname, '../../../../analyzer/src/lib/__tests__/__fixtures__/basic');

describe('printManifest', () => {
  it('prints routes, chunks, and bytes', async () => {
    const output = new PassThrough();
    let result = '';
    output.on('data', (chunk) => {
      result += chunk.toString();
    });

    await printManifest({ projectRoot: FIXTURE_ROOT, output });

    expect(result).toContain('/ ->');
    expect(result).toContain('static/chunks/app/page.js');
    expect(result).toContain('1.2 kB');
  });

  it('includes cache metadata when available', async () => {
    const root = await mkdtemp(join(tmpdir(), 'scx-print-cache-'));
    try {
      const distDir = join(root, '.next');
      const staticDir = join(distDir, 'static/chunks/app');
      await mkdir(staticDir, { recursive: true });
      await mkdir(join(distDir, 'server'), { recursive: true });

      await writeFile(
        join(staticDir, 'page.js'),
        'export default function Page() { return null; }',
        'utf8'
      );

      await writeFile(
        join(distDir, 'build-manifest.json'),
        JSON.stringify({ pages: {}, app: { '/page': ['static/chunks/app/page.js'] } })
      );
      await writeFile(
        join(distDir, 'app-build-manifest.json'),
        JSON.stringify({ pages: { '/page': ['static/chunks/app/page.js'] }, rootMainFiles: [] })
      );
      await writeFile(
        join(distDir, 'prerender-manifest.json'),
        JSON.stringify({
          version: 4,
          routes: {
            '/': {
              initialRevalidateSeconds: 45,
              initialHeaders: {
                'x-next-cache-tags': 'catalog, promotions',
              },
            },
          },
          dynamicRoutes: {},
          notFoundRoutes: [],
        })
      );

      // Basic chunk mapping so printManifest has data to display
      await writeFile(
        join(distDir, 'build-manifest.json.__scx_sizes__'),
        JSON.stringify({ 'static/chunks/app/page.js': [{ name: 'page.js', size: 1024 }] })
      );

      const output = new PassThrough();
      let text = '';
      output.on('data', (chunk) => {
        text += chunk.toString();
      });

      await printManifest({ projectRoot: root, output });

      expect(text).toContain('[cache: ISR 45s; Tags: catalog, promotions]');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
