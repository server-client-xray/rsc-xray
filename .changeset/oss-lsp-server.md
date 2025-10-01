---
'@rsc-xray/lsp-server': minor
---

Add OSS LSP server package as thin wrapper for browser-side usage

- New `@rsc-xray/lsp-server` package for browser-side LSP
- Thin wrapper around `@rsc-xray/analyzer` with 8 basic rules
- Error handling and version metadata
- No rate limiting or caching (browser-side usage only)
- Perfect for interactive demos and CodeMirror/Monaco integration
- 11 comprehensive tests (100% pass)
- Zero server-side dependencies
