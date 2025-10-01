/**
 * Suspense Boundary Missing - M4 Analyzer Demo
 *
 * This scenario demonstrates the Suspense boundary analyzer detecting
 * missing Suspense boundaries around async server components.
 *
 * Issue: SlowData is an async server component that should be wrapped
 * in Suspense to enable streaming and prevent blocking the entire page.
 *
 * Analyzer should flag: "suspense-boundary-missing"
 * Suggestion: Wrap <SlowData /> in <Suspense fallback={...}>
 */

async function SlowData() {
  // Simulate slow data fetch (2 seconds)
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return (
    <div className="rounded-lg border border-green-600 bg-green-50 p-6">
      <h3 className="mb-2 text-lg font-semibold text-green-900">✓ Data Loaded Successfully</h3>
      <p className="text-sm text-green-700">
        This component took 2 seconds to load. Without Suspense, the entire page was blocked during
        this time.
      </p>
    </div>
  );
}

export default function SuspenseMissingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h1 className="mb-4 text-2xl font-bold text-blue-900">Suspense Boundary Missing Demo</h1>
        <p className="mb-4 text-sm text-blue-700">
          This page demonstrates a missing Suspense boundary. The analyzer should detect that{' '}
          <code className="rounded bg-blue-100 px-1 py-0.5">SlowData</code> is an async component
          without Suspense.
        </p>
        <div className="rounded bg-blue-100 p-3">
          <p className="text-xs font-mono text-blue-800">
            Violation: <strong>suspense-boundary-missing</strong>
            <br />
            File: app/(scenarios)/scenarios/suspense-missing/page.tsx
            <br />
            Fix: Wrap &lt;SlowData /&gt; in &lt;Suspense&gt;
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-yellow-600 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ Loading data below (no Suspense, page blocked for 2 seconds)...
        </p>
      </div>

      {/* Missing Suspense boundary - analyzer should flag this */}
      <SlowData />

      <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Recommended Fix:</h3>
        <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-xs text-green-400">
          {`import { Suspense } from 'react';

<Suspense fallback={<div>Loading...</div>}>
  <SlowData />
</Suspense>`}
        </pre>
      </div>
    </div>
  );
}
