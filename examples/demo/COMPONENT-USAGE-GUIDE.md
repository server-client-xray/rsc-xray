# Component Usage Guide

This guide explains when to use each code viewer component in the demo and across the RSC X-Ray project.

## Components Overview

### 1. `MultiFileCodeViewer` (New - Reusable)

**Location**: `app/components/MultiFileCodeViewer.tsx`

**Purpose**: Generic, reusable multi-file code viewer for **static/read-only** displays.

**Best for**:

- ✅ Landing pages showing code examples
- ✅ Documentation with multi-file examples
- ✅ Marketing materials
- ✅ Blog posts with code snippets
- ✅ Read-only context files in demos
- ✅ Before/after comparisons

**Features**:

- Tab navigation
- Syntax highlighting
- Diagnostic overlays
- Read-only OR editable
- Simple API
- No server dependencies

**When to use**:

```tsx
// Static multi-file display with diagnostics
<MultiFileCodeViewer
  files={[
    { fileName: 'App.tsx', code: appCode },
    { fileName: 'utils.ts', code: utilsCode },
  ]}
  diagnostics={staticDiagnostics}
/>
```

---

### 2. `CodeEditor` (Demo-specific)

**Location**: `app/components/CodeEditor.tsx`

**Purpose**: **Interactive, real-time** editor with live LSP analysis.

**Best for**:

- ✅ Interactive demo scenarios
- ✅ Live code editing with instant feedback
- ✅ Real-time LSP analysis via API
- ✅ Deep linking with line highlighting
- ✅ Debounced analysis on code changes

**Features**:

- Full CodeMirror editor
- Real-time API calls to `/api/analyze`
- Debounced analysis (300ms)
- Line highlighting for URLs
- Status updates (analyzing/idle/error)

**When to use**:

```tsx
// Interactive editing with live analysis
<CodeEditor scenario={scenario} highlightLine={lineNumber} onAnalysisComplete={handleAnalysis} />
```

---

### 3. `ContextTabs` (Demo-specific - Legacy)

**Location**: `app/components/ContextTabs.tsx`

**Purpose**: Display **single read-only context file** with diagnostics.

**Status**: ⚠️ **Consider deprecating** - use `MultiFileCodeViewer` instead

**Migration**:

```tsx
// Before
<ContextTabs file={contextFile} diagnostics={diagnostics} />

// After (recommended)
<MultiFileCodeViewer
  files={[contextFile]}
  diagnostics={diagnostics}
/>
```

---

### 4. `DemoApp` (Demo orchestration)

**Location**: `app/components/DemoApp.tsx`

**Purpose**: Orchestrates the demo flow with tabs, analysis, and state management.

**Current architecture**:

- Uses `CodeEditor` for main editable tab
- Uses `ContextTabs` for read-only context files
- Manages diagnostics state
- Handles tab switching

**Potential refactor** (future):
Could use `MultiFileCodeViewer` but would need:

- Integration with real-time analysis
- Handling of editable vs read-only files
- API call logic for code changes
- Status bar updates

---

## Decision Matrix

| Use Case                     | Component             | Reason                    |
| ---------------------------- | --------------------- | ------------------------- |
| Landing page code example    | `MultiFileCodeViewer` | Static, no API needed     |
| Documentation multi-file     | `MultiFileCodeViewer` | Read-only, clean API      |
| Marketing before/after       | `MultiFileCodeViewer` | Simple, reusable          |
| Interactive demo (main file) | `CodeEditor`          | Real-time analysis needed |
| Demo context files           | `MultiFileCodeViewer` | Read-only, diagnostics    |
| Blog post with diagnostics   | `MultiFileCodeViewer` | Self-contained            |
| GitHub README examples       | `MultiFileCodeViewer` | Portable                  |

---

## VSCode Extension Considerations

### Will you have the same diagnostic positioning issues?

**Short answer**: **No, VSCode is easier!**

### Why the current implementation was complex:

1. **CodeMirror-specific**:
   - Manual position conversion (1-indexed LSP → 0-indexed CM)
   - Manual line/column calculations
   - Custom diagnostic rendering
   - String matching for package names

2. **Server-side analysis**:
   - Demo runs analyzer on server (Next.js API route)
   - Returns diagnostics via HTTP
   - Client must render them manually

3. **Multi-file coordination**:
   - Passing diagnostics between components
   - Filtering by file name
   - Tab state management

### Why VSCode extension will be simpler:

1. **Native LSP support**:

   ```typescript
   // VSCode handles everything!
   vscode.languages.registerDiagnosticProvider('typescript', {
     provideDiagnostics(document) {
       return diagnostics; // VSCode renders them automatically
     },
   });
   ```

2. **Built-in diagnostics**:
   - VSCode automatically renders squiggles
   - Hover tooltips work out-of-box
   - Position conversion handled by VSCode
   - Multi-file just works (workspace-aware)

3. **No manual rendering**:

   ```typescript
   // You just provide diagnostics in LSP format
   const diagnostic = new vscode.Diagnostic(
     range, // VSCode Range object
     message,
     severity // VSCode DiagnosticSeverity enum
   );

   diagnosticCollection.set(document.uri, [diagnostic]);
   // Done! VSCode renders it.
   ```

4. **File system access**:
   - Read all files directly (no server needed)
   - Workspace-aware analysis
   - Watch for changes automatically

### VSCode Extension Architecture (Recommended)

```typescript
// 1. Register diagnostic provider
export function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('rsc-xray');

  // 2. Analyze on save or change
  vscode.workspace.onDidSaveTextDocument(async (document) => {
    if (document.languageId === 'typescript' || document.languageId === 'typescriptreact') {
      const diagnostics = await analyzeDocument(document);
      diagnosticCollection.set(document.uri, diagnostics);
    }
  });
}

async function analyzeDocument(document: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
  // Use @rsc-xray/analyzer directly (Node.js environment)
  const result = await analyze({
    code: document.getText(),
    fileName: document.fileName,
    // ... context from workspace
  });

  // Convert to VSCode Diagnostic format
  return result.diagnostics.map((d) => {
    const range = new vscode.Range(
      d.loc.line - 1, // Convert to 0-indexed
      d.loc.col - 1,
      d.loc.line - 1,
      d.loc.col + 10 // Approximate length
    );

    return new vscode.Diagnostic(
      range,
      d.message,
      d.level === 'error' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning
    );
  });
}
```

### Key differences from demo:

| Aspect               | Demo (CodeMirror)     | VSCode Extension   |
| -------------------- | --------------------- | ------------------ |
| Diagnostic rendering | Manual                | Automatic          |
| Position conversion  | Custom logic          | VSCode API         |
| File access          | Server API            | Direct filesystem  |
| Multi-file           | Manual coordination   | Built-in workspace |
| Hover tooltips       | CodeMirror extension  | Built-in           |
| Quick fixes          | Custom implementation | CodeActionProvider |
| Performance          | HTTP overhead         | Native             |

### What you'll still need to handle:

1. **Context gathering** (like current analyzer):
   - Find all client components in workspace
   - Build client bundles map
   - Detect route configs
   - ✅ Same logic as analyzer, just read from disk

2. **Workspace analysis** (new capability):
   - Analyze multiple files at once
   - Cross-file references
   - Project-wide patterns
   - ✅ Much easier than in web demo!

3. **Configuration**:
   - User settings (thresholds, rules)
   - Ignore patterns
   - Framework detection
   - ✅ Use VSCode settings API

### Recommended VSCode Extension structure:

```
rsc-xray-vscode/
├── src/
│   ├── extension.ts           # Entry point
│   ├── diagnosticProvider.ts  # Main logic
│   ├── codeActionProvider.ts  # Quick fixes
│   ├── hoverProvider.ts       # Hover tooltips
│   ├── utils/
│   │   ├── workspace.ts       # Workspace analysis
│   │   └── config.ts          # Settings
│   └── test/
├── package.json               # VSCode extension manifest
└── README.md
```

### Dependencies:

```json
{
  "dependencies": {
    "@rsc-xray/analyzer": "^0.7.2", // ✅ Reuse existing analyzer!
    "@rsc-xray/schemas": "^0.7.2"
  },
  "devDependencies": {
    "@types/vscode": "^1.80.0",
    "typescript": "^5.0.0"
  }
}
```

### Summary:

**Demo complexity** was due to:

- Web environment (no filesystem)
- Manual rendering (CodeMirror)
- Server/client split
- Custom position math

**VSCode extension** will be **much simpler** because:

- Native LSP support
- Direct file access
- Automatic rendering
- Built-in multi-file

**Reusable parts**:

- ✅ `@rsc-xray/analyzer` (core logic)
- ✅ `@rsc-xray/schemas` (types)
- ✅ Rule detection algorithms
- ❌ Demo UI components (web-specific)

---

## Future: Unified Architecture?

Potential future refactor for the demo:

1. **Use `MultiFileCodeViewer` everywhere**
2. **Add real-time analysis prop**:
   ```tsx
   <MultiFileCodeViewer
     files={files}
     enableRealTimeAnalysis={true}
     onAnalyze={async (code) => {
       const result = await fetch('/api/analyze', { ... });
       return result.diagnostics;
     }}
   />
   ```
3. **Deprecate `CodeEditor` and `ContextTabs`**
4. **Simplify `DemoApp`**

Benefits:

- Single component to maintain
- Consistent UX across all code displays
- Easier to add new features
- Reusable in docs/marketing

**Not urgent** - current implementation works well!

---

## Questions?

- How to migrate a scenario? See `MultiFileCodeViewer.example.tsx`
- How to add new features? See `MultiFileCodeViewer.README.md`
- How to contribute? Follow existing patterns and update docs
