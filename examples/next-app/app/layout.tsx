import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Server Client XRay Demo',
  description: 'Demo Next.js App Router project with Suspense islands.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
