'use client';

import { useState, useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { linter, type Diagnostic as CMDiagnostic } from '@codemirror/lint';
import type { Diagnostic, Suggestion } from '@rsc-xray/schemas';
import styles from './ContextTabs.module.css';

interface ContextFile {
  fileName: string;
  code: string;
  description: string;
}

interface ContextTabsConfig {
  file: ContextFile;
  diagnostics: Array<Diagnostic | Suggestion>;
}

export function ContextTabs({ file, diagnostics }: ContextTabsConfig) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Convert RSC X-Ray diagnostics to CodeMirror diagnostics for this file
  const convertDiagnostics = (diags: Array<Diagnostic | Suggestion>): CMDiagnostic[] => {
    return diags
      .filter((d) => d.loc?.file === file.fileName || d.loc?.file.includes(file.fileName))
      .map((diag) => {
        const line = (diag.loc?.line || 1) - 1; // Convert to 0-indexed
        const col = (diag.loc?.col || 1) - 1;
        const offset = viewRef.current?.state.doc.line(line + 1).from || 0;
        const position = offset + col;

        return {
          from: position,
          to: position + 10, // Highlight ~10 chars
          severity: diag.level === 'error' ? 'error' : 'warning',
          message: diag.message,
        } as CMDiagnostic;
      });
  };

  // Initialize CodeMirror for read-only context file
  useEffect(() => {
    if (!editorRef.current || isReady) return;

    const view = new EditorView({
      doc: file.code,
      extensions: [
        basicSetup,
        javascript({ jsx: true, typescript: true }),
        EditorView.editable.of(false), // Read-only
        linter(() => convertDiagnostics(diagnostics)), // Show diagnostics
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
            caretColor: 'transparent', // Hide caret in read-only
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
    };
  }, []);

  // Update diagnostics when they change
  useEffect(() => {
    if (!viewRef.current || !isReady) return;

    // Force linter to re-run
    import('@codemirror/lint').then(({ forceLinting }) => {
      if (viewRef.current) {
        forceLinting(viewRef.current);
      }
    });
  }, [diagnostics, isReady]);

  return (
    <div className={styles.container}>
      <div className={styles.description}>{file.description}</div>
      <div ref={editorRef} className={styles.editor} />
    </div>
  );
}
