import * as ts from 'typescript';
import type { Diagnostic } from '@rsc-xray/schemas';

import { classifyComponent } from '../lib/classify.js';
import type { ComponentKind } from '../lib/classify.js';

export interface AnalyzeClientSourceOptions {
  fileName: string;
  sourceText: string;
  forbiddenModules?: readonly string[];
}

const DEFAULT_MODULES = new Set([
  'fs',
  'path',
  'child_process',
  'os',
  'net',
  'tls',
  'http',
  'https',
  'worker_threads',
  'perf_hooks',
]);

function resolveModuleSet(forbiddenModules?: readonly string[]): Set<string> {
  return forbiddenModules ? new Set(forbiddenModules) : DEFAULT_MODULES;
}

function normalizeModule(moduleName: string): string {
  return moduleName.startsWith('node:') ? moduleName.slice(5) : moduleName;
}

function isForbiddenModule(moduleName: string, modules: Set<string>): boolean {
  return modules.has(moduleName) || modules.has(normalizeModule(moduleName));
}

function createDiagnostic(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  moduleName: string
): Diagnostic {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return {
    rule: 'client-forbidden-import',
    level: 'error',
    message: `Client components must not import '${moduleName}'.`,
    loc: {
      file: sourceFile.fileName,
      line: line + 1,
      col: character + 1,
    },
  };
}

function analyzeSource({
  fileName,
  sourceText,
  forbiddenModules,
}: AnalyzeClientSourceOptions): Diagnostic[] {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const diagnostics: Diagnostic[] = [];
  const modules = resolveModuleSet(forbiddenModules);

  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const moduleName = node.moduleSpecifier.text;
      if (isForbiddenModule(moduleName, modules)) {
        diagnostics.push(createDiagnostic(sourceFile, node.moduleSpecifier, moduleName));
      }
    }

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'require' &&
      node.arguments.length > 0 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      const moduleName = node.arguments[0].text;
      if (isForbiddenModule(moduleName, modules)) {
        diagnostics.push(createDiagnostic(sourceFile, node.arguments[0], moduleName));
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return diagnostics;
}

export interface AnalyzeClientFileOptions {
  fileName: string;
  sourceText: string;
  forbiddenModules?: readonly string[];
}

export function analyzeClientFileForForbiddenImports({
  fileName,
  sourceText,
  forbiddenModules,
}: AnalyzeClientFileOptions): Diagnostic[] {
  const classification = classifyComponent({ fileName, sourceText });
  if (classification.kind !== 'client') {
    return [];
  }
  return analyzeSource({ fileName, sourceText, forbiddenModules });
}

export interface CollectForbiddenImportsOptions {
  files: Array<{ filePath: string; sourceText: string; kind: ComponentKind }>;
  forbiddenModules?: readonly string[];
}

export function collectForbiddenImportDiagnostics({
  files,
  forbiddenModules,
}: CollectForbiddenImportsOptions): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const file of files) {
    if (file.kind !== 'client') continue;
    diagnostics.push(
      ...analyzeSource({
        fileName: file.filePath,
        sourceText: file.sourceText,
        forbiddenModules,
      })
    );
  }
  return diagnostics;
}

export const __testing = { analyzeSource, resolveModuleSet, normalizeModule };
