/**
 * Mock data for Pro feature previews
 *
 * ⚠️ DEMO PREVIEW ONLY
 * This is static demonstration data to showcase Pro features visually.
 * Actual Pro version includes real-time analysis and interactive capabilities.
 *
 * NO PRO BUSINESS LOGIC OR ALGORITHMS ARE INCLUDED HERE.
 */

export interface MockNode {
  id: string;
  name: string;
  kind: 'route' | 'server' | 'client' | 'suspense';
  file?: string;
  bytes?: number;
  hydrationMs?: number;
  children?: string[];
}

export interface MockBoundaryTreeData {
  route: string;
  nodes: MockNode[];
}

export interface MockCacheLensData {
  tags: Array<{
    name: string;
    routes: string[];
    nodeCount: number;
  }>;
}

export interface MockFlightTimelineData {
  route: string;
  chunks: Array<{
    index: number;
    timestamp: number;
    size: number;
    label?: string;
  }>;
}

export interface MockHydrationData {
  route: string;
  islands: Array<{
    name: string;
    file: string;
    hydrationMs: number;
    bytes: number;
  }>;
  totalMs: number;
}

// Example 1: E-commerce product page
export const mockBoundaryTree: MockBoundaryTreeData = {
  route: '/products/[id]',
  nodes: [
    {
      id: '1',
      name: '/products/[id]',
      kind: 'route',
      file: 'app/products/[id]/page.tsx',
      children: ['2', '3', '4'],
    },
    {
      id: '2',
      name: 'ProductDetails',
      kind: 'server',
      file: 'components/ProductDetails.tsx',
      children: ['5'],
    },
    {
      id: '3',
      name: 'AddToCart',
      kind: 'client',
      file: 'components/AddToCart.tsx',
      bytes: 12500,
      hydrationMs: 45,
    },
    {
      id: '4',
      name: 'RelatedProducts',
      kind: 'suspense',
      file: 'components/RelatedProducts.tsx',
      children: ['6'],
    },
    {
      id: '5',
      name: 'PriceDisplay',
      kind: 'client',
      file: 'components/PriceDisplay.tsx',
      bytes: 3200,
      hydrationMs: 12,
    },
    {
      id: '6',
      name: 'ProductCard',
      kind: 'client',
      file: 'components/ProductCard.tsx',
      bytes: 8900,
      hydrationMs: 23,
    },
  ],
};

export const mockCacheLens: MockCacheLensData = {
  tags: [
    {
      name: 'user-profile',
      routes: ['/dashboard', '/settings', '/profile'],
      nodeCount: 5,
    },
    {
      name: 'product-catalog',
      routes: ['/products', '/products/[id]', '/search'],
      nodeCount: 12,
    },
    {
      name: 'shopping-cart',
      routes: ['/cart', '/checkout'],
      nodeCount: 3,
    },
    {
      name: 'reviews',
      routes: ['/products/[id]', '/products/[id]/reviews'],
      nodeCount: 4,
    },
  ],
};

export const mockFlightTimeline: MockFlightTimelineData = {
  route: '/products/[id]',
  chunks: [
    { index: 0, timestamp: 0, size: 1024, label: 'Initial' },
    { index: 1, timestamp: 45, size: 512 },
    { index: 2, timestamp: 120, size: 2048, label: 'ProductDetails' },
    { index: 3, timestamp: 180, size: 1536 },
    { index: 4, timestamp: 250, size: 896 },
    { index: 5, timestamp: 320, size: 3200, label: 'RelatedProducts' },
    { index: 6, timestamp: 450, size: 256 },
  ],
};

export const mockHydration: MockHydrationData = {
  route: '/products/[id]',
  islands: [
    {
      name: 'AddToCart',
      file: 'components/AddToCart.tsx',
      hydrationMs: 45,
      bytes: 12500,
    },
    {
      name: 'PriceDisplay',
      file: 'components/PriceDisplay.tsx',
      hydrationMs: 12,
      bytes: 3200,
    },
    {
      name: 'ProductCard',
      file: 'components/ProductCard.tsx',
      hydrationMs: 23,
      bytes: 8900,
    },
    {
      name: 'ProductCard',
      file: 'components/ProductCard.tsx',
      hydrationMs: 21,
      bytes: 8900,
    },
    {
      name: 'ProductCard',
      file: 'components/ProductCard.tsx',
      hydrationMs: 24,
      bytes: 8900,
    },
  ],
  totalMs: 125,
};
