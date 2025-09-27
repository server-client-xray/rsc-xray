# Workflows

This document threads the core OSS flows into repeatable checklists so you can run the analyzer, render offline reports, or capture Flight stream data without jumping between files.

## Analyze → Report

1. `pnpm -C examples/next-app build` – produce `.next` artifacts (rerun after code changes you want to inspect).
2. `pnpm -F @rsc-xray/cli analyze --project ./examples/next-app --out ./model.json`
   - Outputs `model.json` in the current working directory.
   - Validates collected data against the shared JSON schema.
3. `pnpm -F @rsc-xray/cli report --model ./model.json --out ./report.html`
   - Generates an offline HTML report beside the model file.
4. Open `report.html` locally or publish it as a CI artifact.

## Flight Tap (stream timings)

1. Launch the demo in another terminal: `pnpm -C examples/next-app dev` (defaults to http://localhost:3000).
2. From the repo root, stream the route you want to inspect:

   ```bash
   pnpm -F @rsc-xray/cli flight-tap \
     --url http://localhost:3000/(shop)/products/1 \
     --route /products/[id] \
     --out examples/next-app/.scx/flight.json
   ```

3. The command writes chunk timings to STDOUT and saves a model-compatible snapshot (`{ "samples": [...] }`) when `--out` is provided. Analyzer runs fold this data into `model.flight`, enabling the Pro overlay to surface timeline summaries.

## Overlay Stub Behavior

- The OSS demo injects `OverlayBootstrap`, which registers a console warning if the Pro overlay bundle is missing.
- Toggle with **Control**+Shift+X while the demo runs, or call `window.__SCX_OVERLAY__?.toggle()` in the browser console.
- To access the full UI (hydration timings, cache lens, budgets), install `@rsc-xray/pro-overlay` in the example app and invoke `autoInstallOverlay()`.

## Publishing new releases

Releases are Changesets-driven. The happy path is:

1. Run `pnpm changeset` on your feature branch to record the semver bump and release note.
2. Merge the feature branch. When `main` contains unreleased changesets, the **Version Packages** workflow raises a PR that updates package versions and changelogs.
3. Merge that PR. The **Publish Packages** workflow on `main` installs with the shared token (`NPM_TOKEN`), runs `pnpm changeset publish`, and pushes the new `@rsc-xray/*` versions to npm.
4. Confirm the publish with `pnpm view @rsc-xray/cli versions`. Perform the same check in the pro repo for `@rsc-xray/pro-*` packages.

If there are no changesets, the version and publish workflows exit early—no manual steps are needed.

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
