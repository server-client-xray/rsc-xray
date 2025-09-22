import Link from 'next/link';

import { getProducts } from '../../../data/products';

export const revalidate = 60;

export default async function ProductsPage(): Promise<JSX.Element> {
  const products = await getProducts();

  return (
    <main>
      <section>
        <h1>Products</h1>
        <p>Server components render this list after awaiting `getProducts`.</p>
        <ul>
          {products.map((product, index) => {
            const numericPath = `/products/${index + 1}`;
            return (
              <li key={product.id}>
                <Link href={numericPath} prefetch>
                  {product.name}
                </Link>{' '}
                <span style={{ color: 'rgba(148, 163, 184, 0.75)', fontSize: 13 }}>
                  ({numericPath})
                </span>
              </li>
            );
          })}
        </ul>
        <p style={{ marginTop: 16, color: 'rgba(148, 163, 184, 0.85)' }}>
          Prefer semantic slugs? The analyzer still supports classic routes such as{' '}
          <code>/products/analyzer</code>; the numeric aliases simply keep the demo easy to explore.
        </p>
      </section>
    </main>
  );
}
