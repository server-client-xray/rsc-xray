'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { createHydrationHook } from '@rsc-xray/hydration';

const useHydrationTimings = createHydrationHook({ useEffect, useRef });

interface Review {
  id: string;
  author: string;
  comment: string;
}

interface ReviewsProps {
  productId: string;
  reviewsPromise: Promise<Review[]>;
}

export default function Reviews({ productId, reviewsPromise }: ReviewsProps): JSX.Element {
  useHydrationTimings('module:app/components/Reviews.tsx');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    reviewsPromise.then((value) => {
      if (mounted) {
        setReviews(value);
      }
    });
    return () => {
      mounted = false;
    };
  }, [reviewsPromise]);

  const refetch = () => {
    startTransition(() => {
      void (async () => {
        const { getProductReviews } = await import('../../data/products');
        const next = await getProductReviews(productId);
        setReviews(next);
      })();
    });
  };

  return (
    <section>
      <h2>Customer reviews</h2>
      <button type="button" onClick={refetch} disabled={isPending}>
        {isPending ? 'Refreshing...' : 'Refresh reviews'}
      </button>
      <ul>
        {reviews.map((review) => (
          <li key={review.id}>
            <strong>{review.author}</strong>
            <p>{review.comment}</p>
          </li>
        ))}
      </ul>
      {reviews.length === 0 && <p>Loading reviews...</p>}
    </section>
  );
}
