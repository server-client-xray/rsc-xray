import { PassThrough } from 'node:stream';

import { describe, expect, it, vi } from 'vitest';

import { flightTap, streamFromStrings } from '../flightTap';

describe('flightTap', () => {
  it('logs chunk timings and annotates samples with route metadata', async () => {
    const output = new PassThrough();
    let content = '';
    output.on('data', (chunk) => {
      content += chunk.toString();
    });

    const fakeFetch = vi.fn(
      async () =>
        ({
          body: streamFromStrings(['chunk-1', 'chunk-2'], 1),
        }) as unknown as Response
    );

    const result = await flightTap({
      url: 'http://localhost:3000/products/1',
      route: '/products/[id]',
      output,
      fetchImpl: fakeFetch,
      now: (() => {
        let current = 0;
        return () => {
          current += 5;
          return current;
        };
      })(),
    });

    expect(result.chunks).toBe(2);
    expect(result.samples).toHaveLength(2);
    expect(result.samples[0]).toMatchObject({
      route: '/products/[id]',
      chunkIndex: 0,
      ts: 5,
    });
    expect(result.samples[0]?.label).toContain('bytes');
    expect(content).toContain('route=/products/[id]');
    expect(content).toContain('chunk 0');
    expect(content).toContain('chunk 1');
  });

  it('creates a readable stream from strings', async () => {
    const stream = streamFromStrings(['a', 'b']);
    const reader = stream.getReader();
    const first = await reader.read();
    expect(new TextDecoder().decode(first.value)).toBe('a');
  });
});
