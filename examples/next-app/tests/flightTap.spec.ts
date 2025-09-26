import { spawn } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { pathToFileURL } from 'node:url';

import { expect, test } from '@playwright/test';
import treeKill from 'tree-kill';

import { getAvailablePort } from './utils/getAvailablePort';
import { waitForPort } from './utils/waitForPort';

const HOST = '127.0.0.1';
const exampleRoot = path.resolve(__dirname, '..');
const snapshotPath = path.join(exampleRoot, '.scx', 'flight.json');
const cliModuleUrl = pathToFileURL(
  path.resolve(exampleRoot, '..', '..', 'packages', 'cli', 'dist', 'index.js')
).href;

async function resolveFlightTap() {
  try {
    const mod = await import('@rsc-xray/cli');
    return mod.flightTap;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ERR_MODULE_NOT_FOUND') {
      throw error;
    }
    const mod = await import(cliModuleUrl);
    return mod.flightTap;
  }
}

async function stopServer(child: ReturnType<typeof spawn> | undefined) {
  if (!child?.pid) {
    return;
  }
  await new Promise<void>((resolve) => {
    treeKill(child.pid!, 'SIGTERM', (error) => {
      if (error && (error as NodeJS.ErrnoException).code !== 'ESRCH') {
        console.warn('[scx] Failed to terminate Next dev server cleanly', error);
      }
      resolve();
    });
  });
}

test.describe('flight tap telemetry', () => {
  let server: ReturnType<typeof spawn> | undefined;
  let port: number;
  let flightTap: (typeof import('@rsc-xray/cli'))['flightTap'];

  test.beforeAll(async () => {
    flightTap = await resolveFlightTap();
    await rm(snapshotPath, { force: true });
    port = await getAvailablePort();
    server = spawn('pnpm', ['dev', '--hostname', HOST, '--port', String(port)], {
      cwd: exampleRoot,
      env: { ...process.env, PORT: String(port) },
      stdio: 'inherit',
    });
    await waitForPort({ port, host: HOST });
  });

  test.afterAll(async () => {
    await stopServer(server);
    server = undefined;
  });

  test('captures flight samples for streaming route', async () => {
    const result = await flightTap({
      url: `http://${HOST}:${port}/products/1`,
      route: '/products/[id]',
      output: new PassThrough(),
    });

    expect(result.samples.length).toBeGreaterThan(0);

    await mkdir(path.dirname(snapshotPath), { recursive: true });
    await writeFile(snapshotPath, JSON.stringify({ samples: result.samples }, null, 2), 'utf8');

    const raw = await readFile(snapshotPath, 'utf8');
    const parsed = JSON.parse(raw) as { samples?: unknown };
    expect(Array.isArray(parsed.samples)).toBe(true);
  });
});
