import { describe, expect, it } from 'vitest';

import type { ClientComponentBundle } from '../clientBundles';
import { attributeBytes } from '../attributeBytes';

describe('attributeBytes', () => {
  it('aggregates bytes by component', () => {
    const bundles: ClientComponentBundle[] = [
      {
        filePath: 'components/Foo.tsx',
        chunks: ['static/chunks/foo.js'],
        totalBytes: 1024,
      },
      {
        filePath: 'components/Bar.tsx',
        chunks: ['static/chunks/bar.js'],
        totalBytes: 2048,
      },
      {
        filePath: 'components\\Foo.tsx',
        chunks: ['static/chunks/foo-extra.js'],
        totalBytes: 512,
      },
    ];

    const result = attributeBytes(bundles);

    expect(result).toEqual({
      'components/Bar.tsx': {
        totalBytes: 2048,
        chunks: ['static/chunks/bar.js'],
      },
      'components/Foo.tsx': {
        totalBytes: 1536,
        chunks: ['static/chunks/foo-extra.js', 'static/chunks/foo.js'],
      },
    });
  });

  it('returns empty record when bundles missing', () => {
    expect(attributeBytes([])).toEqual({});
    expect(attributeBytes(undefined)).toEqual({});
  });
});
