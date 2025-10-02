# @rsc-xray/analyzer

## 1.0.0

### Major Changes

- 3ac473a: BREAKING: Refactor diagnostic location schema to use character offset ranges
  - Changed `DiagnosticLocation` from `{ file, line, col }` to `{ file, range: { from, to } }`
  - All analyzer rules now use AST node positions for precise highlighting
  - Added `diagnosticHelpers.ts` with `createLocationFromNode()` and related utilities
  - Updated CLI, report-html, and lsp-server to use new range format
  - Demo CodeMirror integration simplified with direct range consumption

  **Migration guide:**
  - Replace `diagnostic.loc.line` / `.loc.col` with `diagnostic.loc.range.from` / `.range.to`
  - Character offsets are 0-indexed (use `sourceFile.getLineAndCharacterOfPosition()` if line/col needed)
  - Benefits: More precise highlighting, no client-side heuristics, cleaner schema

### Patch Changes

- Updated dependencies [3ac473a]
  - @rsc-xray/schemas@1.0.0

## 0.7.2

### Patch Changes

- a0b7039: Add TypeScript as runtime dependency

  TypeScript is now a runtime dependency of @rsc-xray/analyzer since it imports and uses the TypeScript compiler API at runtime. This fixes deployment issues in environments like Vercel where workspace dependencies aren't available.

- 734d89e: fix(analyzer): Use AST positions for client-size diagnostics

  Fixed duplicate-dependencies and client-component-oversized diagnostics to use actual AST positions instead of hardcoded line 1, col 1. Now correctly points to the first import statement regardless of 'use client' directives or comments above.
  - @rsc-xray/schemas@0.7.2

## 0.7.1

### Patch Changes

- fix(analyzer): Use AST positions for client-size diagnostics

  Fixed duplicate-dependencies and client-component-oversized diagnostics to use actual AST positions instead of hardcoded line 1, col 1. Now correctly points to the first import statement regardless of 'use client' directives or comments above.
  - @rsc-xray/schemas@0.7.1

## 0.7.0

### Minor Changes

- 26837e7: Improve route-segment-config diagnostic positioning

  Diagnostics now point to actual export statements instead of hardcoded `line: 1, col: 1`.
  - Enhanced `parseRouteSegmentConfig` to track AST nodes for each config option
  - New `getLocation` helper converts AST nodes to accurate line/col positions
  - Updated `detectConfigConflicts` to use node positions for all diagnostics
  - All 190 tests passing with no behavior changes

  Result: Users see diagnostics on the exact problematic export statement (e.g., `export const dynamic = 'force-dynamic'`) instead of always pointing to the first line.

### Patch Changes

- 46383c4: Fix ES module imports by adding .js extensions to all relative imports/exports. This resolves module resolution errors when importing the package in Node.js environments.
- 46383c4: Fix final missing .js extension in ES module import (clientForbiddenImports). This completes the ES module migration and resolves all Node.js module resolution errors.
  - @rsc-xray/schemas@0.7.0

## 0.6.4

### Patch Changes

- d8b2964: Fix missing .js extensions in clientForbiddenImports.ts for classify imports. Completes ES module migration.
  - @rsc-xray/schemas@0.6.4

## 0.6.3

### Patch Changes

- 11af651: Fix ES module imports by adding .js extensions to all relative imports/exports. This resolves module resolution errors when importing the package in Node.js environments.
- 262dc52: Fix final missing .js extension in ES module import (clientForbiddenImports). This completes the ES module migration and resolves all Node.js module resolution errors.
  - @rsc-xray/schemas@0.6.3

## 0.6.2

### Patch Changes

- 5bf8225: Fix ES module imports by adding .js extensions to all relative imports/exports. This resolves module resolution errors when importing the package in Node.js environments.
  - @rsc-xray/schemas@0.6.2

## 0.6.1

### Patch Changes

- chore: align versions after incorrect publish

  Fixed version mismatch between repository and npm registry.
  All packages bumped to 0.6.1 to maintain consistency.

- Updated dependencies
  - @rsc-xray/schemas@0.6.1

## 0.6.0

### Minor Changes

- cfad577: feat(analyzer): add clean LSP API for real-time single-file analysis

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

- a6bc3fd: feat: Export LSP types and all analyzer rules for Pro LSP server integration
  - Export all analyzer rule functions for Pro LSP server
  - Add LSP diagnostic schema and types to schemas package
  - Create lsp-client package with mock and HTTP implementations
  - Enable real-time LSP analysis for demo and VS Code integration

  This is a breaking change for consumers expecting private APIs, but all new exports are intentional for LSP integration.

### Patch Changes

- Updated dependencies [a6bc3fd]
  - @rsc-xray/schemas@0.6.0

## 0.5.0

### Minor Changes

- feat: Export LSP types and all analyzer rules for Pro LSP server integration
  - Export all analyzer rule functions for Pro LSP server
  - Add LSP diagnostic schema and types to schemas package
  - Create lsp-client package with mock and HTTP implementations
  - Enable real-time LSP analysis for demo and VS Code integration

  This is a breaking change for consumers expecting private APIs, but all new exports are intentional for LSP integration.

### Patch Changes

- Updated dependencies
  - @rsc-xray/schemas@0.5.0

## 0.4.0

### Minor Changes

- 9d5ace3: Complete T4.2 Static/Dynamic Route Detector with comprehensive integration test fixtures
  - Add 12 new integration test fixtures for static/dynamic route classification
  - Total: 19 analyzeProject integration tests (7 original + 12 new)
  - All route types correctly classified with appropriate cache metadata

  Fixtures cover:
  - Pure static routes (no dynamic APIs)
  - ISR routes with revalidate export
  - Dynamic routes (cookies(), headers(), noStore())
  - Force-static and force-dynamic exports
  - Mixed routes (static + dynamic + ISR)
  - Nested dynamic API calls in helper functions
  - Conditional dynamic API calls
  - ISR + dynamic export conflicts (dynamic wins)

  Future enhancement: searchParams prop detection

### Patch Changes

- @rsc-xray/schemas@0.4.0

## 0.3.0

### Minor Changes

- M4 Analyzer Features: Suspense boundary analysis, client size thresholds, React 19 cache() detection

  ## New Analyzer Rules (T4.5, T4.6, T4.7)

  ### Suspense Boundary Analysis (T4.5)
  - `suspense-boundary-missing`: Detect async server components without Suspense boundaries
  - `suspense-boundary-opportunity`: Suggest parallel streaming for multiple awaits

  ### Client Component Size Warnings (T4.6)
  - `client-component-oversized`: Warn when components exceed 50KB threshold (configurable)
  - `duplicate-dependencies`: Identify shared chunks across client islands

  ### React 19 cache() API Detector (T4.7)
  - `react19-cache-opportunity`: Suggest migration from Map/WeakMap caching and duplicate fetch calls to React 19 cache() API
  - Version-aware: only suggests for React 19+ projects

  ## Test Coverage
  - 56 new tests added (92 total analyzer tests)
  - 100% coverage for all new rules

  ## Documentation
  - Updated VIOLATIONS.md with 5 new rules
  - Enhanced README with feature descriptions and diagnostics details
  - Fixed CI badge (ci-release.yml)

### Patch Changes

- @rsc-xray/schemas@0.3.0

## 0.2.5

### Patch Changes

- 58869ea: Consolidate CI/CD workflows and improve repository configuration
  - Unified ci.yml and publish.yml into single ci-release.yml workflow
  - Clear job dependencies: lint-and-format + test → build → publish
  - Updated TypeScript to 5.6.2 and Vitest to 3.2.4
  - Added package descriptions for better npm registry display
  - Configured Dependabot for automated dependency updates
  - Added .nvmrc for Node.js version consistency

- Updated dependencies [58869ea]
  - @rsc-xray/schemas@0.2.5

## 0.2.4

### Patch Changes

- 2e28eef: Configuration and tooling improvements: upgraded TypeScript to 5.6.2, Vitest to 3.2.4, standardized dependencies, added Prettier config, security scanning, and developer tools
- Updated dependencies [2e28eef]
  - @rsc-xray/schemas@0.2.4

## 0.2.3

### Patch Changes

- 3ba7be0: Release: align docs & features; dynamic detection improvements
  - Analyzer: infer dynamic via cookies/headers/noStore + dynamic import patterns
  - CLI/Report: align with analyzer updates
  - Docs: example and cross-links polished

- Updated dependencies [3ba7be0]
  - @rsc-xray/schemas@0.2.3

## 0.2.2

### Patch Changes

- edefd17: Release: align docs & features; dynamic detection improvements
  - Analyzer: infer dynamic via cookies/headers/noStore + dynamic import patterns
  - CLI/Report: align with analyzer updates
  - Docs: example and cross-links polished

- Updated dependencies [edefd17]
  - @rsc-xray/schemas@0.2.2

## 0.2.1

### Patch Changes

- 610e586: chore(docs): add npm badges to package READMEs and keywords to manifests for improved discovery; include updated README content in published tarballs.
- Updated dependencies [610e586]
  - @rsc-xray/schemas@0.2.1

## 0.2.0

### Minor Changes

- Expand cache metadata to capture route dynamic/ISR semantics, surface the data in the CLI/report, and expose policy hints for cache lens consumers.

### Patch Changes

- Updated dependencies
  - @rsc-xray/schemas@0.2.0

## 0.1.2

### Patch Changes

- Add JSON import assertion for schema exports so Node ESM consumers work without flags.
- Updated dependencies
  - @rsc-xray/schemas@0.1.2

## 0.1.1

### Patch Changes

- Fix schema package exports to use explicit .js extension for Node ESM consumers.
- Updated dependencies
  - @rsc-xray/schemas@0.1.1

## 0.1.0

### Minor Changes

- 999c091: Initial release under the `@rsc-xray` scope.

### Patch Changes

- Updated dependencies [999c091]
  - @rsc-xray/schemas@0.1.0
