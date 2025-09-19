# server-client-xray (OSS)

Core analyzer + CLI + schemas + offline HTML report.

- Detect server/client boundaries (`use client`)
- Suspense discovery
- Bundle bytes per island
- Suggestions (hoist fetch, parallelize)
- Export HTML/JSON report

Pro/Team features (overlay UI, hydration timings, cache lens, VS Code, CI dashboards) live in the private repo.

## Getting Started

1. `corepack pnpm install` — install workspace dependencies (packages + example app).
2. `corepack pnpm -r test` — run package test suites (schemas includes a schema smoke test).
3. `pnpm -C examples/next-app dev` — launch the demo Next.js App Router project with Suspense/client islands.

## Example Next.js App

The workspace ships with `examples/next-app`, a minimal App Router project:

- Server components render `/products` with Suspense fallbacks.
- A client component (`app/components/Reviews.tsx`) hydrates on the product detail page and refetches data.
- Artificial delays in `data/products.ts` surface waterfalls for analyzer experimentation.

Use this project when developing analyzer fixtures or demonstrating the OSS CLI.
