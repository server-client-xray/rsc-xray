import { describe, expect, it } from 'vitest';

import { modelSchema } from './index';

describe('modelSchema', () => {
  it('exposes schema metadata', () => {
    expect(modelSchema.$id).toContain('model.schema.json');
    expect(modelSchema.properties?.version?.const).toBe('0.1');
  });
});
