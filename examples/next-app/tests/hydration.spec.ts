import { spawn } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';

import { expect, test } from '@playwright/test';

const PORT = 3100;
const HOST = '127.0.0.1';
const exampleRoot = path.resolve(__dirname, '..');
const snapshotPath = path.join(exampleRoot, '.scx', 'hydration.json');

async function waitForPort({
  port,
  host,
  timeoutMs = 30_000,
}: {
  port: number;
  host: string;
  timeoutMs?: number;
}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const isOpen = await new Promise<boolean>((resolve) => {
      const socket = net.createConnection({ port, host }, () => {
        socket.end();
        resolve(true);
      });
      socket.on('error', () => {
        resolve(false);
      });
    });
    if (isOpen) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for http://${host}:${port}`);
}

test.describe('hydration telemetry', () => {
  let server: ReturnType<typeof spawn> | undefined;

  test.beforeAll(async () => {
    try {
      await rm(snapshotPath, { force: true });
    } catch (error) {
      console.warn('[scx] Failed to reset hydration snapshot', error);
    }

    server = spawn('pnpm', ['dev', '--hostname', HOST, '--port', String(PORT)], {
      cwd: exampleRoot,
      env: { ...process.env, PORT: String(PORT) },
      stdio: 'inherit',
    });

    await waitForPort({ port: PORT, host: HOST });
  });

  test.afterAll(async () => {
    if (server) {
      server.kill();
      server = undefined;
    }
  });

  test('writes hydration snapshot after initial render', async ({ page }) => {
    await page.goto(`http://${HOST}:${PORT}/products/1`, { waitUntil: 'networkidle' });

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
