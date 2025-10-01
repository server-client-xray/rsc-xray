# @rsc-xray/lsp-client

LSP client with both mock (OSS) and real (Pro) implementations.

## Features

- **Mock LSP Client:** Hardcoded diagnostics for OSS demo (no real analysis)
- **HTTP LSP Client:** Calls real LSP API for Pro demo
- **Auto-detection:** Automatically chooses implementation based on environment
- **Type-safe:** Full TypeScript support with shared types from `@rsc-xray/schemas`

## Installation

```bash
pnpm add @rsc-xray/lsp-client
```

## Usage

### Auto-detect (Recommended)

```typescript
import { createLspClient } from '@rsc-xray/lsp-client';

// Automatically uses mock or HTTP based on NEXT_PUBLIC_LSP_API_URL
const client = createLspClient({ type: 'auto' });

const result = await client.analyze({
  code: `
    "use client";
    export function Button({ onClick }) {
      return <button onClick={onClick}>Click</button>;
    }
  `,
  fileName: 'Button.tsx',
  scenario: 'serialization-boundary',
});

console.log(result.diagnostics);
// [{ rule: 'server-client-serialization-violation', ... }]
```

### Explicit Mock Client (OSS Demo)

```typescript
import { createLspClient } from '@rsc-xray/lsp-client';

const client = createLspClient({ type: 'mock' });

// Returns hardcoded diagnostics based on code patterns
const result = await client.analyze({
  code: '...',
  fileName: 'demo.tsx',
});
```

### Explicit HTTP Client (Pro Demo)

```typescript
import { createLspClient } from '@rsc-xray/lsp-client';

const client = createLspClient({
  type: 'http',
  http: {
    apiUrl: '/api/lsp', // Or https://demo-pro.rsc-xray.dev/api/lsp
    timeout: 10000,
  },
});

// Calls real LSP API for analysis
const result = await client.analyze({
  code: '...',
  fileName: 'demo.tsx',
});
```

## Environment Variables

### For Auto-detection

Set `NEXT_PUBLIC_LSP_API_URL` to enable HTTP client:

```env
# OSS demo (uses mock)
# No env var needed

# Pro demo (uses real API)
NEXT_PUBLIC_LSP_API_URL=/api/lsp
```

## Architecture

```
┌─────────────────────────────────────┐
│   @rsc-xray/lsp-client              │
├─────────────────────────────────────┤
│                                     │
│  createLspClient({ type: 'auto' }) │
│           │                         │
│           ├─→ MockLspClient         │
│           │   (OSS: hardcoded)      │
│           │                         │
│           └─→ HttpLspClient         │
│               (Pro: real API)       │
│                                     │
└─────────────────────────────────────┘
```

## Mock Diagnostics

The Mock LSP Client detects patterns in code and returns hardcoded diagnostics:

| Pattern                                | Diagnostic                              |
| -------------------------------------- | --------------------------------------- |
| `onClick={...}` in client component    | `server-client-serialization-violation` |
| `async function` without `<Suspense>`  | `suspense-boundary-missing`             |
| `fetch()` without `cache()`            | `react19-cache-opportunity`             |
| Large client component                 | `client-component-oversized`            |
| `import fs` in client component        | `client-forbidden-import`               |
| Multiple `await` without `Promise.all` | `server-promise-all`                    |
| Conflicting route config               | `route-segment-config-conflict`         |

## Deployment Strategies

### Option A: Same Code, Different Deployments

Deploy the same demo app twice:

```bash
# OSS demo (uses mock LSP)
vercel --prod --env NEXT_PUBLIC_LSP_API_URL=""
→ demo.rsc-xray.dev

# Pro demo (uses real LSP API)
vercel --prod --env NEXT_PUBLIC_LSP_API_URL="/api/lsp"
→ demo-pro.rsc-xray.dev
```

### Option B: Conditional Features

Show "Upgrade to Pro" CTA in OSS demo:

```tsx
import { isRealLspAvailable } from '@rsc-xray/lsp-client';

export function DemoBanner() {
  const isProDemo = isRealLspAvailable();

  if (isProDemo) {
    return <div>✨ Pro Preview - Real-time Analysis</div>;
  }

  return (
    <div>
      📢 Mock Analysis - <a href="https://demo-pro.rsc-xray.dev">Try Pro</a>
    </div>
  );
}
```

## API

### `createLspClient(config?)`

Create an LSP client instance.

**Parameters:**

- `config.type`: `'mock' | 'http' | 'auto'` (default: `'auto'`)
- `config.http.apiUrl`: API endpoint URL (required for `'http'` type)
- `config.http.timeout`: Request timeout in ms (default: `10000`)
- `config.http.headers`: Custom HTTP headers

**Returns:** `ILspClient`

### `ILspClient`

```typescript
interface ILspClient {
  analyze(request: LspAnalysisRequest): Promise<LspAnalysisResponse>;
  isMock(): boolean;
  getType(): 'mock' | 'http';
}
```

### `isRealLspAvailable()`

Check if real LSP API is configured.

**Returns:** `boolean`

## Testing

```bash
pnpm test
```

## License

MIT
