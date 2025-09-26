import net from 'node:net';

export async function waitForPort({
  port,
  host,
  timeoutMs = 30_000,
}: {
  port: number;
  host: string;
  timeoutMs?: number;
}): Promise<void> {
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
