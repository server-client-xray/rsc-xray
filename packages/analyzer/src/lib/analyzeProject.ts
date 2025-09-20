import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

import type { Diagnostic, Model, Suggestion } from '@server-client-xray/schemas';

import { collectClientComponentBundles } from './clientBundles';
import { buildGraph } from './graph';
import { classifyFiles } from './classifyFiles';
import { readManifests } from './readManifests';
import { collectSuggestionsForSource } from './suggestions';
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
}

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const IGNORED_DIRECTORIES = new Set(['node_modules', '.git', '.next', '.turbo']);

const toPosix = (value: string) => value.replace(/\\/g, '/');

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

  const graph = await buildGraph({
    projectRoot,
    classifiedFiles: classified,
    diagnosticsByFile,
    clientBundles,
    suggestionsByFile,
    appDir,
  });

  const manifestLookup = new Map(
    manifest.routes.map((route) => [route.route, route])
  );

  const routes = graph.routes.map((route) => {
    const info = manifestLookup.get(route.route);
    if (!info) {
      return route;
    }
    return {
      ...route,
      chunks: info.chunks,
      totalBytes: info.totalBytes,
    };
  });

  const buildInfo = {
    nextVersion: await readNextVersion(projectRoot),
    timestamp: new Date().toISOString(),
  };

  return {
    version: '0.1',
    routes,
    nodes: graph.nodes,
    build: buildInfo,
  };
}
