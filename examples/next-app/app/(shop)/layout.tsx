import { Suspense } from 'react';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p>Loading shop shell...</p>}>{children}</Suspense>;
}
