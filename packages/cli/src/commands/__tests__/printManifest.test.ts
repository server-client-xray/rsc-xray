import { join } from 'node:path';
import { PassThrough } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { printManifest } from '../printManifest';

const FIXTURE_ROOT = join(__dirname, '../../../../analyzer/src/lib/__tests__/__fixtures__/basic');

describe('printManifest', () => {
  it('prints routes, chunks, and bytes', async () => {
    const output = new PassThrough();
    let result = '';
    output.on('data', (chunk) => {
      result += chunk.toString();
    });

    await printManifest({ projectRoot: FIXTURE_ROOT, output });

    expect(result).toContain('/ ->');
    expect(result).toContain('static/chunks/app/page.js');
    expect(result).toContain('1.2 kB');
  });
});
