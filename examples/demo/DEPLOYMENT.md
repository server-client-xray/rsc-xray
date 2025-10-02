# RSC X-Ray Demo - Deployment Guide

## Overview

The RSC X-Ray interactive demo is deployed to Vercel and accessible at:
- **Production**: `https://rsc-xray-demo.vercel.app` (or custom domain `demo.rsc-xray.dev`)
- **Preview**: Auto-deployed for every PR

## Architecture

### Hosting: Vercel
- **Framework**: Next.js 15 with App Router
- **Runtime**: Node.js 20.x
- **Build**: Static + Server-Side API routes
- **Deployment**: Automatic via GitHub integration

### Key Features
- **Browser-side UI**: Static React components + CodeMirror
- **Server-side LSP**: Next.js API route (`/api/analyze`) for RSC analysis
- **Workspace dependencies**: `@rsc-xray/lsp-server` and `@rsc-xray/schemas`
- **No database**: Fully stateless, no persistent storage needed

## Vercel Configuration

### Project Settings

**Build & Development Settings:**
```
Root Directory: examples/demo
Framework Preset: Next.js
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install (from monorepo root)
Development Command: pnpm dev
```

**Environment Variables:**
- None required (stateless application)

### Deployment Triggers
- **Production**: Merges to `main` branch
- **Preview**: Every PR (auto-deploys)
- **Branches**: Can manually deploy any branch

## Deployment Workflow

### Automatic (Recommended)
1. Make changes in `examples/demo/`
2. Open PR (Vercel auto-deploys preview)
3. Review preview deployment
4. Merge to `main` (triggers production deploy)

### Manual (via Vercel CLI)
```bash
cd examples/demo
pnpm vercel          # Preview
pnpm vercel --prod   # Production
```

## Workspace Dependencies

The demo depends on workspace packages:
- `@rsc-xray/lsp-server` - LSP analysis orchestration
- `@rsc-xray/schemas` - Type definitions
- `@rsc-xray/analyzer` (transitive) - Core analysis engine

### Important: Package Resolution

Vercel must resolve workspace dependencies correctly:

1. **pnpm-workspace.yaml** in repo root defines packages
2. **pnpm-lock.yaml** pins all dependencies (including workspace:*)
3. Vercel runs `pnpm install` from root, resolving workspace packages
4. Next.js `transpilePackages` config ensures workspace packages are bundled

```js
// next.config.js
transpilePackages: ['@rsc-xray/lsp-server', '@rsc-xray/schemas'],
```

## Build Process

```
1. pnpm install (root) → Installs all workspace packages
2. Build workspace deps (@rsc-xray/lsp-server, @rsc-xray/schemas)
3. next build (examples/demo) → Builds demo app
4. Static pages generated, API routes bundled
5. Deploy to Vercel Edge Network
```

## Deployment Checklist

Before deploying major changes:

- [ ] Test locally: `pnpm dev` (port 3001)
- [ ] Run unit tests: `pnpm test`
- [ ] Run lint: `pnpm lint`
- [ ] Build succeeds: `pnpm build`
- [ ] Preview deploy works (PR)
- [ ] Check Vercel logs for errors
- [ ] Verify all scenarios load
- [ ] Test deep linking (`?scenario=...`)
- [ ] Check Pro modals open
- [ ] Mobile responsive (if implemented)

## Monitoring & Logs

### Vercel Dashboard
- **Deployments**: View history, status, URLs
- **Logs**: Real-time function logs for API routes
- **Analytics**: Page views, performance metrics
- **Errors**: Automatic error tracking

### Key Metrics to Monitor
- **Build time**: Should be < 2 minutes
- **Bundle size**: Main chunk ~175KB (acceptable for demo)
- **API latency**: `/api/analyze` should be < 500ms
- **Success rate**: 99%+ (stateless, no external deps)

## Troubleshooting

### Build Failures

**Issue**: `Cannot find module '@rsc-xray/lsp-server'`
- **Cause**: Workspace dependency not resolved
- **Fix**: Ensure `pnpm-lock.yaml` is committed and `pnpm-workspace.yaml` exists

**Issue**: `Module not found: Can't resolve '@rsc-xray/analyzer'`
- **Cause**: Transitive dep not transpiled
- **Fix**: Add to `transpilePackages` in `next.config.js`

**Issue**: Next.js build fails with TypeScript errors
- **Cause**: Type errors in components
- **Fix**: Run `pnpm build` locally, fix errors, commit

### Runtime Errors

**Issue**: `/api/analyze` returns 500
- **Cause**: LSP analyzer crash (invalid code input)
- **Fix**: Add error handling in `app/api/analyze/route.ts`

**Issue**: CodeMirror not loading
- **Cause**: Client bundle too large or import error
- **Fix**: Check browser console, verify imports

### Performance Issues

**Issue**: Slow initial load
- **Cause**: Large bundle size
- **Fix**: Review bundle analyzer, lazy load Pro modals

**Issue**: Analysis takes > 1s
- **Cause**: Complex code or slow server
- **Fix**: Optimize analyzer, add caching

## Custom Domain (demo.rsc-xray.dev)

### DNS Configuration
1. Add CNAME record: `demo.rsc-xray.dev` → `cname.vercel-dns.com`
2. In Vercel dashboard: Add domain to project
3. Wait for SSL certificate provisioning (~minutes)
4. Verify HTTPS works

### Domain Settings
- **Primary domain**: `demo.rsc-xray.dev`
- **Redirect**: `rsc-xray-demo.vercel.app` → `demo.rsc-xray.dev`
- **HTTPS**: Automatic (Let's Encrypt)
- **HSTS**: Enabled

## Security

### No Secrets Required
- Stateless application
- No API keys
- No database credentials
- No user authentication

### Rate Limiting
- Vercel default limits apply (1000 req/min for Pro)
- Browser-side = no abuse vector for `/api/analyze`
- Consider Vercel Edge Config rate limits if needed

## Rollback Procedure

1. Go to Vercel dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Confirm promotion

**OR** via CLI:
```bash
vercel rollback
```

## Future Enhancements

- [ ] Add Vercel Analytics for page views
- [ ] Implement Vercel Speed Insights
- [ ] Add Sentry for error tracking
- [ ] Configure Web Vitals monitoring
- [ ] Add staging environment (separate Vercel project)

## Support

- **Vercel Support**: support@vercel.com
- **Project Issues**: https://github.com/rsc-xray/rsc-xray/issues
- **Deployment Logs**: Vercel Dashboard → Deployments → [deployment] → Logs

