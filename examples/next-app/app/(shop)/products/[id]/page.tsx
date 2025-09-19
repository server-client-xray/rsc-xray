import { notFound } from 'next/navigation';

import Reviews from '../../../components/Reviews';
import { getProduct, getProductReviews } from '../../../../data/products';

interface ProductPageProps {
  params: { id: string };
}

export const dynamicParams = true;

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  const reviewsPromise = getProductReviews(product.id);

  return (
    <main>
      <section>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <Reviews productId={product.id} reviewsPromise={reviewsPromise} />
      </section>
    </main>
  );
}
