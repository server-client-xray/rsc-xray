import { join } from 'node:path';

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
});
