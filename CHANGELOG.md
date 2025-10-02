# Changelog

All notable changes to RSC X‑Ray will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Interactive demo at demo.rsc-xray.dev with live code editing and diagnostics
- Comprehensive CONTRIBUTING.md guide for open-source contributors
- Improved README with M4 features and demo link

## [0.7.2] - 2025-10-02

### Added

- **Route segment config analyzer** — Parse and validate route segment config options (`dynamic`, `revalidate`, `fetchCache`, `runtime`, `preferredRegion`)
- **Serialization boundary validation** — Detect non-serializable props passed from server to client (functions, Dates, class instances, Symbols)
- **React 19 cache() API detector** — Identify opportunities to migrate manual deduplication to React 19 `cache()`
- **Client component size thresholds** — Alert on oversized client islands (>50KB threshold)
- **Duplicate dependency detection** — Find shared dependencies across client islands
- **Suspense boundary analyzer** — Detect missing Suspense boundaries and parallel streaming opportunities
- **Static/dynamic route classification** — Analyze route rendering strategies with cache metadata

### Fixed

- Diagnostic positioning now uses AST for accurate line/column numbers
- TypeScript added as runtime dependency in analyzer for Vercel deployments

### Changed

- Improved demo with Pro feature teasers (visual replicas with static data)
- Enhanced diagnostic messages with actionable guidance

## [0.7.1] - 2025-09-30

### Added

- LSP server package (`@rsc-xray/lsp-server`) for browser-side analysis
- Demo application with CodeMirror integration and server-side LSP
- Deep linking support for demo scenarios (`?scenario=...&line=...`)
- E2E tests with Playwright for demo application

### Fixed

- Vercel deployment configuration for standalone demo
- React 19 RC type compatibility issues

## [0.6.5] - 2025-09-25

### Added

- Hydration timing telemetry with Performance API integration
- Waterfall detector for sequential data fetches
- Cache lens with tag/path revalidation visualization
- Flight tap production support with graceful degradation

### Changed

- Updated all OSS packages to use proper ESM `.js` extensions
- Migrated to unified `ci-release.yml` workflow

## [0.2.5] - 2025-09-30

### Added

- Comprehensive repository configuration improvements
- Dependabot for automated dependency updates
- Pre-push hooks for local build verification
- Issue and PR templates

### Fixed

- TypeScript version alignment across all packages (5.6.2)
- Workspace configuration includes all packages
- Prettier configuration for OSS repository

## [0.1.2] - 2025-09-25

### Fixed

- ESM imports now include `.js` extensions for Node.js compatibility
- JSON imports use proper assertions for Next.js/Node.js compatibility

### Changed

- Pro packages now reference published OSS packages from npm

## [0.1.0] - 2025-09-23

### Added

- Initial public release
- Core analyzer with server/client boundary detection
- Forbidden import rules for client components
- CLI tool for analyze and report generation
- HTML report generator with offline support
- JSON schema validation for model output
- Example Next.js application with demo scenarios
- Basic documentation (QUICKSTART, WORKFLOWS, VIOLATIONS)

### Features

- Detect `'use client'` boundaries
- Analyze Suspense boundaries
- Calculate bundle bytes per client island
- Detect forbidden Node.js API usage in client components
- Generate suggestions (hoist fetch, parallelize awaits)
- Export JSON model and HTML report
- Flight tap for capturing RSC streaming data

---

## Release Notes

For detailed release information, see [GitHub Releases](https://github.com/rsc-xray/rsc-xray/releases).

## Upgrade Guides

### 0.7.x → 0.8.x (Upcoming)

TBD

### 0.6.x → 0.7.x

- New analyzer rules may surface previously undetected issues
- No breaking changes to API or CLI commands
- Model JSON schema extended with new diagnostic types

### 0.1.x → 0.2.x

- ESM imports now require `.js` extensions
- Update imports: `import { foo } from './bar'` → `import { foo } from './bar.js'`

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on proposing changes.

## Deprecation Policy

- Features marked as deprecated will be removed in the next major version
- Major version bumps follow semantic versioning (breaking changes)
- Minor and patch versions maintain backward compatibility
