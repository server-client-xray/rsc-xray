# Quickstart — Monorepo Development

> **Note**: This guide is for **contributors** working on the RSC X-Ray monorepo itself. If you want to **use** RSC X-Ray in your Next.js app, see [GETTING-STARTED.md](./GETTING-STARTED.md) instead. For detailed contribution guidelines, see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Setup

1. `corepack pnpm install` — install dependencies for all packages and the example Next.js app.
2. `corepack pnpm -r test` — exercise package test suites (schemas validates the shared JSON schema).
3. `pnpm -C examples/next-app build` — produce `.next` artifacts for analysis (rerun after code changes you want to inspect).
4. Keep [docs/WORKFLOWS.md](./WORKFLOWS.md) nearby for the command cheatsheets listed below.

## Analyzer & Report Workflow

```bash
# from repo root
pnpm -C examples/next-app build
pnpm -F @rsc-xray/cli analyze --project ./examples/next-app --out ./model.json
pnpm -F @rsc-xray/cli report --model ./model.json --out ./report.html
```

- `model.json` powers CI, the HTML report, and the Pro overlay.
- `report.html` is static; open it locally or publish it from CI for team review.
- See the [scenario matrix](./WORKFLOWS.md#scenario-matrix) to trigger specific rules before you run the analyzer.

## Flight Tap (Optional)

Stream and persist Flight chunks while the dev server runs:

```bash
pnpm -C examples/next-app dev &
pnpm -F @rsc-xray/cli flight-tap --url http://localhost:3000/products/analyzer --out ./flight.json
```

Sample output:

```
[scx-flight] t=18ms chunk 0 (1024 bytes)
[scx-flight] t=47ms chunk 1 (2048 bytes)
```

Use the captured timings to correlate overlay observations with Flight delivery order.

- The `--timeout <ms>` flag aborts the capture if a stream hangs (defaults to 30000). Set `--timeout 0` to disable the guard when debugging long-running routes.

## Overlay Stub

- The OSS demo ships a stub overlay that logs instructions until `@rsc-xray/pro-overlay` is installed.
- Toggle it with **Control**+Shift+X (macOS uses the Control key) or via `window.__SCX_OVERLAY__?.toggle()`.
- Install the Pro overlay package to visualize hydration timings, cache lens insights, and CI budgets inline.

## Interactive Demo

Try the live demo at **[demo.rsc-xray.dev](https://demo.rsc-xray.dev)** — Edit code and see diagnostics in real-time!

### Local Demo Development

The demo source is in `examples/demo`:

```bash
cd examples/demo
pnpm dev
```

Features:

- Split-panel layout (explanation + CodeMirror editor)
- Real-time LSP analysis via API route
- 8 scenarios showcasing all OSS analyzer rules
- Pro feature teasers (visual replicas with static data)
- Deep linking support (`?scenario=...&line=...`)

## Scenario Playground (Next.js Example App)

The `examples/next-app` includes demo routes:

- `/products` — baseline
- `/scenarios/server-promise-all`
- `/scenarios/client-hoist-fetch`
- `/scenarios/client-forbidden-import`
- `/scenarios/serialization-boundary`

See `docs/VIOLATIONS.md` for what each rule measures and how to trigger it.
