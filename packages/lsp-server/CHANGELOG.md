# @rsc-xray/lsp-server

## 0.2.0

### Minor Changes

- 46383c4: Add OSS LSP server package as thin wrapper for browser-side usage
  - New `@rsc-xray/lsp-server` package for browser-side LSP
  - Thin wrapper around `@rsc-xray/analyzer` with 8 basic rules
  - Error handling and version metadata
  - No rate limiting or caching (browser-side usage only)
  - Perfect for interactive demos and CodeMirror/Monaco integration
  - 11 comprehensive tests (100% pass)
  - Zero server-side dependencies

### Patch Changes

- Updated dependencies [fef3576]
- Updated dependencies [46383c4]
- Updated dependencies [46383c4]
  - @rsc-xray/analyzer@0.7.0
  - @rsc-xray/schemas@0.7.0
