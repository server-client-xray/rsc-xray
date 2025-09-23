import { getProduct, getProductReviews } from '../../../../data/products';

export const metadata = {
  title: 'Sequential awaits – Server Promise.all violation',
  description: 'Demonstrates the Promise.all suggestion triggered by serial awaits.',
};

export default async function ServerPromiseAllScenario(): Promise<JSX.Element> {
  const product = await getProduct('analyzer');
  const related = await getProduct('overlay');

  const reviews = await getProductReviews(product?.id ?? 'analyzer');

  return (
    <main style={{ padding: '32px' }}>
      <h1>Sequential awaits in a server component</h1>
      <p style={{ maxWidth: 560, marginBottom: 24 }}>
        This page awaits product data sequentially. The analyzer flags the second await with the
        <strong> server-promise-all</strong> suggestion, recommending that independent requests be
        wrapped in <code>Promise.all</code>.
      </p>
      <section style={{ display: 'grid', gap: 16, maxWidth: 560 }}>
        <article style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 16 }}>
          <h2>{product?.name ?? 'Analyzer'}</h2>
          <p>{product?.description}</p>
        </article>
        <article style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 16 }}>
          <h2>{related?.name ?? 'Overlay'}</h2>
          <p>{related?.description}</p>
        </article>
      </section>
      <section style={{ marginTop: 32 }}>
        <h2>Sample reviews</h2>
        <ul>
          {reviews.map((review) => (
            <li key={review.id}>
              <strong>{review.author}</strong>: {review.comment}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
