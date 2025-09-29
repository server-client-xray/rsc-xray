import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ROUTE_WATERFALL_SUGGESTION_RULE } from '@rsc-xray/schemas';

import { analyzeProject } from '../analyzeProject';

const SIZE_MANIFEST = JSON.stringify(
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
      await writeFile(
        join(projectRoot, '.next/server/app-build-manifest.json'),
        APP_BUILD_MANIFEST,
        'utf8'
      );
      await writeFile(
        join(projectRoot, '.next/build-manifest.json.__scx_sizes__'),
        SIZE_MANIFEST,
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
      const routeWaterfall = routeNode?.suggestions?.find(
        (item) => item.rule === ROUTE_WATERFALL_SUGGESTION_RULE
      );
      expect(routeWaterfall?.level).toBe('warn');
      expect(routeWaterfall?.message).toContain('Waterfall suspected');
      expect(routeWaterfall?.message).toContain('app/page.tsx');

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

  it('merges route cache metadata from source exports and manifest data', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-cache-meta-'));
    try {
      await mkdir(join(projectRoot, 'app/components'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });

      await writeFile(
        join(projectRoot, 'app/page.tsx'),
        `import { revalidateTag } from 'next/cache';\n\nexport const revalidate = 30;\nexport const dynamic = 'force-dynamic';\nexport const experimental_ppr = true;\n\nexport default async function Page() {\n  revalidateTag('products');\n  return <div>ok</div>;\n}\n`,
        'utf8'
      );

      await writeFile(join(projectRoot, '.next/build-manifest.json'), BUILD_MANIFEST, 'utf8');
      await writeFile(
        join(projectRoot, '.next/server/app-build-manifest.json'),
        APP_BUILD_MANIFEST,
        'utf8'
      );
      await writeFile(
        join(projectRoot, '.next/build-manifest.json.__scx_sizes__'),
        SIZE_MANIFEST,
        'utf8'
      );
      await writeFile(
        join(projectRoot, '.next/server/app/page_client-reference-manifest.js'),
        CLIENT_REFERENCE_MANIFEST(projectRoot),
        'utf8'
      );
      await writeFile(
        join(projectRoot, '.next/prerender-manifest.json'),
        JSON.stringify(
          {
            version: 4,
            routes: {
              '/': {
                initialRevalidateSeconds: 60,
                initialHeaders: {
                  'x-next-cache-tags': 'catalog',
                },
              },
            },
            dynamicRoutes: {},
            notFoundRoutes: [],
          },
          null,
          2
        ),
        'utf8'
      );

      const model = await analyzeProject({ projectRoot });
      const route = model.routes.find((entry) => entry.route === '/');
      expect(route?.cache).toMatchObject({
        revalidateSeconds: 30,
        tags: ['catalog'],
        dynamic: 'force-dynamic',
        experimentalPpr: true,
      });

      const routeNode = model.nodes['route:/'];
      expect(routeNode?.tags).toContain('catalog');
      expect(routeNode?.cache).toMatchObject({
        dynamic: 'force-dynamic',
        revalidateSeconds: [30],
        experimentalPpr: true,
      });

      const pageNode = model.nodes['module:app/page.tsx'];
      expect(pageNode?.cache).toMatchObject({ dynamic: 'force-dynamic' });
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it('sets dynamic route and node cache when using next/headers dynamic APIs', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-dynamic-apis-'));
    try {
      await mkdir(join(projectRoot, 'app'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });

      await writeFile(
        join(projectRoot, 'app/page.tsx'),
        `import { cookies } from 'next/headers';\n\nexport default function Page() {\n  cookies();\n  return <div>ok</div>;\n}\n`,
        'utf8'
      );

      await writeFile(join(projectRoot, '.next/build-manifest.json'), BUILD_MANIFEST, 'utf8');
      await writeFile(
        join(projectRoot, '.next/server/app-build-manifest.json'),
        APP_BUILD_MANIFEST,
        'utf8'
      );
      await writeFile(
        join(projectRoot, '.next/build-manifest.json.__scx_sizes__'),
        SIZE_MANIFEST,
        'utf8'
      );
      await writeFile(
        join(projectRoot, '.next/server/app/page_client-reference-manifest.js'),
        CLIENT_REFERENCE_MANIFEST(projectRoot),
        'utf8'
      );

      const model = await analyzeProject({ projectRoot });
      const route = model.routes.find((entry) => entry.route === '/');
      expect(route?.cache?.dynamic).toBe('force-dynamic');

      const pageNode = model.nodes['module:app/page.tsx'];
      expect(pageNode?.cache?.dynamic).toBe('force-dynamic');
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it('applies hydration snapshot data to nodes and route totals', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-hydration-'));
    try {
      await mkdir(join(projectRoot, 'app/components'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });
      await mkdir(join(projectRoot, '.scx'), { recursive: true });

      await writeFile(
        join(projectRoot, 'app/page.tsx'),
        `import { ClientIsland } from './components/ClientIsland';\n\nexport default function Page() {\n  return <ClientIsland />;\n}\n`,
        'utf8'
      );

      await writeFile(
        join(projectRoot, 'app/components/ClientIsland.tsx'),
        `'use client';\nexport function ClientIsland() {\n  return <div>island</div>;\n}\n`,
        'utf8'
      );

      await writeFile(join(projectRoot, '.next/build-manifest.json'), BUILD_MANIFEST, 'utf8');
      await writeFile(
        join(projectRoot, '.next/server/app-build-manifest.json'),
        APP_BUILD_MANIFEST,
        'utf8'
      );
      await writeFile(
        join(projectRoot, '.next/build-manifest.json.__scx_sizes__'),
        SIZE_MANIFEST,
        'utf8'
      );
      await writeFile(
        join(projectRoot, '.next/server/app/page_client-reference-manifest.js'),
        CLIENT_REFERENCE_MANIFEST(projectRoot),
        'utf8'
      );

      await writeFile(
        join(projectRoot, '.scx/hydration.json'),
        JSON.stringify(
          {
            'module:app/components/ClientIsland.tsx': 42.5,
            'module:app/components/Missing.tsx': -10,
          },
          null,
          2
        ),
        'utf8'
      );

      const model = await analyzeProject({ projectRoot });
      const clientNode = model.nodes['module:app/components/ClientIsland.tsx'];
      expect(clientNode?.hydrationMs).toBeCloseTo(42.5);

      const rootId = model.routes[0]?.rootNodeId;
      expect(rootId).toBeTruthy();
      const routeNode = rootId ? model.nodes[rootId] : undefined;
      expect(routeNode?.hydrationMs).toBeCloseTo(42.5);
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it('includes flight snapshot data in the model when available', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-flight-'));
    try {
      await mkdir(join(projectRoot, 'app/components'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });
      await mkdir(join(projectRoot, '.scx'), { recursive: true });

      await writeFile(
        join(projectRoot, 'app/page.tsx'),
        `export default function Page() {\n  return <div>hello</div>;\n}\n`,
        'utf8'
      );

      await writeFile(join(projectRoot, '.next/build-manifest.json'), BUILD_MANIFEST, 'utf8');
      await writeFile(
        join(projectRoot, '.next/server/app-build-manifest.json'),
        APP_BUILD_MANIFEST,
        'utf8'
      );
      await writeFile(
        join(projectRoot, '.next/build-manifest.json.__scx_sizes__'),
        SIZE_MANIFEST,
        'utf8'
      );
      await writeFile(
        join(projectRoot, '.next/server/app/page_client-reference-manifest.js'),
        CLIENT_REFERENCE_MANIFEST(projectRoot),
        'utf8'
      );

      await writeFile(
        join(projectRoot, '.scx/flight.json'),
        JSON.stringify(
          {
            samples: [
              { route: '/', ts: 12, chunkIndex: 0, label: '8 KB' },
              { route: '/', ts: 48.7, chunkIndex: 1 },
              { route: '/ignore', ts: 'oops', chunkIndex: 2 },
            ],
          },
          null,
          2
        ),
        'utf8'
      );

      const model = await analyzeProject({ projectRoot });
      expect(model.flight?.samples).toEqual([
        { route: '/', ts: 12, chunkIndex: 0, label: '8 KB' },
        { route: '/', ts: 48.7, chunkIndex: 1 },
      ]);
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });
});
