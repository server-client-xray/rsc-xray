import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type {
  NextAppBuildManifest,
  NextBuildManifest,
  ParsedManifests,
} from '../types/next-manifest';

interface ReadManifestsOptions {
  projectRoot: string;
  distDir?: string;
}

interface NamedAssetSize {
  name: string;
  size: number;
}

const DEFAULT_DIST_DIR = '.next';

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

function sumBytes(assets: NamedAssetSize[] | undefined): number | undefined {
  if (!assets || assets.length === 0) {
    return undefined;
  }
  return assets.reduce((acc, asset) => acc + asset.size, 0);
}

export async function readManifests({
  projectRoot,
  distDir = DEFAULT_DIST_DIR,
}: ReadManifestsOptions): Promise<ParsedManifests> {
  const manifestPath = join(projectRoot, distDir, 'build-manifest.json');
  const appManifestPath = join(projectRoot, distDir, 'server', 'app-build-manifest.json');
  const sizeManifestPath = join(projectRoot, distDir, 'build-manifest.json.__scx_sizes__');

  const [buildManifest, appBuildManifest] = await Promise.all([
    readJsonFile<NextBuildManifest>(manifestPath),
    readJsonFile<NextAppBuildManifest>(appManifestPath),
  ]);

  let assetSizes: Record<string, number> | undefined;
  try {
    const parsed = await readJsonFile<Record<string, NamedAssetSize[]>>(sizeManifestPath);
    assetSizes = Object.fromEntries(
      Object.entries(parsed).map(([chunk, assets]) => [chunk, sumBytes(assets) ?? 0])
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  const seenRoutes = new Map<string, Set<string>>();
  const normalizeRoute = (route: string): string => {
    if (route === '/') {
      return route;
    }
    return route.replace(/\/page$/, '') || '/';
  };

  const appendRoute = (route: string, chunks: string[]) => {
    const key = normalizeRoute(route);
    if (!seenRoutes.has(key)) {
      seenRoutes.set(key, new Set());
    }
    const set = seenRoutes.get(key)!;
    chunks.forEach((chunk) => set.add(chunk));
  };

  Object.entries(buildManifest.pages).forEach(([route, chunks]) => appendRoute(route, chunks));
  Object.entries(buildManifest.app).forEach(([route, chunks]) => appendRoute(route, chunks));
  Object.entries(appBuildManifest.pages).forEach(([route, chunks]) => appendRoute(route, chunks));

  const routes = Array.from(seenRoutes.entries()).map(([route, chunks]) => {
    const chunkArray = Array.from(chunks);
    const totalBytes = assetSizes
      ? chunkArray.reduce((acc, chunk) => acc + (assetSizes?.[chunk] ?? 0), 0)
      : undefined;

    return {
      route,
      chunks: chunkArray,
      totalBytes: totalBytes && totalBytes > 0 ? totalBytes : undefined,
    };
  });

  return { routes };
}
