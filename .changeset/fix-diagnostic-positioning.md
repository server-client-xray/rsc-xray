---
'@rsc-xray/analyzer': patch
'@rsc-xray/lsp-server': patch
---

fix(analyzer): Use AST positions for client-size diagnostics

Fixed duplicate-dependencies and client-component-oversized diagnostics to use actual AST positions instead of hardcoded line 1, col 1. Now correctly points to the first import statement regardless of 'use client' directives or comments above.
