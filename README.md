# rsc-xray (OSS)

Core analyzer + CLI + schemas + offline HTML report.

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

```bash
# from repo root
docs/WORKFLOWS.md details each step, but in short:
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
- Install `@rsc-xray-pro/overlay` in the example app to unlock the full UI (hydration timings, cache lens, CI budgets).

## Pro & Team

Interested in overlay UI, hydration timings, cache lens, CI dashboards, or licensing flows?  
See **[rsc-xray-pro](https://github.com/rsc-xray/rsc-xray-pro)**.
