# Analysis: Adding TypeScript & React Diagnostics to Demo

**Date:** October 2, 2025  
**Status:** Feasibility Analysis (Not Implemented)

---

## Overview

Should the RSC X-Ray interactive demo include standard TypeScript and React diagnostics alongside RSC-specific diagnostics to provide a more realistic IDE-like experience?

---

## Current State

**What We Have:**

- RSC X-Ray diagnostics only (`client-forbidden-import`, `suspense-boundary-missing`, etc.)
- Clean, focused experience showing only RSC-specific issues
- Lightweight: ~100KB CodeMirror bundle

**What's Missing:**

- No TypeScript type checking (e.g., `Cannot find name 'useState'`, type mismatches)
- No React-specific linting (e.g., missing dependencies in `useEffect`)
- No general JavaScript errors (e.g., undefined variables, syntax errors)

---

## User Experience Considerations

### ✅ **Pros of Adding TS/React Diagnostics**

1. **More Realistic Environment**
   - Mimics VS Code / IDE experience users are familiar with
   - Shows how RSC X-Ray diagnostics appear _alongside_ normal errors
   - Educational: demonstrates RSC X-Ray augments existing tools

2. **Better Demo Scenarios**
   - Users can see RSC X-Ray catches RSC-specific issues that TS can't
   - Side-by-side comparison: "TS says this is valid, but RSC X-Ray warns about serialization"
   - Validates RSC X-Ray's unique value proposition

3. **Interactive Fixes**
   - Users could introduce TypeScript errors and see both types of feedback
   - More engaging "try to fix" workflow
   - Shows RSC X-Ray doesn't replace linters, it complements them

### ❌ **Cons of Adding TS/React Diagnostics**

1. **Noise / Distraction**
   - Too many red squiggles might overwhelm users
   - Harder to focus on RSC X-Ray's unique diagnostics
   - Could confuse: "Is this RSC X-Ray or TypeScript?"

2. **Bundle Size Concerns**
   - TypeScript compiler: ~10MB (though we can use web worker)
   - Would significantly increase demo bundle
   - Slower initial load time

3. **Complexity**
   - Need to manage two separate linting systems
   - Merge diagnostics from multiple sources
   - Handle conflicting advice

---

## Technical Feasibility

### **Option 1: Full TypeScript Language Service (Heavy)**

**Implementation:**

```typescript
import * as ts from 'typescript';

// Create virtual file system
const files = new Map([['demo.tsx', code]]);

// Create TypeScript language service
const servicesHost: ts.LanguageServiceHost = {
  getScriptFileNames: () => ['demo.tsx'],
  getScriptVersion: () => '1',
  getScriptSnapshot: (fileName) => {
    const text = files.get(fileName);
    return text ? ts.ScriptSnapshot.fromString(text) : undefined;
  },
  getCurrentDirectory: () => '/',
  getCompilationSettings: () => ({
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
  }),
  getDefaultLibFileName: ts.getDefaultLibFilePath,
  fileExists: (path) => files.has(path),
  readFile: (path) => files.get(path),
};

const languageService = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
const diagnostics = languageService.getSemanticDiagnostics('demo.tsx');
```

**Pros:**

- Full TypeScript type checking (most accurate)
- Supports all TS features (types, generics, inference)

**Cons:**

- **Bundle size**: ~10MB (TypeScript compiler)
- **Performance**: Slower analysis (full type checking)
- **Complexity**: Need to set up virtual file system, lib files
- **Memory**: High memory usage for web context

**Verdict:** ❌ **Not Recommended** — Too heavy for a lightweight demo

---

### **Option 2: Quick-Check Linter (Medium)**

**Implementation:**

```typescript
import { ESLint } from 'eslint'; // Web bundle available

const eslint = new ESLint({
  baseConfig: {
    parser: '@typescript-eslint/parser',
    plugins: ['react', 'react-hooks', '@typescript-eslint'],
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },
  useEslintrc: false,
});

const results = await eslint.lintText(code, { filePath: 'demo.tsx' });
```

**Pros:**

- **Moderate bundle size**: ~1-2MB (ESLint + plugins)
- **Fast**: Rule-based, no full type checking
- **Familiar**: Same rules developers use daily
- **Configurable**: Can enable/disable specific rules

**Cons:**

- **Still significant**: 1-2MB is 10-20x current bundle
- **Limited**: No full type inference
- **Setup**: Need to bundle ESLint for web

**Verdict:** ⚠️ **Possible but Heavy** — Adds significant weight

---

### **Option 3: Hardcoded "Fake" Diagnostics (Light)**

**Implementation:**

```typescript
// Define expected diagnostics per scenario
const scenarioDiagnostics = {
  'serialization-boundary': [
    // RSC X-Ray diagnostics (real)
    { rule: 'server-client-serialization-violation', ... },

    // TypeScript diagnostics (hardcoded for demo)
    {
      line: 15,
      message: "Type 'Date' is not assignable to type 'string | number'",
      severity: 'error',
      source: 'TypeScript',
    },
  ],
};
```

**Pros:**

- **Zero bundle impact**: No additional libraries
- **Curated**: Show only relevant diagnostics
- **Fast**: No analysis needed
- **Controlled**: Perfect demo experience

**Cons:**

- **Not interactive**: Won't update when user edits
- **Deceptive**: Might mislead users about capabilities
- **Maintenance**: Need to manually add for each scenario

**Verdict:** ⚠️ **Quick Win but Limited** — Good for specific demos, not general use

---

### **Option 4: Server-Side TypeScript Checking**

**Implementation:**

```typescript
// In /api/analyze route
import * as ts from 'typescript';

// Run TypeScript checking on server
const program = ts.createProgram(['demo.tsx'], compilerOptions, host);
const tsDiagnostics = ts.getPreEmitDiagnostics(program);

// Merge with RSC X-Ray diagnostics
return {
  diagnostics: [...rscXrayDiagnostics, ...tsDiagnostics],
};
```

**Pros:**

- **Zero client bundle**: TypeScript runs server-side
- **Full type checking**: Accurate diagnostics
- **Existing infrastructure**: Already have API route

**Cons:**

- **Server load**: Each edit triggers server-side TS compilation
- **Latency**: Network round-trip for diagnostics
- **Complexity**: Need to set up TS compiler on server
- **Cost**: More server compute per request

**Verdict:** ✅ **Best Tradeoff** — Leverages existing server-side analysis

---

## Recommendation

### **Recommended Approach: Option 4 (Server-Side TypeScript)**

**Why:**

1. **Zero bundle impact** — TypeScript stays server-side
2. **Leverages existing API route** — Already have `/api/analyze`
3. **Full type checking** — Most accurate
4. **Consistent UX** — Same 300ms debounce as RSC X-Ray

**Implementation Plan:**

1. **Update `/api/analyze` route:**

   ```typescript
   import * as ts from 'typescript';
   import { analyze as rscAnalyze } from '@rsc-xray/lsp-server';

   // Run RSC X-Ray analysis
   const rscResult = await rscAnalyze({ code, ... });

   // Run TypeScript analysis
   const tsHost = createVirtualHost({ 'demo.tsx': code });
   const program = ts.createProgram(['demo.tsx'], compilerOptions, tsHost);
   const tsDiagnostics = ts.getPreEmitDiagnostics(program).map(formatDiagnostic);

   // Merge diagnostics (RSC X-Ray first for visual priority)
   return {
     diagnostics: [...rscResult.diagnostics, ...tsDiagnostics],
     duration: rscResult.duration,
   };
   ```

2. **Visual Distinction in CodeMirror:**
   - RSC X-Ray diagnostics: **Red squiggles** with `[RSC]` prefix
   - TypeScript diagnostics: **Blue squiggles** with `[TS]` prefix
   - Differentiate by color so users see RSC X-Ray's unique value

3. **Optional Toggle:**
   - Add checkbox: "Show TypeScript diagnostics"
   - Default: **Off** (RSC X-Ray only)
   - Users can enable for more realistic experience

**Effort Estimate:** 2-3 days

- 1 day: Set up TS compiler in API route with virtual host
- 1 day: Merge diagnostics, add visual distinction
- Half day: Add toggle UI, testing

---

## Alternative: Phased Rollout

### **Phase 1 (Current): RSC X-Ray Only** ✅ **Complete**

- Clean, focused experience
- Demonstrates unique value
- Lightweight bundle

### **Phase 2 (Optional): Server-Side TypeScript**

- Add TypeScript diagnostics via API
- Toggle to enable/disable
- Maintains zero bundle impact

### **Phase 3 (Future): ESLint Rules**

- Add React Hooks linting server-side
- Show `exhaustive-deps` warnings
- Further demonstrates comprehensive tooling

---

## Conclusion

### **Should We Add TS/React Diagnostics?**

**Answer: Yes, via server-side TypeScript (Option 4), but make it optional.**

**Rationale:**

1. **Educational Value**: Shows RSC X-Ray's unique diagnostics alongside familiar TypeScript errors
2. **Zero Bundle Impact**: Keeps client lightweight
3. **User Choice**: Optional toggle respects different use cases
4. **Realistic**: Mimics real IDE experience where multiple linters coexist

**Default State**: TypeScript diagnostics **OFF**

- Let RSC X-Ray shine without noise
- Users can enable for realistic IDE simulation

**Implementation Priority**: Medium

- Nice-to-have enhancement, not critical path
- Current demo already effective at showing value
- Best done after M6 visual assets (higher priority per roadmap)

---

## Technical Notes

### TypeScript Virtual File System

```typescript
function createVirtualHost(files: Record<string, string>): ts.CompilerHost {
  return {
    fileExists: (fileName) => fileName in files,
    readFile: (fileName) => files[fileName],
    writeFile: () => {},
    getCurrentDirectory: () => '/',
    getCanonicalFileName: (fileName) => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    getSourceFile: (fileName, languageVersion) => {
      const sourceText = files[fileName];
      return sourceText !== undefined
        ? ts.createSourceFile(fileName, sourceText, languageVersion)
        : undefined;
    },
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
  };
}
```

### Diagnostic Formatting

```typescript
function formatTsDiagnostic(tsDiag: ts.Diagnostic): RscXrayDiagnostic {
  const start = ts.getLineAndCharacterOfPosition(tsDiag.file!, tsDiag.start!);

  return {
    rule: 'typescript',
    level: tsDiag.category === ts.DiagnosticCategory.Error ? 'error' : 'warning',
    message: `[TS] ${ts.flattenDiagnosticMessageText(tsDiag.messageText, '\n')}`,
    loc: {
      file: 'demo.tsx',
      line: start.line + 1,
      col: start.character + 1,
    },
  };
}
```

---

## Related Tasks

- **M6 T6.1**: Responsive demo mobile layout (higher priority)
- **M6 T6.6**: Visual assets for discovery (higher priority)
- **Future**: Enhanced troubleshooting guides (could include TS diagnostic examples)

---

**Decision**: Defer to post-M6. Focus on visual polish and discovery first.
