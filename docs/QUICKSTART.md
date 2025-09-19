# Quickstart

1. `corepack pnpm install` — install dependencies for all packages and the example Next.js app.
2. `corepack pnpm -r test` — exercise package test suites (schemas validates the shared JSON schema).
3. `pnpm -C examples/next-app dev` — launch the demo Suspense/client-island app at http://localhost:3000.
4. (Coming soon) `pnpm -F @server-client-xray/cli analyze --project examples/next-app --out model.json` — generate analyzer output once the CLI lands.
