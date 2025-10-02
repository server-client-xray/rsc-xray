---
'@rsc-xray/schemas': minor
'@rsc-xray/analyzer': minor
'@rsc-xray/lsp-server': minor
'@rsc-xray/cli': minor
'@rsc-xray/report-html': minor
---

BREAKING: Refactor diagnostic location schema to use character offset ranges

- Changed `DiagnosticLocation` from `{ file, line, col }` to `{ file, range: { from, to } }`
- All analyzer rules now use AST node positions for precise highlighting
- Added `diagnosticHelpers.ts` with `createLocationFromNode()` and related utilities
- Updated CLI, report-html, and lsp-server to use new range format
- Demo CodeMirror integration simplified with direct range consumption

**Migration guide:**

- Replace `diagnostic.loc.line` / `.loc.col` with `diagnostic.loc.range.from` / `.range.to`
- Character offsets are 0-indexed (use `sourceFile.getLineAndCharacterOfPosition()` if line/col needed)
- Benefits: More precise highlighting, no client-side heuristics, cleaner schema
