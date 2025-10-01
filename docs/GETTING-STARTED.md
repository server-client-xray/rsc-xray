# Getting Started with RSC X-Ray

**Analyze React Server Components in Next.js: boundaries, Suspense, bundle bytes, and actionable suggestions**

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Analyze Your App (OSS)](#1-analyze-your-app-oss)
3. [View HTML Report (OSS)](#2-view-html-report-oss)
4. [Pro Features](#pro-features)
5. [Next Steps](#next-steps)

---

## Quick Start

```bash
# 1. Install the analyzer
npm install -D @rsc-xray/cli

# 2. Build your Next.js app
npm run build

# 3. Run analysis
npx @rsc-xray/cli analyze --project . --out model.json

# 4. Generate HTML report
npx @rsc-xray/cli report --model model.json --out report.html

# 5. Open report in browser
open report.html  # macOS
# or: xdg-open report.html  # Linux
# or: start report.html  # Windows
```

🎉 **Done!** You now have an interactive HTML report showing your app's RSC boundaries, bundle sizes, and optimization suggestions.

---

## 1. Analyze Your App (OSS)

### Installation

```bash
# Using npm
npm install -D @rsc-xray/cli

# Using yarn
yarn add -D @rsc-xray/cli

# Using pnpm
pnpm add -D @rsc-xray/cli
```

### Run Analyzer

**Prerequisites:**

- Next.js 13.4+ with App Router
- App must be built (`next build`)

```bash
# Build your Next.js app first
npm run build

# Run analyzer
npx @rsc-xray/cli analyze --project . --out model.json
```

**What it does:**

- ✅ Detects all server/client boundaries (`'use client'`)
- ✅ Discovers Suspense boundaries
- ✅ Calculates bundle sizes per client component
- ✅ Identifies optimization opportunities
- ✅ Checks for rule violations (forbidden imports, oversized components)
- ✅ Exports structured JSON model

**Output:** `model.json` (structured analysis data)

### Customization

```bash
# Specify custom Next.js directories
npx @rsc-xray/cli analyze \
  --project ./my-app \
  --dist .next \
  --app app \
  --out analysis.json
```

**Options:**

- `--project` - Path to Next.js project root (default: `.`)
- `--dist` - Build output directory (default: `.next`)
- `--app` - App directory name (default: `app`)
- `--out` - Output file path (default: `model.json`)
- `--pretty` - Pretty-print JSON output

---

## 2. View HTML Report (OSS)

### Generate Report

```bash
# Generate interactive HTML report
npx @rsc-xray/cli report --model model.json --out report.html

# Open in browser
open report.html
```

### What's in the Report?

The static HTML report includes:

#### 📊 **Bundle Analysis**

- Total bytes breakdown (client/server split)
- Per-route bundle sizes
- Client component size distribution
- Size thresholds and warnings

#### 🌳 **Component Tree**

- Interactive component hierarchy
- Server/client boundary markers
- `'use client'` directive locations
- Parent-child relationships

#### ⏸️ **Suspense Boundaries**

- Where streaming happens
- Boundary placement analysis
- Missing boundary warnings
- Optimization opportunities

#### 🚨 **Diagnostics**

Rule violations with file/line numbers:

- **Forbidden imports:** Node.js APIs in client components
- **Oversized components:** Client bundles > 50KB
- **Duplicate dependencies:** Shared code across islands
- **Route config conflicts:** Next.js route segment misconfigurations

#### 💡 **Suggestions**

Actionable fixes with exact locations:

- **Hoist fetch calls:** Move data fetching from client to server
- **Parallelize awaits:** Use `Promise.all()` for concurrent requests
- **Add Suspense boundaries:** Improve streaming and user experience
- **Migrate to React 19 cache():** Deduplicate requests

#### ℹ️ **Build Info**

- Next.js version
- Build timestamp
- Total route count
- Analysis metadata

**Perfect for:** Sharing with teammates, uploading to CI artifacts, offline review

---

## Pro Features

RSC X-Ray Pro adds powerful tools for teams and CI/CD workflows.

### 🎨 Interactive Overlay (:warning: Pro)

<details>
<summary>View live component tree with hydration timings in your running app</summary>

The Pro overlay provides **real-time visualization** overlaid on your Next.js app:

**Features:**

- **Live component tree** - See server/client boundaries as your app runs
- **Hydration timings** - Measure time-to-interactive for each component
- **Suspense markers** - Visual indicators for streaming boundaries
- **Cache lens** - Track `revalidateTag` and `revalidatePath` impact
- **Performance metrics** - Bundle sizes, hydration times, diagnostics

**Installation:**

```bash
# Configure .npmrc for GitHub Packages
echo "@rsc-xray:registry=https://npm.pkg.github.com" >> .npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> .npmrc

# Install Pro overlay
pnpm add @rsc-xray/pro-overlay
```

**Setup** (Next.js):

```typescript
// app/layout.tsx
import { OverlayBootstrap } from '@rsc-xray/pro-overlay';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <OverlayBootstrap
          license={process.env.RSC_XRAY_LICENSE}
          publicKey={process.env.LICENSE_SIGN_PUBLIC_KEY_BASE64}
        />
      </body>
    </html>
  );
}
```

**Usage:** Press `Ctrl+Shift+X` to toggle overlay

**Get your license:** Contact sales@rsc-xray.dev or visit the marketplace

</details>

---

### 📈 Performance Dashboard & CI (:warning: Pro)

<details>
<summary>Track performance trends, enforce budgets, and catch regressions in CI</summary>

The Pro CI package provides **automated trend tracking** and **performance budgets**:

**Features:**

- **Trend collection** - Track bundle size and hydration over time
- **Performance scoring** - A+ to F grades based on size, hydration, trends
- **Dashboard** - Interactive HTML dashboard with charts and comparisons
- **Budgets** - Fail CI if bundle sizes exceed limits
- **Regression detection** - Automatic alerts for performance drops
- **PR comments** - Post budget reports directly to pull requests
- **GitHub Action** - Zero-config CI integration

**Installation:**

```bash
# Configure .npmrc for GitHub Packages
echo "@rsc-xray:registry=https://npm.pkg.github.com" >> .npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> .npmrc

# Install Pro CI tools
pnpm add -D @rsc-xray/pro-ci
```

**GitHub Action:**

```yaml
# .github/workflows/rsc-xray.yml
- name: Analyze with RSC X-Ray
  run: npx @rsc-xray/cli analyze --project . --out model.json

- name: Collect trend data
  uses: rsc-xray/rsc-xray-pro/.github/actions/collect-trends@main
  with:
    model-path: ./model.json
    history-path: ./trend-history.json
```

**Dashboard:** Download trend history artifact and load into interactive HTML dashboard

**Complete setup guide:** See Pro package documentation

**Get your license:** Contact sales@rsc-xray.dev or visit the marketplace

</details>

---

### 🔧 VS Code Extension (:warning: Pro)

<details>
<summary>Get inline diagnostics and quick fixes directly in your editor</summary>

The Pro VS Code extension brings RSC X-Ray **into your IDE**:

**Features:**

- **Inline diagnostics** - Violations and suggestions in Problems panel
- **Quick fixes** - One-click fixes for common issues:
  - Wrap async components in `<Suspense>`
  - Add React 19 `cache()` wrapper for deduplication
  - Dynamic import guidance for code splitting
- **"Open in X-Ray"** command - Jump to overlay from editor
- **License gating** - Pro features require valid license

**Installation:**

1. Open VS Code Extensions (Cmd+Shift+X)
2. Search "RSC X-Ray Pro"
3. Install extension
4. Configure license in settings:
   ```json
   {
     "serverClientXray.licenseToken": "YOUR_JWT_TOKEN",
     "serverClientXray.modelPath": "model.json"
   }
   ```

**Usage:** Diagnostics appear automatically in Problems panel

**Get your license:** Contact sales@rsc-xray.dev or visit the marketplace

</details>

---

### 🤖 Automated Codemods (:warning: Pro)

<details>
<summary>Run automated code transformations to fix common issues</summary>

The Pro codemods package provides **automated fixes** for common patterns:

**Available Codemods:**

- **Add `'use client'`** - Convert server components to client
- **Wrap in Suspense** - Add Suspense boundaries around async components
- **Add preload hints** - Insert `<link rel="preload">` for resources
- **Add hydration hooks** - Instrument components for timing measurement

**Installation:**

```bash
# Configure .npmrc for GitHub Packages
echo "@rsc-xray:registry=https://npm.pkg.github.com" >> .npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> .npmrc

# Install Pro codemods
pnpm add -D @rsc-xray/pro-codemods
```

**Usage:**

```bash
# Run specific codemod
npx @rsc-xray/pro-codemods use-client app/components/Button.tsx

# Preview changes (dry run)
npx @rsc-xray/pro-codemods wrap-suspense --dry-run app/page.tsx
```

**Get your license:** Contact sales@rsc-xray.dev or visit the marketplace

</details>

---

## Comparison: OSS vs Pro

| Feature                            | OSS | Pro |
| ---------------------------------- | --- | --- |
| **Analysis**                       |     |     |
| Detect server/client boundaries    | ✅  | ✅  |
| Bundle size calculation            | ✅  | ✅  |
| Suspense boundary detection        | ✅  | ✅  |
| Diagnostics (violations)           | ✅  | ✅  |
| Suggestions (optimizations)        | ✅  | ✅  |
| HTML report export                 | ✅  | ✅  |
| **Visualization**                  |     |     |
| Static HTML report                 | ✅  | ✅  |
| Interactive overlay                | ❌  | ✅  |
| Hydration timing measurement       | ❌  | ✅  |
| Cache lens (revalidation tracking) | ❌  | ✅  |
| **CI/CD**                          |     |     |
| JSON model export                  | ✅  | ✅  |
| Trend collection                   | ❌  | ✅  |
| Performance dashboard              | ❌  | ✅  |
| Bundle size budgets                | ❌  | ✅  |
| GitHub Action                      | ❌  | ✅  |
| PR comments                        | ❌  | ✅  |
| **Developer Tools**                |     |     |
| CLI commands                       | ✅  | ✅  |
| VS Code extension                  | ❌  | ✅  |
| Automated codemods                 | ❌  | ✅  |
| Quick fixes                        | ❌  | ✅  |

---

## Next Steps

### For OSS Users

1. **Run analysis regularly** - After major changes, check bundle sizes and boundaries
2. **Share reports** - Upload HTML reports to CI artifacts for team visibility
3. **Fix violations** - Address diagnostics (forbidden imports, oversized components)
4. **Optimize** - Follow suggestions (hoist fetch, add Suspense, parallelize)

**Upgrade to Pro** for live overlay, CI automation, and VS Code integration

---

### For Pro Users

1. **Set up CI integration** - Automate trend collection and budget enforcement
2. **Configure overlay** - Add to your Next.js app for real-time visualization
3. **Install VS Code extension** - Get inline diagnostics and quick fixes
4. **Run codemods** - Automate common fixes

**Guides:**

- **CI Setup:** See `@rsc-xray/pro-ci` package README
- **Overlay:** See `@rsc-xray/pro-overlay` package README
- **VS Code:** See `@rsc-xray/pro-vscode` package README
- **Codemods:** See `@rsc-xray/pro-codemods` package README

---

## Troubleshooting

### "Command not found: npx @rsc-xray/cli"

**Solution:** Ensure package is installed:

```bash
npm install -D @rsc-xray/cli
# or: pnpm add -D @rsc-xray/cli
```

---

### "No .next directory found"

**Solution:** Build your Next.js app first:

```bash
npm run build
```

---

### "404 Not Found" when installing Pro packages

**Solution:** Configure `.npmrc` with GitHub token:

```bash
echo "@rsc-xray:registry=https://npm.pkg.github.com" >> .npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> .npmrc
```

**Get GitHub token:** Settings → Developer settings → Personal access tokens → Generate (with `read:packages` scope)

---

### Report shows no routes

**Possible causes:**

1. App directory not found (default: `app/`)
2. Build output not found (default: `.next/`)
3. Not using Next.js App Router

**Solution:** Specify custom paths:

```bash
npx @rsc-xray/cli analyze \
  --project . \
  --dist .next \
  --app src/app \
  --out model.json
```

---

## Support

- **OSS Issues:** https://github.com/rsc-xray/rsc-xray/issues
- **Documentation:** [docs/](./docs/) directory
- **Pro Support:** support@rsc-xray.dev
- **Sales:** sales@rsc-xray.dev

---

## License

**OSS:** MIT License  
**Pro:** Commercial license (contact sales@rsc-xray.dev)

---

**Last Updated:** October 1, 2025
