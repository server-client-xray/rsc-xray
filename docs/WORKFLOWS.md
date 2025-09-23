# Workflows

This document threads the core OSS flows into repeatable checklists so you can run the analyzer, render offline reports, or capture Flight stream data without jumping between files.

## Analyze → Report

1. `pnpm -C examples/next-app build` – produce `.next` artifacts (rerun after code changes you want to inspect).
2. `pnpm -F @server-client-xray/cli analyze --project ./examples/next-app --out ./model.json`
   - Outputs `model.json` in the current working directory.
   - Validates collected data against the shared JSON schema.
3. `pnpm -F @server-client-xray/cli report --model ./model.json --out ./report.html`
   - Generates an offline HTML report beside the model file.
4. Open `report.html` locally or publish it as a CI artifact.

## Flight Tap (stream timings)

1. Launch the demo in another terminal: `pnpm -C examples/next-app dev` (defaults to http://localhost:3000).
2. From the repo root, stream the route you want to inspect:

   ```bash
   pnpm -F @server-client-xray/cli flight-tap --url http://localhost:3000/products/analyzer --out ./flight.json
   ```

3. The command writes human-readable chunk timings to STDOUT and saves the sampled data when `--out` is provided. Use these samples to align overlay observations with Flight delivery order.

## Overlay Stub Behavior

- The OSS demo injects `OverlayBootstrap`, which registers a console warning if the Pro overlay bundle is missing.
- Toggle with **Control**+Shift+X while the demo runs, or call `window.__SCX_OVERLAY__?.toggle()` in the browser console.
- To access the full UI (hydration timings, cache lens, budgets), install `@server-client-xray-pro/overlay` in the example app and invoke `autoInstallOverlay()`.

## Scenario Matrix

| Route                                | Purpose                                         | Notes                                                              |
| ------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------ |
| `/products`                          | Baseline Suspense + client islands              | Valid reference output                                             |
| `/scenarios/server-promise-all`      | Sequential awaits trigger `server-promise-all`  | Re-run analyze/report to view suggestion                           |
| `/scenarios/client-hoist-fetch`      | Client-side fetch triggers `client-hoist-fetch` | Shows why fetches belong in server components or loaders           |
| `/scenarios/client-forbidden-import` | Documents `client-forbidden-import` diagnostic  | Analyzer flags the bundled example component described on the page |
| `/scenarios/cache-lens-coming-soon`  | Placeholder for cache lens scenarios            | Roadmapped                                                         |
| `/scenarios/pro-budget-coming-soon`  | Placeholder for Pro CI budget overlay           | Roadmapped                                                         |

Use the scenario grid on the home page for quick navigation when smoke-testing analyzer output.
