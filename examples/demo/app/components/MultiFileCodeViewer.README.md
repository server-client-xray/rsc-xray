# MultiFileCodeViewer Component

A reusable, generic multi-file code viewer component with tab navigation, syntax highlighting, and diagnostic overlays.

## Overview

`MultiFileCodeViewer` is a React component built on CodeMirror 6 that displays multiple code files in a tabbed interface. It supports:

- **Tab Navigation**: Switch between multiple files
- **Syntax Highlighting**: TypeScript, JavaScript, JSX, TSX
- **Read-only or Editable**: Configure per file
- **Diagnostic Overlays**: Display errors/warnings from RSC X-Ray analyzer
- **Smart Highlighting**: Intelligent package name highlighting for imports
- **Responsive Design**: Adapts to light/dark mode

## Installation

The component is located in:

```
examples/demo/app/components/MultiFileCodeViewer.tsx
```

Dependencies (already in demo):

- `codemirror` (^6.0.2)
- `@codemirror/lang-javascript` (^6.2.4)
- `@codemirror/lint` (^6.8.5)
- `@rsc-xray/schemas` (workspace package)

## Basic Usage

```tsx
import { MultiFileCodeViewer } from './components/MultiFileCodeViewer';

function MyComponent() {
  const files = [
    {
      fileName: 'App.tsx',
      code: `export function App() {
  return <div>Hello World</div>;
}`,
      description: 'Main application component',
    },
    {
      fileName: 'utils.ts',
      code: `export function formatDate(date: Date) {
  return date.toISOString();
}`,
    },
  ];

  return <MultiFileCodeViewer files={files} />;
}
```

## API Reference

### Props

#### `files` (required)

Type: `CodeFile[]`

Array of code files to display. Each file has:

```typescript
interface CodeFile {
  fileName: string; // Displayed in tab (e.g., 'App.tsx')
  code: string; // File content
  description?: string; // Optional description above editor
  editable?: boolean; // Allow editing (default: false)
  language?: 'typescript' | 'javascript' | 'tsx' | 'jsx'; // Default: 'typescript'
}
```

#### `diagnostics` (optional)

Type: `Array<Diagnostic | Suggestion>`

Array of diagnostics to overlay on the code. From `@rsc-xray/schemas`:

```typescript
interface Diagnostic {
  rule: string;
  level: 'warn' | 'error';
  message: string;
  loc?: {
    file: string; // Must match fileName
    line: number; // 1-indexed
    col: number; // 1-indexed
  };
}
```

#### `initialFile` (optional)

Type: `string`

File name to show initially. Defaults to first file.

#### `onFileChange` (optional)

Type: `(fileName: string) => void`

Callback when user switches tabs.

#### `onCodeChange` (optional)

Type: `(fileName: string, code: string) => void`

Callback when editable file content changes.

## Use Cases

### 1. Documentation Examples

Display code examples with context:

```tsx
<MultiFileCodeViewer
  files={[
    { fileName: 'page.tsx', code: serverCode },
    { fileName: 'client.tsx', code: clientCode },
  ]}
  initialFile="client.tsx"
/>
```

### 2. Interactive Demos

Allow users to edit and see diagnostics:

```tsx
<MultiFileCodeViewer
  files={[{ fileName: 'demo.tsx', code: initialCode, editable: true }]}
  diagnostics={liveAnalysisResults}
  onCodeChange={handleCodeUpdate}
/>
```

### 3. Landing Pages

Show problems and solutions:

```tsx
// Before
<MultiFileCodeViewer
  files={[{ fileName: 'BadComponent.tsx', code: badCode }]}
  diagnostics={problems}
/>

// After
<MultiFileCodeViewer
  files={[{ fileName: 'GoodComponent.tsx', code: goodCode }]}
/>
```

### 4. Multi-file Context

Show how issues span multiple files:

```tsx
<MultiFileCodeViewer
  files={[
    { fileName: 'App.tsx', code: appCode, editable: true },
    { fileName: 'Header.tsx', code: headerCode },
    { fileName: 'Footer.tsx', code: footerCode },
  ]}
  diagnostics={allDiagnostics}
/>
```

## Styling

The component uses CSS modules with CSS variables for theming:

```css
/* Default variables (light mode) */
--color-bg-primary:
  #ffffff --color-bg-secondary: #f8f9fa --color-bg-tertiary: #f1f3f5 --color-text-primary: #212529
    --color-text-secondary: #6c757d --color-text-tertiary: #adb5bd --color-border: #dee2e6
    --font-mono: 'Monaco',
  'Menlo', monospace /* Dark mode (via @media prefers-color-scheme: dark) */;
```

To customize, override these CSS variables in your app.

## Features in Detail

### Smart Import Highlighting

For diagnostics with rules like `duplicate-dependencies` or `client-forbidden-import`, the component intelligently highlights **only the package name** (string literal) in import statements:

```tsx
import { foo } from 'date-fns'; // Only 'date-fns' is highlighted
                     ^^^^^^^^^^
```

### Editable Indicator

Files with `editable: true` show a pencil icon (✎) in the tab.

### Diagnostic Positioning

The component handles the conversion from 1-indexed LSP positions to 0-indexed CodeMirror positions, ensuring diagnostics appear at the correct location.

### File Matching

Diagnostics are matched to files using flexible logic:

- Exact match: `'App.tsx'` → `'App.tsx'`
- Path match: `'components/App.tsx'` → `'App.tsx'`
- Contains: Any path containing the file name

## Migration from Existing Components

### From `ContextTabs`

```tsx
// Before
<ContextTabs file={contextFile} diagnostics={diagnostics} />

// After
<MultiFileCodeViewer
  files={[contextFile]}
  diagnostics={diagnostics}
/>
```

### From `CodeEditor` + `ContextTabs`

```tsx
// Before
{
  activeTab === 'main' ? (
    <CodeEditor scenario={scenario} diagnostics={diagnostics} />
  ) : (
    <ContextTabs file={contextFile} diagnostics={diagnostics} />
  );
}

// After
<MultiFileCodeViewer
  files={[{ fileName: 'demo.tsx', code: scenario.code, editable: true }, ...scenario.contextFiles]}
  diagnostics={diagnostics}
  onCodeChange={handleCodeChange}
/>;
```

## Examples

See `MultiFileCodeViewer.example.tsx` for complete, runnable examples including:

1. **SimpleExample**: Basic read-only viewer
2. **EditableWithDiagnosticsExample**: Editable with warnings
3. **MultiFileContextExample**: Context files (duplicate-dependencies)
4. **LandingPageExample**: Marketing use case

## Future Enhancements

Potential additions (not yet implemented):

- [ ] Line highlighting (for deep linking)
- [ ] Diff view (compare before/after)
- [ ] Search within files
- [ ] Minimap for large files
- [ ] Collapsible file tree (for many files)
- [ ] Export/copy code functionality
- [ ] Language auto-detection from file extension
- [ ] Custom themes beyond light/dark

## Contributing

When enhancing this component:

1. **Maintain backward compatibility** - it's used across the app
2. **Update examples** - add new use cases to `.example.tsx`
3. **Document new props** - update this README
4. **Test with diagnostics** - ensure positioning works correctly
5. **Check mobile** - ensure responsive design

## License

Same as the RSC X-Ray project (MIT).
