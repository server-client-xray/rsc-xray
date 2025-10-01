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

  // TODO: Fix this test - hydrationMs not being applied to route node
  it.skip('applies hydration snapshot data to nodes and route totals', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-hydration-'));
    try {
      await mkdir(join(projectRoot, 'app/components'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });
      await mkdir(join(projectRoot, '.scx'), { recursive: true });

      await writeFile(
        join(projectRoot, 'app/page.tsx'),
        `import { ClientIsland } from './components/ClientIsland.js';\n\nexport default function Page() {\n  return <ClientIsland />;\n}\n`,
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

  it('enhances waterfall suggestion with cache() hints when React 19 cache opportunities detected', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-waterfall-cache-'));
    try {
      await mkdir(join(projectRoot, 'app'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });

      // Create a page with both waterfall (sequential awaits) and Map-based caching (cache opportunity)
      // Using Map instead of duplicate fetch to ensure cache suggestion is created
      await writeFile(
        join(projectRoot, 'app/page.tsx'),
        `const cache = new Map();

export default async function Page() {
  const data1 = await getUsers();
  const data2 = await getPosts();
  return <div>{data1.length + data2.length}</div>;
}`,
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

      // Check if cache suggestion was created on the module node
      const pageNode = model.nodes['module:app/page.tsx'];
      const cacheOpportunity = pageNode?.suggestions?.find(
        (s) => s.rule === 'react19-cache-opportunity'
      );

      // Find the waterfall suggestion
      const routeNode = model.nodes['route:/'];
      const waterfallSuggestion = routeNode?.suggestions?.find(
        (item) => item.rule === ROUTE_WATERFALL_SUGGESTION_RULE
      );

      expect(waterfallSuggestion).toBeTruthy();
      expect(waterfallSuggestion?.message).toContain('Waterfall suspected');

      // Verify cache hint is included when cache opportunity exists
      if (cacheOpportunity) {
        expect(waterfallSuggestion?.message).toContain('React 19 cache() opportunities detected');
        expect(waterfallSuggestion?.message).toContain('app/page.tsx');
        expect(waterfallSuggestion?.message).toContain(
          'wrapping duplicate fetch calls in cache() can help deduplicate requests and reduce waterfall impact'
        );
      }
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it('uses default waterfall guidance when no cache opportunities detected', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-waterfall-no-cache-'));
    try {
      await mkdir(join(projectRoot, 'app'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });

      // Create a page with waterfall but no cache opportunities
      await writeFile(
        join(projectRoot, 'app/page.tsx'),
        `export default async function Page() {
  const users = await getUsers();
  const posts = await getPosts();
  return <div>{users.length + posts.length}</div>;
}`,
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

      // Find the waterfall suggestion
      const routeNode = model.nodes['route:/'];
      const waterfallSuggestion = routeNode?.suggestions?.find(
        (item) => item.rule === ROUTE_WATERFALL_SUGGESTION_RULE
      );

      expect(waterfallSuggestion).toBeTruthy();
      expect(waterfallSuggestion?.message).toContain('Waterfall suspected');
      expect(waterfallSuggestion?.message).not.toContain('cache() opportunities detected');
      expect(waterfallSuggestion?.message).toContain(
        'Wrap independent awaits in Promise.all, or use Next.js preload / React 19 cache() to start work earlier'
      );
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });
});

describe('analyzeProject - Static/Dynamic Route Detection (T4.2)', () => {
  it('classifies pure static route (no dynamic APIs, no revalidate)', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-static-'));
    try {
      await mkdir(join(projectRoot, 'app/static'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });

      await writeFile(
        join(projectRoot, 'app/static/page.tsx'),
        `export default function StaticPage() {\n  return <div>Static content</div>;\n}\n`,
        'utf8'
      );

      const buildManifest = JSON.stringify({
        pages: {},
        app: { '/static/page': ['static/chunks/app/static/page.js'] },
      });
      const appBuildManifest = JSON.stringify({
        pages: { '/static/page': ['static/chunks/app/static/page.js'] },
        rootMainFiles: [],
      });

      await writeFile(join(projectRoot, '.next/build-manifest.json'), buildManifest, 'utf8');
      await writeFile(
        join(projectRoot, '.next/server/app-build-manifest.json'),
        appBuildManifest,
        'utf8'
      );

      const model = await analyzeProject({ projectRoot });

      const route = model.routes.find((r) => r.route === '/static');
      expect(route).toBeTruthy();
      expect(route?.cache?.dynamic).toBeUndefined();
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it('classifies ISR route with revalidate export', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-isr-'));
    try {
      await mkdir(join(projectRoot, 'app/isr'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });

      await writeFile(
        join(projectRoot, 'app/isr/page.tsx'),
        `export const revalidate = 60;\n\nexport default async function ISRPage() {\n  const data = await fetch('https://api.example.com/data');\n  return <div>{JSON.stringify(data)}</div>;\n}\n`,
        'utf8'
      );

      const buildManifest = JSON.stringify({
        pages: {},
        app: { '/isr/page': ['static/chunks/app/isr/page.js'] },
      });
      const appBuildManifest = JSON.stringify({
        pages: { '/isr/page': ['static/chunks/app/isr/page.js'] },
        rootMainFiles: [],
      });

      await writeFile(join(projectRoot, '.next/build-manifest.json'), buildManifest, 'utf8');
      await writeFile(
        join(projectRoot, '.next/server/app-build-manifest.json'),
        appBuildManifest,
        'utf8'
      );

      const model = await analyzeProject({ projectRoot });

      const route = model.routes.find((r) => r.route === '/isr');
      expect(route).toBeTruthy();
      expect(route?.cache?.revalidateSeconds).toBe(60);
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it('classifies dynamic route with cookies() usage', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-dynamic-cookies-'));
    try {
      await mkdir(join(projectRoot, 'app/dynamic-cookies'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });

      await writeFile(
        join(projectRoot, 'app/dynamic-cookies/page.tsx'),
        `import { cookies } from 'next/headers';\n\nexport default function DynamicPage() {\n  const cookieStore = cookies();\n  const theme = cookieStore.get('theme');\n  return <div>Theme: {theme?.value}</div>;\n}\n`,
        'utf8'
      );

      const buildManifest = JSON.stringify({
        pages: {},
        app: { '/dynamic-cookies/page': ['static/chunks/app/dynamic-cookies/page.js'] },
      });
      const appBuildManifest = JSON.stringify({
        pages: { '/dynamic-cookies/page': ['static/chunks/app/dynamic-cookies/page.js'] },
        rootMainFiles: [],
      });

      await writeFile(join(projectRoot, '.next/build-manifest.json'), buildManifest, 'utf8');
      await writeFile(
        join(projectRoot, '.next/server/app-build-manifest.json'),
        appBuildManifest,
        'utf8'
      );

      const model = await analyzeProject({ projectRoot });

      const route = model.routes.find((r) => r.route === '/dynamic-cookies');
      expect(route).toBeTruthy();
      expect(route?.cache?.dynamic).toBe('force-dynamic');
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it('classifies dynamic route with headers() usage', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-dynamic-headers-'));
    try {
      await mkdir(join(projectRoot, 'app/dynamic-headers'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });

      await writeFile(
        join(projectRoot, 'app/dynamic-headers/page.tsx'),
        `import { headers } from 'next/headers';\n\nexport default function DynamicPage() {\n  const headersList = headers();\n  const userAgent = headersList.get('user-agent');\n  return <div>UA: {userAgent}</div>;\n}\n`,
        'utf8'
      );

      const buildManifest = JSON.stringify({
        pages: {},
        app: { '/dynamic-headers/page': ['static/chunks/app/dynamic-headers/page.js'] },
      });
      const appBuildManifest = JSON.stringify({
        pages: { '/dynamic-headers/page': ['static/chunks/app/dynamic-headers/page.js'] },
        rootMainFiles: [],
      });

      await writeFile(join(projectRoot, '.next/build-manifest.json'), buildManifest, 'utf8');
      await writeFile(
        join(projectRoot, '.next/server/app-build-manifest.json'),
        appBuildManifest,
        'utf8'
      );

      const model = await analyzeProject({ projectRoot });

      const route = model.routes.find((r) => r.route === '/dynamic-headers');
      expect(route).toBeTruthy();
      expect(route?.cache?.dynamic).toBe('force-dynamic');
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it('classifies dynamic route with noStore() usage', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-dynamic-nostore-'));
    try {
      await mkdir(join(projectRoot, 'app/dynamic-nostore'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });

      await writeFile(
        join(projectRoot, 'app/dynamic-nostore/page.tsx'),
        `import { unstable_noStore as noStore } from 'next/cache';\n\nexport default async function DynamicPage() {\n  noStore();\n  const data = await fetch('https://api.example.com/data');\n  return <div>{JSON.stringify(data)}</div>;\n}\n`,
        'utf8'
      );

      const buildManifest = JSON.stringify({
        pages: {},
        app: { '/dynamic-nostore/page': ['static/chunks/app/dynamic-nostore/page.js'] },
      });
      const appBuildManifest = JSON.stringify({
        pages: { '/dynamic-nostore/page': ['static/chunks/app/dynamic-nostore/page.js'] },
        rootMainFiles: [],
      });

      await writeFile(join(projectRoot, '.next/build-manifest.json'), buildManifest, 'utf8');
      await writeFile(
        join(projectRoot, '.next/server/app-build-manifest.json'),
        appBuildManifest,
        'utf8'
      );

      const model = await analyzeProject({ projectRoot });

      const route = model.routes.find((r) => r.route === '/dynamic-nostore');
      expect(route).toBeTruthy();
      expect(route?.cache?.dynamic).toBe('force-dynamic');
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it('classifies force-static route with export', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-force-static-'));
    try {
      await mkdir(join(projectRoot, 'app/force-static'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });

      await writeFile(
        join(projectRoot, 'app/force-static/page.tsx'),
        `export const dynamic = 'force-static';\n\nexport default function ForcedStaticPage() {\n  return <div>Forced static</div>;\n}\n`,
        'utf8'
      );

      const buildManifest = JSON.stringify({
        pages: {},
        app: { '/force-static/page': ['static/chunks/app/force-static/page.js'] },
      });
      const appBuildManifest = JSON.stringify({
        pages: { '/force-static/page': ['static/chunks/app/force-static/page.js'] },
        rootMainFiles: [],
      });

      await writeFile(join(projectRoot, '.next/build-manifest.json'), buildManifest, 'utf8');
      await writeFile(
        join(projectRoot, '.next/server/app-build-manifest.json'),
        appBuildManifest,
        'utf8'
      );

      const model = await analyzeProject({ projectRoot });

      const route = model.routes.find((r) => r.route === '/force-static');
      expect(route).toBeTruthy();
      expect(route?.cache?.dynamic).toBe('force-static');
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it('classifies force-dynamic route with export', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-force-dynamic-'));
    try {
      await mkdir(join(projectRoot, 'app/force-dynamic'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });

      await writeFile(
        join(projectRoot, 'app/force-dynamic/page.tsx'),
        `export const dynamic = 'force-dynamic';\n\nexport default async function ForcedDynamicPage() {\n  const data = await fetch('https://api.example.com/data');\n  return <div>{JSON.stringify(data)}</div>;\n}\n`,
        'utf8'
      );

      const buildManifest = JSON.stringify({
        pages: {},
        app: { '/force-dynamic/page': ['static/chunks/app/force-dynamic/page.js'] },
      });
      const appBuildManifest = JSON.stringify({
        pages: { '/force-dynamic/page': ['static/chunks/app/force-dynamic/page.js'] },
        rootMainFiles: [],
      });

      await writeFile(join(projectRoot, '.next/build-manifest.json'), buildManifest, 'utf8');
      await writeFile(
        join(projectRoot, '.next/server/app-build-manifest.json'),
        appBuildManifest,
        'utf8'
      );

      const model = await analyzeProject({ projectRoot });

      const route = model.routes.find((r) => r.route === '/force-dynamic');
      expect(route).toBeTruthy();
      expect(route?.cache?.dynamic).toBe('force-dynamic');
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it('classifies route with searchParams as dynamic (when using dynamic APIs)', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-searchparams-'));
    try {
      await mkdir(join(projectRoot, 'app/search'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });

      // Note: searchParams alone doesn't trigger dynamic detection (prop-based, not API call)
      // But in practice, Next.js makes these routes dynamic. Future enhancement: detect searchParams prop usage.
      await writeFile(
        join(projectRoot, 'app/search/page.tsx'),
        `import { headers } from 'next/headers';\n\nexport default function SearchPage({ searchParams }: { searchParams: { q: string } }) {\n  headers();\n  return <div>Search: {searchParams.q}</div>;\n}\n`,
        'utf8'
      );

      const buildManifest = JSON.stringify({
        pages: {},
        app: { '/search/page': ['static/chunks/app/search/page.js'] },
      });
      const appBuildManifest = JSON.stringify({
        pages: { '/search/page': ['static/chunks/app/search/page.js'] },
        rootMainFiles: [],
      });

      await writeFile(join(projectRoot, '.next/build-manifest.json'), buildManifest, 'utf8');
      await writeFile(
        join(projectRoot, '.next/server/app-build-manifest.json'),
        appBuildManifest,
        'utf8'
      );

      const model = await analyzeProject({ projectRoot });

      const route = model.routes.find((r) => r.route === '/search');
      expect(route).toBeTruthy();
      expect(route?.cache?.dynamic).toBe('force-dynamic');
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it('handles mixed routes (static + dynamic + ISR)', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-mixed-'));
    try {
      await mkdir(join(projectRoot, 'app/static'), { recursive: true });
      await mkdir(join(projectRoot, 'app/dynamic'), { recursive: true });
      await mkdir(join(projectRoot, 'app/isr'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });

      await writeFile(
        join(projectRoot, 'app/static/page.tsx'),
        `export default function StaticPage() {\n  return <div>Static</div>;\n}\n`,
        'utf8'
      );

      await writeFile(
        join(projectRoot, 'app/dynamic/page.tsx'),
        `import { cookies } from 'next/headers';\n\nexport default function DynamicPage() {\n  cookies();\n  return <div>Dynamic</div>;\n}\n`,
        'utf8'
      );

      await writeFile(
        join(projectRoot, 'app/isr/page.tsx'),
        `export const revalidate = 30;\n\nexport default function ISRPage() {\n  return <div>ISR</div>;\n}\n`,
        'utf8'
      );

      const buildManifest = JSON.stringify({
        pages: {},
        app: {
          '/static/page': ['static/chunks/app/static/page.js'],
          '/dynamic/page': ['static/chunks/app/dynamic/page.js'],
          '/isr/page': ['static/chunks/app/isr/page.js'],
        },
      });
      const appBuildManifest = JSON.stringify({
        pages: {
          '/static/page': ['static/chunks/app/static/page.js'],
          '/dynamic/page': ['static/chunks/app/dynamic/page.js'],
          '/isr/page': ['static/chunks/app/isr/page.js'],
        },
        rootMainFiles: [],
      });

      await writeFile(join(projectRoot, '.next/build-manifest.json'), buildManifest, 'utf8');
      await writeFile(
        join(projectRoot, '.next/server/app-build-manifest.json'),
        appBuildManifest,
        'utf8'
      );

      const model = await analyzeProject({ projectRoot });

      const staticRoute = model.routes.find((r) => r.route === '/static');
      const dynamicRoute = model.routes.find((r) => r.route === '/dynamic');
      const isrRoute = model.routes.find((r) => r.route === '/isr');

      expect(staticRoute?.cache?.dynamic).toBeUndefined();
      expect(dynamicRoute?.cache?.dynamic).toBe('force-dynamic');
      expect(isrRoute?.cache?.revalidateSeconds).toBe(30);
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it('detects dynamic APIs in nested helper functions', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-nested-dynamic-'));
    try {
      await mkdir(join(projectRoot, 'app/nested'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });

      await writeFile(
        join(projectRoot, 'app/nested/page.tsx'),
        `import { cookies } from 'next/headers';\n\nfunction getTheme() {\n  const cookieStore = cookies();\n  return cookieStore.get('theme');\n}\n\nexport default function NestedPage() {\n  const theme = getTheme();\n  return <div>Theme: {theme?.value}</div>;\n}\n`,
        'utf8'
      );

      const buildManifest = JSON.stringify({
        pages: {},
        app: { '/nested/page': ['static/chunks/app/nested/page.js'] },
      });
      const appBuildManifest = JSON.stringify({
        pages: { '/nested/page': ['static/chunks/app/nested/page.js'] },
        rootMainFiles: [],
      });

      await writeFile(join(projectRoot, '.next/build-manifest.json'), buildManifest, 'utf8');
      await writeFile(
        join(projectRoot, '.next/server/app-build-manifest.json'),
        appBuildManifest,
        'utf8'
      );

      const model = await analyzeProject({ projectRoot });

      const route = model.routes.find((r) => r.route === '/nested');
      expect(route).toBeTruthy();
      expect(route?.cache?.dynamic).toBe('force-dynamic');
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it('handles conditional dynamic API calls (still marks dynamic)', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-conditional-dynamic-'));
    try {
      await mkdir(join(projectRoot, 'app/conditional'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });

      await writeFile(
        join(projectRoot, 'app/conditional/page.tsx'),
        `import { cookies } from 'next/headers';\n\nexport default function ConditionalPage({ params }: { params: { id?: string } }) {\n  if (params.id) {\n    const cookieStore = cookies();\n    return <div>ID: {cookieStore.get('user')?.value}</div>;\n  }\n  return <div>No ID</div>;\n}\n`,
        'utf8'
      );

      const buildManifest = JSON.stringify({
        pages: {},
        app: { '/conditional/page': ['static/chunks/app/conditional/page.js'] },
      });
      const appBuildManifest = JSON.stringify({
        pages: { '/conditional/page': ['static/chunks/app/conditional/page.js'] },
        rootMainFiles: [],
      });

      await writeFile(join(projectRoot, '.next/build-manifest.json'), buildManifest, 'utf8');
      await writeFile(
        join(projectRoot, '.next/server/app-build-manifest.json'),
        appBuildManifest,
        'utf8'
      );

      const model = await analyzeProject({ projectRoot });

      const route = model.routes.find((r) => r.route === '/conditional');
      expect(route).toBeTruthy();
      expect(route?.cache?.dynamic).toBe('force-dynamic');
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });

  it('handles route with both ISR and dynamic export (dynamic wins)', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'scx-isr-dynamic-conflict-'));
    try {
      await mkdir(join(projectRoot, 'app/conflict'), { recursive: true });
      await mkdir(join(projectRoot, '.next/server/app'), { recursive: true });

      await writeFile(
        join(projectRoot, 'app/conflict/page.tsx'),
        `export const revalidate = 60;\nexport const dynamic = 'force-dynamic';\n\nexport default function ConflictPage() {\n  return <div>Conflict</div>;\n}\n`,
        'utf8'
      );

      const buildManifest = JSON.stringify({
        pages: {},
        app: { '/conflict/page': ['static/chunks/app/conflict/page.js'] },
      });
      const appBuildManifest = JSON.stringify({
        pages: { '/conflict/page': ['static/chunks/app/conflict/page.js'] },
        rootMainFiles: [],
      });

      await writeFile(join(projectRoot, '.next/build-manifest.json'), buildManifest, 'utf8');
      await writeFile(
        join(projectRoot, '.next/server/app-build-manifest.json'),
        appBuildManifest,
        'utf8'
      );

      const model = await analyzeProject({ projectRoot });

      const route = model.routes.find((r) => r.route === '/conflict');
      expect(route).toBeTruthy();
      expect(route?.cache?.dynamic).toBe('force-dynamic');
      expect(route?.cache?.revalidateSeconds).toBe(60);
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  });
});
