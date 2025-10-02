'use client';

import { useState, useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { linter, type Diagnostic as CMDiagnostic } from '@codemirror/lint';
import type { Diagnostic, Suggestion } from '@rsc-xray/schemas';
import styles from './MultiFileCodeViewer.module.css';

/**
 * A single code file with optional diagnostics
 */
export interface CodeFile {
  /** File name (displayed in tab) */
  fileName: string;
  /** File content (code) */
  code: string;
  /** Optional description shown above the editor */
  description?: string;
  /** Whether this file is editable (default: false) */
  editable?: boolean;
  /** Language for syntax highlighting (default: 'typescript') */
  language?: 'typescript' | 'javascript' | 'tsx' | 'jsx';
}

interface MultiFileCodeViewerConfig {
  /** Array of files to display in tabs */
  files: CodeFile[];
  /** Optional diagnostics to overlay on the code */
  diagnostics?: Array<Diagnostic | Suggestion>;
  /** Initial active file (defaults to first file) */
  initialFile?: string;
  /** Callback when active file changes */
  onFileChange?: (fileName: string) => void;
  /** Callback when editable file content changes */
  onCodeChange?: (fileName: string, code: string) => void;
  /** Scenario object for analysis context (enables real-time analysis for editable files) */
  scenario?: {
    id: string;
    context?: Record<string, unknown>;
  };
  /** Callback when analysis completes */
  onAnalysisComplete?: (diagnostics: Array<Diagnostic | Suggestion>, duration: number) => void;
  /** Callback when analysis starts */
  onAnalysisStart?: () => void;
  /** Enable real-time analysis for editable files (triggers onAnalyze callback) - DEPRECATED, use scenario prop */
  enableRealTimeAnalysis?: boolean;
  /** Callback to perform analysis (return diagnostics for all files) - DEPRECATED, use scenario prop */
  onAnalyze?: (fileName: string, code: string) => Promise<Array<Diagnostic | Suggestion>>;
  /** Debounce delay for real-time analysis in ms (default: 300) */
  analysisDebounceMs?: number;
}

/**
 * Multi-file code viewer with tabs and optional diagnostics
 *
 * Features:
 * - Tab navigation for multiple files
 * - Syntax highlighting (TypeScript/JavaScript)
 * - Read-only or editable mode per file
 * - Diagnostic overlays (errors/warnings) from RSC X-Ray
 * - Smart package name highlighting for import diagnostics
 *
 * Usage:
 * ```tsx
 * <MultiFileCodeViewer
 *   files={[
 *     { fileName: 'App.tsx', code: '...', editable: true },
 *     { fileName: 'utils.ts', code: '...' }
 *   ]}
 *   diagnostics={diagnostics}
 *   onCodeChange={(file, code) => console.log('Changed:', file)}
 * />
 * ```
 */
export function MultiFileCodeViewer({
  files,
  diagnostics = [],
  initialFile,
  onFileChange,
  onCodeChange,
  scenario,
  onAnalysisComplete,
  onAnalysisStart,
  enableRealTimeAnalysis = false,
  onAnalyze,
  analysisDebounceMs = 300,
}: MultiFileCodeViewerConfig) {
  const [activeFileName, setActiveFileName] = useState<string>(
    initialFile || files[0]?.fileName || ''
  );
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [isReady, setIsReady] = useState(false);
  const scenarioRef = useRef(scenario);

  // Keep scenario ref up to date
  useEffect(() => {
    scenarioRef.current = scenario;
  }, [scenario]);

  const activeFile = files.find((f) => f.fileName === activeFileName);

  // Suppress unused variable warnings for deprecated props
  // These are kept for backwards compatibility but not used in scenario mode
  void enableRealTimeAnalysis;
  void onAnalyze;
  void analysisDebounceMs;

  // Convert RSC X-Ray diagnostics to CodeMirror diagnostics for the active file
  const convertDiagnostics = (
    diags: Array<Diagnostic | Suggestion>,
    fileName: string
  ): CMDiagnostic[] => {
    const filtered = diags.filter((d) => {
      if (!d.loc?.file) return false;

      // Match exact file name or if loc.file contains this file name
      return (
        d.loc.file === fileName ||
        d.loc.file.endsWith(`/${fileName}`) ||
        d.loc.file.includes(fileName)
      );
    });

    if (!viewRef.current) return [];

    return filtered.map((diag) => {
      const line = (diag.loc?.line || 1) - 1; // Convert to 0-indexed
      const col = (diag.loc?.col || 1) - 1;

      try {
        const lineObj = viewRef.current!.state.doc.line(line + 1);
        const position = lineObj.from + col;

        // Smart highlight length based on diagnostic type
        let highlightLength: number;
        const lineText = viewRef.current!.state.doc.sliceString(lineObj.from, lineObj.to);

        // For import-related diagnostics, find and highlight the package name (string literal)
        if (diag.rule === 'duplicate-dependencies' || diag.rule === 'client-forbidden-import') {
          const fromCol = lineText.substring(col);
          const stringMatch = fromCol.match(/^['"]([^'"]+)['"]/);
          if (stringMatch) {
            highlightLength = stringMatch[0].length;
          } else {
            highlightLength = Math.min(20, lineObj.to - position);
          }
        } else {
          highlightLength = Math.min(20, lineObj.to - position);
        }

        return {
          from: position,
          to: position + highlightLength,
          severity: diag.level === 'error' ? 'error' : 'warning',
          message: diag.message,
        } as CMDiagnostic;
      } catch (e) {
        console.error('[MultiFileCodeViewer] Error converting diagnostic:', e);
        return {
          from: 0,
          to: 10,
          severity: diag.level === 'error' ? 'error' : 'warning',
          message: diag.message,
        } as CMDiagnostic;
      }
    });
  };

  // Initialize or update CodeMirror editor
  useEffect(() => {
    if (!editorRef.current || !activeFile) return;

    // Destroy existing editor if present
    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    // Create linter: async if scenario is provided and file is editable, otherwise sync
    const linterExtension =
      scenario && activeFile.editable
        ? linter(async (view): Promise<CMDiagnostic[]> => {
            const code = view.state.doc.toString();
            const currentScenario = scenarioRef.current;

            if (!currentScenario) {
              return convertDiagnostics(diagnostics, activeFile.fileName);
            }

            console.log(`[MultiFileCodeViewer] Running analysis for "${currentScenario.id}"`);

            try {
              if (onAnalysisStart) onAnalysisStart();

              const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache',
                },
                body: JSON.stringify({
                  code,
                  fileName: activeFile.fileName,
                  scenario: currentScenario.id,
                  context: currentScenario.context,
                }),
              });

              if (!response.ok) {
                throw new Error(`Analysis failed: ${response.statusText}`);
              }

              const result = await response.json();
              console.log('[MultiFileCodeViewer] Analysis result:', result);

              if (onAnalysisComplete) {
                onAnalysisComplete(result.diagnostics || [], result.duration);
              }

              return convertDiagnostics(result.diagnostics || [], activeFile.fileName);
            } catch (error) {
              console.error('[MultiFileCodeViewer] Analysis error:', error);
              return [];
            }
          })
        : linter(() => convertDiagnostics(diagnostics, activeFile.fileName));

    const view = new EditorView({
      doc: activeFile.code,
      extensions: [
        basicSetup,
        javascript({ jsx: true, typescript: activeFile.language !== 'javascript' }),
        EditorView.editable.of(activeFile.editable || false),
        linterExtension,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && activeFile.editable) {
            const newCode = update.state.doc.toString();

            // Trigger user callback
            if (onCodeChange) {
              onCodeChange(activeFile.fileName, newCode);
            }

            // Trigger real-time analysis if enabled
            triggerAnalysis(activeFile.fileName, newCode);
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
            backgroundColor: 'var(--color-bg-tertiary)',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: 'var(--font-mono)',
          },
          '.cm-content': {
            caretColor: activeFile.editable ? 'var(--color-text-primary)' : 'transparent',
          },
          '.cm-gutters': {
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-tertiary)',
            border: 'none',
          },
        }),
      ],
      parent: editorRef.current,
    });

    viewRef.current = view;
    setIsReady(true);

    return () => {
      view.destroy();
      viewRef.current = null;
      setIsReady(false);
    };
  }, [activeFileName, activeFile?.code]);

  // Update diagnostics when they change (for non-scenario mode)
  useEffect(() => {
    if (!viewRef.current || !isReady || scenario) return; // Skip if scenario mode (linter handles it)

    import('@codemirror/lint').then(({ forceLinting }) => {
      if (viewRef.current) {
        forceLinting(viewRef.current);
      }
    });
  }, [diagnostics, isReady, scenario]);

  const handleTabChange = (fileName: string) => {
    setActiveFileName(fileName);
    if (onFileChange) {
      onFileChange(fileName);
    }
  };

  return (
    <div className={styles.container}>
      {/* Tab navigation */}
      <div className={styles.tabNavigation}>
        {files.map((file) => (
          <button
            key={file.fileName}
            className={`${styles.tabButton} ${
              activeFileName === file.fileName ? styles.activeTabButton : ''
            }`}
            onClick={() => handleTabChange(file.fileName)}
            title={file.description}
          >
            {file.fileName}
            {file.editable && <span className={styles.editableIndicator}>✎</span>}
          </button>
        ))}
      </div>

      {/* File description (optional) */}
      {activeFile?.description && (
        <div className={styles.description}>{activeFile.description}</div>
      )}

      {/* Analyzing indicator */}
      {enableRealTimeAnalysis && <div className={styles.analyzingIndicator}>⚡ Analyzing...</div>}

      {/* CodeMirror editor */}
      <div ref={editorRef} className={styles.editor} />
    </div>
  );
}
