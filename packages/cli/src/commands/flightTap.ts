import { performance } from 'node:perf_hooks';
import type { Writable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

interface FlightTapOptions {
  url: string;
  output?: Writable;
  fetchImpl?: typeof fetch;
}

interface FlightTapResult {
  chunks: number;
}

const DEFAULT_OUTPUT: Writable = process.stdout;

export async function flightTap({
  url,
  output = DEFAULT_OUTPUT,
  fetchImpl = fetch,
}: FlightTapOptions): Promise<FlightTapResult> {
  const response = await fetchImpl(url);
  if (!response.body) {
    throw new Error(`No response body for ${url}`);
  }

  let chunkIndex = 0;
  const start = performance.now();
  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      const timestamp = Math.round(performance.now() - start);
      output.write(
        `[scx-flight] t=${timestamp}ms chunk ${chunkIndex} (${value.byteLength} bytes)\n`,
      );
      chunkIndex += 1;
    }
  }

  return { chunks: chunkIndex };
}

export function streamFromStrings(chunks: string[], delayMs = 0): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (index >= chunks.length) {
        controller.close();
        return;
      }
      const chunk = chunks[index];
      index += 1;
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      controller.enqueue(encoder.encode(chunk));
    },
  });
}
