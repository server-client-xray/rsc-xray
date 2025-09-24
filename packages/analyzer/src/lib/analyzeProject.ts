import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

import type {
  Diagnostic,
  Model,
  NodeCacheMetadata,
  RouteEntry,
  Suggestion,
} from '@server-client-xray/schemas';

import { collectClientComponentBundles } from './clientBundles';
import { buildGraph } from './graph';
import { classifyFiles } from './classifyFiles';
import { readManifests } from './readManifests';
import { collectSuggestionsForSource } from './suggestions';
import { collectCacheMetadata, type FileCacheMetadata } from './cacheMetadata';
import { analyzeClientFileForForbiddenImports } from '../rules/clientForbiddenImports';

interface AnalyzeProjectOptions {
  projectRoot: string;
  distDir?: string;
  appDir?: string;
}

interface SourceEntry {
  filePath: string;
  kind: 'server' | 'client';
  sourceText: string;
  cacheMetadata: FileCacheMetadata;
}

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const IGNORED_DIRECTORIES = new Set(['node_modules', '.git', '.next', '.turbo']);
const HYDRATION_SNAPSHOT_PATH = ['.scx', 'hydration.json'] as const;

const toPosix = (value: string) => value.replace(/\\/g, '/');

async function readHydrationSnapshot(projectRoot: string): Promise<Record<string, number>> {
  try {
    const raw = await readFile(join(projectRoot, ...HYDRATION_SNAPSHOT_PATH), 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const durations: Record<string, number> = {};
    for (const [nodeId, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof nodeId !== 'string' || nodeId.length === 0) {
        continue;
      }
      const numeric = typeof value === 'number' ? value : Number(value);
      if (Number.isFinite(numeric) && numeric >= 0) {
        durations[nodeId] = numeric;
      }
    }
    return durations;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    return {};
  }
}

function sumHydrationDuration(
  nodeId: string,
  nodes: Record<string, XNode>,
  visiting: Set<string>
): number {
  if (visiting.has(nodeId)) {
    return 0;
  }
  const node = nodes[nodeId];
  if (!node) {
    return 0;
  }
  visiting.add(nodeId);

  const shouldCountSelf = node.kind === 'client' || node.kind === 'suspense';
  let total =
    shouldCountSelf && typeof node.hydrationMs === 'number' && Number.isFinite(node.hydrationMs)
      ? node.hydrationMs
      : 0;

  for (const childId of node.children ?? []) {
    total += sumHydrationDuration(childId, nodes, visiting);
  }

  visiting.delete(nodeId);
  return total;
}

function applyHydrationDurations(
  nodes: Record<string, XNode>,
  routes: RouteEntry[],
  durations: Record<string, number>
): void {
  const entries = Object.entries(durations);
  if (!entries.length) {
    return;
  }

  for (const [nodeId, duration] of entries) {
    const node = nodes[nodeId];
    if (!node) {
      continue;
    }
    nodes[nodeId] = {
      ...node,
      hydrationMs: duration,
    };
  }

  for (const route of routes) {
    const total = sumHydrationDuration(route.rootNodeId, nodes, new Set());
    if (total <= 0) {
      continue;
    }
    const existing = nodes[route.rootNodeId];
    if (!existing) {
      continue;
    }
    nodes[route.rootNodeId] = {
      ...existing,
      hydrationMs: total,
    };
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function discoverSourceFiles(baseDir: string, projectRoot: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!SOURCE_EXTENSIONS.has(extname(entry.name))) {
        continue;
      }
      const rel = toPosix(relative(projectRoot, fullPath));
      results.push(rel);
    }
  }

  if (await pathExists(baseDir)) {
    await walk(baseDir);
  }

  results.sort();
  return results;
}

async function readNextVersion(projectRoot: string): Promise<string> {
  try {
    const pkgRaw = await readFile(join(projectRoot, 'package.json'), 'utf8');
    const pkg = JSON.parse(pkgRaw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return pkg.dependencies?.next ?? pkg.devDependencies?.next ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function analyzeProject({
  projectRoot,
  distDir = '.next',
  appDir = 'app',
}: AnalyzeProjectOptions): Promise<Model> {
  const appRoot = join(projectRoot, appDir);
  const sourcePaths = await discoverSourceFiles(appRoot, projectRoot);
  const absolutePaths = sourcePaths.map((relativePath) => join(projectRoot, relativePath));

  const classified = await classifyFiles({ projectRoot, filePaths: absolutePaths });

  const sources: SourceEntry[] = await Promise.all(
    classified.map(async (entry) => {
      const absPath = join(projectRoot, entry.filePath);
      const sourceText = await readFile(absPath, 'utf8');
      return {
        filePath: toPosix(entry.filePath),
        kind: entry.kind,
        sourceText,
        cacheMetadata: collectCacheMetadata({ sourceText }),
      } as SourceEntry;
    })
  );

  const diagnosticsByFile: Record<string, Diagnostic[]> = {};
  for (const entry of sources) {
    if (entry.kind !== 'client') {
      continue;
    }
    const diagnostics = analyzeClientFileForForbiddenImports({
      fileName: entry.filePath,
      sourceText: entry.sourceText,
    });
    if (diagnostics.length > 0) {
      diagnosticsByFile[entry.filePath] = diagnostics;
    }
  }

  const suggestionsByFile: Record<string, Suggestion[]> = {};
  for (const entry of sources) {
    const suggestions = collectSuggestionsForSource({
      filePath: entry.filePath,
      sourceText: entry.sourceText,
      kind: entry.kind,
    });
    if (suggestions.length > 0) {
      suggestionsByFile[entry.filePath] = suggestions;
    }
  }

  const clientBundles = await collectClientComponentBundles({ projectRoot, distDir });
  const manifest = await readManifests({ projectRoot, distDir });

  const cacheMetadataByFile: Record<string, FileCacheMetadata> = {};
  for (const entry of sources) {
    cacheMetadataByFile[entry.filePath] = entry.cacheMetadata;
  }

  const graph = await buildGraph({
    projectRoot,
    classifiedFiles: classified,
    diagnosticsByFile,
    clientBundles,
    suggestionsByFile,
    appDir,
    cacheMetadataByFile,
  });

  const hydrationDurations = await readHydrationSnapshot(projectRoot);

  const manifestLookup = new Map(manifest.routes.map((route) => [route.route, route]));

  const nodes = { ...graph.nodes };

  const routes = graph.routes.map((route) => {
    const info = manifestLookup.get(route.route);
    if (!info) {
      return route;
    }
    const result: RouteEntry = {
      ...route,
      chunks: info.chunks,
      totalBytes: info.totalBytes,
      ...(info.cache ? { cache: info.cache } : {}),
    };

    if (info.cache) {
      const currentNode = nodes[route.rootNodeId];
      if (currentNode) {
        let updatedNode = currentNode;

        if (info.cache.tags?.length) {
          const combined = new Set<string>(currentNode.tags ?? []);
          for (const tag of info.cache.tags) {
            combined.add(tag);
          }
          if (combined.size) {
            updatedNode = {
              ...updatedNode,
              tags: Array.from(combined).sort(),
            };
          }
        }

        if (typeof info.cache.revalidateSeconds !== 'undefined') {
          const existingCache = updatedNode.cache ?? {};
          const updatedCache: NodeCacheMetadata = { ...existingCache };

          if (info.cache.revalidateSeconds === false) {
            updatedCache.hasRevalidateFalse = true;
          } else if (typeof info.cache.revalidateSeconds === 'number') {
            const seconds = new Set<number>(updatedCache.revalidateSeconds ?? []);
            seconds.add(info.cache.revalidateSeconds);
            updatedCache.revalidateSeconds = Array.from(seconds).sort((a, b) => a - b);
          }

          if (
            updatedCache.modes?.length ||
            updatedCache.revalidateSeconds?.length ||
            updatedCache.hasRevalidateFalse
          ) {
            updatedNode = {
              ...updatedNode,
              cache: updatedCache,
            };
          }
        }

        nodes[route.rootNodeId] = updatedNode;
      }
    }

    return result;
  });

  const buildInfo = {
    nextVersion: await readNextVersion(projectRoot),
    timestamp: new Date().toISOString(),
  };

  applyHydrationDurations(nodes, routes, hydrationDurations);

  return {
    version: '0.1',
    routes,
    nodes,
    build: buildInfo,
  };
}
