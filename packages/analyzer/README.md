# @rsc-xray/analyzer

[![npm](https://img.shields.io/npm/v/@rsc-xray/analyzer.svg)](https://www.npmjs.com/package/@rsc-xray/analyzer)
[![Downloads](https://img.shields.io/npm/dm/@rsc-xray/analyzer.svg)](https://www.npmjs.com/package/@rsc-xray/analyzer)

Static analyzer that inspects a Next.js App Router build and produces the shared `model.json` contract consumed by the OSS report, Pro overlay, and CI automations.

## What it solves

- Classifies every node under the App Router as server, client, suspense, or route boundary.
- Attributes client bundle bytes to the components that load them.
- Detects forbidden client imports and sequential server awaits so teams can fix waterfalls quickly.
- **Validates serialization boundaries**: Flags non-serializable props (functions, Date, Map, class instances) passed from server to client components.
- Folds hydration durations and Flight samples (when available) into the model for richer tooling downstream.

## Installation

```bash
pnpm add -D @rsc-xray/analyzer
```

## Step-by-step usage (Node API)

1. Build your Next.js project so `.next` manifests exist:
   ```bash
   pnpm next build
   ```
2. Call `analyzeProject` from a script or workspace tool:

   ```ts
   import { analyzeProject } from '@rsc-xray/analyzer';

   const model = await analyzeProject({
     projectRoot: '/path/to/app',
     distDir: '.next',
     appDir: 'app',
   });

   await fs.promises.writeFile('model.json', JSON.stringify(model, null, 2));
   ```

3. Pass `model.json` to the CLI report generator or the Pro overlay.

## Step-by-step usage (via CLI)

Rather use the ready-made executable? Combine this package with the CLI:

```bash
pnpm -F @rsc-xray/cli analyze --project ./examples/next-app --out ./model.json
```

The CLI delegates to `@rsc-xray/analyzer`, validates the schema, and writes the model safely.

## Tests

- `packages/analyzer/src/lib/__tests__/analyzeProject.test.ts` covers the end-to-end pipeline against fixture projects.
- `packages/analyzer/src/lib/__tests__/snapshots.test.ts` guarantees hydration/Flight snapshots behave exactly as described above.

Run the analyzer suite with:

```bash
pnpm -F @rsc-xray/analyzer test -- --run
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
