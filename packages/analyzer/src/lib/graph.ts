import { readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

import * as ts from 'typescript';

import type {
  Diagnostic,
  NodeCacheMetadata,
  NodeMutationMetadata,
  RouteEntry,
  Suggestion,
  XNode,
} from '@rsc-xray/schemas';

import type { ClassifiedFile } from './classifyFiles';
import type { ClientComponentBundle } from './clientBundles';
import { attributeBytes } from './attributeBytes';
import type { FileCacheMetadata } from './cacheMetadata';

export interface BuildGraphOptions {
  projectRoot: string;
  classifiedFiles: ClassifiedFile[];
  appDir?: string;
  diagnosticsByFile?: Record<string, Diagnostic[]>;
  clientBundles?: ClientComponentBundle[];
  suggestionsByFile?: Record<string, Suggestion[]>;
  cacheMetadataByFile?: Record<string, FileCacheMetadata>;
}

export interface BuildGraphResult {
  routes: RouteEntry[];
  nodes: Record<string, XNode>;
}

type NodeKind = XNode['kind'];

interface ModuleMeta {
  id: string;
  filePath: string; // posix relative path from project root
  absPath: string;
  kind: NodeKind;
  imports: string[]; // module ids
}

const SUPPORTED_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

function toPosixPath(value: string): string {
  return value.replace(/\\/g, '/');
}

function normalizeRelativePath(projectRoot: string, absPath: string): string {
  const rel = relative(projectRoot, absPath) || absPath;
  return toPosixPath(rel);
}

function deriveRouteFromAppFile(appDir: string, filePath: string): string | undefined {
  const segments = filePath.split('/');

  if (segments[0] !== appDir) {
    return undefined;
  }

  const fileName = segments[segments.length - 1];
  const baseName = fileName.split('.')[0];

  if (baseName !== 'page') {
    return undefined;
  }

  const withoutFile = segments.slice(1, -1); // drop app dir + filename

  const routeSegments = withoutFile
    .map((segment) => segment.replace(/^\(([^)]+)\)$/, ''))
    .filter((segment) => segment.length > 0);

  if (routeSegments.length === 0) {
    return '/';
  }

  return `/${routeSegments.join('/')}`;
}

function createNodeId(kind: NodeKind, key: string): string {
  return `${kind}:${key}`;
}

async function extractRelativeImports(absPath: string): Promise<string[]> {
  const sourceText = await readFile(absPath, 'utf8');
  const sourceFile = ts.createSourceFile(
    absPath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    absPath.endsWith('.tsx') || absPath.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const imports: string[] = [];

  sourceFile.forEachChild((node) => {
    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push(node.moduleSpecifier.text);
    }
  });

  return imports;
}

function resolveImport(
  projectRoot: string,
  fromFile: string,
  importPath: string,
  availableFiles: Set<string>
): string | undefined {
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
    return undefined;
  }

  const fromDir = dirname(fromFile);
  const basePath = resolve(fromDir, importPath);

  const candidates: string[] = [];

  if (SUPPORTED_EXTENSIONS.some((ext) => importPath.endsWith(ext))) {
    candidates.push(basePath);
  } else {
    for (const ext of SUPPORTED_EXTENSIONS) {
      candidates.push(`${basePath}${ext}`);
    }
    for (const ext of SUPPORTED_EXTENSIONS) {
      candidates.push(join(basePath, `index${ext}`));
    }
  }

  for (const candidate of candidates) {
    const relCandidate = normalizeRelativePath(projectRoot, candidate);
    if (availableFiles.has(relCandidate)) {
      return relCandidate;
    }
  }

  return undefined;
}

function buildModuleId(filePath: string): string {
  return `module:${filePath}`;
}

export async function buildGraph({
  projectRoot,
  classifiedFiles,
  appDir = 'app',
  diagnosticsByFile,
  clientBundles,
  suggestionsByFile,
  cacheMetadataByFile,
}: BuildGraphOptions): Promise<BuildGraphResult> {
  const availableFiles = new Set(classifiedFiles.map((file) => toPosixPath(file.filePath)));

  const diagnosticsLookup = new Map<string, Diagnostic[]>();
  if (diagnosticsByFile) {
    for (const [filePath, diagnosticList] of Object.entries(diagnosticsByFile)) {
      if (!diagnosticList?.length) {
        continue;
      }
      const normalized = toPosixPath(filePath);
      diagnosticsLookup.set(
        normalized,
        diagnosticList.map((diagnostic) => ({ ...diagnostic }))
      );
    }
  }

  const bundleLookup = attributeBytes(clientBundles);
  const suggestionLookup = new Map<string, Suggestion[]>();
  if (suggestionsByFile) {
    for (const [filePath, suggestionList] of Object.entries(suggestionsByFile)) {
      if (!suggestionList?.length) {
        continue;
      }
      suggestionLookup.set(
        toPosixPath(filePath),
        suggestionList.map((entry) => ({ ...entry }))
      );
    }
  }

  const cacheMetadataLookup = new Map<string, FileCacheMetadata>();
  if (cacheMetadataByFile) {
    for (const [filePath, meta] of Object.entries(cacheMetadataByFile)) {
      cacheMetadataLookup.set(toPosixPath(filePath), meta);
    }
  }

  const moduleMetas = new Map<string, ModuleMeta>();

  for (const file of classifiedFiles) {
    const relPath = toPosixPath(file.filePath);
    const absPath = join(projectRoot, relPath);
    const moduleId = buildModuleId(relPath);

    const importSpecifiers = await extractRelativeImports(absPath);
    const resolvedImports: string[] = [];

    for (const specifier of importSpecifiers) {
      const resolved = resolveImport(projectRoot, absPath, specifier, availableFiles);
      if (resolved) {
        resolvedImports.push(buildModuleId(resolved));
      }
    }

    const meta: ModuleMeta = {
      id: moduleId,
      filePath: relPath,
      absPath,
      kind: file.kind,
      imports: Array.from(new Set(resolvedImports)).sort(),
    };

    moduleMetas.set(moduleId, meta);
  }

  const nodes: Record<string, XNode> = {};

  for (const meta of moduleMetas.values()) {
    const diagnostics = diagnosticsLookup.get(meta.filePath);
    const bundle = bundleLookup[meta.filePath];
    const suggestions = suggestionLookup.get(meta.filePath);

    const cacheMetadata = cacheMetadataLookup.get(meta.filePath);
    const tagSet = new Set<string>();
    if (cacheMetadata) {
      for (const tag of cacheMetadata.tags) {
        if (tag) {
          tagSet.add(tag);
        }
      }
    }

    const nodeCache: NodeCacheMetadata | undefined = cacheMetadata
      ? (() => {
          const modes = Array.from(cacheMetadata.cacheModes);
          const revalidateSeconds = Array.from(cacheMetadata.revalidateSeconds).sort(
            (a, b) => a - b
          );
          if (!modes.length && !revalidateSeconds.length && !cacheMetadata.hasRevalidateFalse) {
            return undefined;
          }
          const result: NodeCacheMetadata = {};
          if (modes.length) {
            result.modes = modes;
          }
          if (revalidateSeconds.length) {
            result.revalidateSeconds = revalidateSeconds;
          }
          if (cacheMetadata.hasRevalidateFalse) {
            result.hasRevalidateFalse = true;
          }
          return result;
        })()
      : undefined;

    const nodeMutations: NodeMutationMetadata | undefined = cacheMetadata
      ? (() => {
          const mutationTags = Array.from(cacheMetadata.revalidateTagCalls).sort();
          const mutationPaths = Array.from(cacheMetadata.revalidatePathCalls).sort();
          if (!mutationTags.length && !mutationPaths.length) {
            return undefined;
          }
          const result: NodeMutationMetadata = {};
          if (mutationTags.length) {
            result.tags = mutationTags;
          }
          if (mutationPaths.length) {
            result.paths = mutationPaths;
          }
          return result;
        })()
      : undefined;

    nodes[meta.id] = {
      id: meta.id,
      kind: meta.kind,
      file: meta.filePath,
      name: meta.filePath.split('/').pop(),
      children: meta.imports,
      ...(diagnostics ? { diagnostics } : {}),
      ...(bundle && bundle.totalBytes > 0 ? { bytes: bundle.totalBytes } : {}),
      ...(suggestions ? { suggestions } : {}),
      ...(tagSet.size ? { tags: Array.from(tagSet).sort() } : {}),
      ...(nodeCache ? { cache: nodeCache } : {}),
      ...(nodeMutations ? { mutations: nodeMutations } : {}),
    };
  }

  const routes: RouteEntry[] = [];

  const sortedModules = Array.from(moduleMetas.values()).sort((a, b) =>
    a.filePath.localeCompare(b.filePath)
  );

  for (const meta of sortedModules) {
    const route = deriveRouteFromAppFile(appDir, meta.filePath);
    if (!route) {
      continue;
    }

    const routeId = createNodeId('route', route);
    const routeNode: XNode = {
      id: routeId,
      kind: 'route',
      name: route,
      children: [meta.id],
    };

    nodes[routeId] = routeNode;
    routes.push({ route, rootNodeId: routeId });
  }

  routes.sort((a, b) => a.route.localeCompare(b.route));

  return {
    routes,
    nodes,
  };
}
