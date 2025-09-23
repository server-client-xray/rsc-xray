# Quickstart

## Setup

1. `corepack pnpm install` — install dependencies for all packages and the example Next.js app.
2. `corepack pnpm -r test` — exercise package test suites (schemas validates the shared JSON schema).
3. `pnpm -C examples/next-app dev` — launch the demo Suspense/client-island app at http://localhost:3000 (useful for exploring the overlay).

## Generate a report

```bash
# from repo root
pnpm -C examples/next-app build
pnpm -F @server-client-xray/cli analyze --project ./examples/next-app --out ./model.json
pnpm -F @server-client-xray/cli report --model ./model.json --out ./report.html
```

- The analyzer reads `.next` build artifacts, so re-run `next build` whenever the app changes.
- `report.html` is a static artifact you can open locally or upload from CI.
- The home page includes a scenario grid with routes that intentionally trigger suggestions (e.g. `/scenarios/server-promise-all`, `/scenarios/client-hoist-fetch`). Use them to sanity-check analyzer output.

## Hydration timings in the overlay

- Client components can opt into hydration tracking by creating a hook via `createHydrationHook({ useEffect, useRef })` from `@server-client-xray/hydration`, then calling it with the analyzer node id.
- The example `Reviews` island calls `createHydrationHook({ useEffect, useRef })('module:app/components/Reviews.tsx')`; open `/products/analyzer` (or `/products/1`, both map to the same demo product) in dev mode and toggle the overlay to see the timings badge. On macOS use **Control**+Shift+X, or run `window.__SCX_OVERLAY__?.toggle()` from the console if a global shortcut conflicts.
- Until the Pro overlay bundle is installed the OSS demo exposes a stub `__SCX_OVERLAY__` object that logs setup instructions instead of opening a UI.
- No telemetry leaves the browser — metrics are kept in-memory and consumed by the overlay only.
