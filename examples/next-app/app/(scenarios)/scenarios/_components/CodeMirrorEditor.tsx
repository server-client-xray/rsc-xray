'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { linter, Diagnostic as CMDiagnostic } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';

export interface MockDiagnostic {
  from: number; // Character offset from start of document
  to: number; // Character offset from start of document
  severity: 'error' | 'warning' | 'info';
  message: string;
  source?: string;
}

interface CodeMirrorEditorProps {
  initialValue: string;
  mockDiagnostics?: MockDiagnostic[];
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  proFeature?: boolean; // Flag to show Pro badge
}

/**
 * CodeMirror 6 editor with mock LSP diagnostic support
 * For OSS: Uses hardcoded diagnostics
 * For Pro: Can be extended to use real LSP server
 */
export function CodeMirrorEditor({
  initialValue,
  mockDiagnostics = [],
  onChange,
  readOnly = false,
  height = '400px',
  proFeature = false,
}: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !editorRef.current) return;

    // Convert mock diagnostics to CodeMirror format
    const mockLinter = linter(() => {
      return mockDiagnostics.map(
        (d): CMDiagnostic => ({
          from: d.from,
          to: d.to,
          severity: d.severity,
          message: d.message,
          source: d.source || 'rsc-xray',
        })
      );
    });

    const extensions = [
      basicSetup,
      javascript({ jsx: true, typescript: true }),
      mockLinter,
      EditorView.theme({
        '&': { height },
        '.cm-scroller': { overflow: 'auto' },
      }),
      EditorView.editable.of(!readOnly),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChange) {
          onChange(update.state.doc.toString());
        }
      }),
    ];

    const state = EditorState.create({
      doc: initialValue,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [isClient, initialValue, mockDiagnostics, onChange, readOnly, height]);

  if (!isClient) {
    return (
      <div
        className="rounded-lg border border-gray-300 bg-gray-50 p-4"
        style={{ height, overflow: 'auto' }}
      >
        <pre className="text-sm">
          <code>{initialValue}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="relative">
      {proFeature && (
        <div className="absolute right-2 top-2 z-10 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
          Pro Feature
        </div>
      )}
      <div
        ref={editorRef}
        className="rounded-lg border border-gray-300 overflow-hidden"
        style={{ fontSize: '14px' }}
      />
      <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500"></span>
          <span>Error</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-yellow-500"></span>
          <span>Warning</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
          <span>Info</span>
        </div>
        {!readOnly && <span className="ml-auto">✏️ Editable - try changing the code!</span>}
      </div>
    </div>
  );
}
