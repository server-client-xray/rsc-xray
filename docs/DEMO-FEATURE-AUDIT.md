# Demo Feature Audit

Last updated: 2025-10-01

This document tracks which implemented features have corresponding demo scenarios in the OSS example app.

## ✅ Features with Complete Demos

| Feature                          | Rule                                    | Demo Route                           | Status      | Notes                              |
| -------------------------------- | --------------------------------------- | ------------------------------------ | ----------- | ---------------------------------- |
| Client fetch on hydration        | `client-hoist-fetch`                    | `/scenarios/client-hoist-fetch`      | ✅ Complete | Shows fetch in client component    |
| Sequential server awaits         | `server-promise-all`                    | `/scenarios/server-promise-all`      | ✅ Enhanced | Code examples + timing comparison  |
| Client forbidden imports         | `client-forbidden-import`               | `/scenarios/client-forbidden-import` | ✅ Complete | Node.js APIs in client component   |
| Suspense boundary missing        | `suspense-boundary-missing`             | `/scenarios/suspense-missing`        | ✅ Enhanced | Code examples + performance impact |
| Oversized client component       | `client-component-oversized`            | `/scenarios/client-oversized`        | ✅ Enhanced | Bundle size metrics + fixes        |
| React 19 cache() opportunity     | `react19-cache-opportunity`             | `/scenarios/cache-opportunity`       | ✅ Complete | Duplicate function calls           |
| Route segment config conflict    | `route-segment-config-conflict`         | `/scenarios/route-config-conflict`   | ✅ Complete | Config vs behavior conflicts       |
| Dynamic route detection          | `dynamic-api-usage`                     | `/scenarios/dynamic-route`           | ✅ Complete | Shows headers() usage              |
| Serialization boundary violation | `server-client-serialization-violation` | `/scenarios/serialization-boundary`  | ✅ Enhanced | Interactive prop analysis          |

## 🔵 Pro Features with Teasers

| Feature    | Demo Route                          | Status    | Notes                                                     |
| ---------- | ----------------------------------- | --------- | --------------------------------------------------------- |
| Cache Lens | `/scenarios/cache-lens-coming-soon` | ✅ Teaser | Shows tag relationships, ISR policies, conflict detection |
| CI Budget  | `/scenarios/pro-budget-coming-soon` | ✅ Teaser | Future feature teaser                                     |

## ❌ Released Features Missing Demos

| Feature                       | Rule                            | Status      | Priority | Notes                                                                    |
| ----------------------------- | ------------------------------- | ----------- | -------- | ------------------------------------------------------------------------ |
| Suspense boundary opportunity | `suspense-boundary-opportunity` | Released M4 | Medium   | Different from suspense-missing - shows parallel streaming opportunities |
| Duplicate dependencies        | `duplicate-dependencies`        | Released M4 | Medium   | Shows shared chunks across client components                             |

## 📋 Planned Features (Not Yet Released)

| Feature                 | Rule                      | Status             | Notes                    |
| ----------------------- | ------------------------- | ------------------ | ------------------------ |
| Bytes budget regression | `bytes-budget-regression` | Planned Team/CI M3 | CI-only feature          |
| Static/dynamic mismatch | `static-dynamic-mismatch` | In Progress Pro M4 | Route strategy conflicts |
| Edge cache drift        | `edge-cache-drift`        | Planned Pro M4     | SWR semantics detection  |
| Server action orphan    | `server-action-orphan`    | Planned Pro M4     | Orphaned server actions  |

## 🎯 Recommendations

### High Priority

1. **Create `suspense-boundary-opportunity` demo**
   - Show route with sequential data fetches
   - Demonstrate parallel Suspense boundaries
   - Visual comparison of waterfall vs streaming

2. **Create `duplicate-dependencies` demo**
   - Multiple client components sharing large dependencies
   - Show bundle analysis
   - Suggest code extraction or dynamic imports

### Medium Priority

3. **Enhance existing demos**
   - Add "Run Analyzer" buttons to generate real reports
   - Add inline report viewing
   - Link to generated `model.json` and `report.html`

### Low Priority

4. **Create more Pro teasers**
   - Waterfall detector overlay visualization
   - Server actions map preview
   - PPR/ISR advanced scenarios

## 📝 Next.js Version Support

**Current Demo Version:** Next.js 14.2.5

**Question:** Should we have demos for multiple Next.js versions?

**Recommendation:**

- Keep ONE demo app on latest stable Next.js
- Add version compatibility matrix to documentation instead
- Test suite should cover multiple versions, not demos
- Update demo when new Next.js major version releases

**Reasoning:**

- Maintaining multiple demo apps is expensive
- Version differences are primarily internal, not user-facing
- Documentation + tests provide better version coverage
- Users can test their specific version locally

## 🚀 Action Items

- [ ] Create suspense-boundary-opportunity demo
- [ ] Create duplicate-dependencies demo
- [ ] Update VIOLATIONS.md to reflect demo coverage
- [ ] Add "View Report" capability to demo app
- [ ] Document Next.js version support strategy
