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
          {products.map((product) => (
            <li key={product.id}>
              <Link href={`/products/${product.id}`} prefetch>
                {product.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
