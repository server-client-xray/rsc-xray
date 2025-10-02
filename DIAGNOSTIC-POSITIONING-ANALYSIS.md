# Diagnostic Positioning Analysis

## Summary

Investigated 5 reported diagnostic positioning issues. **Result**: Only 1 analyzer fix needed (✅ completed), the rest are already correct or are demo rendering issues.

## Issues & Resolution

### 1. ✅ `client-size` - Already Fixed

**Reported**: Highlights to end of line  
**Expected**: Highlight only package name  
**Status**: ✅ **ALREADY CORRECT** in analyzer (as of previous PR fixing `duplicate-dependencies`)

The `toDiagnostic` function in `clientSizeThreshold.ts` (lines 67-78) already finds the module specifier (package name string literal) and uses its position:

```typescript
if (firstImport && ts.isImportDeclaration(firstImport)) {
  const moduleSpecifier = firstImport.moduleSpecifier;
  if (ts.isStringLiteral(moduleSpecifier)) {
    const pos = sourceFile.getLineAndCharacterOfPosition(moduleSpecifier.getStart(sourceFile));
    line = pos.line + 1;
    col = pos.character + 1;
  }
}
```

### 2. ✅ `react19-cache` - Fixed in This PR

**Reported**: Only highlights first fetch occurrence  
**Expected**: Highlight ALL duplicate fetch calls  
**Status**: ✅ **FIXED** - Changed from 1 diagnostic (first call) to N diagnostics (all calls)

**Before** (`react19Cache.ts` lines 184-201):

```typescript
for (const [url, calls] of fetchUrls.entries()) {
  if (calls.length > 1) {
    const firstCall = calls[0]; // ❌ Only first call
    suggestions.push(toSuggestion(sourceFile, firstCall, ...));
  }
}
```

**After**:

```typescript
for (const [url, calls] of fetchUrls.entries()) {
  if (calls.length > 1) {
    for (const call of calls) { // ✅ All calls
      suggestions.push(toSuggestion(sourceFile, call, ...));
    }
  }
}
```

**Tests updated**: `react19Cache.test.ts` now expects:

- 2 diagnostics for 2 fetch calls (was 1)
- 5 total diagnostics for 2+3 calls (was 2)

### 3. ℹ️ `serialization-boundary` - Analyzer Correct, Demo Issue

**Reported**: Highlights to end of line  
**Expected**: Highlight only the problematic expression/prop  
**Status**: ℹ️ **ANALYZER IS CORRECT** - This is a demo rendering issue

The `createDiagnostic` function in `serializationBoundary.ts` (lines 34-55) correctly positions on the **expression node** (e.g., `handleClick`), not the entire line:

```typescript
function createDiagnostic(sourceFile: ts.SourceFile, node: ts.Node, ...) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile) // ✅ Points to the expression
  );
  // ...
}

// Called at line 220:
diagnostics.push(createDiagnostic(sourceFile, expression, ...));
```

**Example**:

```tsx
return <ClientButton onClick={handleClick} />;
//                            ^^^^^^^^^^^ ✅ Analyzer positions here
//                                        ❌ Demo highlights to end of line
```

**Root cause**: Demo's `MultiFileCodeViewer.tsx` (line 158) uses `Math.min(20, lineObj.to - position)` which highlights either 20 chars or to end of line, not the actual token length.

### 4. ℹ️ `suspense-boundary` - Analyzer Correct, Demo Issue

**Reported**: Highlights 20 characters (hardcoded)  
**Expected**: Highlight the entire JSX element  
**Status**: ℹ️ **ANALYZER IS CORRECT** - This is a demo rendering issue

The `toSuggestion` function in `suspenseBoundary.ts` (lines 16-67) correctly finds the JSX return statement:

```typescript
function toSuggestion(sourceFile: ts.SourceFile, node: ts.Node, ...) {
  let targetNode = node;

  // Find the JSX return statement instead of function declaration
  if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ...) {
    // ... traverse to find JSX ...
    if (ts.isReturnStatement(n) && n.expression) {
      if (ts.isJsxElement(n.expression) || ts.isJsxSelfClosingElement(n.expression)) {
        targetNode = n.expression; // ✅ Points to JSX element
      }
    }
  }

  const { line, character } = sourceFile.getLineAndCharacterOfPosition(
    targetNode.getStart(sourceFile)
  );
}
```

**Root cause**: Same as #3 - Demo's `MultiFileCodeViewer.tsx` (line 158) uses hardcoded `Math.min(20, lineObj.to - position)`.

**Note**: LSP `Suggestion` type only has `line`/`col` (start position), not end position. To fix in demo, we'd need to either:

1. Add `endLine`/`endCol` to `Suggestion` schema, or
2. Have demo parse the code to find token/JSX end positions

### 5. ✅ `route-config` - Already Correct

**Reported**: Position fixed at first line?  
**Expected**: Position on the specific conflicting config line  
**Status**: ✅ **ANALYZER IS CORRECT** - Uses AST node positions

The `detectConfigConflicts` function in `routeSegmentConfig.ts` uses AST node positions:

```typescript
// Parse config WITH node positions (lines 22-135)
export function parseRouteSegmentConfig(sourceFile: ts.SourceFile): RouteSegmentConfigWithNodes {
  const config: RouteSegmentConfigWithNodes = { nodes: {} };

  for (const declaration of node.declarationList.declarations) {
    const name = declaration.name.getText();
    if (name === 'dynamic') {
      config.dynamic = value;
      config.nodes!.dynamic = declaration; // ✅ Store AST node
    }
    // ... same for revalidate, fetchCache, etc.
  }
}

// Use node positions for diagnostics (lines 189, 212-214, 247, 267-269)
const loc = getLocation(sourceFile, configWithNodes.nodes?.dynamic); // ✅ Points to specific config line
diagnostics.push({
  rule: ROUTE_SEGMENT_CONFIG_CONFLICT_RULE,
  message: 'Route config \'dynamic = "force-dynamic"\' conflicts with ...',
  loc: { file: filePath, ...loc },
});
```

**Example**:

```tsx
export const dynamic = 'force-dynamic'; // ✅ Diagnostic here
export const revalidate = 60; // Not here
```

## Recommendations

### For Analyzer (OSS Repo)

✅ **Done**: `react19-cache` now highlights all duplicate fetch calls

### For Demo (OSS Repo)

🔧 **TODO**: Fix `MultiFileCodeViewer.tsx` highlighting logic (lines 145-159):

**Current** (hardcoded 20 chars or end of line):

```typescript
let highlightLength: number;
if (diag.rule === 'duplicate-dependencies' || diag.rule === 'client-forbidden-import') {
  const stringMatch = lineText.substring(col).match(/^['"]([^'"]+)['"]/);
  if (stringMatch) {
    highlightLength = stringMatch[0].length; // ✅ Smart for imports
  } else {
    highlightLength = Math.min(20, lineObj.to - position); // ❌ Fallback: 20 chars
  }
} else {
  highlightLength = Math.min(20, lineObj.to - position); // ❌ All other rules: 20 chars
}
```

**Proposed** (smart highlighting for all rules):

```typescript
let highlightLength: number;

// Import-related: highlight package name
if (diag.rule === 'duplicate-dependencies' || diag.rule === 'client-forbidden-import') {
  const stringMatch = lineText.substring(col).match(/^['"]([^'"]+)['"]/);
  highlightLength = stringMatch ? stringMatch[0].length : Math.min(20, lineObj.to - position);
}
// JSX-related: highlight to end of tag
else if (
  diag.rule === 'suspense-boundary-missing' ||
  diag.rule === 'suspense-boundary-opportunity'
) {
  // Find closing > or />
  const closingMatch = lineText.substring(col).match(/^[^<]*?(\/?>)/);
  highlightLength = closingMatch ? closingMatch[0].length : Math.min(50, lineObj.to - position);
}
// Expression-related: highlight identifier
else if (diag.rule === 'server-client-serialization-violation') {
  // Find identifier end (alphanumeric, _, $)
  const identMatch = lineText.substring(col).match(/^[\w$]+/);
  highlightLength = identMatch ? identMatch[0].length : Math.min(20, lineObj.to - position);
}
// Config-related: highlight to end of value
else if (diag.rule === 'route-segment-config-conflict') {
  // Find end of assignment (;)
  const configMatch = lineText.substring(col).match(/^[^;]+/);
  highlightLength = configMatch ? configMatch[0].length : Math.min(40, lineObj.to - position);
}
// Default: highlight token or 20 chars
else {
  const tokenMatch = lineText.substring(col).match(/^[\w$]+/);
  highlightLength = tokenMatch ? tokenMatch[0].length : Math.min(20, lineObj.to - position);
}
```

**Alternative**: Extend `Suggestion` schema to include `endLine`/`endCol` and have analyzer provide exact ranges.

## Testing

### Analyzer

✅ All 190 tests pass:

```bash
cd packages/analyzer && pnpm test
```

Key test changes:

- `react19Cache.test.ts`: Updated expectations for multiple diagnostics
  - Line 130: `expect(suggestions).toHaveLength(2)` (was 1)
  - Line 154: `expect(suggestions).toHaveLength(5)` (was 2+)

### Demo

🔧 **TODO**: Test each scenario after fixing `MultiFileCodeViewer.tsx`:

1. `serialization-boundary`: Should highlight `handleClick` only
2. `suspense-boundary`: Should highlight `<AsyncComponent />` fully
3. `client-size`: Should highlight package name (already works)
4. `react19-cache`: Should highlight both fetch calls (needs analyzer republish)
5. `route-config`: Should highlight specific config line (verify working)

## Files Modified

### Analyzer

- ✅ `packages/analyzer/src/rules/react19Cache.ts` (lines 184-203)
- ✅ `packages/analyzer/src/rules/__tests__/react19Cache.test.ts` (lines 130, 154-156)

### Demo

- 🔧 `examples/demo/app/components/MultiFileCodeViewer.tsx` (lines 145-159) - **TODO**

## Conclusion

**Analyzer**: 1 fix completed (`react19-cache`), 4 already correct ✅

**Demo**: Highlighting logic needs enhancement to use smarter token detection instead of hardcoded 20-character limit.

The analyzer is doing its job correctly - it provides accurate `line` and `col` positions for diagnostics. The demo's rendering layer needs to be smarter about how it highlights those positions.
