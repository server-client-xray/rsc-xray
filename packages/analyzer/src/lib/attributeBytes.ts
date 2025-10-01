import type { ClientComponentBundle } from './clientBundles.js';

export interface NodeBundleBytes {
  totalBytes: number;
  chunks: string[];
}

function toPosix(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

export function attributeBytes(
  bundles: ClientComponentBundle[] | undefined
): Record<string, NodeBundleBytes> {
  if (!bundles || bundles.length === 0) {
    return {};
  }

  const map = new Map<string, NodeBundleBytes>();

  for (const bundle of bundles) {
    const key = toPosix(bundle.filePath);
    const existing = map.get(key);

    if (existing) {
      existing.totalBytes += bundle.totalBytes;
      for (const chunk of bundle.chunks) {
        if (!existing.chunks.includes(chunk)) {
          existing.chunks.push(chunk);
        }
      }
      existing.chunks.sort();
    } else {
      map.set(key, {
        totalBytes: bundle.totalBytes,
        chunks: [...bundle.chunks].sort(),
      });
    }
  }

  return Object.fromEntries(map.entries());
}
