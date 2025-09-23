import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { OverlayBootstrap } from './components/OverlayBootstrap';

export const metadata: Metadata = {
  title: 'Server Client XRay Demo',
  description: 'Demo Next.js App Router project with Suspense islands.',
};

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body>
        <OverlayBootstrap />
        {children}
      </body>
    </html>
  );
}
