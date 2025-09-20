import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { analyzeProject } from '../analyzeProject';

const SIZE_MANIFEST = (projectRoot: string) =>
  JSON.stringify(
    {
      'static/chunks/app/page.js': [{ name: 'page.js', size: 4096 }],
      'static/chunks/app/client-island.js': [{ name: 'client-island.js', size: 1536 }],
    },
    null,
    2
  );

const BUILD_MANIFEST = JSON.stringify(
  {
    pages: {
      '/': ['static/chunks/app/page.js'],
      '/_app': [],
    },
    app: {
      '/page': ['static/chunks/app/page.js'],
    },
  },
  null,
  2
);

const APP_BUILD_MANIFEST = JSON.stringify(
  {
    pages: {
      '/page': ['static/chunks/app/page.js'],
      '/components/ClientIsland': ['static/chunks/app/client-island.js'],
    },
    rootMainFiles: ['app/main.js'],
  },
  null,
  2
);

const CLIENT_REFERENCE_MANIFEST = (projectRoot: string) => {
  const componentPath = `${projectRoot.replace(/\\/g, '\\\\')}/app/components/ClientIsland.tsx`;
  return `globalThis.__RSC_MANIFEST=(globalThis.__RSC_MANIFEST||{});globalThis.__RSC_MANIFEST["/page"]={"clientModules":{"${componentPath}":{"chunks":["static/chunks/app/client-island.js"]}}};`;
};

describe('analyzeProject', () => {
  it('builds a model with routes, nodes, suggestions, and bytes', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-analyze-'));
    try {
      await mkdir(join(projectRoot, 'app/components'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });

      await writeFile(
        join(projectRoot, 'app/page.tsx'),
        `export default async function Page() {\n  const users = await getUsers();\n  const posts = await getPosts();\n  return <div>{users.length + posts.length}</div>;\n}\n`,
        'utf8'
      );

      await writeFile(
        join(projectRoot, 'app/components/ClientIsland.tsx'),
        `'use client';\nexport async function ClientIsland() {\n  const data = await fetch('/api/data');\n  return <pre>{JSON.stringify(data)}</pre>;\n}\n`,
        'utf8'
      );

      await writeFile(join(projectRoot, '.next/build-manifest.json'), BUILD_MANIFEST, 'utf8');
      await writeFile(join(projectRoot, '.next/server/app-build-manifest.json'), APP_BUILD_MANIFEST, 'utf8');
      await writeFile(
        join(projectRoot, '.next/build-manifest.json.__scx_sizes__'),
        SIZE_MANIFEST(projectRoot),
        'utf8'
      );
      await writeFile(
        join(projectRoot, '.next/server/app/page_client-reference-manifest.js'),
        CLIENT_REFERENCE_MANIFEST(projectRoot),
        'utf8'
      );

      const model = await analyzeProject({ projectRoot });

      expect(model.routes).toEqual([
        {
          route: '/',
          rootNodeId: 'route:/',
          chunks: ['static/chunks/app/page.js'],
          totalBytes: 4096,
        },
      ]);

      const routeNode = model.nodes['route:/'];
      expect(routeNode).toBeTruthy();

      const serverNode = model.nodes['module:app/page.tsx'];
      expect(serverNode?.suggestions?.[0]?.rule).toBe('server-promise-all');

      const clientNode = model.nodes['module:app/components/ClientIsland.tsx'];
      expect(clientNode?.bytes).toBe(1536);
      expect(clientNode?.suggestions?.[0]?.rule).toBe('client-hoist-fetch');
      expect(clientNode?.suggestions?.[0]?.level).toBe('warn');

      expect(model.build.nextVersion).toBeTruthy();
      expect(model.build.timestamp).toBeTruthy();
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });
});
