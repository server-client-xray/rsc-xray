#!/usr/bin/env node
import process from 'node:process';

import { flightTap } from '../commands/flightTap';

function parseArgs(argv: string[]) {
  let url = 'http://localhost:3000/products';
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if ((arg === '--url' || arg === '-u') && argv[i + 1]) {
      url = argv[++i];
    } else if (arg === '--help' || arg === '-h') {
      return { help: true } as const;
    }
  }
  return { url } as const;
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if ('help' in parsed) {
    console.log('Usage: flight-tap [--url http://localhost:3000/products]');
    process.exit(0);
  }

  try {
    await flightTap({ url: parsed.url });
  } catch (error) {
    console.error('[scx-flight] failed:', (error as Error).message);
    process.exitCode = 1;
  }
}

main();
