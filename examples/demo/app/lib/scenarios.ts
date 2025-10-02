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
  /** Human-readable description of what the analyzer is checking */
  contextDescription?: string;
  /** Context to pass to LSP analyzer (for rules that need it) */
  context?: {
    clientComponentPaths?: string[];
    clientBundles?: Array<{
      filePath: string;
      chunks: string[];
      totalBytes: number;
    }>;
    routeConfig?: {
      dynamic?: string;
      revalidate?: number | false;
      fetchCache?: string;
      runtime?: string;
      preferredRegion?: string;
    };
    reactVersion?: string;
  };
}

export const scenarios: Scenario[] = [
  // Fundamentals Category
  {
    id: 'serialization-boundary', // Matches LSP scenario
    title: 'Serialization Boundary Violation',
    category: 'fundamentals',
    isPro: false,
    rule: 'serialization-boundary-violation',
    description: 'Passing non-serializable props from Server to Client components',
    code: `import { ClientButton } from './ClientButton';

export default function Page() {
  const handleClick = () => console.log('clicked');
  
  return <ClientButton onClick={handleClick} />;
}`,
    explanation: {
      what: 'This code tries to pass a function from a Server Component to a Client Component',
      why: 'Server Components run on the server, Client Components run in the browser. Functions cannot be serialized and sent over the network.',
      how: 'Move the function to the Client Component, or use a serializable prop like a URL for server actions',
    },
    proFeatures: [
      'VS Code quick fix: Convert to Server Action',
      'Overlay visual boundary tree with component-level violations',
      'Automated refactoring with codemod support',
    ],
    contextDescription:
      "Analyzer knows 'ClientButton' is a Client Component, so it checks props passed to it",
    context: {
      clientComponentPaths: ['./ClientButton', 'ClientButton'],
    },
  },

  {
    id: 'client-forbidden-imports', // Matches LSP scenario (note the 's')
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
    proFeatures: [
      "VS Code diagnostics in Problems panel with 'use client' fix",
      'Overlay visual tree showing client/server boundaries',
      'Automatic refactoring to move logic to server components',
    ],
  },

  {
    id: 'suspense-boundary', // Matches LSP scenario
    title: 'Missing Suspense Boundary',
    category: 'fundamentals',
    isPro: false,
    rule: 'suspense-boundary-missing',
    description: 'Async Server Component without Suspense wrapper',
    code: `export default async function Page() {
  const data = await fetch('https://api.example.com/data');
  const json = await data.json();
  
  return <div>{json.title}</div>;
}`,
    explanation: {
      what: 'This async Server Component fetches data but is not wrapped in a Suspense boundary',
      why: 'Without Suspense, the entire page waits for data before showing anything to users',
      how: 'Wrap async components with <Suspense fallback={<Loading />}> for better UX',
    },
    proFeatures: [
      'VS Code quick fix: Wrap in Suspense with auto-import',
      'Overlay visual indicators for missing/parallel Suspense opportunities',
      'Automated codemod to add Suspense boundaries',
    ],
  },

  // Performance Category
  {
    id: 'client-size', // Matches LSP scenario
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
      how: 'Use lightweight alternatives (date-fns instead of moment), tree-shake imports (import { sortBy } from lodash), or move heavy logic to Server Components',
    },
    proFeatures: [
      'Dashboard with bundle size trends over time',
      'VS Code quick fix: Convert to dynamic import with guidance',
      'CI budget enforcement with PR comments',
    ],
    contextDescription:
      'Analyzer simulates a 320KB bundle (exceeding the 50KB threshold). Note: Bundle size is simulated and does not update when editing imports.',
    context: {
      clientBundles: [
        {
          filePath: 'demo.tsx',
          chunks: ['chunk-1.js', 'chunk-2.js', 'chunk-3.js'],
          totalBytes: 320000, // 320 KB - exceeds threshold
        },
      ],
    },
  },

  {
    id: 'duplicate-dependencies',
    title: 'Duplicate Dependencies',
    category: 'performance',
    isPro: false,
    rule: 'duplicate-dependencies',
    description: 'Multiple client components bundling the same heavy library',
    code: `'use client';
import { format } from 'date-fns'; // Shared with Header.tsx and Footer.tsx

export function DateDisplay({ date }: { date: Date }) {
  return <div>{format(date, 'PPP')}</div>;
}`,
    explanation: {
      what: 'This component (DateDisplay.tsx) shares 3 dependencies (date-fns, lodash, moment) with Header.tsx and Footer.tsx',
      why: 'Duplicate dependencies waste bandwidth and increase bundle size unnecessarily',
      how: 'Extract shared dependencies into a common chunk, or move to a shared utility Server Component',
    },
    proFeatures: [
      'Dashboard showing duplicate dependency analysis across all routes',
      'Overlay visual map of shared chunks across components',
      'CI trend tracking for dependency duplication over time',
    ],
    contextDescription:
      'Analyzer simulates 3 client bundles (DateDisplay, Header, Footer) sharing date-fns, lodash, and moment',
    context: {
      clientBundles: [
        {
          filePath: 'components/DateDisplay.tsx',
          chunks: ['date-fns.js', 'lodash.js', 'moment.js'],
          totalBytes: 45000,
        },
        {
          filePath: 'components/Header.tsx',
          chunks: ['date-fns.js', 'lodash.js', 'moment.js'],
          totalBytes: 44000,
        },
        {
          filePath: 'components/Footer.tsx',
          chunks: ['date-fns.js', 'lodash.js', 'moment.js'],
          totalBytes: 43000,
        },
      ],
    },
  },

  {
    id: 'react19-cache',
    title: 'React 19 Cache Opportunity',
    category: 'performance',
    isPro: false,
    rule: 'react19-cache-opportunity',
    description: 'Deduplicate fetch calls with React 19 cache()',
    code: `export default async function Page() {
  const user = await fetch('/api/user/1');
  const userData = await user.json();
  
  const userAgain = await fetch('/api/user/1'); // Duplicate!
  const userDataAgain = await userAgain.json();
  
  return <div>{userData.name}</div>;
}`,
    explanation: {
      what: 'The same URL is fetched multiple times in this component',
      why: 'Duplicate fetches waste bandwidth and slow down rendering',
      how: 'Wrap fetch in React 19 cache() to automatically deduplicate requests',
    },
    proFeatures: [
      'VS Code quick fix: Wrap fetch in cache() with auto-import',
      'Overlay cache lens showing fetch request patterns',
      'Dashboard tracking cache hit/miss rates over time',
    ],
  },

  // Route Configuration
  {
    id: 'route-config',
    title: 'Route Config Conflict',
    category: 'performance',
    isPro: false,
    rule: 'route-segment-config-conflict',
    description: 'Conflicting route segment configuration options',
    code: `export const dynamic = 'force-dynamic';
export const revalidate = 60; // ⚠️ Conflict!

export default function Page() {
  return <div>Dynamic page</div>;
}`,
    explanation: {
      what: 'This route has conflicting configuration: force-dynamic with revalidate',
      why: 'ISR (Incremental Static Regeneration) with revalidate requires static or auto mode, not force-dynamic',
      how: "Remove 'force-dynamic' to enable ISR, or remove revalidate for fully dynamic rendering",
    },
    proFeatures: [
      'Overlay cache lens showing ISR/PPR metadata per route',
      'Dashboard with route strategy (static/dynamic/ISR) visualization',
      'CI monitoring for route config changes affecting cache behavior',
    ],
    contextDescription:
      "Analyzer checks: dynamic = 'force-dynamic' + revalidate = 60 (conflicting options)",
    context: {
      routeConfig: {
        dynamic: 'force-dynamic',
        revalidate: 60,
      },
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
