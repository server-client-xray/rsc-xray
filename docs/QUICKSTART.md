# Quickstart

## Setup

1. `corepack pnpm install` — install dependencies for all packages and the example Next.js app.
2. `corepack pnpm -r test` — exercise package test suites (schemas validates the shared JSON schema).
3. `pnpm -C examples/next-app build` — produce `.next` artifacts for analysis (rerun after code changes you want to inspect).
4. Keep [docs/WORKFLOWS.md](./WORKFLOWS.md) nearby for the command cheatsheets listed below.

## Analyzer & Report Workflow

```bash
# from repo root
pnpm -C examples/next-app build
pnpm -F @server-client-xray/cli analyze --project ./examples/next-app --out ./model.json
pnpm -F @server-client-xray/cli report --model ./model.json --out ./report.html
```

- `model.json` powers CI, the HTML report, and the Pro overlay.
- `report.html` is static; open it locally or publish it from CI for team review.
- See the [scenario matrix](./WORKFLOWS.md#scenario-matrix) to trigger specific rules before you run the analyzer.

## Flight Tap (Optional)

Stream and persist Flight chunks while the dev server runs:

```bash
pnpm -C examples/next-app dev &
pnpm -F @server-client-xray/cli flight-tap --url http://localhost:3000/products/analyzer --out ./flight.json
```

Sample output:

```
[scx-flight] t=18ms chunk 0 (1024 bytes)
[scx-flight] t=47ms chunk 1 (2048 bytes)
```

Use the captured timings to correlate overlay observations with Flight delivery order.

## Overlay Stub

- The OSS demo ships a stub overlay that logs instructions until `@server-client-xray-pro/overlay` is installed.
- Toggle it with **Control**+Shift+X (macOS uses the Control key) or via `window.__SCX_OVERLAY__?.toggle()`.
- Install the Pro overlay package to visualize hydration timings, cache lens insights, and CI budgets inline.

## Scenario Playground

- The home page lists analyzer demos:
  - `/products` — baseline
  - `/scenarios/server-promise-all`
  - `/scenarios/client-hoist-fetch`
  - `/scenarios/client-forbidden-import`
  - `/scenarios/cache-lens-coming-soon`
  - `/scenarios/pro-budget-coming-soon`
- `docs/VIOLATIONS.md` explains what each rule measures, the corresponding analyzer nodes, and where Pro features add depth.
