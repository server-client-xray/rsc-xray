import * as ts from 'typescript';

export interface FileCacheMetadata {
  tags: Set<string>;
  cacheModes: Set<'force-cache' | 'no-store'>;
  revalidateSeconds: Set<number>;
  hasRevalidateFalse: boolean;
  revalidateTagCalls: Set<string>;
  revalidatePathCalls: Set<string>;
  exportedDynamic?: 'auto' | 'force-dynamic' | 'force-static' | 'error';
  experimentalPpr: boolean;
}

interface CollectOptions {
  sourceText: string;
}

const CACHE_LITERAL_VALUES = new Set(['force-cache', 'no-store']);
const DYNAMIC_LITERAL_VALUES = new Set(['auto', 'force-dynamic', 'force-static', 'error']);

function createEmptyMetadata(): FileCacheMetadata {
  return {
    tags: new Set<string>(),
    cacheModes: new Set<'force-cache' | 'no-store'>(),
    revalidateSeconds: new Set<number>(),
    hasRevalidateFalse: false,
    revalidateTagCalls: new Set<string>(),
    revalidatePathCalls: new Set<string>(),
    experimentalPpr: false,
  };
}

function extractStaticString(node: ts.Expression): string | null {
  if (ts.isStringLiteralLike(node)) {
    return node.text;
  }
  if (ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isTemplateExpression(node) && node.templateSpans.length === 0) {
    return node.head.text;
  }
  return null;
}

function extractStaticNumber(node: ts.Expression): number | null {
  if (ts.isNumericLiteral(node)) {
    const value = Number(node.text);
    return Number.isFinite(value) ? value : null;
  }
  return null;
}

function extractStaticBoolean(node: ts.Expression): boolean | null {
  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  return null;
}

function collectTagsFromExpression(target: ts.Expression, into: Set<string>) {
  if (ts.isArrayLiteralExpression(target)) {
    for (const element of target.elements) {
      if (!ts.isExpression(element)) {
        continue;
      }
      const value = extractStaticString(element);
      if (value && !value.startsWith('_N_')) {
        into.add(value);
      }
    }
    return;
  }

  const literal = extractStaticString(target);
  if (literal) {
    literal
      .split(/[,\n]/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0 && !entry.startsWith('_N_'))
      .forEach((entry) => {
        into.add(entry);
      });
  }
}

function collectCacheFromObjectLiteral(
  node: ts.ObjectLiteralExpression,
  metadata: FileCacheMetadata
) {
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property) || !property.name) {
      continue;
    }

    const name = ts.isIdentifier(property.name)
      ? property.name.text
      : ts.isStringLiteralLike(property.name)
        ? property.name.text
        : undefined;

    if (!name) {
      continue;
    }

    if (!ts.isExpression(property.initializer)) {
      continue;
    }

    switch (name) {
      case 'cache': {
        const literal = extractStaticString(property.initializer);
        if (literal && CACHE_LITERAL_VALUES.has(literal as 'force-cache' | 'no-store')) {
          metadata.cacheModes.add(literal as 'force-cache' | 'no-store');
        }
        break;
      }
      case 'revalidate': {
        if (property.initializer.kind === ts.SyntaxKind.FalseKeyword) {
          metadata.hasRevalidateFalse = true;
        } else {
          const value = extractStaticNumber(property.initializer);
          if (typeof value === 'number') {
            metadata.revalidateSeconds.add(value);
          }
        }
        break;
      }
      case 'next': {
        if (ts.isObjectLiteralExpression(property.initializer)) {
          collectCacheFromObjectLiteral(property.initializer, metadata);
        }
        break;
      }
      case 'tags': {
        collectTagsFromExpression(property.initializer, metadata.tags);
        break;
      }
      case 'headers': {
        if (ts.isObjectLiteralExpression(property.initializer)) {
          collectCacheFromObjectLiteral(property.initializer, metadata);
        }
        break;
      }
      case 'x-next-cache-tags': {
        collectTagsFromExpression(property.initializer, metadata.tags);
        break;
      }
      default:
        break;
    }
  }
}

function isIdentifierWithName(node: ts.Expression, name: string): boolean {
  if (ts.isIdentifier(node)) {
    return node.text === name;
  }
  if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.name)) {
    return node.name.text === name;
  }
  return false;
}

export function collectCacheMetadata({ sourceText }: CollectOptions): FileCacheMetadata {
  const metadata = createEmptyMetadata();
  const sourceFile = ts.createSourceFile(
    'inline.tsx',
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const visit = (node: ts.Node) => {
    if (
      ts.isVariableStatement(node) &&
      node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      for (const declaration of node.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) {
          continue;
        }
        const initializer = declaration.initializer;
        if (!initializer || !ts.isExpression(initializer)) {
          continue;
        }

        switch (declaration.name.text) {
          case 'revalidate': {
            if (initializer.kind === ts.SyntaxKind.FalseKeyword) {
              metadata.hasRevalidateFalse = true;
            } else {
              const value = extractStaticNumber(initializer);
              if (typeof value === 'number') {
                metadata.revalidateSeconds.add(value);
              }
            }
            break;
          }
          case 'dynamic': {
            const literal = extractStaticString(initializer);
            if (literal && DYNAMIC_LITERAL_VALUES.has(literal)) {
              metadata.exportedDynamic = literal as
                | 'auto'
                | 'force-dynamic'
                | 'force-static'
                | 'error';
            }
            break;
          }
          case 'experimental_ppr': {
            const value = extractStaticBoolean(initializer);
            if (value === true) {
              metadata.experimentalPpr = true;
            }
            break;
          }
          default:
            break;
        }
      }
    }

    if (ts.isCallExpression(node)) {
      if (isIdentifierWithName(node.expression, 'fetch') && node.arguments.length >= 2) {
        const options = node.arguments[1];
        if (ts.isObjectLiteralExpression(options)) {
          collectCacheFromObjectLiteral(options, metadata);
        }
      } else if (isIdentifierWithName(node.expression, 'revalidateTag')) {
        const [first] = node.arguments;
        if (first && ts.isExpression(first)) {
          const tag = extractStaticString(first);
          if (tag) {
            metadata.revalidateTagCalls.add(tag);
          }
        }
      } else if (isIdentifierWithName(node.expression, 'revalidatePath')) {
        const [first] = node.arguments;
        if (first && ts.isExpression(first)) {
          const path = extractStaticString(first);
          if (path) {
            metadata.revalidatePathCalls.add(path);
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return metadata;
}
