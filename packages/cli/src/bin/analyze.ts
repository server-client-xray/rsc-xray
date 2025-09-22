#!/usr/bin/env node
import { cwd } from 'node:process';
import { resolve } from 'node:path';

import { analyze } from '../commands/analyze';

interface CliOptions {
  projectRoot?: string;
  distDir?: string;
  appDir?: string;
  outputPath?: string;
  pretty?: boolean;
  help?: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case '--project': {
        options.projectRoot = argv[++index];
        break;
      }
      case '--dist': {
        options.distDir = argv[++index];
        break;
      }
      case '--app': {
        options.appDir = argv[++index];
        break;
      }
      case '--out': {
        options.outputPath = argv[++index];
        break;
      }
      case '--pretty': {
        options.pretty = true;
        break;
      }
      case '--no-pretty': {
        options.pretty = false;
        break;
      }
      case '--help':
      case '-h': {
        options.help = true;
        break;
      }
      default: {
        if (options.help) {
          break;
        }
        if (arg.startsWith('-')) {
          console.warn(`Unknown flag: ${arg}`);
        }
      }
    }
  }

  return options;
}

function printUsage() {
  console.log(
    'Usage: analyze [--project <path>] --out <file> [--dist <.next>] [--app <appDir>] [--no-pretty]'
  );
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.help) {
    printUsage();
    process.exit(0);
  }

  const baseDir = process.env.INIT_CWD ?? cwd();
  const projectRoot = resolve(baseDir, parsed.projectRoot ?? '.');
  const rawOutputPath = parsed.outputPath;

  if (!rawOutputPath) {
    console.error('Missing required --out <file> argument');
    printUsage();
    process.exit(1);
    return;
  }

  try {
    await analyze({
      projectRoot,
      outputPath: resolve(baseDir, rawOutputPath),
      distDir: parsed.distDir,
      appDir: parsed.appDir,
      pretty: parsed.pretty,
    });
  } catch (error) {
    console.error('Failed to analyze project:', (error as Error).message);
    process.exitCode = 1;
  }
}

main();
