import Link from 'next/link';

export default function HomePage(): JSX.Element {
  return (
    <main>
      <section>
        <h1>Server Client XRay Demo</h1>
        <p>This example highlights Suspense boundaries and client islands for analyzer fixtures.</p>
        <p>
          Start with the <Link href="/products">/products</Link> route to load data-heavy sections
          and a client-only reviews widget.
        </p>
      </section>
    </main>
  );
}
