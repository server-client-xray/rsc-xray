---
'@rsc-xray/analyzer': minor
---

feat(analyzer): add clean LSP API for real-time single-file analysis

BREAKING CHANGE: New LSP-friendly API added for editor and LSP server integration

- **New exports:**
  - `analyzeLspRequest()` - Main LSP analysis function
  - `analyzeScenario()` - Convenience wrapper for single scenario
  - `createSourceFile()` - Create TypeScript SourceFile from code string
  - `shouldAnalyzeFile()` - Helper to determine file applicability
  - `LspAnalysisRequest` and `LspAnalysisResponse` interfaces

- **Features:**
  - Accepts code strings instead of file paths
  - Works without file system or full project context
  - Supports all analyzer rules (serialization, suspense, cache, etc.)
  - Optional scenario and rule filtering
  - Performance tracking (duration in ms)
  - Graceful error handling per rule

- **Use cases:**
  - LSP servers for real-time diagnostics
  - VS Code extension integration
  - Online code playgrounds
  - CI/CD single-file checks

**Example:**

```typescript
import { analyzeLspRequest } from '@rsc-xray/analyzer';

const result = analyzeLspRequest({
  code: 'export default function Page() { ... }',
  fileName: 'app/page.tsx',
  scenario: 'serialization-boundary',
});

console.log(result.diagnostics); // Array of diagnostics/suggestions
console.log(result.duration); // Analysis time in ms
```

This enables the Pro LSP server to provide instant feedback without adapters or workarounds.
