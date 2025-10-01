'use client';

import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { linter, Diagnostic as CMDiagnostic } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import type { RscXrayDiagnostic } from '@rsc-xray/schemas';
import type { LspAnalysisResponse } from '@rsc-xray/lsp-server';
import styles from './CodeEditor.module.css';

interface CodeEditorConfig {
  initialCode: string;
  scenarioId: string;
  onAnalysisComplete: (config: {
    diagnostics: RscXrayDiagnostic[];
    duration: number;
    status: 'idle' | 'analyzing' | 'error';
  }) => void;
}

/**
 * CodeMirror 6 editor with real-time LSP integration
 *
 * Features:
 * - Real-time analysis with 500ms debounce
 * - Red/yellow squiggles for errors/warnings
 * - Hover tooltips with rule explanations
 * - Uses @rsc-xray/lsp-server via Next.js API route
 * - Lightweight (~100KB vs Monaco's 2MB)
 *
 * Note: Analysis runs server-side because @rsc-xray/analyzer
 * uses Node.js APIs. Still provides real-time UX with debouncing.
 */
export function CodeEditor({
  initialCode,
  scenarioId,
  onAnalysisComplete,
}: CodeEditorConfig): ReactElement {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    // Create linter function that calls RSC X-Ray analyzer via API
    const rscXrayLinter = linter(
      async (view): Promise<CMDiagnostic[]> => {
        const code = view.state.doc.toString();

        try {
          onAnalysisComplete({ diagnostics: [], duration: 0, status: 'analyzing' });

          // Call server-side LSP analysis API
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code,
              fileName: 'demo.tsx',
              scenario: scenarioId,
            }),
          });

          if (!response.ok) {
            throw new Error(`Analysis failed: ${response.statusText}`);
          }

          const result: LspAnalysisResponse = await response.json();

          // Convert RSC X-Ray diagnostics to CodeMirror format
          // Filter to only Diagnostic items (which have line/column, not Suggestions)
          const diagnosticsOnly = (result.diagnostics || []).filter(
            (d) => 'line' in d && 'column' in d
          );

          const cmDiagnostics: CMDiagnostic[] = diagnosticsOnly.map((d) => {
            const diag = d as unknown as {
              line: number;
              column: number;
              endLine?: number;
              endColumn?: number;
              severity: string;
              message: string;
              rule: string;
            };

            return {
              from: getOffset(view.state.doc, diag.line, diag.column),
              to: getOffset(
                view.state.doc,
                diag.endLine || diag.line,
                diag.endColumn || diag.column + 1
              ),
              severity: diag.severity as 'error' | 'warning' | 'info',
              message: diag.message,
              source: diag.rule,
            };
          });

          onAnalysisComplete({
            diagnostics: diagnosticsOnly as unknown as RscXrayDiagnostic[],
            duration: result.duration,
            status: 'idle',
          });

          return cmDiagnostics;
        } catch (error) {
          console.error('Analysis error:', error);
          onAnalysisComplete({
            diagnostics: [],
            duration: 0,
            status: 'error',
          });
          return [];
        }
      },
      { delay: 500 }
    ); // 500ms debounce

    // Initialize CodeMirror
    const startState = EditorState.create({
      doc: initialCode,
      extensions: [
        basicSetup,
        javascript({ jsx: true, typescript: true }),
        rscXrayLinter,
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
          },
          '.cm-content': {
            fontFamily: 'var(--font-mono)',
          },
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;
    setIsReady(true);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Only run once on mount

  // Update code when scenario changes
  useEffect(() => {
    if (!viewRef.current || !isReady) return;

    const currentCode = viewRef.current.state.doc.toString();
    if (currentCode !== initialCode) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: currentCode.length,
          insert: initialCode,
        },
      });
    }
  }, [initialCode, scenarioId, isReady]);

  return <div ref={editorRef} className={styles.editor} />;
}

/**
 * Convert line/column to document offset
 */
function getOffset(
  doc: { line: (n: number) => { from: number; to: number } },
  line: number,
  column: number
): number {
  const lineObj = doc.line(line);
  return lineObj.from + Math.min(column, lineObj.to - lineObj.from);
}
