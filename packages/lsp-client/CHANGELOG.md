# @rsc-xray/lsp-client

## 0.3.0

### Minor Changes

- a6bc3fd: feat: Export LSP types and all analyzer rules for Pro LSP server integration
  - Export all analyzer rule functions for Pro LSP server
  - Add LSP diagnostic schema and types to schemas package
  - Create lsp-client package with mock and HTTP implementations
  - Enable real-time LSP analysis for demo and VS Code integration

  This is a breaking change for consumers expecting private APIs, but all new exports are intentional for LSP integration.

### Patch Changes

- Updated dependencies [a6bc3fd]
  - @rsc-xray/schemas@0.6.0

## 0.2.0

### Minor Changes

- feat: Export LSP types and all analyzer rules for Pro LSP server integration
  - Export all analyzer rule functions for Pro LSP server
  - Add LSP diagnostic schema and types to schemas package
  - Create lsp-client package with mock and HTTP implementations
  - Enable real-time LSP analysis for demo and VS Code integration

  This is a breaking change for consumers expecting private APIs, but all new exports are intentional for LSP integration.

### Patch Changes

- Updated dependencies
  - @rsc-xray/schemas@0.5.0
