import * as ts from 'typescript';

import type { Suggestion } from '@rsc-xray/schemas';

const REACT19_CACHE_OPPORTUNITY_RULE = 'react19-cache-opportunity';

function toSuggestion(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  rule: string,
  message: string,
  level: 'info' | 'warn',
  filePath: string
): Suggestion {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return {
    rule,
    level,
    message,
    loc: {
      file: filePath,
      line: line + 1,
      col: character + 1,
    },
  };
}

/**
 * Check if a file already imports cache from react
 */
function hasCacheImport(sourceFile: ts.SourceFile): boolean {
  let found = false;

  const visit = (node: ts.Node) => {
    if (found) return;

    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const moduleName = node.moduleSpecifier.text;
      if (moduleName === 'react' || moduleName === 'react/cache') {
        const namedBindings = node.importClause?.namedBindings;
        if (namedBindings && ts.isNamedImports(namedBindings)) {
          for (const element of namedBindings.elements) {
            if (element.name.text === 'cache') {
              found = true;
              return;
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);
  return found;
}

/**
 * Detect manual caching patterns using Map or WeakMap
 */
function detectMapCachingPatterns(sourceFile: ts.SourceFile, filePath: string): Suggestion[] {
  const suggestions: Suggestion[] = [];

  const visit = (node: ts.Node) => {
    // Look for: const cache = new Map() or new WeakMap()
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isNewExpression(node.initializer)
    ) {
      const expr = node.initializer.expression;
      if (ts.isIdentifier(expr) && (expr.text === 'Map' || expr.text === 'WeakMap')) {
        suggestions.push(
          toSuggestion(
            sourceFile,
            node,
            REACT19_CACHE_OPPORTUNITY_RULE,
            `Manual caching with ${expr.text} detected. In React 19+, consider using cache() from 'react' for automatic deduplication. Example: import { cache } from 'react'; const getData = cache(async (id) => { ... });`,
            'info',
            filePath
          )
        );
      }
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);
  return suggestions;
}

/**
 * Detect closure-based caching patterns
 */
function detectClosureCachingPatterns(sourceFile: ts.SourceFile, filePath: string): Suggestion[] {
  const suggestions: Suggestion[] = [];

  const visit = (node: ts.Node) => {
    // Look for IIFE returning a function with closure cache
    // Pattern: const getData = (() => { let cache; return async () => { if (cache) return cache; ... } })()
    if (ts.isVariableDeclaration(node) && node.initializer) {
      if (ts.isCallExpression(node.initializer)) {
        const callExpr = node.initializer;
        // Check if it's an IIFE (arrow function or function expression)
        if (
          (ts.isArrowFunction(callExpr.expression) ||
            ts.isFunctionExpression(callExpr.expression)) &&
          callExpr.arguments.length === 0
        ) {
          const funcBody = callExpr.expression.body;
          // Check if the body contains a return statement with a function
          if (ts.isBlock(funcBody)) {
            let hasReturnedFunction = false;
            const checkReturn = (child: ts.Node) => {
              if (
                ts.isReturnStatement(child) &&
                child.expression &&
                (ts.isArrowFunction(child.expression) || ts.isFunctionExpression(child.expression))
              ) {
                hasReturnedFunction = true;
              }
              ts.forEachChild(child, checkReturn);
            };
            ts.forEachChild(funcBody, checkReturn);

            if (hasReturnedFunction) {
              suggestions.push(
                toSuggestion(
                  sourceFile,
                  node,
                  REACT19_CACHE_OPPORTUNITY_RULE,
                  "Closure-based caching pattern detected. In React 19+, use cache() from 'react' for simpler and more reliable deduplication.",
                  'info',
                  filePath
                )
              );
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);
  return suggestions;
}

/**
 * Detect duplicate fetch calls that could benefit from cache()
 */
function detectDuplicateFetches(sourceFile: ts.SourceFile, filePath: string): Suggestion[] {
  const fetchUrls = new Map<string, ts.CallExpression[]>();

  const visit = (node: ts.Node) => {
    // Look for: fetch('/api/...')
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'fetch' &&
      node.arguments.length > 0
    ) {
      const firstArg = node.arguments[0];
      if (firstArg && ts.isStringLiteral(firstArg)) {
        const url = firstArg.text;
        const existing = fetchUrls.get(url) || [];
        existing.push(node);
        fetchUrls.set(url, existing);
      }
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);

  const suggestions: Suggestion[] = [];
  for (const [url, calls] of fetchUrls.entries()) {
    if (calls.length > 1) {
      // Return a diagnostic for EACH fetch call (not just the first one)
      for (const call of calls) {
        suggestions.push(
          toSuggestion(
            sourceFile,
            call,
            REACT19_CACHE_OPPORTUNITY_RULE,
            `Duplicate fetch to '${url}' detected (${calls.length} calls). In React 19+, wrap fetch in cache() to automatically deduplicate requests.`,
            'info',
            filePath
          )
        );
      }
    }
  }

  return suggestions;
}

export interface React19CacheDetectorConfig {
  reactVersion?: string;
  enabled?: boolean;
}

/**
 * Detect opportunities to use React 19 cache() API
 */
export function detectReact19CacheOpportunities(
  sourceFile: ts.SourceFile,
  filePath: string,
  config: React19CacheDetectorConfig = {}
): Suggestion[] {
  const { reactVersion, enabled = true } = config;

  if (!enabled) {
    return [];
  }

  // Skip if React version is explicitly set and is < 19
  if (
    reactVersion &&
    !reactVersion.startsWith('19') &&
    !reactVersion.startsWith('^19') &&
    !reactVersion.startsWith('~19')
  ) {
    return [];
  }

  // Skip if file already uses cache()
  if (hasCacheImport(sourceFile)) {
    return [];
  }

  const suggestions: Suggestion[] = [];

  // Detect various manual caching patterns
  suggestions.push(...detectMapCachingPatterns(sourceFile, filePath));
  suggestions.push(...detectClosureCachingPatterns(sourceFile, filePath));
  suggestions.push(...detectDuplicateFetches(sourceFile, filePath));

  return suggestions;
}
