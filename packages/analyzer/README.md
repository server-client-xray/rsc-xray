# @rsc-xray/analyzer

Static analyzer that inspects a Next.js App Router build and produces the shared `model.json` contract consumed by the OSS report, Pro overlay, and CI automations.

## What it solves

- Classifies every node under the App Router as server, client, suspense, or route boundary.
- Attributes client bundle bytes to the components that load them.
- Detects forbidden client imports and sequential server awaits so teams can fix waterfalls quickly.
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
