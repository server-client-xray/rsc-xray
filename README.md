# RSC X‑Ray — Next.js RSC analyzer & report

[![npm](https://img.shields.io/npm/v/@rsc-xray/cli.svg)](https://www.npmjs.com/package/@rsc-xray/cli)
[![CI](https://img.shields.io/github/actions/workflow/status/rsc-xray/rsc-xray/ci.yml?branch=main)](https://github.com/rsc-xray/rsc-xray/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Analyze React Server Components in Next.js: boundaries, Suspense, bundle bytes, and suggestions — export a shareable offline HTML report.

## Features (Free/OSS)

- Detect server/client boundaries (`'use client'`)
- Suspense discovery
- Bundle bytes per island
- Forbidden import rules
- Suggestions (hoist fetch, parallelize)
- Export JSON/HTML report
- Compatibility banner (Next 13.4–15.x)

## Documentation

- [docs/QUICKSTART.md](./docs/QUICKSTART.md) — one-page setup and checklist.
- [docs/WORKFLOWS.md](./docs/WORKFLOWS.md) — repeatable commands for analyze/report, flight tap, and overlay stub usage.
- [docs/VIOLATIONS.md](./docs/VIOLATIONS.md) — rule triggers, demo routes, and artifact references.
- Looking for milestone plans or commercialization work? Those live in the Pro repo; see [rsc-xray-pro](https://github.com/rsc-xray/rsc-xray-pro).

## Getting Started

1. `corepack pnpm install` — install dependencies.
2. `corepack pnpm -r test` — run unit and snapshot suites across the workspace.
3. `pnpm -C examples/next-app build` — produce `.next` artifacts for analysis.
4. Visit `docs/WORKFLOWS.md` for analyze/report/flight tap commands.

## Analyzer + Report Example

From the repo root (see docs/WORKFLOWS.md for details):

```bash
pnpm -C examples/next-app build
pnpm -F @rsc-xray/cli analyze --project ./examples/next-app --out ./model.json
pnpm -F @rsc-xray/cli report --model ./model.json --out ./report.html
```

`model.json` and `report.html` are written relative to your working directory (the repo root in this example).

## Flight Tap

Capture RSC/Flight streaming timings while the demo is running:

```bash
pnpm -C examples/next-app dev &
pnpm -F @rsc-xray/cli flight-tap --url http://localhost:3000/products/analyzer --out ./flight.json
```

STDOUT prints chunk timings; the optional `--out` flag stores the samples for later inspection.

## Demo Scenario Playground

- The home page lists example routes for analyzer smoke testing (see [docs/WORKFLOWS.md](./docs/WORKFLOWS.md)).
- Each scenario links to a route that highlights a rule or upcoming feature:
  - “Product Listing” — valid baseline
  - “Sequential server awaits” — triggers `server-promise-all`
  - “Client fetch on hydration” — triggers `client-hoist-fetch`
  - “Client forbidden import” — documents the `client-forbidden-import` diagnostic with reproduction steps
  - “Cache lens” / “CI budget” — placeholders for roadmap items

## Using the overlay stub

- `OverlayBootstrap` registers a console hint when the Pro overlay bundle is missing.
- Toggle with **Control**+Shift+X or run `window.__SCX_OVERLAY__?.toggle()` in the browser console.
- Install `@rsc-xray/pro-overlay` in the example app to unlock the full UI (hydration timings, cache lens, CI budgets).

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

## Releases

- Create a changeset: `pnpm changeset`
- Merge to `main`; the Version/Publish workflows build and publish to npm
- Pro release process and general guidance are documented in the Pro repo: `docs/12-Release-Handbook.md`
