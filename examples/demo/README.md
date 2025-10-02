# RSC X-Ray Interactive Demo

Interactive tutorial for learning React Server Components analysis with a split-panel interface.

## Architecture

- **Server-side LSP analysis** via Next.js API route (`/api/analyze`)
  - Uses `@rsc-xray/lsp-server` and `@rsc-xray/analyzer`
  - Required due to Node.js API dependencies (fs, vm, path)
  - Still provides real-time UX with 300ms debounce
- **CodeMirror 6** for lightweight, fast editing experience (~100KB vs Monaco's 2MB)
- Split-panel layout: explanation (left) + code editor (right)
- Real-time diagnostics with red/yellow squiggles
- Scenario selector with categorized violations (8 scenarios: 7 OSS + 1 Pro teaser)
- Pro feature teasers with visual replicas (safe for OSS)
- Deep linking support (`?scenario=...&line=...`)
- Light/dark mode adaptive theming

## Development

```bash
# Install dependencies (from monorepo root)
pnpm install

# Start dev server
cd examples/demo
pnpm dev
```

Visit http://localhost:3001

## Dependencies

This demo uses workspace dependencies (no npm publishing required for deployment):

- `@rsc-xray/lsp-server@workspace:*` - LSP orchestration layer
- `@rsc-xray/schemas@workspace:*` - Type definitions
- `@rsc-xray/analyzer` (transitive) - Core analysis engine

Vercel resolves workspace packages via `pnpm-workspace.yaml` and `pnpm-lock.yaml`.
During local development, workspace packages are linked automatically.

## Editor Choice: CodeMirror 6

**Why not Monaco (VSCode editor)?**

- Monaco: ~2MB bundle, slower load, complex setup
- CodeMirror: ~100KB bundle, fast, simple
- **Winner: CodeMirror** for tutorial performance

## Deployment

**Live Demo**: [demo.rsc-xray.dev](https://demo.rsc-xray.dev) (or rsc-xray-demo.vercel.app)

Deployed via Vercel with automatic deployments:
- **Production**: Merges to `main` branch
- **Preview**: Every PR

```bash
# Build for production
pnpm build

# Preview locally
pnpm start

# Deploy via Vercel CLI
vercel          # Preview
vercel --prod   # Production
```

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide.**

## Testing

```bash
# Run unit tests (28 tests)
pnpm test

# Run E2E tests (5 smoke tests with Playwright)
pnpm test:e2e

# Run E2E with UI
pnpm test:e2e:ui
```

## Features

### Implemented (T1.15.1-8)

- ✅ Split-panel layout (40% explanation / 60% code)
- ✅ Scenario selector with 8 scenarios (7 OSS + 1 Pro)
- ✅ Server-side LSP analysis via API route
- ✅ CodeMirror 6 editor with real-time diagnostics
- ✅ Status bar with analysis metrics (duration, count)
- ✅ Deep linking (`?scenario=...&line=...`)
- ✅ Pro feature teasers (4 visual replicas: Boundary Tree, Cache Lens, Flight Timeline, Hydration)
- ✅ Light/dark mode theming
- ✅ E2E test setup (Playwright)
- ✅ Vercel deployment

### Pending (T1.15.9)

- ⏳ Responsive mobile layout (stacked panels, tabs)

## References

- Design spec: `/rsc-xray-pro/docs/DEMO-UX-DESIGN.md`
- LSP integration: `/rsc-xray/docs/PROPOSAL-CODEMIRROR-LSP-DEMOS.md`
- Issue: https://github.com/rsc-xray/rsc-xray/issues/133
