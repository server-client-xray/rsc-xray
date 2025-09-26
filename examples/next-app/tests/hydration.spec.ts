import { spawn } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { once } from 'node:events';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { getAvailablePort } from './utils/getAvailablePort';
import { waitForPort } from './utils/waitForPort';
import treeKill from 'tree-kill';

const HOST = '127.0.0.1';
const exampleRoot = path.resolve(__dirname, '..');
const snapshotPath = path.join(exampleRoot, '.scx', 'hydration.json');

const DEFAULT_PORT = 3100;
let port: number;

test.describe('hydration telemetry', () => {
  let server: ReturnType<typeof spawn> | undefined;

  test.beforeAll(async () => {
    try {
      await rm(snapshotPath, { force: true });
    } catch (error) {
      console.warn('[scx] Failed to reset hydration snapshot', error);
    }

    port = await getAvailablePort(DEFAULT_PORT);

    server = spawn('pnpm', ['dev', '--hostname', HOST, '--port', String(port)], {
      cwd: exampleRoot,
      env: { ...process.env, PORT: String(port) },
      stdio: 'inherit',
    });

    await waitForPort({ port, host: HOST });
  });

  test.afterAll(async () => {
    if (server) {
      try {
        await new Promise<void>((resolve, reject) => {
          treeKill(server!.pid, 'SIGTERM', (error) => {
            if (error && (error as NodeJS.ErrnoException).code !== 'ESRCH') {
              reject(error);
              return;
            }
            resolve();
          });
        });
        await once(server, 'exit');
      } catch (error) {
        console.warn('[scx] Failed to terminate Next dev server cleanly', error);
      }
      server = undefined;
    }
  });

  test('writes hydration snapshot after initial render', async ({ page }) => {
    await page.goto(`http://${HOST}:${port}/products/1`, { waitUntil: 'networkidle' });

    await expect
      .poll(async () => {
        try {
          const contents = await readFile(snapshotPath, 'utf8');
          const data = JSON.parse(contents) as Record<string, number>;
          return Object.keys(data).length;
        } catch {
          return 0;
        }
      })
      .toBeGreaterThan(0);
  });
});
