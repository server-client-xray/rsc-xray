/**
 * Interactive Demo Example using MultiFileCodeViewer with Real-Time Analysis
 *
 * This demonstrates how to use MultiFileCodeViewer to replace both
 * CodeEditor and ContextTabs with a single unified component.
 */

import { useState } from 'react';
import { MultiFileCodeViewer, type CodeFile } from './MultiFileCodeViewer';
import type { Diagnostic, Suggestion } from '@rsc-xray/schemas';

/**
 * Example: Interactive Demo with Real-Time Analysis
 *
 * This replaces the current DemoApp architecture with a unified component.
 */
export function InteractiveDemoExample() {
  const [scenario] = useState({
    id: 'duplicate-dependencies',
    code: `'use client';
import { format } from 'date-fns';
import _ from 'lodash';
import moment from 'moment';

export function DateDisplay({ date }: { date: Date }) {
  return <div>{format(date, 'PPP')}</div>;
}`,
    contextFiles: [
      {
        fileName: 'Header.tsx',
        code: `'use client';
import { format } from 'date-fns';
export function Header() {
  return <header>{format(new Date(), 'MMM d')}</header>;
}`,
        description: 'Header component also imports date-fns (duplication)',
      },
      {
        fileName: 'Footer.tsx',
        code: `'use client';
import { format } from 'date-fns';
export function Footer() {
  return <footer>© {format(new Date(), 'yyyy')}</footer>;
}`,
        description: 'Footer component also imports date-fns (duplication)',
      },
    ],
    context: {
      clientBundles: [
        { filePath: 'demo.tsx', chunks: ['date-fns.js', 'lodash.js', 'moment.js'] },
        { filePath: 'Header.tsx', chunks: ['date-fns.js'] },
        { filePath: 'Footer.tsx', chunks: ['date-fns.js'] },
      ],
    },
  });

  // Build files array for MultiFileCodeViewer
  const files: CodeFile[] = [
    {
      fileName: 'demo.tsx',
      code: scenario.code,
      editable: true, // ✅ Main file is editable
      description: 'Main component importing date-fns, lodash, and moment',
    },
    ...(scenario.contextFiles || []), // ✅ Context files are read-only by default
  ];

  // Real-time analysis function
  const handleAnalyze = async (
    fileName: string,
    code: string
  ): Promise<Array<Diagnostic | Suggestion>> => {
    // Call server-side LSP analysis API
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        fileName,
        scenario: scenario.id,
        context: scenario.context,
      }),
    });

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    const result = await response.json();
    return result.diagnostics || [];
  };

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <MultiFileCodeViewer
        files={files}
        enableRealTimeAnalysis={true} // ✅ Enable live analysis
        onAnalyze={handleAnalyze} // ✅ Analysis callback
        analysisDebounceMs={300} // ✅ Debounce delay
        initialFile="demo.tsx"
        onCodeChange={(fileName, newCode) => {
          console.log(`${fileName} changed:`, newCode.length, 'chars');
        }}
        onFileChange={(fileName) => {
          console.log('Switched to:', fileName);
        }}
      />
    </div>
  );
}

/**
 * Example: How to migrate from current DemoApp architecture
 *
 * Before (current DemoApp.tsx):
 * ```tsx
 * {activeTab === 'main' ? (
 *   <CodeEditor
 *     scenario={scenario}
 *     onAnalysisComplete={handleAnalysisComplete}
 *     diagnostics={diagnostics}
 *   />
 * ) : (
 *   <ContextTabs
 *     file={contextFiles[activeTab]}
 *     diagnostics={diagnostics}
 *   />
 * )}
 * ```
 *
 * After (with MultiFileCodeViewer):
 * ```tsx
 * <MultiFileCodeViewer
 *   files={[
 *     { fileName: 'demo.tsx', code: scenario.code, editable: true },
 *     ...scenario.contextFiles
 *   ]}
 *   enableRealTimeAnalysis={true}
 *   onAnalyze={async (fileName, code) => {
 *     const result = await fetch('/api/analyze', { ... });
 *     return result.diagnostics;
 *   }}
 * />
 * ```
 */

/**
 * Example: Mixed editable/read-only files
 */
export function MixedEditabilityExample() {
  const files: CodeFile[] = [
    {
      fileName: 'App.tsx',
      code: `'use client';\nexport function App() {\n  return <div>App</div>;\n}`,
      editable: true, // ✅ Editable
    },
    {
      fileName: 'utils.ts',
      code: `export function helper() {\n  return 42;\n}`,
      editable: true, // ✅ Also editable
    },
    {
      fileName: 'config.ts',
      code: `export const API_URL = 'https://api.example.com';`,
      editable: false, // ✅ Read-only (no ✎ icon)
    },
  ];

  return (
    <MultiFileCodeViewer
      files={files}
      enableRealTimeAnalysis={true}
      onAnalyze={async (fileName) => {
        // Only analyze the changed file
        console.log('Analyzing:', fileName);
        return []; // Return diagnostics
      }}
    />
  );
}

/**
 * Benefits of unified component:
 *
 * 1. **Simpler architecture**
 *    - One component instead of three (CodeEditor, ContextTabs, DemoApp tabs)
 *    - No manual state management for diagnostics
 *    - No manual tab switching logic
 *
 * 2. **More flexible**
 *    - Any number of files (not just 1 main + N context)
 *    - Any file can be editable
 *    - Mix editable and read-only files
 *
 * 3. **Better UX**
 *    - Analyzing indicator built-in
 *    - Consistent styling across all tabs
 *    - Smart package name highlighting everywhere
 *
 * 4. **Easier to maintain**
 *    - Single codebase for all code displays
 *    - Centralized diagnostic handling
 *    - Easier to add features (everyone benefits)
 *
 * 5. **Reusable**
 *    - Same component for demo, docs, landing pages
 *    - Turn off real-time analysis for static displays
 *    - Progressive enhancement (static → interactive)
 */
