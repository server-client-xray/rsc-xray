# @rsc-xray/lsp-server

[![npm](https://img.shields.io/npm/v/@rsc-xray/lsp-server.svg)](https://www.npmjs.com/package/@rsc-xray/lsp-server)
[![Downloads](https://img.shields.io/npm/dm/@rsc-xray/lsp-server.svg)](https://www.npmjs.com/package/@rsc-xray/lsp-server)

**Universal LSP wrapper for React Server Components analysis**

This package provides a thin wrapper around the OSS `@rsc-xray/analyzer` for Language Server Protocol (LSP) usage. It works in **browser, Node.js, VS Code extensions, and GitHub Actions** with 8 essential correctness rules.

**Used by**: OSS Demo, Pro Overlay, Pro VS Code, Pro CI

For Pro features (overlay visualization, VS Code integration, CI automation), see [rsc-xray.dev/pro](https://rsc-xray.dev/pro).

---

## Features

### 8 Essential Rules (Free Forever)

| Rule                                    | Description                                       |
| --------------------------------------- | ------------------------------------------------- |
| `client-forbidden-import`               | Detects Node.js imports in client components      |
| `suspense-boundary-missing`             | Finds async components without Suspense           |
| `suspense-boundary-opportunity`         | Suggests parallel Suspense opportunities          |
| `client-component-oversized`            | Warns about large client bundles (>50KB)          |
| `duplicate-dependencies`                | Finds shared dependencies bundled multiple times  |
| `react19-cache-opportunity`             | Suggests React 19 cache() API usage               |
| `route-segment-config-conflict`         | Detects Next.js route config conflicts            |
| `server-client-serialization-violation` | Finds non-serializable props to client components |

---

## Installation

```bash
npm install @rsc-xray/lsp-server
```

---

## Usage

### Basic Analysis

```typescript
import { analyze } from '@rsc-xray/lsp-server';

const result = await analyze({
  code: `
    'use client';
    import fs from 'fs';
    
    export default function BadClient() {
      fs.readFileSync('file.txt');
      return <div>Client</div>;
    }
  `,
  fileName: 'components/BadClient.tsx',
});

console.log(result.diagnostics);
// [
//   {
//     rule: 'client-forbidden-import',
//     message: 'Client components cannot import Node.js built-ins like "fs"',
//     severity: 'error',
//     line: 2,
//     column: 8,
//     ...
//   }
// ]
```

### With Scenario Filter

```typescript
const result = await analyze({
  code: serverComponentCode,
  fileName: 'app/page.tsx',
  scenario: 'serialization-boundary', // Only run this specific scenario
});
```

### With Rule Filter

```typescript
const result = await analyze({
  code: clientComponentCode,
  fileName: 'components/Button.tsx',
  rules: ['client-forbidden-import', 'client-component-oversized'], // Only these rules
});
```

### With Context

```typescript
const result = await analyze({
  code: routeCode,
  fileName: 'app/page.tsx',
  context: {
    clientComponentPaths: ['./ClientButton', './Chart'],
    routeConfig: {
      dynamic: 'force-static',
      revalidate: 60,
    },
  },
});
```

---

## API Reference

### `analyze(request: LspAnalysisRequest): Promise<LspAnalysisResponse>`

Main analysis entry point.

**Parameters:**

```typescript
interface LspAnalysisRequest {
  /** Source code to analyze */
  code: string;

  /** File name (for determining .ts vs .tsx and diagnostics) */
  fileName: string;

  /** Specific scenario to analyze (if omitted, runs all applicable rules) */
  scenario?:
    | 'serialization-boundary'
    | 'suspense-boundary'
    | 'react19-cache'
    | 'client-size'
    | 'client-forbidden-imports'
    | 'route-config';

  /** Specific rule IDs to run (if omitted, runs all applicable rules) */
  rules?: string[];

  /** Additional context for rules that need it */
  context?: {
    clientBundles?: ClientComponentBundle[];
    routeConfig?: RouteSegmentConfig;
    reactVersion?: string;
    clientComponentPaths?: string[];
  };
}
```

**Returns:**

```typescript
interface LspAnalysisResponse {
  /** Diagnostics and suggestions found */
  diagnostics: Array<Diagnostic | Suggestion>;

  /** Analysis duration in milliseconds */
  duration: number;

  /** Rules that were executed */
  rulesExecuted: string[];

  /** Version of the analyzer */
  version: string;

  /** Error information */
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

---

## Use Cases

### Interactive Browser Demo

```typescript
// Perfect for Svelte-style tutorial interfaces
import { analyze } from '@rsc-xray/lsp-server';

function handleCodeChange(code: string) {
  const result = await analyze({
    code,
    fileName: 'demo.tsx',
  });

  displayDiagnostics(result.diagnostics);
}
```

### CodeMirror Integration

```typescript
import { analyze } from '@rsc-xray/lsp-server';
import { EditorView, Decoration } from '@codemirror/view';

async function lintCode(code: string) {
  const result = await analyze({ code, fileName: 'page.tsx' });

  return result.diagnostics.map((d) => ({
    from: getOffset(d.line, d.column),
    to: getOffset(d.endLine || d.line, d.endColumn || d.column),
    severity: d.severity,
    message: d.message,
  }));
}
```

### Monaco Editor Integration

```typescript
import * as monaco from 'monaco-editor';
import { analyze } from '@rsc-xray/lsp-server';

monaco.languages.registerCodeLensProvider('typescript', {
  async provideCodeLenses(model) {
    const code = model.getValue();
    const result = await analyze({ code, fileName: model.uri.path });

    return {
      lenses: result.diagnostics.map((d) => ({
        range: new monaco.Range(d.line, d.column, d.line, d.column),
        command: {
          id: 'show-diagnostic',
          title: d.message,
        },
      })),
    };
  },
});
```

---

## Architecture

This package is a **thin orchestration layer** (DRY principle):

```
┌─────────────────────────────────────────────┐
│  @rsc-xray/lsp-server                       │
│  - Error handling wrapper                   │
│  - Version metadata                         │
│  - Consistent API shape                     │
│  - Type safety                              │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  @rsc-xray/analyzer                         │
│  - 8 OSS analysis rules                     │
│  - AST parsing                              │
│  - Diagnostic generation                    │
└─────────────────────────────────────────────┘
```

**Design Principles:**

- ✅ **Universal**: Works in browser, Node.js, VS Code, GitHub Actions
- ✅ **DRY**: Single orchestration layer for all consumers
- ✅ **Simple**: Pure JavaScript, no server/auth/caching (keep it simple!)
- ✅ **Consistent**: All consumers get same response format
- ✅ **Tested**: 11 comprehensive tests ensure reliability

**Used By:**

1. **OSS Demo**: Browser-side interactive tutorial
2. **Pro Overlay**: Node.js-based development server visualization
3. **Pro VS Code**: Extension host analysis
4. **Pro CI**: GitHub Actions budget enforcement

---

## Upgrading to Pro

For server-side deployment with advanced features, upgrade to `@rsc-xray/pro-lsp-server`:

### Pro Features

- 🚀 **8 Advanced Performance Rules**
  - Route waterfall analysis
  - Cache invalidation tracking
  - ISR/PPR policy optimization
  - Dynamic rendering detection
  - And more!

- 🔒 **Server-Side Deployment**
  - Rate limiting (demo and customer modes)
  - Redis caching
  - License validation
  - Enterprise privacy mode

- 🎨 **Visual Overlay**
  - Live diagnostics in your browser
  - Performance metrics
  - Cache visualization

- 💻 **VS Code Extension**
  - Inline diagnostics
  - Quick fixes
  - Auto-refactoring

### Installation

```bash
# Configure private registry
echo "@rsc-xray:registry=https://npm.pkg.github.com" >> .npmrc

# Install Pro packages
npm install @rsc-xray/pro-lsp-server
```

### Usage

```typescript
import { analyze } from '@rsc-xray/pro-lsp-server';

const result = await analyze({
  code: routeCode,
  fileName: 'app/page.tsx',
  license: process.env.LICENSE_KEY, // Pro license required
});

// Now includes Pro rules:
// - route-waterfall
// - cache-tag-impact
// - cache-policy-mismatch
// - static-dynamic-mismatch
// - And more!
```

---

## Testing

```typescript
import { analyze } from '@rsc-xray/lsp-server';
import { describe, it, expect } from 'vitest';

describe('LSP Server', () => {
  it('should detect forbidden imports', async () => {
    const result = await analyze({
      code: `'use client';\nimport fs from 'fs';`,
      fileName: 'components/Bad.tsx',
    });

    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].rule).toBe('client-forbidden-import');
  });
});
```

---

## License

MIT

## Support

- Documentation: https://rsc-xray.dev/docs
- Issues: https://github.com/rsc-xray/rsc-xray/issues
- Pro Support: https://rsc-xray.dev/support

---

**Made with ❤️ for the React Server Components community**
