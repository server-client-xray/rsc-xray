export interface Product {
  id: string;
  name: string;
  description: string;
}

const PRODUCTS: Product[] = [
  {
    id: 'analyzer',
    name: 'Analyzer',
    description: 'Static analysis for RSC boundaries and manifests.',
  },
  {
    id: 'overlay',
    name: 'Overlay',
    description: 'Interactive Suspense and hydration inspector.',
  },
  {
    id: 'cache-lens',
    name: 'Cache Lens',
    description: 'Model cache tags and revalidation impact.',
  },
];

export async function getProducts(): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return PRODUCTS;
}

export async function getProduct(id: string): Promise<Product | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 60));
  return PRODUCTS.find((product) => product.id === id);
}

export async function getProductReviews(
  id: string
): Promise<Array<{ id: string; author: string; comment: string }>> {
  await new Promise((resolve) => setTimeout(resolve, 160));
  return [
    { id: `${id}-1`, author: 'Perf Lead', comment: 'Caught Suspense waterfalls before launch.' },
    { id: `${id}-2`, author: 'DX Engineer', comment: 'Analyzer JSON powers our CI budgets.' },
  ];
}
