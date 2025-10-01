import { headers } from 'next/headers';

/**
 * Dynamic Route Detection - M4 T4.2 Demo
 *
 * This scenario demonstrates the analyzer detecting dynamic routes
 * (routes that use Next.js dynamic APIs or have dynamic configuration).
 *
 * Issue: Route uses headers() API, making it dynamic (cannot be statically generated).
 *
 * Analyzer should detect: cache.dynamic = 'force-dynamic'
 * Info: Route will be rendered on-demand for each request
 */

export default async function DynamicRoutePage() {
  // Using headers() makes this route dynamic
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || 'unknown';
  const host = headersList.get('host') || 'unknown';

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h1 className="mb-4 text-2xl font-bold text-blue-900">Dynamic Route Detection Demo</h1>
        <p className="mb-4 text-sm text-blue-700">
          This page demonstrates a dynamic route. The analyzer should detect that this route uses{' '}
          <code className="rounded bg-blue-100 px-1 py-0.5">headers()</code> and therefore must be
          rendered dynamically.
        </p>
        <div className="rounded bg-blue-100 p-3">
          <p className="text-xs font-mono text-blue-800">
            Detection: <strong>Dynamic Route</strong>
            <br />
            File: app/(scenarios)/scenarios/dynamic-route/page.tsx
            <br />
            Reason: Uses headers() API
            <br />
            Rendering: On-demand (per request)
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-purple-600 bg-purple-50 p-4">
        <p className="text-sm text-purple-800">🔄 This route is dynamic (not static/ISR)</p>
        <div className="mt-2 space-y-1 text-xs text-purple-700">
          <p>• Rendered on each request</p>
          <p>• Cannot be pre-generated at build time</p>
          <p>• Has access to request-specific data</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-300 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Request Headers:</h3>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="font-medium text-gray-600">User Agent:</span>
            <span className="truncate text-gray-800">{userAgent}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-gray-600">Host:</span>
            <span className="text-gray-800">{host}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">What Makes a Route Dynamic:</h3>
        <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-xs text-green-400">
          {`// Using dynamic APIs:
import { cookies, headers } from 'next/headers';

export default async function Page() {
  const headersList = await headers(); // ← Makes route dynamic
  const cookieStore = await cookies();  // ← Makes route dynamic
  // ...
}

// Using searchParams prop:
export default function Page({
  searchParams
}: {
  searchParams: { q: string }
}) {
  // searchParams makes route dynamic
}

// Using dynamic route segment config:
export const dynamic = 'force-dynamic';

export default function Page() {
  // Explicitly configured as dynamic
}

// Using unstable APIs:
import { unstable_noStore } from 'next/cache';

export default function Page() {
  unstable_noStore(); // ← Opts out of caching
}`}
        </pre>
      </div>

      <div className="rounded-lg border border-green-300 bg-green-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-green-700">
          Comparison: Static vs ISR vs Dynamic
        </h3>
        <div className="space-y-3 text-xs">
          <div>
            <p className="font-semibold text-green-800">Static (Default):</p>
            <p className="text-green-700">Generated at build time, same for all users. Fastest.</p>
          </div>
          <div>
            <p className="font-semibold text-green-800">ISR (with revalidate):</p>
            <p className="text-green-700">
              Static but regenerates periodically. Balance of fresh + fast.
            </p>
            <pre className="mt-1 rounded bg-green-900 p-2 text-green-300">
              export const revalidate = 60; // Regenerate every 60s
            </pre>
          </div>
          <div>
            <p className="font-semibold text-green-800">Dynamic (This page):</p>
            <p className="text-green-700">
              Rendered per request. Use for personalized/real-time data.
            </p>
            <pre className="mt-1 rounded bg-green-900 p-2 text-green-300">
              const headersList = await headers(); // ← Dynamic
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
