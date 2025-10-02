---
'@rsc-xray/analyzer': patch
---

Add TypeScript as runtime dependency

TypeScript is now a runtime dependency of @rsc-xray/analyzer since it imports and uses the TypeScript compiler API at runtime. This fixes deployment issues in environments like Vercel where workspace dependencies aren't available.
