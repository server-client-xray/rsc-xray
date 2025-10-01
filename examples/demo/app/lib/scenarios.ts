/**
 * Scenario definitions for the interactive demo
 *
 * Each scenario demonstrates a specific RSC X-Ray analysis rule with:
 * - Sample code that triggers the rule
 * - Explanation of what's wrong and why
 * - How to fix it
 * - Pro features available for this scenario
 */

export interface Scenario {
  id: string;
  title: string;
  category: 'fundamentals' | 'performance' | 'pro';
  isPro: boolean;
  rule: string;
  description: string;
  code: string;
  explanation: {
    what: string;
    why: string;
    how: string;
  };
  proFeatures?: string[];
}

export const scenarios: Scenario[] = [
  // Fundamentals Category
  {
    id: 'serialization-boundary',
    title: 'Serialization Boundary Violation',
    category: 'fundamentals',
    isPro: false,
    rule: 'server-client-serialization-violation',
    description: 'Passing non-serializable props from Server to Client components',
    code: `// app/page.tsx (Server Component)
export default function Page() {
  const handleClick = () => console.log('clicked');
  
  return <ClientButton onClick={handleClick} />;
}

// components/ClientButton.tsx
'use client';
export function ClientButton({ onClick }) {
  return <button onClick={onClick}>Click me</button>;
}`,
    explanation: {
      what: 'This code tries to pass a function from a Server Component to a Client Component',
      why: 'Server Components run on the server, Client Components run in the browser. Functions cannot be serialized and sent over the network.',
      how: 'Move the function to the Client Component, or use a serializable prop like a URL for server actions',
    },
  },

  {
    id: 'client-forbidden-import',
    title: 'Client Component with Node.js Import',
    category: 'fundamentals',
    isPro: false,
    rule: 'client-forbidden-import',
    description: 'Importing Node.js built-ins in Client Components',
    code: `'use client';
import fs from 'fs';
import path from 'path';

export function FileReader() {
  const data = fs.readFileSync('file.txt');
  return <div>{data}</div>;
}`,
    explanation: {
      what: 'This Client Component imports Node.js built-in modules (fs, path)',
      why: 'Client Components run in the browser, which does not have access to Node.js APIs like fs or path',
      how: 'Move file operations to Server Components, or fetch data from an API route',
    },
  },

  {
    id: 'suspense-boundary-missing',
    title: 'Missing Suspense Boundary',
    category: 'fundamentals',
    isPro: false,
    rule: 'suspense-boundary-missing',
    description: 'Async Server Component without Suspense wrapper',
    code: `// app/page.tsx
export default async function Page() {
  const data = await fetch('https://api.example.com/data');
  const json = await data.json();
  
  return <div>{json.title}</div>;
}`,
    explanation: {
      what: 'This async Server Component fetches data but is not wrapped in a Suspense boundary',
      why: 'Without Suspense, the entire page waits for data before showing anything to users',
      how: 'Wrap async components with <Suspense fallback={<Loading />}> for better UX',
    },
  },

  // Performance Category
  {
    id: 'client-oversized',
    title: 'Oversized Client Bundle',
    category: 'performance',
    isPro: false,
    rule: 'client-component-oversized',
    description: 'Client Component bundle exceeds size threshold',
    code: `'use client';
import _ from 'lodash'; // 71KB!
import moment from 'moment'; // 67KB!
import * as icons from 'react-icons/all'; // 200KB+!

export function HeavyComponent() {
  const formatted = moment().format('YYYY-MM-DD');
  const sorted = _.sortBy([1, 3, 2]);
  
  return <div>{formatted} {icons.FaCheck}</div>;
}`,
    explanation: {
      what: 'This Client Component imports large libraries, creating a 300KB+ bundle',
      why: 'Large bundles slow down page load and hurt mobile users on slow connections',
      how: 'Use lightweight alternatives, tree-shake imports, or move heavy logic to Server Components',
    },
  },

  {
    id: 'react19-cache',
    title: 'React 19 Cache Opportunity',
    category: 'performance',
    isPro: false,
    rule: 'react19-cache-opportunity',
    description: 'Deduplicate fetch calls with React 19 cache()',
    code: `// lib/api.ts
export async function getUser(id: string) {
  const res = await fetch(\`/api/users/\${id}\`);
  return res.json();
}

// Multiple components call getUser(1) - fetched multiple times!`,
    explanation: {
      what: 'The same data is fetched multiple times across different components',
      why: 'Duplicate fetches waste bandwidth and slow down rendering',
      how: 'Wrap the function with React 19 cache() to deduplicate requests automatically',
    },
  },

  // Route Configuration
  {
    id: 'route-config',
    title: 'Route Config Conflict',
    category: 'performance',
    isPro: false,
    rule: 'route-segment-config-conflict',
    description: 'Conflicting route segment configuration options',
    code: `// app/page.tsx
export const dynamic = 'force-static';
export const revalidate = 60; // ⚠️ Conflict!

export default function Page() {
  return <div>Static page with revalidate?</div>;
}`,
    explanation: {
      what: 'This route has conflicting configuration: force-static with revalidate',
      why: "Static pages don't revalidate - these options are mutually exclusive",
      how: "Choose either 'force-static' for full static or 'force-dynamic' with revalidate",
    },
  },

  // Pro Teasers
  {
    id: 'pro-waterfall',
    title: 'Waterfall Detection (Pro)',
    category: 'pro',
    isPro: true,
    rule: 'route-waterfall-detected',
    description: 'Sequential data fetching causes performance waterfalls',
    code: `// This scenario requires Pro subscription
export default async function Page() {
  const user = await getUser();
  const posts = await getPosts(user.id);
  const comments = await getComments(posts[0].id);
  
  return <div>...</div>;
}`,
    explanation: {
      what: 'Pro feature: Detects sequential async calls that could be parallel',
      why: 'Waterfalls add latency - each await blocks the next',
      how: 'Pro suggestion: Use Promise.all() or React 19 use() for parallel fetching',
    },
    proFeatures: [
      'Waterfall visualization',
      'Automatic refactoring suggestions',
      'Performance timeline',
    ],
  },
];

/**
 * Get scenario by ID
 */
export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}

/**
 * Get scenarios by category
 */
export function getScenariosByCategory(category: Scenario['category']): Scenario[] {
  return scenarios.filter((s) => s.category === category);
}
