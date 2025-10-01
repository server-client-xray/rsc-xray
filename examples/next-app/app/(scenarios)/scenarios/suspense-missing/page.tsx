import { CodeBlock } from '../_components/CodeBlock';
import { DiagnosticBox } from '../_components/DiagnosticBox';

/**
 * Suspense Boundary Missing - Performance Demo
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

const FAULTY_CODE = `// Server Component
async function SlowData() {
  const data = await fetch('/api/slow-data');
  return <div>{data}</div>;
}

export default function Page() {
  return (
    <div>
      <h1>My Page</h1>
      <SlowData />  {/* ❌ No Suspense boundary */}
    </div>
  );
}`;

const FIXED_CODE = `import { Suspense } from 'react';

async function SlowData() {
  const data = await fetch('/api/slow-data');
  return <div>{data}</div>;
}

export default function Page() {
  return (
    <div>
      <h1>My Page</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <SlowData />  {/* ✅ Wrapped in Suspense */}
      </Suspense>
    </div>
  );
}`;

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
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Suspense Boundary Missing</h1>
        <p className="text-gray-600">
          Detects async server components without Suspense boundaries, which blocks the entire page
          render until all data is fetched.
        </p>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-300 p-4">
        <h2 className="font-semibold text-blue-900 mb-2">Rule: suspense-boundary-missing</h2>
        <p className="text-sm text-blue-800">
          Flags async server components that should be wrapped in Suspense to enable streaming and
          improve perceived performance.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Faulty Code</h2>
        <CodeBlock code={FAULTY_CODE} title="page.tsx" highlightLines={[9]} />
      </div>

      <DiagnosticBox
        type="warning"
        title="Missing Suspense boundary"
        message="Async server component <SlowData /> is not wrapped in a Suspense boundary. This blocks the entire page render until the component finishes loading."
        code="<SlowData />"
        fix={FIXED_CODE}
      />

      <div>
        <h2 className="text-xl font-semibold mb-3">Why This Matters</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>
            <strong>Blocking Render:</strong> Without Suspense, Next.js waits for all async
            components before sending any HTML
          </li>
          <li>
            <strong>Poor UX:</strong> Users see a blank page until everything is ready
          </li>
          <li>
            <strong>No Streaming:</strong> Can't leverage React 18 streaming capabilities
          </li>
          <li>
            <strong>Longer TTFB:</strong> Time to First Byte increases significantly
          </li>
        </ul>
      </div>

      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-3">Live Example</h2>
        <p className="text-sm text-gray-600 mb-4">
          The component below will block page rendering for 2 seconds (no Suspense). Notice how
          nothing appears until everything is ready.
        </p>
        <div className="rounded-lg border border-yellow-600 bg-yellow-50 p-4 mb-4">
          <p className="text-sm text-yellow-800">⚠️ Loading data (page blocked for 2 seconds)...</p>
        </div>
        <SlowData />
      </div>
    </div>
  );
}
