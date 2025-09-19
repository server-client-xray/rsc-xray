import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { classifyFiles } from '../classifyFiles';

const COMPONENT_ROOT = join(__dirname, '__fixtures__', 'components');

describe('classifyFiles', () => {
  it('classifies multiple files', async () => {
    const result = await classifyFiles({
      projectRoot: COMPONENT_ROOT,
      filePaths: [
        join(COMPONENT_ROOT, 'ClientComponent.ts'),
        join(COMPONENT_ROOT, 'ServerComponent.ts'),
      ],
    });

    expect(result).toEqual([
      { filePath: 'ClientComponent.ts', kind: 'client' },
      { filePath: 'ServerComponent.ts', kind: 'server' },
    ]);
  });
});
