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
    console.log(
      '[ContextTabs] Converting diagnostics for',
      file.fileName,
      'from',
      diags.length,
      'total'
    );

    const filtered = diags.filter((d) => {
      if (!d.loc?.file) return false;

      // Match exact file name or if loc.file contains this file name
      const matches =
        d.loc.file === file.fileName ||
        d.loc.file.endsWith(`/${file.fileName}`) ||
        d.loc.file.includes(file.fileName);

      if (matches) {
        console.log('[ContextTabs] Matched diagnostic:', d.loc.file, '→', file.fileName);
      }

      return matches;
    });

    console.log('[ContextTabs] Filtered to', filtered.length, 'diagnostics for', file.fileName);

    return filtered.map((diag) => {
      const line = (diag.loc?.line || 1) - 1; // Convert to 0-indexed
      const col = (diag.loc?.col || 1) - 1;

      try {
        const offset = viewRef.current?.state.doc.line(line + 1).from || 0;
        const position = offset + col;
        const lineLength = viewRef.current?.state.doc.line(line + 1).length || 10;
        const highlightLength = Math.min(20, lineLength - col);

        console.log(
          '[ContextTabs] Diagnostic at line',
          line + 1,
          'col',
          col + 1,
          '→ offset',
          position
        );

        return {
          from: position,
          to: position + highlightLength,
          severity: diag.level === 'error' ? 'error' : 'warning',
          message: diag.message,
        } as CMDiagnostic;
      } catch (e) {
        console.error('[ContextTabs] Error converting diagnostic:', e);
        return {
          from: 0,
          to: 10,
          severity: diag.level === 'error' ? 'error' : 'warning',
          message: diag.message,
        } as CMDiagnostic;
      }
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
