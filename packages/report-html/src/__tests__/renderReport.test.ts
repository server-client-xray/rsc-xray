import { describe, expect, it } from 'vitest';

import type { Model } from '@server-client-xray/schemas';

import { renderHtmlReport } from '../renderReport';

describe('renderHtmlReport', () => {
  it('renders HTML with routes, bytes, and suggestions', () => {
    const model: Model = {
      version: '0.1',
      build: { nextVersion: '14.2.0', timestamp: '2025-09-20T10:00:00.000Z' },
      routes: [
        {
          route: '/',
          rootNodeId: 'route:/',
          chunks: ['static/chunks/app/page.js'],
          totalBytes: 4096,
        },
      ],
      nodes: {
        'route:/': {
          id: 'route:/',
          kind: 'route',
          children: ['module:app/page.tsx'],
        },
        'module:app/page.tsx': {
          id: 'module:app/page.tsx',
          kind: 'server',
          file: 'app/page.tsx',
          bytes: 4096,
          children: ['module:app/components/ClientIsland.tsx'],
          suggestions: [
            {
              rule: 'server-promise-all',
              level: 'info',
              message: 'Consider wrapping awaits in Promise.all',
            },
          ],
        },
        'module:app/components/ClientIsland.tsx': {
          id: 'module:app/components/ClientIsland.tsx',
          kind: 'client',
          file: 'app/components/ClientIsland.tsx',
          suggestions: [
            {
              rule: 'client-hoist-fetch',
              level: 'warn',
              message: 'Move fetch to server component',
            },
          ],
          bytes: 1536,
          children: [],
        },
      },
    };

    const html = renderHtmlReport(model);

    expect(html).toContain('Server-Client XRay Report');
    expect(html).toContain('/');
    expect(html).toContain('static/chunks/app/page.js');
    expect(html).toContain('Suggestions 1');
  });
});
