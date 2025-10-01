# Analyzer Rules & Coverage

Reference for the rules shipped in the OSS analyzer today and the upcoming detectors planned across OSS, Pro Overlay, and Team/CI milestones.

| Rule                                    | Trigger                                                                                           | Demo coverage                                                 | Analyzer artifact                                                                     | Overlay / CI surface                                                                | Status                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------- |
| `client-hoist-fetch`                    | Awaiting `fetch` inside a client component                                                        | `/scenarios/client-hoist-fetch`                               | `module:app/(scenarios)/scenarios/client-hoist-fetch/page.tsx`                        | Included in static report; overlay adds live hydration context                      | Released (OSS M1)                   |
| `server-promise-all`                    | Sequential `await` calls in a server component that could run in parallel                         | `/scenarios/server-promise-all`                               | `module:app/(scenarios)/scenarios/server-promise-all/page.tsx`                        | Report suggestions + overlay route-level waterfall badges with Flight timeline data | Released (OSS M1, Pro M2)           |
| `client-forbidden-import`               | Client component imports Node built-ins (`fs`, `path`, etc.)                                      | `/scenarios/client-forbidden-import` (instructions + fixture) | `module:app/(scenarios)/scenarios/client-forbidden-import/ForbiddenImportExample.tsx` | Shows as report diagnostic; VS Code extension will surface it inline                | Released (OSS M1)                   |
| `route-waterfall`                       | Route-level aggregation of sequential dependencies with Flight timeline context                   | `/scenarios/server-promise-all` (shows route badge)           | Analyzer lifts `server-promise-all` findings to route-scoped suggestions              | Overlay shows route-level waterfall badge + tooltip with aggregated file context    | Released (Pro M2)                   |
| `cache-tag-impact`                      | Pages sharing `revalidateTag`/`revalidatePath`; shows which routes refresh together               | Cache lens demo in overlay (search/filter enabled)            | Cache lens metadata with ISR/PPR policy detection                                     | Overlay cache lens with search, policy mismatch warnings, route metadata            | Released (Pro M2)                   |
| `cache-policy-mismatch`                 | Routes with inconsistent static/dynamic policies or ISR semantics                                 | Detected via cache lens analysis                              | Route `dynamic`/`revalidate` metadata in model                                        | Cache lens warnings for mismatched policies; "SWR next visit" hints for ISR routes  | Released (Pro M2)                   |
| `dynamic-api-usage`                     | Route uses Next.js dynamic APIs (`headers()`, `cookies()`, `noStore()`) forcing dynamic rendering | Auto-detected in routes using dynamic APIs                    | OSS analyzer infers dynamic rendering and sets route strategy                         | Overlay Boundary Tree shows route strategy badge (Dynamic/ISR/Static/Manual)        | Released (OSS M4, rsc-xray#106)     |
| `suspense-boundary-missing`             | Async server component without Suspense boundary wrapper                                          | `/scenarios/suspense-missing`                                 | Suggestion with file/line for missing boundary placements                             | Overlay highlights suggested Suspense placements; codemod available for wrapping    | Released (OSS M4, rsc-xray#97)      |
| `suspense-boundary-opportunity`         | Multiple await expressions that could use parallel Suspense boundaries                            | `/scenarios/suspense-opportunity`                             | Suggestion with parallel streaming opportunity guidance                               | Overlay visualizes parallel vs sequential Suspense opportunities                    | Released (OSS M4, rsc-xray#97)      |
| `client-component-oversized`            | Client component bundle exceeds configurable size threshold (default 50KB)                        | `/scenarios/client-oversized`                                 | Diagnostic with current size, threshold, and overage percentage                       | Budget dashboard warnings; overlay size badges with threshold status                | Released (OSS M4, rsc-xray#98)      |
| `duplicate-dependencies`                | Multiple client components share 3+ chunk dependencies                                            | `/scenarios/duplicate-dependencies`                           | Diagnostic listing shared chunks and affected components                              | Overlay dependency graph view; suggestions for code extraction or dynamic imports   | Released (OSS M4, rsc-xray#98)      |
| `react19-cache-opportunity`             | Manual caching patterns that could use React 19 cache() API                                       | `/scenarios/cache-opportunity`                                | Suggestion with cache() migration guidance and code examples                          | Overlay inline hints; VS Code quick fixes for automatic migration                   | Released (OSS M4, rsc-xray#99)      |
| `route-segment-config-conflict`         | Next.js route segment config conflicts with actual code behavior                                  | `/scenarios/route-config-conflict`                            | Diagnostic with conflict explanation and resolution guidance                          | Overlay route config display; VS Code inline diagnostics for config conflicts       | Released (OSS M4, rsc-xray#104)     |
| `server-client-serialization-violation` | Non-serializable props (functions, Date, Map, Set, class instances) passed from server to client  | `/scenarios/serialization-boundary`                           | Diagnostic with type-specific suggestions (Server Actions, ISO serialization, etc.)   | Overlay inline hints; VS Code quick fixes for automatic serialization               | Released (OSS M5, rsc-xray#111)     |
| `bytes-budget-regression`               | Route/component bytes exceed configured budget vs baseline                                        | CI budget workflow in examples/next-app                       | Budget comparison JSON + PR comment formatter                                         | GitHub Action comment + required check                                              | Released (Pro M3, rsc-xray-pro#130) |
| `static-dynamic-mismatch`               | Route should be static but opts into dynamic rendering (or vice-versa)                            | Covered by static/dynamic detector fixtures                   | Analyzer flags + CLI warning; overlay highlights affected routes                      | Overlay route strategy badges with policy recommendations                           | Released (OSS/Pro M4, #106)         |
| `cache-lens-v2-edge-cases`              | Cache lens v2 detects revalidatePath, ISR/SWR semantics, and policy conflicts                     | Cache lens demo in overlay with edge case coverage            | Extended cache lens metadata with revalidatePath tracking                             | Overlay cache lens with revalidatePath hints and SWR next-visit projections         | Released (Pro M4, rsc-xray-pro#152) |
| `server-action-map`                     | Server actions graph showing action→tag/path→route connections                                    | Server actions map in overlay                                 | Server actions graph export with bidirectional queries                                | Overlay server actions map with route/action discovery                              | Released (Pro M4, rsc-xray-pro#132) |

## Cross-References

For detailed implementation status and testing coverage, see:

- **Pro Development Guide:** `rsc-xray-pro/docs/02-Development-Guide.md`
  - T2.9 (Waterfall detector enhancements) — Completed 2025-09-25
  - T2.10 (Cache lens enhancements) — Completed 2025-09-30
  - T3.1 (GitHub Action budgets) — Completed 2025-09-30
  - T4.1 (Cache lens v2) — Completed 2025-10-01
  - T4.2 (Static/dynamic route detector) — Completed 2025-10-01
  - T4.3 (Server actions map) — Completed 2025-09-30
  - T4.5 (Suspense boundary analyzer) — Completed 2025-10-01
  - T4.6 (Client size warnings) — Completed 2025-10-01
  - T4.7 (React 19 cache detector) — Completed 2025-10-01
  - T4.8 (Route segment config analyzer) — Completed 2025-10-01
  - T5.4 (Serialization boundary validation) — Completed 2025-10-01
- **Pro Agent Ledger:** `rsc-xray-pro/docs/AGENT-LEDGER.md` — Merge history and outcomes

## Updates Log

- **2025-10-01:** M4 hardening complete — all analyzer rules released (Suspense, client size, cache(), route config, serialization); M3 budgets shipped; cache lens v2 and server actions map in Pro overlay
- **2025-09-30:** Synced with Pro M2 deliverables (route-level waterfall badges, cache lens search/filter, ISR/PPR metadata, dynamic API detection)
- **2025-09-23:** Initial ledger created with M1 violations

---

Additional rules, insights, and CI gates will be appended here as they land so OSS users can see which detections require Pro/Team surfaces and where to reproduce them.
