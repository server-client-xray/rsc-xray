/**
 * Oversized Client Component - M4 Analyzer Demo
 *
 * This component intentionally creates a large client bundle to trigger
 * the oversized component warning (> 50KB threshold).
 *
 * Analyzer should flag: "client-component-oversized"
 * Suggestion: Consider code splitting, lazy loading, or moving to server
 */

'use client';

import { useState } from 'react';

// Simulate large data that will bloat the bundle
const LARGE_DATA_SET = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
  description: `This is a detailed description for item ${i}. It contains some text to make the bundle larger. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
  metadata: {
    category: `Category ${i % 10}`,
    tags: [`tag${i % 5}`, `tag${i % 7}`, `tag${i % 3}`],
    prices: {
      regular: i * 10 + 99,
      sale: i * 8 + 79,
      bulk: i * 6 + 59,
    },
    availability: {
      inStock: i % 3 === 0,
      warehouse: `WH-${i % 5}`,
      suppliers: [
        { name: `Supplier ${i % 4}`, rating: 4.5 + (i % 10) / 10 },
        { name: `Supplier ${(i + 1) % 4}`, rating: 4.0 + (i % 15) / 15 },
      ],
    },
  },
  reviews: Array.from({ length: 5 }, (_, j) => ({
    id: `review-${i}-${j}`,
    rating: 3 + (j % 3),
    text: `Review ${j} for item ${i}. This is some review text to add more content.`,
    author: `User ${(i + j) % 100}`,
  })),
}));

// Additional large lookup tables
const LOOKUP_TABLE = Array.from({ length: 500 }, (_, i) => ({
  key: `key-${i}`,
  value: `value-${i}`,
  config: {
    enabled: i % 2 === 0,
    priority: i % 5,
    settings: {
      timeout: i * 100,
      retries: i % 10,
      cache: i % 3 === 0,
    },
  },
}));

const TRANSLATIONS = {
  en: Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`key${i}`, `English text ${i}`])),
  fr: Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`key${i}`, `Texte français ${i}`])),
  es: Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`key${i}`, `Texto español ${i}`])),
};

export function LargeComponent(): JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredItems = LARGE_DATA_SET.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoryItems = selectedCategory
    ? filteredItems.filter((item) => item.metadata.category === selectedCategory)
    : filteredItems;

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search items..."
          className="flex-1 rounded border border-gray-300 px-4 py-2"
        />
        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="rounded border border-gray-300 px-4 py-2"
        >
          <option value="">All Categories</option>
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i} value={`Category ${i}`}>
              Category {i}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
        <p className="text-sm text-gray-700">
          Showing {categoryItems.length} of {LARGE_DATA_SET.length} items
          <br />
          Bundle includes {LARGE_DATA_SET.length} items, {LOOKUP_TABLE.length} config entries, and{' '}
          {Object.keys(TRANSLATIONS).length} language packs.
        </p>
      </div>

      <div className="grid gap-4">
        {categoryItems.slice(0, 10).map((item) => (
          <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-sm text-gray-600">{item.description}</p>
            <div className="mt-2 flex gap-2 text-xs text-gray-500">
              {item.metadata.tags.map((tag) => (
                <span key={tag} className="rounded bg-gray-100 px-2 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
