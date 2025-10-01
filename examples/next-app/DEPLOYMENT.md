# Deploying RSC X-Ray Demo to Vercel

This document explains how to deploy the interactive demo application to Vercel.

## Overview

The RSC X-Ray demo is a Next.js application located in `examples/next-app/` that showcases various RSC analysis features with interactive CodeMirror editors and mock LSP diagnostics.

**Architecture:**

- **Next.js App**: Interactive demo with CodeMirror editors
- **Mock LSP**: Client-side diagnostic simulation (no server required)
- **Public Access**: Freely accessible at `demo.rsc-xray.dev` (or your chosen domain)

**Note:** This demo uses a **mock LSP implementation** that runs entirely client-side. For production analysis with real diagnostics, users should install the CLI package (`@rsc-xray/cli`) or use the Pro LSP server.

## Prerequisites

1. **Vercel Account**: Free tier works perfectly
2. **GitHub Repository**: The OSS repository (`rsc-xray/rsc-xray`)
3. **Domain (Optional)**: Custom domain for the demo

## Deployment Steps

### Option A: Vercel Dashboard (Recommended for First Deployment)

1. **Import Project**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import the `rsc-xray/rsc-xray` repository
   - Vercel will auto-detect the Next.js framework

2. **Configure Project**
   - **Framework Preset**: Next.js
   - **Root Directory**: `examples/next-app`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `pnpm install`

3. **Environment Variables**
   - No environment variables are required for the demo
   - The mock LSP runs entirely client-side

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (~2-3 minutes)
   - Your demo will be live at `https://[project-name].vercel.app`

### Option B: Vercel CLI (For Subsequent Deployments)

```bash
# Install Vercel CLI globally
npm i -g vercel

# Navigate to the demo app
cd examples/next-app

# Login to Vercel (first time only)
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Option C: GitHub Integration (Continuous Deployment)

1. **Connect Repository**
   - In Vercel Dashboard, connect your GitHub repository
   - Set root directory to `examples/next-app`

2. **Configure Branches**
   - **Production Branch**: `main`
   - **Preview Branches**: All other branches (optional)

3. **Auto-Deploy**
   - Every push to `main` automatically deploys to production
   - PRs get preview deployments automatically

## Custom Domain Setup

1. **Add Domain in Vercel**
   - Project Settings → Domains
   - Add `demo.rsc-xray.dev` (or your domain)

2. **Configure DNS**
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or use Vercel's nameservers for full management

3. **SSL**
   - Vercel automatically provisions SSL certificates
   - HTTPS is enabled by default

## Build Configuration

The demo app uses the workspace's shared dependencies. Vercel will:

1. Install root dependencies: `pnpm install`
2. Build the demo: `pnpm build` (runs in `examples/next-app`)
3. Serve the optimized production build

### Project Structure

```
examples/next-app/
├── app/
│   ├── (scenarios)/
│   │   └── scenarios/          # Demo scenario pages
│   │       ├── serialization-boundary/
│   │       ├── suspense-opportunity/
│   │       ├── client-forbidden-import/
│   │       └── ... (other scenarios)
│   ├── layout.tsx
│   └── page.tsx                # Demo landing page
├── public/
├── package.json
├── next.config.mjs
└── tsconfig.json
```

## Performance Considerations

### Build Optimization

The demo is optimized for production:

- Static pages with dynamic imports
- Code splitting for CodeMirror
- Image optimization via Next.js
- Edge runtime for API routes (if any)

### Expected Build Times

- **Cold Build**: ~2-3 minutes (first deployment)
- **Incremental Build**: ~1-2 minutes (subsequent deployments)

### Bundle Size

The demo includes CodeMirror and related dependencies:

- Initial bundle: ~100-150 KB (gzipped)
- CodeMirror chunk: ~50-80 KB (lazy loaded)
- Total page weight: ~200-250 KB

## Monitoring & Analytics

### Vercel Analytics (Optional)

Enable Web Analytics in project settings to track:

- Core Web Vitals
- Page views
- User engagement
- Performance metrics

### Custom Analytics

Add your own analytics (e.g., Google Analytics, Plausible):

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>{/* Add analytics scripts here */}</head>
      <body>{children}</body>
    </html>
  );
}
```

## Environment-Specific Behavior

The demo automatically adapts based on the environment:

```typescript
// Client-side detection
const isDev = process.env.NODE_ENV === 'development';
const isProduction = process.env.VERCEL_ENV === 'production';
const isPreview = process.env.VERCEL_ENV === 'preview';
```

## Troubleshooting

### Build Fails

**Issue**: Build fails with dependency errors

**Solution**:

```bash
# Locally verify the build works
cd examples/next-app
pnpm install
pnpm build

# If successful locally, ensure Vercel uses the same Node version
# Add to vercel.json:
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

### Out of Memory

**Issue**: Build runs out of memory

**Solution**: Vercel automatically allocates sufficient memory for Next.js builds. If issues persist, contact Vercel support to increase limits.

### Mock LSP Not Working

**Issue**: Diagnostics don't appear in CodeMirror

**Solution**:

1. Check browser console for errors
2. Ensure `CodeMirrorEditor` component is client-side (`'use client'`)
3. Verify diagnostic utilities are working:

   ```typescript
   import { findTextDiagnostic } from '../_components/diagnosticUtils';

   const diagnostic = findTextDiagnostic({
     code: sourceCode,
     searchText: 'function',
     rule: 'test-rule',
     // ...
   });
   console.log(diagnostic); // Should show line/column
   ```

## Deployment Checklist

- [ ] Repository connected to Vercel
- [ ] Root directory set to `examples/next-app`
- [ ] Build command: `pnpm build`
- [ ] Custom domain configured (optional)
- [ ] SSL certificate provisioned
- [ ] Analytics enabled (optional)
- [ ] Test all demo scenarios work
- [ ] Verify mobile responsiveness
- [ ] Check Core Web Vitals in Vercel Dashboard

## Post-Deployment

### Testing

Visit your deployed demo and verify:

1. **Landing Page**: `/` loads correctly
2. **Scenario Pages**: Each scenario in `/scenarios/*` works
3. **CodeMirror**: Editors are interactive with syntax highlighting
4. **Diagnostics**: Mock LSP shows squiggles and hover tooltips
5. **Navigation**: All links work correctly
6. **Mobile**: Responsive design works on mobile devices

### Updating

To update the demo:

1. Make changes to `examples/next-app/`
2. Push to `main` branch
3. Vercel automatically deploys the update
4. Verify at your production URL

## Related Documentation

- **Demo Enhancement**: `docs/PROPOSAL-CODEMIRROR-LSP-DEMOS.md`
- **Feature Audit**: `docs/DEMO-FEATURE-AUDIT.md`
- **Next.js Deployment**: [Vercel Next.js Docs](https://vercel.com/docs/frameworks/nextjs)
- **Pro LSP Server**: For real analysis, see `rsc-xray-pro/packages/pro-lsp-server/ARCHITECTURE.md`

## Support

- **Vercel Issues**: [Vercel Support](https://vercel.com/support)
- **RSC X-Ray Issues**: [GitHub Issues](https://github.com/rsc-xray/rsc-xray/issues)
- **Demo Questions**: Open a discussion in the repository

---

**Last Updated**: 2025-10-01  
**Demo URL**: TBD (configure after deployment)  
**Status**: Ready for deployment
