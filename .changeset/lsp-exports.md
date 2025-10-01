---
'@rsc-xray/analyzer': minor
'@rsc-xray/schemas': minor
'@rsc-xray/lsp-client': minor
---

feat: Export LSP types and all analyzer rules for Pro LSP server integration

- Export all analyzer rule functions for Pro LSP server
- Add LSP diagnostic schema and types to schemas package
- Create lsp-client package with mock and HTTP implementations
- Enable real-time LSP analysis for demo and VS Code integration

This is a breaking change for consumers expecting private APIs, but all new exports are intentional for LSP integration.
