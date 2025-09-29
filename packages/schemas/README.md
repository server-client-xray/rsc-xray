# @rsc-xray/schemas

[![npm](https://img.shields.io/npm/v/@rsc-xray/schemas.svg)](https://www.npmjs.com/package/@rsc-xray/schemas)
[![Downloads](https://img.shields.io/npm/dm/@rsc-xray/schemas.svg)](https://www.npmjs.com/package/@rsc-xray/schemas)

Shared TypeScript types and JSON schema that define the `model.json` contract between the analyzer, CLI, HTML report, and Pro tooling.

## What it solves

- Provides canonical TypeScript types (`Model`, `XNode`, etc.) so packages can share a single source of truth.
- Exposes a JSON schema suitable for runtime validation (used by the CLI and CI workflows).
- Keeps the OSS analyzer and Pro overlay in lockstep when the model evolves.

## Installation

```bash
pnpm add -D @rsc-xray/schemas
```

## Step-by-step usage

1. **Import the types** where you consume `model.json`:

   ```ts
   import type { Model } from '@rsc-xray/schemas';

   const model: Model = JSON.parse(await fs.promises.readFile('model.json', 'utf8'));
   ```

2. **Validate at runtime** (optional but recommended):

   ```ts
   import Ajv from 'ajv';
   import { modelSchema } from '@rsc-xray/schemas';

   const ajv = new Ajv({ allErrors: true });
   const validate = ajv.compile(modelSchema);
   if (!validate(model)) {
     throw new Error(ajv.errorsText(validate.errors));
   }
   ```

3. **Sync with the CLI/analyzer** — both rely on this package, so your code stays compatible as long as you import the same version.

## Tests

- `packages/cli/src/commands/__tests__/analyze.test.ts` and `packages/cli/src/commands/__tests__/report.test.ts` validate models against this schema.
- `packages/schemas/src/index.test.ts` snapshots the exported schema to prevent accidental breaking changes.

Run the schema tests with:

```bash
pnpm -F @rsc-xray/schemas test -- --run
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
