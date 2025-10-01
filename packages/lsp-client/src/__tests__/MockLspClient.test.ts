import { describe, it, expect } from 'vitest';
import { MockLspClient } from '../MockLspClient';

describe('MockLspClient', () => {
  const client = new MockLspClient();

  it('identifies as mock client', () => {
    expect(client.isMock()).toBe(true);
    expect(client.getType()).toBe('mock');
  });

  it('detects serialization boundary violations', async () => {
    const result = await client.analyze({
      code: `
        "use client";
        export function Button({ onClick }) {
          return <button onClick={onClick}>Click me</button>;
        }
      `,
      fileName: 'Button.tsx',
      scenario: 'serialization-boundary',
    });

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      rule: 'server-client-serialization-violation',
      severity: 'error',
      category: 'correctness',
    });
    expect(result.version).toBe('0.1.0-mock');
  });

  it('detects missing Suspense boundaries', async () => {
    const result = await client.analyze({
      code: `
        export default async function Page() {
          const data = await fetch('/api/data');
          return <div>{data}</div>;
        }
      `,
      fileName: 'page.tsx',
      scenario: 'suspense-boundary',
    });

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      rule: 'suspense-boundary-missing',
      severity: 'warning',
      category: 'performance',
    });
  });

  it('detects React 19 cache opportunities', async () => {
    const result = await client.analyze({
      code: `
        export async function getData() {
          return fetch('/api/data').then(r => r.json());
        }
      `,
      fileName: 'data.ts',
      scenario: 'react19-cache',
    });

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      rule: 'react19-cache-opportunity',
      severity: 'info',
      category: 'performance',
    });
  });

  it('detects oversized client components', async () => {
    const result = await client.analyze({
      code: `"use client";\n${'const x = 1;\n'.repeat(100)}`,
      fileName: 'Large.tsx',
      scenario: 'client-oversized',
    });

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      rule: 'client-component-oversized',
      severity: 'warning',
      category: 'performance',
    });
  });

  it('detects forbidden client imports', async () => {
    const result = await client.analyze({
      code: `
        "use client";
        import fs from 'fs';
        
        export function Component() {
          return <div>Hello</div>;
        }
      `,
      fileName: 'Bad.tsx',
      scenario: 'client-forbidden-import',
    });

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      rule: 'client-forbidden-import',
      severity: 'error',
      category: 'correctness',
    });
  });

  it('detects Promise.all opportunities', async () => {
    const result = await client.analyze({
      code: `
        export async function getData() {
          const a = await fetch('/api/a');
          const b = await fetch('/api/b');
          return { a, b };
        }
      `,
      fileName: 'data.ts',
      scenario: 'server-promise-all',
    });

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      rule: 'server-promise-all',
      severity: 'warning',
      category: 'performance',
    });
  });

  it('detects route config conflicts', async () => {
    const result = await client.analyze({
      code: `
        export const dynamic = 'force-dynamic';
        export const revalidate = 60;
      `,
      fileName: 'page.tsx',
      scenario: 'route-config-conflict',
    });

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      rule: 'route-segment-config-conflict',
      severity: 'error',
      category: 'correctness',
    });
  });

  it('returns empty diagnostics for valid code', async () => {
    const result = await client.analyze({
      code: `
        export function Component() {
          return <div>Hello World</div>;
        }
      `,
      fileName: 'Component.tsx',
      scenario: 'all',
    });

    expect(result.diagnostics).toHaveLength(0);
  });

  it('simulates realistic response times', async () => {
    const start = Date.now();
    await client.analyze({
      code: 'const x = 1;',
      fileName: 'test.ts',
    });
    const duration = Date.now() - start;

    expect(duration).toBeGreaterThan(50);
    expect(duration).toBeLessThan(200);
  });
});
