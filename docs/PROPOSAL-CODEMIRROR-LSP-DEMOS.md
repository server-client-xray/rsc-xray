# Proposal: CodeMirror + LSP Server for Interactive Demos

**Status:** Proposal for evaluation  
**Created:** 2025-10-01  
**Complexity:** Medium-High  
**Value:** High

## Overview

Replace current "running faulty code" demos with CodeMirror-based code editor that shows live diagnostics via LSP server, eliminating the need to actually execute problematic code while providing a more educational experience.

## Current Problems

1. **Serialization demo crashes** - had to add `force-dynamic` hack
2. **Limited diagnostic display** - can't show inline squiggles like VS Code
3. **Single issue per demo** - hard to show multiple diagnostics
4. **No interactivity** - users can't edit code and see diagnostics update
5. **Requires actual execution** - some violations are hard to demo safely

## Proposed Solution

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Demo Page (Next.js)                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │           CodeMirror Editor Component             │  │
│  │  - Syntax highlighting                            │  │
│  │  - Line numbers                                   │  │
│  │  - Diagnostic squiggles (red/yellow underlines)   │  │
│  │  - Hover tooltips                                 │  │
│  │  - Editable code                                  │  │
│  └───────────────────────────────────────────────────┘  │
│                           ↕                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │            LSP Server (API Route)                 │  │
│  │  OSS:  Mock server with hardcoded diagnostics    │  │
│  │  Pro:  Real analyzer integration                  │  │
│  └───────────────────────────────────────────────────┘  │
│                           ↕                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Report Viewer Component                 │  │
│  │  - Shows generated HTML report                    │  │
│  │  - Highlights matching diagnostics                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: OSS Mock LSP (2-3 days)

**Difficulty:** Medium  
**Value:** High

**Tasks:**

- [ ] Set up CodeMirror 6 in Next.js demo app
- [ ] Add TypeScript/TSX language support
- [ ] Create mock LSP API route (`/api/lsp`)
- [ ] Hardcode diagnostic responses per scenario
- [ ] Implement diagnostic rendering (squiggles, tooltips)
- [ ] Add code editing with live diagnostic updates

**Mock LSP Response Format:**

```json
{
  "diagnostics": [
    {
      "range": { "start": { "line": 8, "character": 6 }, "end": { "line": 8, "character": 17 } },
      "severity": "error",
      "code": "server-client-serialization-violation",
      "message": "Function props cannot be passed to client components",
      "source": "rsc-xray"
    }
  ]
}
```

**Benefits:**

- No crashes from running faulty code
- VS Code-like diagnostic experience
- Users can edit code and see diagnostics update
- Easy to add new scenarios (just JSON)

### Phase 2: Report Generation Integration (1-2 days)

**Difficulty:** Easy  
**Value:** Medium

**Tasks:**

- [ ] Add "Generate Report" button
- [ ] Use existing `@rsc-xray/report-html` package
- [ ] Display report in iframe or new tab
- [ ] Link diagnostics in editor to report sections
- [ ] Add "Download model.json" option

**Benefits:**

- Users see exactly what analyzer produces
- Educational: connects code → diagnostics → report
- Demonstrates OSS tool capabilities

### Phase 3: Pro Real LSP Server (5-7 days)

**Difficulty:** High  
**Value:** Very High

**Tasks:**

- [ ] Create `@rsc-xray/pro-lsp-server` package
- [ ] Implement LSP protocol handlers
- [ ] Integrate with `@rsc-xray/analyzer`
- [ ] Real-time TypeScript AST parsing
- [ ] Support incremental updates
- [ ] WebSocket or HTTP streaming for performance

**Pro LSP Architecture:**

```typescript
// packages/pro-lsp-server/src/server.ts
import { analyzeSerializationBoundary } from '@rsc-xray/analyzer';

export class RscXrayLSP {
  async getDiagnostics(params: { uri: string; content: string }): Promise<Diagnostic[]> {
    // Run actual analyzer on code
    const diagnostics = analyzeSerializationBoundary({
      fileName: params.uri,
      sourceText: params.content,
      clientComponents: new Set(['ClientButton']),
    });

    // Convert to LSP format (using new range-based schema)
    return diagnostics.map((d) => ({
      range: {
        start: doc.positionAt(d.loc.range.from),
        end: doc.positionAt(d.loc.range.to),
      },
      severity: d.severity === 'error' ? 1 : 2,
      code: d.rule,
      message: d.message,
      source: 'rsc-xray-pro',
    }));
  }
}
```

**Benefits:**

- Real analyzer integration
- Can be reused in VS Code extension
- Supports all analyzer rules automatically
- True real-time validation

### Phase 4: VS Code Extension Integration (3-4 days)

**Difficulty:** Medium  
**Value:** Very High

**Tasks:**

- [ ] Package LSP server for VS Code
- [ ] Implement VS Code language client
- [ ] Register for TypeScript/TSX files
- [ ] Add configuration for enabling/disabling
- [ ] Test with Pro license gating

**Benefits:**

- Single LSP codebase for demos + VS Code
- Consistent diagnostic experience
- Reduces VS Code extension maintenance

## Technical Stack

### Frontend (Demo Pages)

- **CodeMirror 6** - Modern, extensible code editor
- **@codemirror/lang-javascript** - TypeScript/TSX support
- **@codemirror/lint** - Diagnostic integration
- **@codemirror/view** - UI components

### Backend (LSP Server)

- **Next.js API Routes** - HTTP endpoints for demo
- **vscode-languageserver** - LSP protocol (Pro only)
- **@rsc-xray/analyzer** - Real analysis (Pro only)

### Dependencies

```json
{
  "codemirror": "^6.0.1",
  "@codemirror/lang-javascript": "^6.2.1",
  "@codemirror/lint": "^6.4.2",
  "@codemirror/view": "^6.22.0",
  "vscode-languageserver": "^9.0.1" // Pro only
}
```

## Example: Serialization Boundary Demo

### Before (Current)

```tsx
// Have to actually run faulty code
// Causes runtime errors
// Need force-dynamic hack
export default function Page() {
  const fn = () => console.log('crash');
  return <ClientButton onClick={fn} />; // Crashes!
}
```

### After (CodeMirror + LSP)

```tsx
// Demo Page Component
export default function SerializationBoundaryDemo() {
  const initialCode = `// Server Component
export default function Page() {
  const handleClick = () => {
    console.log('This function will be undefined!');
  };
  
  return (
    <ClientButton 
      onClick={handleClick}  // ❌ Error shown here
      label="Click Me" 
    />
  );
}`;

  return (
    <div>
      <h1>Serialization Boundary Violation</h1>
      <p>Edit the code below and see diagnostics update in real-time</p>

      <CodeMirrorEditor
        initialValue={initialCode}
        lspEndpoint="/api/lsp/serialization"
        scenario="serialization-boundary"
      />

      <button onClick={generateReport}>Generate Report</button>
    </div>
  );
}
```

### User Experience

1. User sees code with red squiggle under `onClick={handleClick}`
2. Hovers over squiggle → tooltip shows error message
3. User can edit code, add/remove violations
4. Diagnostics update in real-time
5. Click "Generate Report" → see full HTML report
6. No crashes, no hacks needed

## Benefits Summary

### User Experience

- ✅ No crashes or runtime errors
- ✅ VS Code-like diagnostic experience
- ✅ Interactive (edit code, see results)
- ✅ Multiple diagnostics per scenario
- ✅ Clear visual feedback

### Development

- ✅ Reusable LSP for VS Code extension
- ✅ Easy to add new scenarios (JSON config)
- ✅ No need for "force-dynamic" hacks
- ✅ Consistent across OSS and Pro

### Educational

- ✅ Shows exactly what analyzer detects
- ✅ Links code → diagnostics → report
- ✅ Users can experiment with fixes
- ✅ Professional, polished demo

## Effort Estimate

| Phase                        | Effort   | Value     | Priority          |
| ---------------------------- | -------- | --------- | ----------------- |
| Phase 1: OSS Mock LSP        | 2-3 days | High      | P0 (Required)     |
| Phase 2: Report Integration  | 1-2 days | Medium    | P1 (Important)    |
| Phase 3: Pro Real LSP        | 5-7 days | Very High | P1 (Important)    |
| Phase 4: VS Code Integration | 3-4 days | Very High | P2 (Nice to have) |

**Total:** 11-16 days for complete implementation  
**MVP (OSS Mock):** 2-3 days

## Risks & Mitigations

### Risk 1: CodeMirror Bundle Size

**Impact:** Demo app bundle increases  
**Mitigation:** Lazy load CodeMirror, code-split per scenario

### Risk 2: LSP Complexity

**Impact:** Difficult to implement correctly  
**Mitigation:** Start with simple mock, iterate to real LSP

### Risk 3: Performance

**Impact:** Real-time analysis might be slow  
**Mitigation:** Debounce updates, use Web Workers, cache results

### Risk 4: Maintenance

**Impact:** Two codebases (mock + real) to maintain  
**Mitigation:** Share diagnostic format, automate mock generation

## Recommendation

**Proceed with phased approach:**

1. **Start with Phase 1 (OSS Mock LSP)** - 2-3 days
   - Immediate value for demos
   - Low risk, proven technology
   - Can be done in parallel with other work

2. **Defer Phase 3 (Pro Real LSP)** until Phase 1 proven
   - Wait for user feedback on mock
   - Ensure it solves the demo problem
   - Re-evaluate ROI after Phase 1

3. **Consider Phase 4 (VS Code Integration)** if Phase 3 successful
   - Only valuable if Pro LSP works well
   - Major selling point for Pro plan

## Alternative: Simpler Approach

If full LSP is too complex, consider:

**Static Diagnostic Overlay (1 day)**

- Pre-render diagnostics as overlays
- No editing, just visual display
- Still use CodeMirror for syntax highlighting
- Hardcode diagnostic positions
- Much simpler, 90% of the value

## Decision

**Status:** Awaiting user approval  
**Recommended:** Start with Phase 1 (OSS Mock LSP)  
**Alternative:** Static diagnostic overlay if LSP too complex
