'use client';

import { useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { useEffect, useRef } from 'react';
import styles from './ContextTabs.module.css';

interface ContextFile {
  fileName: string;
  code: string;
  description: string;
}

interface ContextTabsConfig {
  files: ContextFile[];
}

export function ContextTabs({ files }: ContextTabsConfig) {
  const [activeTab, setActiveTab] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize CodeMirror for read-only context files
  useEffect(() => {
    if (!editorRef.current || isReady) return;

    const view = new EditorView({
      doc: files[0]?.code || '',
      extensions: [
        basicSetup,
        javascript({ jsx: true, typescript: true }),
        EditorView.editable.of(false), // Read-only
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

  // Update editor content when tab changes
  useEffect(() => {
    if (!viewRef.current || !isReady) return;

    const currentCode = viewRef.current.state.doc.toString();
    const newCode = files[activeTab]?.code || '';

    if (currentCode !== newCode) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: currentCode.length,
          insert: newCode,
        },
      });
    }
  }, [activeTab, files, isReady]);

  if (files.length === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {files.map((file, index) => (
          <button
            key={file.fileName}
            className={`${styles.tab} ${index === activeTab ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(index)}
            title={file.description}
          >
            {file.fileName}
          </button>
        ))}
      </div>
      <div className={styles.description}>{files[activeTab]?.description}</div>
      <div ref={editorRef} className={styles.editor} />
    </div>
  );
}
