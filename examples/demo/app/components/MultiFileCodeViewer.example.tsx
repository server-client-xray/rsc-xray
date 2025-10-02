/**
 * Usage examples for MultiFileCodeViewer component
 *
 * This file demonstrates various use cases for the reusable multi-file code viewer.
 */

import { MultiFileCodeViewer, type CodeFile } from './MultiFileCodeViewer';
import type { Diagnostic } from '@rsc-xray/schemas';

// Example 1: Simple read-only viewer with multiple files
export function SimpleExample() {
  const files: CodeFile[] = [
    {
      fileName: 'App.tsx',
      code: `export function App() {
  return <div>Hello World</div>;
}`,
      description: 'Main application component',
    },
    {
      fileName: 'utils.ts',
      code: `export function formatDate(date: Date): string {
  return date.toISOString();
}`,
      description: 'Utility functions',
    },
  ];

  return <MultiFileCodeViewer files={files} />;
}

// Example 2: Editable files with diagnostics
export function EditableWithDiagnosticsExample() {
  const files: CodeFile[] = [
    {
      fileName: 'Component.tsx',
      code: `'use client';
import { useState } from 'react';

export function Component() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}`,
      editable: true,
      description: 'Editable component with diagnostics',
    },
  ];

  const diagnostics: Diagnostic[] = [
    {
      rule: 'example-rule',
      level: 'warn',
      message: 'Consider using useCallback for the onClick handler',
      loc: {
        file: 'Component.tsx',
        range: { from: 150, to: 180 }, // Approximate position of onClick handler
      },
    },
  ];

  return (
    <MultiFileCodeViewer
      files={files}
      diagnostics={diagnostics}
      onCodeChange={(fileName, code) => {
        console.log(`${fileName} changed:`, code);
      }}
    />
  );
}

// Example 3: Multi-file with context (like duplicate-dependencies demo)
export function MultiFileContextExample() {
  const files: CodeFile[] = [
    {
      fileName: 'App.tsx',
      code: `'use client';
import { format } from 'date-fns';

export function App() {
  return <div>{format(new Date(), 'PPP')}</div>;
}`,
      editable: true,
      description: 'Main app component importing date-fns',
    },
    {
      fileName: 'Header.tsx',
      code: `'use client';
import { format } from 'date-fns';

export function Header() {
  return <header>{format(new Date(), 'MMM d')}</header>;
}`,
      description: 'Header also imports date-fns (duplication)',
    },
    {
      fileName: 'Footer.tsx',
      code: `'use client';
import { format } from 'date-fns';

export function Footer() {
  return <footer>© {format(new Date(), 'yyyy')}</footer>;
}`,
      description: 'Footer also imports date-fns (duplication)',
    },
  ];

  const diagnostics: Diagnostic[] = [
    {
      rule: 'duplicate-dependencies',
      level: 'warn',
      message: "'date-fns' is duplicated across multiple components",
      loc: { file: 'App.tsx', range: { from: 50, to: 60 } },
    },
    {
      rule: 'duplicate-dependencies',
      level: 'warn',
      message: "'date-fns' is duplicated across multiple components",
      loc: { file: 'Header.tsx', range: { from: 40, to: 50 } },
    },
    {
      rule: 'duplicate-dependencies',
      level: 'warn',
      message: "'date-fns' is duplicated across multiple components",
      loc: { file: 'Footer.tsx', range: { from: 45, to: 55 } },
    },
  ];

  return (
    <MultiFileCodeViewer
      files={files}
      diagnostics={diagnostics}
      initialFile="App.tsx"
      onFileChange={(fileName) => {
        console.log('Switched to:', fileName);
      }}
    />
  );
}

// Example 4: For use in marketing/landing pages
export function LandingPageExample() {
  const files: CodeFile[] = [
    {
      fileName: 'page.tsx',
      code: `import { UserProfile } from './UserProfile';

export default function Page() {
  return <UserProfile userId="123" />;
}`,
      language: 'tsx',
    },
    {
      fileName: 'UserProfile.tsx',
      code: `'use client';
import { db } from './db'; // ❌ Client component importing server code

export function UserProfile({ userId }: { userId: string }) {
  const user = db.users.get(userId);
  return <div>{user.name}</div>;
}`,
      language: 'tsx',
    },
  ];

  const diagnostics: Diagnostic[] = [
    {
      rule: 'client-forbidden-import',
      level: 'error',
      message: "Client components must not import './db'",
      loc: { file: 'UserProfile.tsx', range: { from: 30, to: 36 } },
    },
  ];

  return (
    <MultiFileCodeViewer files={files} diagnostics={diagnostics} initialFile="UserProfile.tsx" />
  );
}
