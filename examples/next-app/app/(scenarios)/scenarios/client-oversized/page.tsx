import { LargeComponent } from './LargeComponent';

/**
 * Oversized Client Component - M4 Analyzer Demo
 *
 * This scenario demonstrates the analyzer detecting client components
 * that exceed the 50KB bundle size threshold.
 *
 * Issue: LargeComponent contains large data sets that bloat the client bundle.
 *
 * Analyzer should flag: "client-component-oversized"
 * Suggestion: Code split, lazy load, or move data to server
 */

export default function ClientOversizedPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h1 className="mb-4 text-2xl font-bold text-blue-900">Oversized Client Component Demo</h1>
        <p className="mb-4 text-sm text-blue-700">
          This page demonstrates an oversized client component. The analyzer should detect that{' '}
          <code className="rounded bg-blue-100 px-1 py-0.5">LargeComponent</code> exceeds the 50KB
          threshold.
        </p>
        <div className="rounded bg-blue-100 p-3">
          <p className="text-xs font-mono text-blue-800">
            Violation: <strong>client-component-oversized</strong>
            <br />
            File: app/(scenarios)/scenarios/client-oversized/LargeComponent.tsx
            <br />
            Fix: Code split, lazy load, or move data to server
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-yellow-600 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ Client component below contains ~1000 items + lookup tables + translations (likely{' '}
          {'>'} 50KB)
        </p>
      </div>

      <LargeComponent />

      <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Recommended Fixes:</h3>
        <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-xs text-green-400">
          {`// Option 1: Lazy load component
const LargeComponent = lazy(() => import('./LargeComponent'));

<Suspense fallback={<Loading />}>
  <LargeComponent />
</Suspense>

// Option 2: Move data to server
async function getData() {
  'use server';
  return LARGE_DATA_SET;
}

// Option 3: Paginate and load on demand
// Only fetch/render what's visible`}
        </pre>
      </div>
    </div>
  );
}
