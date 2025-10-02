# @rsc-xray/cli

[![npm](https://img.shields.io/npm/v/@rsc-xray/cli.svg)](https://www.npmjs.com/package/@rsc-xray/cli)
[![Downloads](https://img.shields.io/npm/dm/@rsc-xray/cli.svg)](https://www.npmjs.com/package/@rsc-xray/cli)

Command-line wrapper for the rsc-xray analyzer, report generator, and Flight tap capture workflow.

## What it solves

- Produces `model.json` from a Next.js App Router project with one command.
- Generates a fully offline HTML report for sharing analyzer findings.
- Streams React Flight chunks so you can understand suspense delivery order and chunk sizes.

## Installation

```bash
pnpm add -D @rsc-xray/cli
```

## Quick Start

```bash
# 1. Build your Next.js app
npm run build

# 2. Analyze and generate model
npx @rsc-xray/cli analyze --project . --out model.json

# 3. Generate HTML report
npx @rsc-xray/cli report --model model.json --out report.html

# 4. Open report
open report.html
```

## Commands

### `analyze`

Generate analyzer model from Next.js build artifacts.

```bash
npx @rsc-xray/cli analyze [options]
```

**Options:**

| Option             | Description                  | Default      |
| ------------------ | ---------------------------- | ------------ |
| `--project <path>` | Path to Next.js project root | `.`          |
| `--dist <dir>`     | Build output directory       | `.next`      |
| `--app <dir>`      | App directory name           | `app`        |
| `--out <file>`     | Output file path             | `model.json` |
| `--pretty`         | Pretty-print JSON output     | `false`      |

**Example:**

```bash
npx @rsc-xray/cli analyze \
  --project ./my-app \
  --dist .next \
  --app app \
  --out analysis.json \
  --pretty
```

### `report`

Generate static HTML report from model.

```bash
npx @rsc-xray/cli report [options]
```

**Options:**

| Option           | Description        | Default       |
| ---------------- | ------------------ | ------------- |
| `--model <file>` | Path to model.json | `model.json`  |
| `--out <file>`   | Output file path   | `report.html` |

**Example:**

```bash
npx @rsc-xray/cli report \
  --model ./model.json \
  --out ./public/rsc-report.html
```

### `flight-tap`

Capture React Flight streaming chunks.

```bash
npx @rsc-xray/cli flight-tap [options]
```

**Options:**

| Option           | Description               | Default            |
| ---------------- | ------------------------- | ------------------ |
| `--url <url>`    | URL to capture (required) | -                  |
| `--route <path>` | Route path for labeling   | Extracted from URL |
| `--out <file>`   | Output file path          | Prints to stdout   |
| `--timeout <ms>` | Abort after timeout       | `30000`            |

**Example:**

```bash
# Start dev server first
npm run dev &

# Capture Flight data
npx @rsc-xray/cli flight-tap \
  --url http://localhost:3000/products/1 \
  --route /products/[id] \
  --out flight.json \
  --timeout 30000
```

**Tip:** Use `--timeout 0` to disable timeout when debugging slow routes.

## Typical Workflow

### Local Development

```bash
# Analyze after code changes
npm run build
npx @rsc-xray/cli analyze --project . --out model.json
npx @rsc-xray/cli report --model model.json --out report.html
open report.html
```

### CI Integration

```yaml
# .github/workflows/analyze.yml
- name: Build Next.js app
  run: npm run build

- name: Analyze RSC boundaries
  run: npx @rsc-xray/cli analyze --project . --out model.json

- name: Generate report
  run: npx @rsc-xray/cli report --model model.json --out report.html

- name: Upload report artifact
  uses: actions/upload-artifact@v3
  with:
    name: rsc-xray-report
    path: report.html
```

## Troubleshooting

### "Command not found"

**Solution:** Install the package:

```bash
npm install -D @rsc-xray/cli
```

### "No .next directory found"

**Solution:** Build your app first:

```bash
npm run build
```

### "Model validation failed"

**Solution:** Ensure you're using Next.js 13.4+ with App Router. Check:

- `app/` directory exists
- `.next/` contains build artifacts
- Next.js version is compatible

### "Flight tap times out"

**Solution:** Increase timeout or disable it:

```bash
npx @rsc-xray/cli flight-tap --url ... --timeout 60000
# or
npx @rsc-xray/cli flight-tap --url ... --timeout 0
```

### Report shows no routes

**Possible causes:**

1. App directory not found (default: `app/`)
2. Build output not found (default: `.next/`)
3. Not using Next.js App Router

**Solution:** Specify custom paths:

```bash
npx @rsc-xray/cli analyze \
  --project . \
  --dist .next \
  --app src/app \
  --out model.json
```

## Tests

Command behavior is covered by:

- `packages/cli/src/commands/__tests__/analyze.test.ts`
- `packages/cli/src/commands/__tests__/report.test.ts`
- `packages/cli/src/commands/__tests__/flightTap.test.ts`

Run the suite with:

```bash
pnpm -F @rsc-xray/cli test -- --run
```

### RSC X‑Ray Pro

Paid plans available — unlock the full toolkit:

- Overlay UI — live boundary tree, Suspense markers, bundle bytes, hydration timings
- Flight tap & timeline — capture React Flight streaming; visualize chunk order, sizes, labels
- Cache lens — inspect `tags`, revalidate policies, and route impact
- Waterfall detector — find sequential awaits; guided fixes (preload/parallelize)
- Codemods — `use client`, wrap with Suspense, add preload/hydration hook
- VS Code extension — analyzer diagnostics + “Open in XRay” deep links
- CI budgets & trends — PR comments, thresholds, and historical deltas

Learn more → https://rsc-xray.dev • Pricing → https://rsc-xray.dev/pricing
