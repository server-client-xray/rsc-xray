import { cookies } from 'next/headers';

/**
 * Route Segment Config Conflict - M4 T4.8 Demo
 *
 * This scenario demonstrates the analyzer detecting conflicts between
 * Next.js route segment configuration and actual code behavior.
 *
 * Issue: Route is configured with dynamic = 'force-static' but uses
 * dynamic APIs (cookies(), headers(), searchParams).
 *
 * Analyzer should flag: "route-segment-config-conflict"
 * Suggestion: Remove force-static or avoid dynamic APIs
 */

// Conflicting configuration: force-static with dynamic API usage
export const dynamic = 'force-static';

export default async function RouteConfigConflictPage() {
  // This conflicts with dynamic = 'force-static'!
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme');

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h1 className="mb-4 text-2xl font-bold text-blue-900">Route Config Conflict Demo</h1>
        <p className="mb-4 text-sm text-blue-700">
          This page demonstrates a route segment configuration conflict. The analyzer should detect
          that <code className="rounded bg-blue-100 px-1 py-0.5">dynamic = 'force-static'</code>{' '}
          conflicts with the use of{' '}
          <code className="rounded bg-blue-100 px-1 py-0.5">cookies()</code>.
        </p>
        <div className="rounded bg-blue-100 p-3">
          <p className="text-xs font-mono text-blue-800">
            Error: <strong>route-segment-config-conflict</strong>
            <br />
            File: app/(scenarios)/scenarios/route-config-conflict/page.tsx
            <br />
            Conflict: force-static + cookies() usage
            <br />
            Fix: Remove force-static or avoid cookies()
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-red-600 bg-red-50 p-4">
        <p className="text-sm text-red-800">❌ Configuration Conflict Detected</p>
        <div className="mt-2 space-y-1 text-xs text-red-700">
          <p>• Route config: dynamic = 'force-static'</p>
          <p>• Dynamic API used: cookies()</p>
          <p>• Result: Build error or unexpected behavior</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-300 bg-white p-4">
        <p className="text-sm text-gray-700">
          Theme from cookie: <strong>{theme?.value || 'default'}</strong>
        </p>
      </div>

      <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Recommended Fixes:</h3>
        <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-xs text-green-400">
          {`// Option 1: Remove force-static (allow dynamic)
// export const dynamic = 'force-static'; // ❌ Remove this
export default async function Page() {
  const cookies = await cookies();
  const theme = cookies.get('theme');
  // ...
}

// Option 2: Remove dynamic API usage
export const dynamic = 'force-static';
export default function Page() {
  // Don't use cookies(), headers(), or searchParams
  // Fetch data at build time instead
}

// Option 3: Use correct config for dynamic route
export const dynamic = 'force-dynamic'; // Match actual behavior
export default async function Page() {
  const cookies = await cookies();
  // ...
}`}
        </pre>
      </div>

      <div className="rounded-lg border border-blue-300 bg-blue-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-blue-700">Other Potential Conflicts:</h3>
        <ul className="space-y-1 text-xs text-blue-600">
          <li>
            • <strong>revalidate</strong> (number) + <strong>dynamic = 'force-dynamic'</strong>: ISR
            won't work with force-dynamic
          </li>
          <li>
            • <strong>runtime = 'edge'</strong> + Node.js APIs (fs, path, os): Edge runtime doesn't
            support Node APIs
          </li>
          <li>
            • <strong>fetchCache = 'force-no-store'</strong> + <strong>revalidate</strong>:
            Conflicting cache strategies
          </li>
        </ul>
      </div>
    </div>
  );
}
