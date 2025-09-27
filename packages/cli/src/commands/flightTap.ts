import { performance } from 'node:perf_hooks';
import type { Writable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

import type { FlightSample } from '@rsc-xray/schemas';

interface FlightTapOptions {
  url: string;
  route?: string;
  output?: Writable;
  fetchImpl?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
}

interface FlightTapResult {
  chunks: number;
  samples: FlightSample[];
}

const DEFAULT_OUTPUT: Writable = process.stdout;
const DEFAULT_NOW = () => performance.now();
const BYTES_IN_KILOBYTE = 1024;
const DEFAULT_FLIGHT_TIMEOUT_MS = 30_000;

function resolveRoute(url: string, explicit?: string): string {
  if (explicit && explicit.trim().length > 0) {
    return explicit;
  }
  try {
    const parsed = new URL(url);
    return parsed.pathname || '/';
  } catch {
    return '/';
  }
}

function formatSize(bytes: number): string {
  if (bytes < BYTES_IN_KILOBYTE) {
    return `${bytes} bytes`;
  }
  const kilobytes = bytes / BYTES_IN_KILOBYTE;
  const precision = kilobytes >= 100 ? 0 : kilobytes >= 10 ? 1 : 2;
  return `${kilobytes.toFixed(precision)} KB`;
}

function isAbortError(error: unknown): boolean {
  if (!error) {
    return false;
  }
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return error.name === 'AbortError';
  }
  return (error as { name?: string }).name === 'AbortError';
}

export async function flightTap({
  url,
  route,
  output = DEFAULT_OUTPUT,
  fetchImpl = fetch,
  now = DEFAULT_NOW,
  timeoutMs,
}: FlightTapOptions): Promise<FlightTapResult> {
  const effectiveTimeout =
    typeof timeoutMs === 'number' && Number.isFinite(timeoutMs)
      ? timeoutMs
      : DEFAULT_FLIGHT_TIMEOUT_MS;
  const useTimeout = typeof effectiveTimeout === 'number' && effectiveTimeout > 0;
  const controller = useTimeout ? new AbortController() : undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let abortedByTimeout = false;

  if (controller && useTimeout) {
    timeoutId = setTimeout(() => {
      abortedByTimeout = true;
      controller.abort();
    }, effectiveTimeout);
  }

  try {
    const response = await fetchImpl(
      url,
      controller ? ({ signal: controller.signal } as RequestInit) : undefined
    );
    if (!response.body) {
      throw new Error(`No response body for ${url}`);
    }

    let chunkIndex = 0;
    const start = now();
    const reader = response.body.getReader();
    const routeId = resolveRoute(url, route);
    const samples: FlightSample[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        const timestamp = Math.round(now() - start);
        const sizeLabel = formatSize(value.byteLength);
        output.write(
          `[scx-flight] route=${routeId} t=${timestamp}ms chunk ${chunkIndex} (${sizeLabel})\n`
        );
        const sample: FlightSample = {
          route: routeId,
          chunkIndex,
          ts: timestamp,
        };
        if (value.byteLength > 0) {
          sample.label = sizeLabel;
        }
        samples.push(sample);
        chunkIndex += 1;
      }
    }

    return { chunks: chunkIndex, samples };
  } catch (error) {
    if (controller && (abortedByTimeout || isAbortError(error))) {
      throw new Error(`Flight tap request timed out after ${effectiveTimeout}ms`);
    }
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
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
