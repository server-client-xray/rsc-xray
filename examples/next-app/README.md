# rsc-xray Example App

Mini Next.js App Router project used to exercise the analyzer, CLI flows, and overlay demos.

## What it showcases

- Baseline product listing with nested Suspense boundaries.
- Intentional waterfall and forbidden-import scenarios for analyzer smoke tests.
- Instrumented client components that emit hydration timings.

## Step-by-step usage

1. Install dependencies at the repo root:
   ```bash
   corepack pnpm install
   ```
2. Build the example (generates `.next` artifacts for the analyzer):
   ```bash
   pnpm -C examples/next-app build
   ```
3. Run the dev server to explore scenarios or capture Flight streams:
   ```bash
   pnpm -C examples/next-app dev
   ```
4. Use the CLI from the repo root to analyze/report:
   ```bash
   pnpm -F @rsc-xray/cli analyze --project ./examples/next-app --out ./model.json
   pnpm -F @rsc-xray/cli report --model ./model.json --out ./report.html
   ```

## Tests

Playwright/CLI telemetry scripts in the Pro repo depend on this app, while OSS unit tests run against its compiled output. Keep the fixtures tidy so analyzer snapshots remain actionable.
