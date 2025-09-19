import { PassThrough } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

import { describe, expect, it, vi } from 'vitest';

import { flightTap, streamFromStrings } from '../flightTap';

describe('flightTap', () => {
  it('logs chunk timings', async () => {
    const output = new PassThrough();
    let content = '';
    output.on('data', (chunk) => {
      content += chunk.toString();
    });

    const fakeFetch = vi.fn(async () => ({
      body: streamFromStrings(['chunk-1', 'chunk-2'], 1),
    } as unknown as Response));

    const result = await flightTap({ url: 'http://localhost:3000/products', output, fetchImpl: fakeFetch });

    expect(result.chunks).toBe(2);
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
