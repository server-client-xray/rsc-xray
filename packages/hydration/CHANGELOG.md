# @rsc-xray/hydration

## 0.6.2

## 0.6.1

### Patch Changes

- chore: align versions after incorrect publish

  Fixed version mismatch between repository and npm registry.
  All packages bumped to 0.6.1 to maintain consistency.

## 0.6.0

## 0.5.0

## 0.4.0

## 0.3.0

## 0.2.5

### Patch Changes

- 58869ea: Consolidate CI/CD workflows and improve repository configuration
  - Unified ci.yml and publish.yml into single ci-release.yml workflow
  - Clear job dependencies: lint-and-format + test → build → publish
  - Updated TypeScript to 5.6.2 and Vitest to 3.2.4
  - Added package descriptions for better npm registry display
  - Configured Dependabot for automated dependency updates
  - Added .nvmrc for Node.js version consistency

## 0.2.4

### Patch Changes

- 2e28eef: Configuration and tooling improvements: upgraded TypeScript to 5.6.2, Vitest to 3.2.4, standardized dependencies, added Prettier config, security scanning, and developer tools

## 0.2.3

### Patch Changes

- 3ba7be0: Release: align docs & features; dynamic detection improvements
  - Analyzer: infer dynamic via cookies/headers/noStore + dynamic import patterns
  - CLI/Report: align with analyzer updates
  - Docs: example and cross-links polished

## 0.2.2

### Patch Changes

- edefd17: Release: align docs & features; dynamic detection improvements
  - Analyzer: infer dynamic via cookies/headers/noStore + dynamic import patterns
  - CLI/Report: align with analyzer updates
  - Docs: example and cross-links polished

## 0.2.1

### Patch Changes

- 610e586: chore(docs): add npm badges to package READMEs and keywords to manifests for improved discovery; include updated README content in published tarballs.

## 0.2.0

## 0.1.2

### Patch Changes

- Add JSON import assertion for schema exports so Node ESM consumers work without flags.

## 0.1.1

### Patch Changes

- Fix schema package exports to use explicit .js extension for Node ESM consumers.

## 0.1.0

### Minor Changes

- 999c091: Initial release under the `@rsc-xray` scope.
