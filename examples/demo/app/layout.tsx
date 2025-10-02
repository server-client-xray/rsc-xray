import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RSC X-Ray Interactive Demo',
  description: 'Learn React Server Components analysis with interactive tutorials',
  keywords: ['react', 'server components', 'rsc', 'next.js', 'tutorial', 'demo'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
