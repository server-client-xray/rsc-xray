import { describe, expect, it } from 'vitest';

import { collectCacheMetadata } from '../cacheMetadata';

const toArray = <T>(set: Set<T>) => Array.from(set);

describe('collectCacheMetadata', () => {
  it('captures fetch cache options and tags', () => {
    const source = `
      export async function loader() {
        await fetch('https://example.com', {
          cache: 'no-store',
          next: { tags: ['products', layoutTag], revalidate: 120 },
          headers: { 'x-next-cache-tags': 'promo, _N_T_/internal' },
        });
      }
    `;

    const meta = collectCacheMetadata({ sourceText: source });

    expect(toArray(meta.cacheModes)).toEqual(['no-store']);
    expect(toArray(meta.revalidateSeconds)).toEqual([120]);
    expect(meta.hasRevalidateFalse).toBe(false);
    expect(toArray(meta.tags).sort()).toEqual(['products', 'promo']);
  });

  it('captures revalidateTag and revalidatePath calls', () => {
    const source = `
      import { revalidatePath, revalidateTag } from 'next/cache';

      export async function action() {
        await revalidateTag('products');
        revalidatePath('/dashboard');
        revalidateTag(tagFromArgs);
      }
    `;

    const meta = collectCacheMetadata({ sourceText: source });

    expect(toArray(meta.revalidateTagCalls)).toEqual(['products']);
    expect(toArray(meta.revalidatePathCalls)).toEqual(['/dashboard']);
  });

  it('tracks explicit disable of revalidation', () => {
    const source = `
      export async function loader() {
        await fetch('https://example.com', {
          next: { revalidate: false }
        });
      }
    `;

    const meta = collectCacheMetadata({ sourceText: source });

    expect(meta.hasRevalidateFalse).toBe(true);
  });
});
