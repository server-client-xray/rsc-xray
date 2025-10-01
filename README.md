# RSC X‑Ray — Next.js RSC analyzer & report

[![npm](https://img.shields.io/npm/v/@rsc-xray/cli.svg)](https://www.npmjs.com/package/@rsc-xray/cli)
[![CI](https://img.shields.io/github/actions/workflow/status/rsc-xray/rsc-xray/ci-release.yml?branch=main)](https://github.com/rsc-xray/rsc-xray/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Analyze React Server Components in Next.js: boundaries, Suspense, bundle bytes, and suggestions — export a shareable offline HTML report.

## Features (Free/OSS)

- Detect server/client boundaries (`'use client'`)
- Suspense discovery & boundary placement analysis
- Bundle bytes per island with size thresholds
- Client component size warnings & duplicate dependency detection
- Forbidden import rules (Node.js APIs in client components)
- React 19 cache() API migration opportunities
- Suggestions (hoist fetch, parallelize, add Suspense)
- Export JSON/HTML report
- Compatibility banner (Next 13.4–15.x)

<details>
<summary><strong>Features (Pro Plan) 🔒</strong></summary>

**Live Development Tools:**

- **Interactive Overlay** — Real-time component tree with hydration timings overlaid on your running app
- **Hydration Performance Tracking** — Measure time-to-interactive for each client component
- **Cache Lens** — Visualize revalidateTag/revalidatePath impact, ISR/PPR policies, and route strategies
- **Flight Timeline** — Capture and analyze React Server Component streaming (chunk order, sizes, timings)
- **Server Actions Map** — Track which actions affect which routes through tags and paths

**CI/CD & Automation:**

- **Performance Dashboard** — Interactive HTML dashboard with A+ to F scoring, trend charts, and regression detection
- **Bundle Budgets** — Enforce size limits in CI and fail PRs that exceed thresholds
- **Automated Trend Collection** — Zero-config GitHub Action for historical performance tracking
- **PR Comments** — Automatic budget reports and delta comparisons posted to pull requests
- **Performance Scoring** — Composite scores based on bundle size, hydration, trends, and violations

**Developer Experience:**

- **VS Code Extension** — Inline diagnostics with one-click quick fixes (wrap in Suspense, add cache(), code splitting)
- **Automated Codemods** — Transform code to fix common patterns (use client, Suspense boundaries, preload hints)
- **Waterfall Detector** — Identify sequential data fetches with guided fixes
- **Advanced Diagnostics** — Route config conflicts, cache policy mismatches, static/dynamic classification

**Enterprise:**

- **Offline License Verification** — Air-gapped deployment support with JWT-based licensing
- **No Telemetry** — 100% local processing, zero network calls during analysis
- **Privacy Mode** — Full GDPR/HIPAA/SOC 2 compliance for sensitive codebases

Learn more → [https://rsc-xray.dev](https://rsc-xray.dev) • Pricing → [https://rsc-xray.dev/pricing](https://rsc-xray.dev/pricing)

</details>

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

### What's in the HTML Report?

The static HTML report shows:

- **Bundle Analysis** - Total bytes, client/server split, per-route breakdown
- **Component Tree** - Server/client boundaries with `'use client'` markers
- **Suspense Boundaries** - Where streaming happens, boundary placement
- **Diagnostics** - Rule violations with specific file/line numbers:
  - Forbidden Node.js imports in client components
  - Oversized client components (>50KB threshold)
  - Duplicate dependencies across client islands
- **Suggestions** - Actionable fixes with file/line locations:
  - Hoist fetch calls from client to server
  - Parallelize sequential awaits with Promise.all
  - Add Suspense boundaries around async components
  - Migrate to React 19 cache() API for deduplication
- **Build Info** - Next.js version, build timestamp, route count

**Perfect for:** Sharing with teammates, uploading to CI artifacts, offline review

**Want live tracking?** See [RSC XRay Pro](#rsc-xray-pro) for interactive overlay, trends dashboard, and CI budgets.

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
