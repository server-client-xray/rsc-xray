#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import process from 'node:process';

import { flightTap } from '../commands/flightTap';

interface ParsedArgs {
  url: string;
  route?: string;
  out?: string;
  timeoutMs?: number;
  help?: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  let url = 'http://localhost:3000/products';
  let out: string | undefined;
  let route: string | undefined;
  let timeoutMs: number | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if ((arg === '--url' || arg === '-u') && argv[i + 1]) {
      url = argv[++i];
    } else if ((arg === '--route' || arg === '-r') && argv[i + 1]) {
      route = argv[++i];
    } else if ((arg === '--out' || arg === '-o') && argv[i + 1]) {
      out = argv[++i];
    } else if ((arg === '--timeout' || arg === '--timeout-ms') && argv[i + 1]) {
      const value = Number(argv[++i]);
      if (Number.isFinite(value) && value >= 0) {
        timeoutMs = Math.floor(value);
      }
    } else if (arg === '--help' || arg === '-h') {
      return { help: true, url };
    }
  }

  return { url, route, out, timeoutMs };
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    console.log(
      'Usage: flight-tap [--url http://localhost:3000/products] [--route /products/[id]] [--out .scx/flight.json] [--timeout 30000]'
    );
    process.exit(0);
  }

  try {
    const result = await flightTap({
      url: parsed.url,
      route: parsed.route,
      timeoutMs: parsed.timeoutMs,
    });
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
