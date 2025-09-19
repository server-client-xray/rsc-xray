import { describe, expect, it } from 'vitest';

import { classifyComponent } from '../classify';

describe('classifyComponent', () => {
  it('marks files with use client directive as client components', () => {
    const result = classifyComponent({
      fileName: '/tmp/component.tsx',
      sourceText: `'use client';
export function Button() { return <button />; }`
    });

    expect(result).toMatchObject({ kind: 'client', hasUseClientDirective: true });
  });

  it('defaults to server components when directive absent', () => {
    const result = classifyComponent({
      fileName: '/tmp/server.tsx',
      sourceText: `export async function Page() { return <div />; }`
    });

    expect(result).toMatchObject({ kind: 'server', hasUseClientDirective: false });
  });
});
