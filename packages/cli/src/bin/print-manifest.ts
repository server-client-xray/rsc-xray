#!/usr/bin/env node
import { cwd } from 'node:process';

import { printManifest } from '../commands/printManifest';

function parseArgs(argv: string[]) {
  let projectRoot: string | undefined;
  let distDir: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--project' && argv[i + 1]) {
      projectRoot = argv[++i];
    } else if (arg === '--dist' && argv[i + 1]) {
      distDir = argv[++i];
    } else if (arg === '--help' || arg === '-h') {
      return { help: true } as const;
    }
  }

  return { projectRoot, distDir } as const;
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));

  if ('help' in parsed) {
    console.log('Usage: print-manifest --project <path> [--dist <.next>]');
    process.exit(0);
  }

  const projectRoot = parsed.projectRoot ?? cwd();

  try {
    await printManifest({ projectRoot, distDir: parsed.distDir });
  } catch (error) {
    console.error('Failed to read manifests:', (error as Error).message);
    process.exitCode = 1;
  }
}

main();
