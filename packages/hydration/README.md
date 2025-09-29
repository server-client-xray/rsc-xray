# @rsc-xray/hydration

[![npm](https://img.shields.io/npm/v/@rsc-xray/hydration.svg)](https://www.npmjs.com/package/@rsc-xray/hydration)
[![Downloads](https://img.shields.io/npm/dm/@rsc-xray/hydration.svg)](https://www.npmjs.com/package/@rsc-xray/hydration)

Tiny helper library that records hydration timings for client components and exposes a hook that plugs into React.

## What it solves

- Marks hydration start/end for each island using the Performance API.
- Provides a React hook (`createHydrationHook`) that instruments components with minimal boilerplate.
- Returns aggregated timings so the analyzer and overlay can display hydration costs per route.

## Installation

```bash
pnpm add @rsc-xray/hydration
```

## Step-by-step usage

1. **Create the hook once**

   ```ts
   import { createHydrationHook } from '@rsc-xray/hydration';
   import { useEffect, useRef } from 'react';

   export const useHydrationTimings = createHydrationHook({ useEffect, useRef });
   ```

2. **Instrument client components**

   ```tsx
   'use client';
   import { useHydrationTimings } from './hooks/useHydrationTimings';

   export function ProductGrid() {
     useHydrationTimings('product-grid');
     return <div>...</div>;
   }
   ```

3. **Read timings when needed**

   ```ts
   import { getHydrationDurations } from '@rsc-xray/hydration';

   const durations = getHydrationDurations();
   console.log(durations['product-grid']);
   ```

4. **Reset between navigations/tests**
   ```ts
   import { resetHydrationMetrics } from '@rsc-xray/hydration';
   resetHydrationMetrics();
   ```

## Tests

- `packages/hydration/src/__tests__/hydration.test.tsx` verifies the hook API and timing collection end-to-end, mirroring the steps above.

Run the suite with:

```bash
pnpm -F @rsc-xray/hydration test -- --run
```

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
