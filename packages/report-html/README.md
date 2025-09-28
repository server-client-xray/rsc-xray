# @rsc-xray/report-html

HTML renderer for the `model.json` contract produced by the analyzer. Generates a static, shareable report without any server dependency.

## What it solves

- Converts analyzer output into an interactive HTML artifact that teams can open locally or publish from CI.
- Highlights server/client boundaries, Suspense nodes, bytes per island, diagnostics, and suggestions.
- Ships as an ESM module so it can run in Node or bundle into other tooling.

## Installation

```bash
pnpm add -D @rsc-xray/report-html
```

## Step-by-step usage

1. Generate `model.json` using the CLI or analyzer API.
2. Render the report:

   ```ts
   import { renderReport } from '@rsc-xray/report-html';
   import fs from 'node:fs/promises';

   const model = JSON.parse(await fs.readFile('model.json', 'utf8'));
   const html = renderReport({ model });
   await fs.writeFile('report.html', html, 'utf8');
   ```

3. Open `report.html` in any browser or upload it as a CI artifact.

Prefer the CLI? Run:

```bash
pnpm -F @rsc-xray/cli report --model ./model.json --out ./report.html
```

## Tests

- `packages/report-html/src/__tests__/renderReport.test.ts` snapshots the generated HTML to guarantee parity with the documented workflow.

Run the suite with:

```bash
pnpm -F @rsc-xray/report-html test -- --run
```
