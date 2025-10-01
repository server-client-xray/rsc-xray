'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { linter, Diagnostic as CMDiagnostic } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import { analyze } from '@rsc-xray/lsp-server';
import type { RscXrayDiagnostic } from '@rsc-xray/schemas';
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
 * CodeMirror 6 editor with browser-side LSP integration
 *
 * Features:
 * - Real-time analysis with 500ms debounce
 * - Red/yellow squiggles for errors/warnings
 * - Hover tooltips with rule explanations
 * - Uses @rsc-xray/lsp-server (browser-side, no server needed)
 * - Lightweight (~100KB vs Monaco's 2MB)
 */
export function CodeEditor({
  initialCode,
  scenarioId,
  onAnalysisComplete,
}: CodeEditorConfig): JSX.Element {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    // Create linter function that calls RSC X-Ray analyzer
    const rscXrayLinter = linter(
      async (view): Promise<CMDiagnostic[]> => {
        const code = view.state.doc.toString();

        try {
          onAnalysisComplete({ diagnostics: [], duration: 0, status: 'analyzing' });

          // Call browser-side LSP server
          const result = await analyze({
            code,
            fileName: 'demo.tsx',
            scenario: scenarioId as never, // Type assertion for now
          });

          // Convert RSC X-Ray diagnostics to CodeMirror format
          const cmDiagnostics: CMDiagnostic[] = (result.diagnostics || []).map((d) => ({
            from: getOffset(view.state.doc, d.line, d.column),
            to: getOffset(view.state.doc, d.endLine || d.line, d.endColumn || d.column + 1),
            severity: d.severity as 'error' | 'warning' | 'info',
            message: d.message,
            source: d.rule,
          }));

          onAnalysisComplete({
            diagnostics: result.diagnostics || [],
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
