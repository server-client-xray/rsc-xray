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
4. `pnpm -C examples/next-app build` — produce `.next` artifacts for analysis (required before CLI runs)

## Example

```bash
# from repo root
pnpm -C examples/next-app build
pnpm -F @server-client-xray/cli analyze --project ./examples/next-app --out ./model.json
pnpm -F @server-client-xray/cli report --model ./model.json --out ./report.html
```

`model.json` and `report.html` will be written relative to your current working directory (the repo root in the example above).

## Using the report & overlay together

1. `pnpm -C examples/next-app build` must run first — the analyzer reads the `.next` artifacts that build produces. Repeat after any code change you want to inspect.
2. `pnpm -F @server-client-xray/cli analyze ...` emits `model.json`, which powers the static HTML report and CI integrations.
3. `pnpm -F @server-client-xray/cli report ...` renders `report.html`; open it locally or upload as a CI artifact to review server/client boundaries, Suspense trees, bytes, and suggestions offline.
4. For live hydration timings, start the demo app (`pnpm -C examples/next-app dev`), visit `/products/analyzer` (numeric aliases like `/products/1` also work), and toggle the Pro overlay (Control+Shift+X). Instrumented components stream their timings into the overlay without extra network calls.

> Tip: The static report currently reflects build-time data (classification, bytes, suggestions). Hydration timings appear in the overlay today; analyzer aggregation is on the M2 follow-up roadmap.

## Instrumenting client islands for hydration timings

The example app uses the shared `@server-client-xray/hydration` helper to attribute hydration durations to specific client components:

```tsx
'use client';

import { createHydrationHook } from '@server-client-xray/hydration';
import { useEffect, useRef } from 'react';

const useHydrationTimings = createHydrationHook({ useEffect, useRef });

export default function Reviews() {
  useHydrationTimings('module:app/components/Reviews.tsx');
  // ...rest of island
}
```

- Call the hook at the top of each client component you want to measure.
- Use the analyzer’s node id (see `model.json` / overlay tree) so the overlay can associate metrics with the correct island.
- The helper is safe to ship in production builds — it records to a local in-memory store (no telemetry) and the overlay simply reads those values.
- In dev mode press **Control**+Shift+X to toggle the overlay (macOS uses the Control key). If that shortcut collides, run `window.__SCX_OVERLAY__?.toggle()` from the browser console or install the overlay yourself with a custom hotkey.

## Pro & Team

Looking for overlay UI, hydration timings, cache lens, CI dashboards?  
See **[server-client-xray-pro](https://github.com/server-client-xray/server-client-xray-pro)**.

## Docs

See [docs/](./docs) for dev guide, backlog, and roadmap.
