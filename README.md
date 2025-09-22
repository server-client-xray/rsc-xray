# server-client-xray (OSS)

Core analyzer + CLI + schemas + offline HTML report.

## Features (Free/OSS)

- Detect server/client boundaries (`'use client'`)
- Suspense discovery
- Bundle bytes per island
- Forbidden import rules
- Suggestions (hoist fetch, parallelize)
- Export JSON/HTML report
- Compatibility banner (Next 13.4–15.x)

## Getting Started

1. `corepack pnpm install` — install dependencies
2. `corepack pnpm -r test` — run test suites
3. `pnpm -C examples/next-app dev` — launch demo App Router project

## Example

```bash
pnpm -F @server-client-xray/cli analyze --project ./examples/next-app --out model.json
pnpm -F @server-client-xray/cli report --model model.json --out report.html
```

## Pro & Team

Looking for overlay UI, hydration timings, cache lens, CI dashboards?  
See **[server-client-xray-pro](https://github.com/server-client-xray/server-client-xray-pro)**.

## Docs

See [docs/](./docs) for dev guide, backlog, and roadmap.
