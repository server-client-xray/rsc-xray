import { Suspense, type ReactNode } from 'react';

export default function ShopLayout({ children }: { children: ReactNode }): JSX.Element {
  return <Suspense fallback={<p>Loading shop shell...</p>}>{children}</Suspense>;
}
