import { ChartComponent } from './ChartComponent';
import { TableComponent } from './TableComponent';
import { CodeMirrorEditor } from '../_components/CodeMirrorEditor';
import { CodeBlock } from '../_components/CodeBlock';
import { DiagnosticBox } from '../_components/DiagnosticBox';
import { findTextDiagnostic } from '../_components/diagnosticUtils';

/**
 * Demonstrates duplicate dependencies analyzer (M4)
 *
 * This scenario shows multiple client components that import the same heavy
 * dependencies, leading to bundle bloat. The analyzer detects these duplications
 * and suggests shared chunk extraction.
 */

const FAULTY_CODE = `'use client';
// ❌ Both ChartWidget and TableWidget import heavy libraries
// These dependencies are bundled separately in each component

// ChartWidget.tsx (25 KB)
import { LineChart } from 'recharts';        // 15 KB
import { format } from 'date-fns';           // 5 KB
import { calculateStats } from './utils';    // 3 KB

export function ChartWidget(): JSX.Element {
  const data = calculateStats(rawData);
  return <LineChart data={data} />;
}

// TableWidget.tsx (28 KB)  
import { DataGrid } from '@mui/x-data-grid';  // 18 KB
import { format } from 'date-fns';            // 5 KB (duplicate!)
import { calculateStats } from './utils';     // 3 KB (duplicate!)

export function TableWidget(): JSX.Element {
  const data = calculateStats(rawData);
  return <DataGrid rows={data} />;
}

// Both components ship date-fns + utils = 8 KB × 2 = 16 KB wasted`;

const FIXED_CODE = `// ✅ Extract shared dependencies to a separate chunk

// utils/shared.ts - Common utilities extracted
import { format } from 'date-fns';
import { calculateStats } from './stats';

export { format, calculateStats };

// ChartWidget.tsx (20 KB - 5 KB saved)
'use client';
import { LineChart } from 'recharts';
import { format, calculateStats } from './utils/shared';

export function ChartWidget(): JSX.Element {
  const data = calculateStats(rawData);
  return <LineChart data={data} />;
}

// TableWidget.tsx (23 KB - 5 KB saved)
'use client';
import { DataGrid } from '@mui/x-data-grid';
import { format, calculateStats } from './utils/shared';

export function TableWidget(): JSX.Element {
  const data = calculateStats(rawData);
  return <DataGrid rows={data} />;
}

// shared.js (8 KB) - Loaded once, shared by both components
// Total: 20 + 23 + 8 = 51 KB (vs 53 KB before)
// But more importantly: shared chunk is cached between navigations`;

const ALTERNATIVE_CODE = `// Alternative: Use dynamic imports for code-splitting

// Dashboard.tsx
import dynamic from 'next/dynamic';

const ChartWidget = dynamic(() => import('./ChartWidget'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Client-only if needed
});

const TableWidget = dynamic(() => import('./TableWidget'), {
  loading: () => <TableSkeleton />,
  ssr: false,
});

export function Dashboard(): JSX.Element {
  return (
    <div>
      <ChartWidget />
      <TableWidget />
    </div>
  );
}

// Next.js automatically extracts shared dependencies into common chunks`;

export default function DuplicateDependenciesPage() {
  // Create mock diagnostics for the interactive editor
  const mockDiagnostics = [
    findTextDiagnostic(
      FAULTY_CODE,
      "import { format } from 'date-fns';           // 5 KB",
      'warning',
      'Duplicate dependency detected: date-fns is imported in multiple client components. Consider extracting to a shared module.',
      'rsc-xray'
    ),
    findTextDiagnostic(
      FAULTY_CODE,
      "import { calculateStats } from './utils';    // 3 KB",
      'warning',
      'Duplicate dependency detected: ./utils is imported in multiple client components. This adds 3 KB to each component bundle.',
      'rsc-xray'
    ),
  ].filter((d) => d !== null);

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Duplicate Dependencies</h1>
        <p className="text-gray-600">
          Detects when multiple client components import the same dependencies, leading to bundle
          bloat and unnecessary network transfer. Suggests shared chunk extraction or dynamic
          imports.
        </p>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-300 p-4">
        <h2 className="font-semibold text-blue-900 mb-2">Rule: duplicate-dependencies</h2>
        <p className="text-sm text-blue-800">
          Flags client components that share dependencies above a certain size threshold. Suggests
          extracting shared code or using dynamic imports.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Interactive Code Editor</h2>
        <p className="text-sm text-gray-600 mb-3">
          Edit the code below to see how duplicate imports affect bundle size. Hover over the yellow
          underlines to see optimization suggestions.
        </p>
        <CodeMirrorEditor initialValue={FAULTY_CODE} mockDiagnostics={mockDiagnostics} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Static View (Reference)</h2>
        <CodeBlock
          code={FAULTY_CODE}
          title="ChartWidget.tsx + TableWidget.tsx (❌ Duplicates)"
          highlightLines={[6, 7, 8, 13, 14, 15]}
        />
      </div>

      <div className="space-y-3">
        <DiagnosticBox
          type="warning"
          title="Duplicate dependencies detected"
          code="duplicate-dependencies"
          message="date-fns (5 KB) and utils (3 KB) are imported in 2 client components, adding 8 KB × 2 = 16 KB to the total bundle. Extract these to a shared module or use dynamic imports."
          fix="Extract shared dependencies to a common module or use Next.js dynamic imports"
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Fixed Code (Shared Dependencies)</h2>
        <CodeBlock code={FIXED_CODE} title="Extracted shared utilities" />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Alternative: Dynamic Imports</h2>
        <CodeBlock code={ALTERNATIVE_CODE} title="Using next/dynamic" />
      </div>

      <div className="rounded-lg bg-green-50 border border-green-300 p-4">
        <h3 className="font-semibold text-green-900 mb-2">Bundle Size Impact</h3>
        <div className="text-sm text-green-800 space-y-2">
          <p>
            <strong>Before (Duplicated):</strong> ChartWidget (25 KB) + TableWidget (28 KB) ={' '}
            <strong>53 KB total</strong>
          </p>
          <p>
            <strong>After (Shared Chunk):</strong> ChartWidget (20 KB) + TableWidget (23 KB) +
            Shared (8 KB) = <strong>51 KB total</strong>
          </p>
          <p>
            <strong>More importantly:</strong> Shared chunk is cached across navigations, so
            subsequent page loads only need 20 KB or 23 KB, not both.
          </p>
          <p className="font-semibold mt-2">
            ⚡ Result: <strong>Better caching + faster subsequent loads</strong>
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Why This Matters</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Duplicate dependencies</strong> waste bandwidth and slow down page loads. Each
            client component bundles its own copy of shared utilities, even if they are identical.
          </p>
          <p>
            <strong>Shared chunks</strong> allow the browser to download common code once and reuse
            it across multiple components. This is especially beneficial for large libraries like
            date-fns, lodash, or charting libraries.
          </p>
          <p>
            <strong>Best for:</strong> Apps with multiple dashboard widgets, data visualizations, or
            feature-rich client components that share utilities.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">How the Analyzer Detects This</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Analyzes all client component imports and their dependency trees</li>
          <li>Identifies dependencies that appear in multiple components</li>
          <li>Calculates the duplicate size overhead (size × occurrence count)</li>
          <li>Suggests extraction when duplicates exceed a threshold (e.g., 5 KB)</li>
          <li>
            Provides guidance on creating shared modules or using Next.js code-splitting features
          </li>
        </ul>
      </div>

      <div className="rounded-lg bg-gray-50 border border-gray-300 p-4">
        <h3 className="font-semibold mb-2">Live Demo Components</h3>
        <p className="text-sm text-gray-600 mb-4">
          The components below simulate heavy client-side libraries. In a real app, the analyzer
          would detect if they share dependencies.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartComponent title="Sales Chart" color="#3b82f6" />
          <ChartComponent title="Revenue Chart" color="#10b981" />
          <TableComponent title="Transaction Table" />
        </div>
      </div>
    </div>
  );
}
