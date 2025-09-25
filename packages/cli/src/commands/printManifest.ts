import type { Writable } from 'node:stream';

import { readManifests } from '@rsc-xray/analyzer';

interface PrintManifestOptions {
  projectRoot: string;
  distDir?: string;
  output?: Writable;
}

const DEFAULT_OUTPUT: Writable = process.stdout;

function formatBytes(bytes: number | undefined): string {
  if (!bytes || bytes <= 0) {
    return '';
  }
  const kb = bytes / 1024;
  if (kb < 1) {
    return `${bytes} B`;
  }
  return `${kb.toFixed(1)} kB`;
}

export async function printManifest({
  projectRoot,
  distDir,
  output = DEFAULT_OUTPUT,
}: PrintManifestOptions): Promise<void> {
  const { routes } = await readManifests({ projectRoot, distDir });

  const lines = routes
    .sort((a, b) => a.route.localeCompare(b.route))
    .map((route) => {
      const chunkList = route.chunks.join(', ');
      const bytesLabel = formatBytes(route.totalBytes);
      return bytesLabel
        ? `${route.route} -> ${chunkList} (${bytesLabel})`
        : `${route.route} -> ${chunkList}`;
    });

  if (lines.length === 0) {
    output.write('No routes found in manifests\n');
    return;
  }

  output.write(lines.join('\n'));
  output.write('\n');
}
