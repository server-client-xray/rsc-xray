import { mkdir, mkdtemp, rm, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { readManifests } from '../readManifests';

const FIXTURE_ROOT = join(__dirname, '__fixtures__', 'basic');

describe('readManifests', () => {
  it('collects routes and chunks from Next manifests', async () => {
    const result = await readManifests({ projectRoot: FIXTURE_ROOT });
    const routes = Object.fromEntries(result.routes.map((route) => [route.route, route]));

    expect(routes['/']).toMatchObject({
      chunks: expect.arrayContaining(['static/chunks/app/page.js', 'static/chunks/main.js']),
      totalBytes: 1234,
    });
    expect(routes['/']?.cache).toBeUndefined();

    expect(routes['/products/[id]']).toMatchObject({
      chunks: expect.arrayContaining([
        'static/chunks/app/products/[id]/page.js',
        'server/app/products/[id]/page.js',
      ]),
    });

    expect(routes['/products']).toMatchObject({
      chunks: expect.arrayContaining(['app/products/page.js']),
    });
  });

  it('falls back to chunk file sizes when size manifest is missing', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'scx-manifests-'));
    const distDir = join(cwd, '.next');
    const staticDir = join(distDir, 'static/chunks/app');
    await mkdir(staticDir, { recursive: true });
    await mkdir(join(distDir, 'server'), { recursive: true });

    await writeFile(
      join(distDir, 'build-manifest.json'),
      JSON.stringify({
        pages: {},
        app: {
          '/': ['static/chunks/app/page.js'],
        },
      })
    );
    await writeFile(join(distDir, 'app-build-manifest.json'), JSON.stringify({ pages: {} }));

    const chunkPath = join(staticDir, 'page.js');
    await writeFile(chunkPath, 'console.log("chunk");');
    const { size } = await stat(chunkPath);

    const result = await readManifests({ projectRoot: cwd });
    const route = result.routes.find((item) => item.route === '/');
    expect(route).toBeDefined();
    expect(route?.totalBytes).toBe(size);

    await rm(cwd, { recursive: true, force: true });
  });

  it('parses prerender manifest cache metadata', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'scx-prerender-'));
    const distDir = join(cwd, '.next');
    await mkdir(join(distDir, 'server'), { recursive: true });

    await writeFile(
      join(distDir, 'build-manifest.json'),
      JSON.stringify({ pages: {}, app: { '/': ['static/chunks/app/page.js'] } })
    );
    await writeFile(join(distDir, 'app-build-manifest.json'), JSON.stringify({ pages: {} }));

    await writeFile(
      join(distDir, 'prerender-manifest.json'),
      JSON.stringify({
        version: 4,
        routes: {
          '/': {
            initialRevalidateSeconds: 60,
            initialHeaders: {
              'content-type': 'text/html',
              'x-next-cache-tags': 'products, _N_T_/layout',
            },
          },
        },
        dynamicRoutes: {},
        notFoundRoutes: [],
      })
    );

    const result = await readManifests({ projectRoot: cwd });
    const route = result.routes.find((entry) => entry.route === '/');
    expect(route?.cache).toEqual({
      revalidateSeconds: 60,
      tags: ['products'],
    });

    await rm(cwd, { recursive: true, force: true });
  });
});
