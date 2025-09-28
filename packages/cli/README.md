# @rsc-xray/cli

Command-line wrapper for the rsc-xray analyzer, report generator, and Flight tap capture workflow.

## What it solves

- Produces `model.json` from a Next.js App Router project with one command.
- Generates a fully offline HTML report for sharing analyzer findings.
- Streams React Flight chunks so you can understand suspense delivery order and chunk sizes.

## Installation

```bash
pnpm add -D @rsc-xray/cli
```

## Step-by-step usage

1. **Prepare your project**
   ```bash
   pnpm next build
   ```
2. **Generate the model**

   ```bash
   pnpm -F @rsc-xray/cli analyze --project ./examples/next-app --out ./model.json
   ```

   - Validates the analyzer output against the shared JSON schema.
   - Overwrites the target file only when validation succeeds.

3. **Create the HTML report**

   ```bash
   pnpm -F @rsc-xray/cli report --model ./model.json --out ./report.html
   ```

   - Produces a static report you can open locally or upload as a CI artifact.

4. **(Optional) Capture Flight streaming data**

   ```bash
   pnpm -C examples/next-app dev &
   pnpm -F @rsc-xray/cli flight-tap      --url http://localhost:3000/products/1      --route /products/[id]      --out ./.scx/flight.json      --timeout 30000
   ```

   - The timeout guard aborts hung streams; pass `--timeout 0` to disable it when debugging slower routes.

## Tests

Command behavior is covered by:

- `packages/cli/src/commands/__tests__/analyze.test.ts`
- `packages/cli/src/commands/__tests__/report.test.ts`
- `packages/cli/src/commands/__tests__/flightTap.test.ts`

Run the suite with:

```bash
pnpm -F @rsc-xray/cli test -- --run
```
