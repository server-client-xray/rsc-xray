import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    deps: {
      registerNodeLoader: true,
    },
  },
  resolve: {
    alias: {
      '@server-client-xray/report-html': resolve(__dirname, '../report-html/src/index.ts'),
      '@server-client-xray/schemas': resolve(__dirname, '../schemas/src/index.ts'),
    },
  },
});
