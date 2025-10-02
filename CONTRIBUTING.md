# Contributing to RSC X‑Ray

Thank you for your interest in contributing to RSC X‑Ray! This document provides guidelines and instructions for contributing to the open-source analyzer and tooling.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)

---

## Code of Conduct

We expect all contributors to be respectful and constructive. Please:

- Be welcoming to newcomers
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community

---

## Getting Started

### Prerequisites

- **Node.js**: v18+ (LTS recommended)
- **pnpm**: v8+ (via corepack)
- **Git**: v2.x+

### Initial Setup

1. **Fork and clone the repository:**

```bash
git clone https://github.com/YOUR_USERNAME/rsc-xray.git
cd rsc-xray
```

2. **Enable corepack and install dependencies:**

```bash
corepack enable
corepack pnpm install
```

3. **Build all packages:**

```bash
pnpm -r build
```

4. **Run tests to verify setup:**

```bash
pnpm -r test
```

### Repository Structure

```
rsc-xray/
├── packages/
│   ├── analyzer/       # Core analysis engine
│   ├── cli/            # Command-line interface
│   ├── schemas/        # TypeScript types & JSON schemas
│   ├── lsp-server/     # Browser-side LSP wrapper
│   ├── hydration/      # Hydration timing utilities
│   └── report-html/    # HTML report generator
├── examples/
│   ├── next-app/       # Test Next.js application
│   └── demo/           # Interactive web demo
└── docs/               # Documentation
```

---

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

- Write clear, focused commits
- Include tests for new features
- Update documentation as needed
- Follow the existing code style

### 3. Test Your Changes

```bash
# Run all tests
pnpm -r test

# Run specific package tests
pnpm -F @rsc-xray/analyzer test

# Run linter
pnpm lint

# Check formatting
pnpm format:check
```

### 4. Build to Verify

```bash
# Build all packages
pnpm -r build

# Test with example app
pnpm -C examples/next-app build
pnpm -F @rsc-xray/cli analyze --project ./examples/next-app
```

---

## Testing

### Unit Tests

We use **Vitest** for unit testing. Test files should be co-located with source:

```
src/
  rules/
    suspenseBoundary.ts
    __tests__/
      suspenseBoundary.test.ts
```

### Test Guidelines

- **Coverage**: Aim for >80% coverage on new code
- **Fixtures**: Use small, focused test fixtures in `__tests__/fixtures/`
- **Snapshots**: Use snapshots for model.json and report output
- **Naming**: Describe what the test validates (e.g., `should detect missing Suspense boundary`)

### Running Tests

```bash
# Watch mode (during development)
pnpm -F @rsc-xray/analyzer test

# Run once (CI mode)
pnpm -F @rsc-xray/analyzer test -- --run

# Update snapshots (when intentionally changed)
pnpm -F @rsc-xray/analyzer test -- -u
```

### E2E Tests

The interactive demo has Playwright tests:

```bash
cd examples/demo
pnpm test:e2e
```

---

## Code Style

### TypeScript

- **Strict mode enabled** — No `any`, use `unknown` if needed
- **Explicit return types** for all exported functions
- **Interfaces over type aliases** for object shapes
- **ESM imports** — Use `.js` extensions in imports

### Code Formatting

We use **Prettier** and **ESLint**:

```bash
# Auto-format
pnpm format

# Check formatting
pnpm format:check

# Lint
pnpm lint
```

### Naming Conventions

- **Files**: `camelCase.ts` for utilities, `PascalCase.tsx` for components
- **Functions**: `camelCase` (e.g., `detectSuspenseBoundaryIssues`)
- **Interfaces**: `PascalCase` (e.g., `DiagnosticRule`)
- **Constants**: `UPPER_SNAKE_CASE` for true constants

### Architecture Principles

- **YAGNI** — You Aren't Gonna Need It (no speculative features)
- **DRY** — Don't Repeat Yourself (extract reusable logic)
- **Early returns** — Validate inputs early, avoid deep nesting
- **No optional parameters** — Use explicit config objects instead

---

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass**: `pnpm -r test -- --run`
2. **Lint and format**: `pnpm lint && pnpm format`
3. **Build successfully**: `pnpm -r build`
4. **Update documentation** if adding/changing features
5. **Add tests** for new functionality

### PR Title Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add route segment config analyzer`
- `fix: correct diagnostic positioning for duplicate dependencies`
- `docs: update README with M4 features`
- `chore: bump dependencies`
- `test: add fixtures for serialization boundary validation`

### PR Description

Include:

- **What**: Brief description of the change
- **Why**: Reason for the change (fixes issue, adds feature, etc.)
- **Testing**: How you tested the change
- **Breaking changes**: If any (rare for this project)

### Review Process

1. **Automated checks** must pass (CI, lint, tests)
2. **Maintainer review** — Be patient, we'll review as soon as possible
3. **Address feedback** — Make requested changes in new commits
4. **Squash merge** — PRs are typically squashed on merge

---

## Reporting Issues

### Bug Reports

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:

- **Description**: Clear description of the bug
- **Reproduction steps**: Minimal steps to reproduce
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: Node.js version, Next.js version, OS
- **Code sample**: Minimal example if possible

### Good Bug Report Example

```markdown
## Bug: Analyzer crashes on routes with dynamic imports

**Environment:**

- Node.js: v20.10.0
- Next.js: 15.0.3
- OS: macOS 14.1

**Steps to reproduce:**

1. Create route with `const Component = dynamic(() => import('./Component'))`
2. Run `pnpm -F @rsc-xray/cli analyze --project ./my-app`
3. Analyzer crashes with TypeError

**Expected:** Should analyze dynamic import
**Actual:** TypeError: Cannot read property 'name' of undefined

**Stack trace:**
[paste relevant stack trace]
```

---

## Feature Requests

We welcome feature requests! Please:

1. **Search existing issues** to avoid duplicates
2. **Describe the use case** — Why is this needed?
3. **Propose a solution** — How should it work?
4. **Consider alternatives** — What other approaches exist?

### OSS vs Pro Features

This repository contains **free/open-source** features. Some advanced features (overlay, VS Code extension, CI budgets) are in the [Pro repository](https://github.com/rsc-xray/rsc-xray-pro) (private).

If unsure whether a feature belongs in OSS or Pro:

- **OSS**: Analysis, detection, reporting, CLI tools
- **Pro**: Live tooling, IDE integrations, CI automation, advanced visualization

---

## Release Process

Releases are managed by maintainers using [Changesets](https://github.com/changesets/changesets):

1. **Create changeset**: `pnpm changeset` (maintainers only)
2. **Version PR**: Automated PR created by changeset-bot
3. **Publish**: Merging version PR triggers npm publish

Contributors don't need to create changesets — maintainers handle versioning.

---

## Questions?

- **Documentation**: Check [docs/QUICKSTART.md](./docs/QUICKSTART.md) and [docs/WORKFLOWS.md](./docs/WORKFLOWS.md)
- **Issues**: Search [existing issues](https://github.com/rsc-xray/rsc-xray/issues)
- **Discussions**: Open a [GitHub Discussion](https://github.com/rsc-xray/rsc-xray/discussions)

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for contributing to RSC X‑Ray! 🎉
