/**
 * Shared utilities for creating diagnostics with precise ranges
 */

import * as ts from 'typescript';
import type { Diagnostic, Suggestion, DiagnosticLocation } from '@rsc-xray/schemas';

/**
 * Create a diagnostic location from an AST node with precise character offsets
 *
 * @param sourceFile - TypeScript source file
 * @param node - AST node to get location from
 * @param filePath - File path for the diagnostic
 * @returns DiagnosticLocation with character offset range (0-indexed)
 */
export function createLocationFromNode(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  filePath: string
): DiagnosticLocation {
  return {
    file: filePath,
    range: {
      from: node.getStart(sourceFile), // 0-indexed character offset
      to: node.getEnd(), // 0-indexed character offset
    },
  };
}

/**
 * Create a diagnostic from an AST node
 *
 * @param sourceFile - TypeScript source file
 * @param node - AST node to get location from
 * @param filePath - File path for the diagnostic
 * @param rule - Rule ID
 * @param message - Diagnostic message
 * @param level - Diagnostic severity level
 * @returns Diagnostic with precise range
 */
export function createDiagnosticFromNode(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  filePath: string,
  rule: string,
  message: string,
  level: 'error' | 'warn'
): Diagnostic {
  return {
    rule,
    level,
    message,
    loc: createLocationFromNode(sourceFile, node, filePath),
  };
}

/**
 * Create a suggestion from an AST node
 *
 * @param sourceFile - TypeScript source file
 * @param node - AST node to get location from
 * @param filePath - File path for the suggestion
 * @param rule - Rule ID
 * @param message - Suggestion message
 * @param level - Suggestion severity level
 * @returns Suggestion with precise range
 */
export function createSuggestionFromNode(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  filePath: string,
  rule: string,
  message: string,
  level: 'info' | 'warn'
): Suggestion {
  return {
    rule,
    level,
    message,
    loc: createLocationFromNode(sourceFile, node, filePath),
  };
}

/**
 * Create a location from explicit character offsets (fallback for cases without AST nodes)
 *
 * @param filePath - File path
 * @param from - Start character offset (0-indexed)
 * @param to - End character offset (0-indexed)
 * @returns DiagnosticLocation with range
 */
export function createLocationFromOffsets(
  filePath: string,
  from: number,
  to: number
): DiagnosticLocation {
  return {
    file: filePath,
    range: { from, to },
  };
}
