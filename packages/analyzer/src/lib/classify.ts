import * as ts from 'typescript';

export type ComponentKind = 'server' | 'client';

interface ClassifyComponentOptions {
  sourceText: string;
  fileName: string;
}

interface ClassificationResult {
  fileName: string;
  kind: ComponentKind;
  hasUseClientDirective: boolean;
}

function hasUseClientDirective(sourceFile: ts.SourceFile): boolean {
  for (const statement of sourceFile.statements) {
    if (!ts.isExpressionStatement(statement)) {
      return false;
    }
    if (!ts.isStringLiteral(statement.expression)) {
      return false;
    }
    if (statement.expression.text === 'use client') {
      return true;
    }
  }
  return false;
}

export function classifyComponent({ sourceText, fileName }: ClassifyComponentOptions): ClassificationResult {
  const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const hasDirective = hasUseClientDirective(sourceFile);
  return {
    fileName,
    kind: hasDirective ? 'client' : 'server',
    hasUseClientDirective: hasDirective
  };
}
