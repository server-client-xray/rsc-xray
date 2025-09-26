#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import process from 'node:process';

import { flightTap } from '../commands/flightTap';

function parseArgs(argv: string[]) {
  let url = 'http://localhost:3000/products';
  let out: string | undefined;
  let route: string | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if ((arg === '--url' || arg === '-u') && argv[i + 1]) {
      url = argv[++i];
    } else if ((arg === '--route' || arg === '-r') && argv[i + 1]) {
      route = argv[++i];
    } else if ((arg === '--out' || arg === '-o') && argv[i + 1]) {
      out = argv[++i];
    } else if (arg === '--help' || arg === '-h') {
      return { help: true } as const;
    }
  }
  return { url, route, out } as const;
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if ('help' in parsed) {
    console.log(
      'Usage: flight-tap [--url http://localhost:3000/products] [--route /products/[id]] [--out .scx/flight.json]'
    );
    process.exit(0);
  }

  try {
    const result = await flightTap({ url: parsed.url, route: parsed.route });
    if (parsed.out) {
      const payload = { samples: result.samples };
      await writeFile(parsed.out, JSON.stringify(payload, null, 2), 'utf8');
      console.log(
        `[scx-flight] wrote ${result.samples.length} samples (${result.chunks} chunks) to ${parsed.out}`
      );
    }
  } catch (error) {
    console.error('[scx-flight] failed:', (error as Error).message);
    process.exitCode = 1;
  }
}

main();
