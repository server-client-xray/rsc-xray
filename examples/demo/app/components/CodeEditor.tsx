'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { linter, Diagnostic as CMDiagnostic } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import type { Diagnostic, Suggestion } from '@rsc-xray/schemas';
import type { LspAnalysisResponse } from '@rsc-xray/lsp-server';
import type { Scenario } from '../lib/scenarios';
import styles from './CodeEditor.module.css';

interface CodeEditorConfig {
  scenario: Scenario;
  highlightLine?: number | null;
  diagnostics?: Array<Diagnostic | Suggestion>; // Optional: pre-computed diagnostics (for context tabs)
  onAnalysisComplete: (config: {
    diagnostics: Array<Diagnostic | Suggestion>;
    duration: number;
    status: 'idle' | 'analyzing' | 'error';
  }) => void;
}

/**
 * CodeMirror 6 editor with real-time LSP integration
 *
 * Features:
 * - Real-time analysis with 300ms debounce
 * - Red/yellow squiggles for errors/warnings
 * - Hover tooltips with rule explanations
 * - Line highlighting for deep linking
 * - Uses @rsc-xray/lsp-server via Next.js API route
 * - Lightweight (~100KB vs Monaco's 2MB)
 *
 * Note: Analysis runs server-side because @rsc-xray/analyzer
 * uses Node.js APIs. Still provides real-time UX with debouncing.
 */
export function CodeEditor({ scenario, highlightLine, onAnalysisComplete }: CodeEditorConfig) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [isReady, setIsReady] = useState(false);
  // Use ref to track current scenario so linter can access latest value
  const scenarioRef = useRef(scenario);

  // Keep scenario ref up to date
  useEffect(() => {
    scenarioRef.current = scenario;
  }, [scenario]);

  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    // Create linter function that calls RSC X-Ray analyzer via API
    const rscXrayLinter = linter(
      async (view): Promise<CMDiagnostic[]> => {
        const code = view.state.doc.toString();
        const currentScenario = scenarioRef.current;

        console.log(
          `[Linter] Running analysis for scenario "${currentScenario.id}" (${code.length} chars)`
        );

        try {
          onAnalysisComplete({ diagnostics: [], duration: 0, status: 'analyzing' });

          // Call server-side LSP analysis API
          // Use scenarioRef.current to get the latest scenario value
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache', // Prevent client-side caching
            },
            body: JSON.stringify({
              code,
              fileName: 'demo.tsx',
              scenario: currentScenario.id,
              context: currentScenario.context, // Pass context for rules that need it
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Analysis API error:', response.status, errorText);
            throw new Error(`Analysis failed: ${response.statusText}`);
          }

          const result: LspAnalysisResponse = await response.json();
          console.log('Analysis result:', result);

          // Convert RSC X-Ray diagnostics to CodeMirror format
          // RSC X-Ray diagnostics have structure: { rule, level, message, loc: { file, line, col } }
          // Filter by: has 'loc' AND is for 'demo.tsx' (not context files)
          const diagnosticsOnly = (result.diagnostics || []).filter(
            (d) => 'loc' in d && d.loc?.file === 'demo.tsx'
          );

          console.log(
            'Diagnostics to display:',
            diagnosticsOnly,
            'filtered from',
            result.diagnostics?.length
          );

          const cmDiagnostics: CMDiagnostic[] = diagnosticsOnly.map((d) => {
            const diag = d as {
              rule: string;
              level: string;
              message: string;
              loc: {
                file: string;
                line: number;
                col: number;
              };
            };

            // RSC X-Ray uses 1-indexed lines/cols
            // CodeMirror doc.line() uses 1-indexed lines, but positions are 0-indexed
            const lineObj = view.state.doc.line(diag.loc.line);
            const from = lineObj.from + (diag.loc.col - 1); // Convert 1-indexed col to 0-indexed offset

            // Smart highlight length based on diagnostic type
            let highlightLength: number;
            const lineText = view.state.doc.sliceString(lineObj.from, lineObj.to);
            const colOffset = diag.loc.col - 1; // 0-indexed column position

            // For import-related diagnostics, find and highlight the package name (string literal)
            if (diag.rule === 'duplicate-dependencies' || diag.rule === 'client-forbidden-import') {
              // Look for quoted string starting at or near the diagnostic position
              const fromCol = lineText.substring(colOffset);
              const stringMatch = fromCol.match(/^['"]([^'"]+)['"]/);
              if (stringMatch) {
                // Highlight the quoted string (including quotes)
                highlightLength = stringMatch[0].length;
              } else {
                highlightLength = Math.min(20, lineObj.to - from);
              }
            } else if (diag.loc.col === 1) {
              // For diagnostics at col 1, highlight the whole line (likely a function/declaration)
              highlightLength = lineObj.to - from;
            } else {
              // For diagnostics mid-line, highlight ~20 characters (likely a specific expression)
              highlightLength = Math.min(20, lineObj.to - from);
            }

            const to = from + highlightLength;

            console.log(
              `Diagnostic: line ${diag.loc.line}, col ${diag.loc.col} -> offset ${from}-${to} (${highlightLength} chars)`,
              diag.message
            );

            return {
              from,
              to,
              severity: diag.level as 'error' | 'warning' | 'info',
              message: diag.message,
              source: diag.rule,
            };
          });

          console.log('CodeMirror diagnostics:', cmDiagnostics);

          // Pass ALL diagnostics (unfiltered) to parent so context tabs can access them
          // CodeMirror only shows the filtered ones (diagnosticsOnly)
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
      { delay: 300 }
    ); // Reduced to 300ms for faster feedback

    // Initialize CodeMirror
    const startState = EditorState.create({
      doc: scenario.code,
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
    if (currentCode !== scenario.code) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: currentCode.length,
          insert: scenario.code,
        },
      });
    }

    // Trigger re-lint with new scenario context immediately
    // This ensures diagnostics update even if user hasn't edited yet
    import('@codemirror/lint').then(({ forceLinting }) => {
      if (viewRef.current) {
        forceLinting(viewRef.current);
      }
    });
  }, [scenario.code, scenario.id, isReady]);

  // Highlight and scroll to specific line (for deep linking)
  useEffect(() => {
    if (!viewRef.current || !isReady || !highlightLine) return;

    const view = viewRef.current;
    const doc = view.state.doc;

    // Validate line number
    if (highlightLine < 1 || highlightLine > doc.lines) {
      console.warn(`Line ${highlightLine} is out of bounds (doc has ${doc.lines} lines)`);
      return;
    }

    try {
      // Get line object for the specified line (1-indexed input, CodeMirror uses 1-indexed for doc.line())
      const lineObj = doc.line(highlightLine);

      // Set selection to the entire line
      view.dispatch({
        selection: { anchor: lineObj.from, head: lineObj.to },
        scrollIntoView: true,
      });

      // Focus the editor
      view.focus();
    } catch (error) {
      console.error('Error highlighting line:', error);
    }
  }, [highlightLine, isReady]);

  return <div ref={editorRef} className={styles.editor} />;
}
