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
      export const revalidate = false;
      export async function loader() {
        await fetch('https://example.com', {
          next: { revalidate: false }
        });
      }
    `;

    const meta = collectCacheMetadata({ sourceText: source });

    expect(meta.hasRevalidateFalse).toBe(true);
  });

  it('captures exported revalidate, dynamic, and experimental_ppr flags', () => {
    const source = `
      export const revalidate = 120;
      export const dynamic = 'force-dynamic';
      export const experimental_ppr = true;
    `;

    const meta = collectCacheMetadata({ sourceText: source });

    expect(toArray(meta.revalidateSeconds)).toEqual([120]);
    expect(meta.exportedDynamic).toBe('force-dynamic');
    expect(meta.experimentalPpr).toBe(true);
  });

  it('marks dynamic when using cookies()/headers() from next/headers', () => {
    const source = `
      import { cookies, headers, draftMode } from 'next/headers';
      export default function Page() {
        headers();
        cookies();
        draftMode();
        return null;
      }
    `;
    const meta = collectCacheMetadata({ sourceText: source });
    expect(meta.usesDynamicApis).toBe(true);
  });

  it('marks dynamic when using noStore()/unstable_noStore() from next/cache', () => {
    const source = `
      import { noStore, unstable_noStore } from 'next/cache';
      export async function loader() {
        noStore();
        unstable_noStore();
      }
    `;
    const meta = collectCacheMetadata({ sourceText: source });
    expect(meta.usesDynamicApis).toBe(true);
  });

  it('marks dynamic when using namespaced headers/cookies', () => {
    const source = `
      import * as nh from 'next/headers';
      export default function Page() {
        nh.headers();
        nh.cookies();
        return null;
      }
    `;
    const meta = collectCacheMetadata({ sourceText: source });
    expect(meta.usesDynamicApis).toBe(true);
  });

  it('marks dynamic when using namespaced noStore', () => {
    const source = `
      import * as nc from 'next/cache';
      export async function loader() {
        nc.noStore();
      }
    `;
    const meta = collectCacheMetadata({ sourceText: source });
    expect(meta.usesDynamicApis).toBe(true);
  });

  it('marks dynamic when destructuring from dynamic import of next/headers', () => {
    const source = `
      export async function Page() {
        const { headers, cookies } = await import('next/headers');
        headers(); cookies();
        return null;
      }
    `;
    const meta = collectCacheMetadata({ sourceText: source });
    expect(meta.usesDynamicApis).toBe(true);
  });

  it('marks dynamic when assigning namespace from dynamic import of next/cache', () => {
    const source = `
      export async function doWork() {
        const nc = await import('next/cache');
        nc.noStore();
      }
    `;
    const meta = collectCacheMetadata({ sourceText: source });
    expect(meta.usesDynamicApis).toBe(true);
  });
});
