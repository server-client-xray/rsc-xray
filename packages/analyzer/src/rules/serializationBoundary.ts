import * as ts from 'typescript';
import type { Diagnostic } from '@rsc-xray/schemas';

export interface SerializationBoundaryOptions {
  fileName: string;
  sourceText: string;
  clientComponents?: Set<string>;
}

/**
 * Detects non-serializable props passed from server to client components.
 *
 * React Server Components require all props to be JSON-serializable.
 * This rule detects common non-serializable patterns:
 * - Functions (including arrow functions, methods)
 * - Class instances (Date, Map, Set, custom classes)
 * - Symbols
 * - Unresolved Promises
 * - React elements (except in children prop)
 */

const NON_SERIALIZABLE_PATTERNS = {
  FUNCTION: 'function',
  ARROW_FUNCTION: 'arrow function',
  DATE: 'Date instance',
  MAP: 'Map instance',
  SET: 'Set instance',
  PROMISE: 'Promise',
  SYMBOL: 'Symbol',
  CLASS_INSTANCE: 'class instance',
  REACT_ELEMENT: 'React element',
} as const;

function createDiagnostic(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  propName: string,
  nonSerializableType: string,
  componentName: string
): Diagnostic {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));

  const suggestions = getSuggestions(nonSerializableType);

  return {
    rule: 'server-client-serialization-violation',
    level: 'error',
    message: `Non-serializable prop '${propName}' (${nonSerializableType}) passed to client component '${componentName}'. Props must be JSON-serializable.${suggestions ? ` ${suggestions}` : ''}`,
    loc: {
      file: sourceFile.fileName,
      line: line + 1,
      col: character + 1,
    },
  };
}

function getSuggestions(nonSerializableType: string): string | undefined {
  switch (nonSerializableType) {
    case NON_SERIALIZABLE_PATTERNS.FUNCTION:
    case NON_SERIALIZABLE_PATTERNS.ARROW_FUNCTION:
      return 'Consider using Server Actions for mutations, or move the function to the client component.';
    case NON_SERIALIZABLE_PATTERNS.DATE:
      return 'Serialize the Date as an ISO string (toISOString()) and parse it in the client component.';
    case NON_SERIALIZABLE_PATTERNS.MAP:
    case NON_SERIALIZABLE_PATTERNS.SET:
      return 'Convert to an array or plain object before passing to the client.';
    case NON_SERIALIZABLE_PATTERNS.CLASS_INSTANCE:
      return 'Extract serializable data from the class instance into a plain object.';
    case NON_SERIALIZABLE_PATTERNS.PROMISE:
      return 'Await the Promise in the server component before passing the resolved value.';
    default:
      return undefined;
  }
}

function isClientComponent(componentName: string, clientComponents: Set<string>): boolean {
  // Check if the component is in the known client components set
  return clientComponents.has(componentName);
}

/**
 * Symbol table to track variable declarations and their initializers
 */
interface VariableDeclaration {
  name: string;
  initializer: ts.Expression | undefined;
  kind: string | undefined;
}

/**
 * Build a symbol table of all variable declarations in the source file
 */
function buildSymbolTable(sourceFile: ts.SourceFile): Map<string, VariableDeclaration> {
  const symbolTable = new Map<string, VariableDeclaration>();

  function visitDeclaration(node: ts.Node) {
    // Variable declarations: const x = ..., let y = ...
    if (ts.isVariableDeclaration(node)) {
      if (ts.isIdentifier(node.name) && node.initializer) {
        const name = node.name.text;
        const kind = detectNonSerializableExpression(node.initializer);
        symbolTable.set(name, {
          name,
          initializer: node.initializer,
          kind,
        });
      }
    }

    // Function declarations: function foo() {}
    if (ts.isFunctionDeclaration(node) && node.name) {
      const name = node.name.text;
      symbolTable.set(name, {
        name,
        initializer: undefined,
        kind: NON_SERIALIZABLE_PATTERNS.FUNCTION,
      });
    }

    ts.forEachChild(node, visitDeclaration);
  }

  visitDeclaration(sourceFile);
  return symbolTable;
}

/**
 * Resolve an expression through the symbol table
 * If it's an identifier, look up its declaration
 */
function resolveExpression(
  expr: ts.Expression,
  symbolTable: Map<string, VariableDeclaration>
): { expression: ts.Expression; kind: string | undefined } {
  // If it's an identifier, look up its declaration
  if (ts.isIdentifier(expr)) {
    const varDecl = symbolTable.get(expr.text);
    if (varDecl) {
      return {
        expression: varDecl.initializer || expr,
        kind: varDecl.kind,
      };
    }
  }

  // Otherwise, try to detect directly
  const kind = detectNonSerializableExpression(expr);
  return { expression: expr, kind };
}

function detectNonSerializableExpression(node: ts.Expression): string | undefined {
  // Arrow function: () => {}
  if (ts.isArrowFunction(node)) {
    return NON_SERIALIZABLE_PATTERNS.ARROW_FUNCTION;
  }

  // Function expression: function() {}
  if (ts.isFunctionExpression(node)) {
    return NON_SERIALIZABLE_PATTERNS.FUNCTION;
  }

  // New expression: new Date(), new Map(), new Set(), new CustomClass()
  if (ts.isNewExpression(node) && node.expression) {
    if (ts.isIdentifier(node.expression)) {
      const typeName = node.expression.text;
      if (typeName === 'Date') return NON_SERIALIZABLE_PATTERNS.DATE;
      if (typeName === 'Map') return NON_SERIALIZABLE_PATTERNS.MAP;
      if (typeName === 'Set') return NON_SERIALIZABLE_PATTERNS.SET;
      if (typeName === 'Promise') return NON_SERIALIZABLE_PATTERNS.PROMISE;
      // Any other new expression is likely a class instance
      return NON_SERIALIZABLE_PATTERNS.CLASS_INSTANCE;
    }
  }

  // Symbol usage
  if (ts.isCallExpression(node)) {
    if (ts.isIdentifier(node.expression) && node.expression.text === 'Symbol') {
      return NON_SERIALIZABLE_PATTERNS.SYMBOL;
    }
  }

  // JSX element (except in children - we'll handle that separately)
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
    return NON_SERIALIZABLE_PATTERNS.REACT_ELEMENT;
  }

  return undefined;
}

function isChildrenProp(propName: string | undefined): boolean {
  return propName === 'children';
}

function analyzeJsxAttributes(
  sourceFile: ts.SourceFile,
  attributes: ts.JsxAttributes,
  componentName: string,
  symbolTable: Map<string, VariableDeclaration>,
  diagnostics: Diagnostic[]
): void {
  for (const prop of attributes.properties) {
    if (!ts.isJsxAttribute(prop)) continue;
    if (!prop.initializer) continue;

    const propName = prop.name.getText(sourceFile);

    // Skip 'children' prop - React elements are allowed there
    if (isChildrenProp(propName)) continue;

    // Handle JSX expression: prop={value}
    if (ts.isJsxExpression(prop.initializer)) {
      const { expression } = prop.initializer;
      if (!expression) continue;

      // Resolve the expression through the symbol table
      const { kind: nonSerializableType } = resolveExpression(expression, symbolTable);

      if (nonSerializableType) {
        diagnostics.push(
          createDiagnostic(sourceFile, expression, propName, nonSerializableType, componentName)
        );
      }
    }
  }
}

function analyzeSource({
  fileName,
  sourceText,
  clientComponents = new Set(),
}: SerializationBoundaryOptions): Diagnostic[] {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  // Check if this is a client component (has 'use client' directive)
  // If it is, we don't need to check it (client-to-client props are fine)
  let hasUseClient = false;
  for (const statement of sourceFile.statements) {
    if (
      ts.isExpressionStatement(statement) &&
      ts.isStringLiteral(statement.expression) &&
      statement.expression.text === 'use client'
    ) {
      hasUseClient = true;
      break;
    }
  }

  // Only analyze server components
  if (hasUseClient) {
    return [];
  }

  // Build symbol table for variable tracking
  const symbolTable = buildSymbolTable(sourceFile);

  const diagnostics: Diagnostic[] = [];

  const visit = (node: ts.Node) => {
    // Look for JSX elements
    if (ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName.getText(sourceFile);

      // Check if it's a known client component
      if (isClientComponent(tagName, clientComponents)) {
        analyzeJsxAttributes(sourceFile, node.attributes, tagName, symbolTable, diagnostics);
      }
    }

    if (ts.isJsxElement(node)) {
      const tagName = node.openingElement.tagName.getText(sourceFile);

      // Check if it's a known client component
      if (isClientComponent(tagName, clientComponents)) {
        analyzeJsxAttributes(
          sourceFile,
          node.openingElement.attributes,
          tagName,
          symbolTable,
          diagnostics
        );
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return diagnostics;
}

export function analyzeSerializationBoundary(options: SerializationBoundaryOptions): Diagnostic[] {
  return analyzeSource(options);
}
