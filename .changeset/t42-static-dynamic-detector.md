---
'@rsc-xray/analyzer': minor
'@rsc-xray/cli': patch
---

Complete T4.2 Static/Dynamic Route Detector with comprehensive integration test fixtures

- Add 12 new integration test fixtures for static/dynamic route classification
- Total: 19 analyzeProject integration tests (7 original + 12 new)
- All route types correctly classified with appropriate cache metadata

Fixtures cover:

- Pure static routes (no dynamic APIs)
- ISR routes with revalidate export
- Dynamic routes (cookies(), headers(), noStore())
- Force-static and force-dynamic exports
- Mixed routes (static + dynamic + ISR)
- Nested dynamic API calls in helper functions
- Conditional dynamic API calls
- ISR + dynamic export conflicts (dynamic wins)

Future enhancement: searchParams prop detection
