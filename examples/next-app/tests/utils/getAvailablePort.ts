import net from 'node:net';

const DEFAULT_PORT = 3100;
const HOST = '127.0.0.1';

export async function getAvailablePort(preferred?: number | number[]): Promise<number> {
  const candidates = Array.isArray(preferred)
    ? preferred
    : preferred !== undefined
      ? [preferred]
      : [DEFAULT_PORT];

  for (const candidate of candidates) {
    if (!Number.isInteger(candidate)) {
      continue;
    }
    try {
      return await tryListen(candidate);
    } catch (error) {
      const reason = error as NodeJS.ErrnoException;
      if (reason.code !== 'EADDRINUSE') {
        throw reason;
      }
    }
  }

  return tryListen(0);
}

async function tryListen(port: number): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', (error) => {
      server.close(() => {
        reject(error);
      });
    });
    server.listen(port, HOST, () => {
      const address = server.address();
      if (typeof address === 'object' && address) {
        const resolvedPort = address.port;
        server.close(() => resolve(resolvedPort));
      } else {
        server.close(() => reject(new Error('Failed to determine listening port')));
      }
    });
  });
}
