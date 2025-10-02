# RSC X-Ray Interactive Demo

Interactive tutorial for learning React Server Components analysis with a split-panel interface.

## Architecture

- **Browser-side LSP analysis** using `@rsc-xray/lsp-server` (no server needed!)
- **CodeMirror 6** for lightweight, fast editing experience
- Split-panel layout: explanation (left) + code editor (right)
- Real-time diagnostics with 500ms debounce
- Scenario selector with categorized violations
- Pro feature teasers and upgrade CTAs

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

This demo requires published versions of:

- `@rsc-xray/lsp-server@^0.2.0`
- `@rsc-xray/schemas@^0.6.5`

**Before deployment:**

1. Ensure PR #132 (vitest fix) is merged ✅
2. Ensure PR #131 (changeset release) is merged to publish packages
3. Verify packages are available on npm

During local development, `workspace:` protocol uses local packages automatically.

## Editor Choice: CodeMirror 6

**Why not Monaco (VSCode editor)?**

- Monaco: ~2MB bundle, slower load, complex setup
- CodeMirror: ~100KB bundle, fast, simple
- **Winner: CodeMirror** for tutorial performance

## Deployment

Deploys to **demo.rsc-xray.dev** from OSS repo via Vercel.

```bash
# Build for production
pnpm build

# Preview locally
pnpm start
```

## Testing

```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e
```

## Features

### Current

- Split-panel layout with responsive design
- Scenario selector dropdown
- Browser-side LSP analysis (real-time)
- CodeMirror editor with diagnostics
- Status bar with analysis metrics
- Deep linking support

### Pro Teasers

- Advanced performance rules (Pro badge)
- VS Code extension promo
- Pro overlay visualization
- Upgrade CTAs throughout

## References

- Design spec: `/rsc-xray-pro/docs/DEMO-UX-DESIGN.md`
- LSP integration: `/rsc-xray/docs/PROPOSAL-CODEMIRROR-LSP-DEMOS.md`
- Issue: https://github.com/rsc-xray/rsc-xray/issues/133
