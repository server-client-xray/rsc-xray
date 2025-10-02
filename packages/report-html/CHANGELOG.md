# @rsc-xray/report-html

## 0.7.2

### Patch Changes

- @rsc-xray/schemas@0.7.2

## 0.7.1

### Patch Changes

- @rsc-xray/schemas@0.7.1

## 0.7.0

### Patch Changes

- @rsc-xray/schemas@0.7.0

## 0.6.4

### Patch Changes

- @rsc-xray/schemas@0.6.4

## 0.6.3

### Patch Changes

- @rsc-xray/schemas@0.6.3

## 0.6.2

### Patch Changes

- @rsc-xray/schemas@0.6.2

## 0.6.1

### Patch Changes

- chore: align versions after incorrect publish

  Fixed version mismatch between repository and npm registry.
  All packages bumped to 0.6.1 to maintain consistency.

- Updated dependencies
  - @rsc-xray/schemas@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [a6bc3fd]
  - @rsc-xray/schemas@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies
  - @rsc-xray/schemas@0.5.0

## 0.4.0

### Patch Changes

- @rsc-xray/schemas@0.4.0

## 0.3.0

### Patch Changes

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
