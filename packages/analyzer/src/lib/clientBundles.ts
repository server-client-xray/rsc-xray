import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import vm from 'node:vm';

interface NamedAssetSize {
  name: string;
  size: number;
}

export interface ClientComponentBundle {
  filePath: string;
  chunks: string[];
  totalBytes: number;
}

interface ClientModuleEntry {
  chunks?: string[];
}

interface ClientManifestEntry {
  clientModules?: Record<string, ClientModuleEntry>;
}

type ClientManifest = Record<string, ClientManifestEntry>;

async function loadJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

function decodeChunkPath(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function loadAssetSizes(
  projectRoot: string,
  distDir: string
): Promise<Record<string, number>> {
  const sizeManifestPath = join(projectRoot, distDir, 'build-manifest.json.__scx_sizes__');
  try {
    const parsed = await loadJson<Record<string, NamedAssetSize[]>>(sizeManifestPath);
    return Object.fromEntries(
      Object.entries(parsed).map(([chunk, assets]) => [
        chunk,
        assets.reduce((acc, asset) => acc + asset.size, 0),
      ])
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function findClientManifestFiles(root: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string) {
    let entries: import('node:fs').Dirent[];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      throw error;
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('client-reference-manifest.js')) {
        results.push(fullPath);
      }
    }
  }

  await walk(root);
  return results;
}

function parseClientReferenceManifest(filePath: string, content: string): ClientManifest {
  const context = { globalThis: {} as { __RSC_MANIFEST?: ClientManifest } };
  vm.runInNewContext(content, context, { filename: filePath });
  return context.globalThis.__RSC_MANIFEST ?? {};
}

function normalizeChunkList(chunks: string[] | undefined): string[] {
  if (!chunks) {
    return [];
  }
  return chunks.filter((chunk) => chunk.includes('/'));
}

export interface ClientBundleOptions {
  projectRoot: string;
  distDir?: string;
}

export async function collectClientComponentBundles({
  projectRoot,
  distDir = '.next',
}: ClientBundleOptions): Promise<ClientComponentBundle[]> {
  const assetSizes = await loadAssetSizes(projectRoot, distDir);
  const manifestRootCandidates = [join(projectRoot, distDir, 'server'), join(projectRoot, distDir)];
  let manifestFiles: string[] = [];

  for (const candidate of manifestRootCandidates) {
    manifestFiles = await findClientManifestFiles(candidate);
    if (manifestFiles.length > 0) {
      break;
    }
  }

  const componentChunks = new Map<string, Set<string>>();

  for (const filePath of manifestFiles) {
    const content = await readFile(filePath, 'utf8');
    const manifest = parseClientReferenceManifest(filePath, content);

    for (const entry of Object.values(manifest)) {
      const modules = entry.clientModules ?? {};
      for (const [modulePath, meta] of Object.entries(modules)) {
        if (!modulePath.startsWith(projectRoot)) {
          continue;
        }
        const relativePath = relative(projectRoot, modulePath) || modulePath;
        const existing = componentChunks.get(relativePath) ?? new Set<string>();
        for (const chunk of normalizeChunkList(meta.chunks)) {
          existing.add(chunk);
        }
        componentChunks.set(relativePath, existing);
      }
    }
  }

  const bundles: ClientComponentBundle[] = [];
  const chunkSizeCache = new Map<string, number>();

  async function resolveChunkSize(chunk: string): Promise<number> {
    if (typeof assetSizes[chunk] === 'number') {
      return assetSizes[chunk];
    }
    if (chunkSizeCache.has(chunk)) {
      return chunkSizeCache.get(chunk)!;
    }
    try {
      const decoded = decodeChunkPath(chunk);
      const chunkPath = join(projectRoot, distDir, decoded);
      const stats = await stat(chunkPath);
      chunkSizeCache.set(chunk, stats.size);
      return stats.size;
    } catch {
      try {
        const stats = await stat(join(projectRoot, distDir, chunk));
        chunkSizeCache.set(chunk, stats.size);
        return stats.size;
      } catch {
        chunkSizeCache.set(chunk, 0);
        return 0;
      }
    }
  }

  for (const [filePath, chunks] of componentChunks.entries()) {
    const chunkList = Array.from(chunks).sort();
    const sizes = await Promise.all(chunkList.map((chunk) => resolveChunkSize(chunk)));
    const totalBytes = sizes.reduce((acc, size) => acc + size, 0);
    bundles.push({ filePath, chunks: chunkList, totalBytes });
  }

  bundles.sort((a, b) => a.filePath.localeCompare(b.filePath));
  return bundles;
}
