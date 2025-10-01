import { headers } from 'next/headers';
import { CodeMirrorEditor } from '../_components/CodeMirrorEditor';
import { CodeBlock } from '../_components/CodeBlock';
import { DiagnosticBox } from '../_components/DiagnosticBox';
import { findTextDiagnostic } from '../_components/diagnosticUtils';

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

const DYNAMIC_CODE = `import { headers } from 'next/headers';

export default async function Page(): Promise<JSX.Element> {
  // Using headers() makes this route dynamic
  const headersList = await headers();
  const userAgent = headersList.get('user-agent');
  
  return <div>User Agent: {userAgent}</div>;
}

// Analyzer detects: Dynamic Route
// Reason: Uses headers() API
// Rendering: On-demand (per request)`;

const STATIC_CODE = `// ✅ Static route (no dynamic APIs)
export default function Page(): JSX.Element {
  return <div>Welcome to our site!</div>;
}

// No cookies(), headers(), searchParams
// No dynamic = 'force-dynamic'
// Result: Pre-rendered at build time`;

const ISR_CODE = `// ✅ ISR route (Incremental Static Regeneration)
export const revalidate = 60; // Regenerate every 60 seconds

export default async function Page(): Promise<JSX.Element> {
  const data = await fetch('https://api.example.com/data');
  return <div>{data.title}</div>;
}

// Result: Static with periodic regeneration`;

export default async function DynamicRoutePage(): Promise<JSX.Element> {
  // Using headers() makes this route dynamic
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || 'unknown';
  const host = headersList.get('host') || 'unknown';

  // Create mock diagnostics for the interactive editor
  const mockDiagnostics = [
    findTextDiagnostic(
      DYNAMIC_CODE,
      'const headersList = await headers();',
      'info',
      'Dynamic API detected: headers() makes this route dynamic (rendered per request). Cannot be statically generated at build time.',
      'rsc-xray'
    ),
  ].filter((d) => d !== null);

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dynamic Route Detection</h1>
        <p className="text-gray-600">
          Detects routes that use Next.js dynamic APIs (cookies, headers, searchParams) or explicit
          dynamic configuration, which makes them render on-demand per request instead of at build
          time.
        </p>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-300 p-4">
        <h2 className="font-semibold text-blue-900 mb-2">Rule: dynamic-api-usage</h2>
        <p className="text-sm text-blue-800">
          Identifies routes that will be rendered dynamically (per request) due to dynamic API usage
          or configuration. Helps understand rendering strategy and performance implications.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Interactive Code Editor</h2>
        <p className="text-sm text-gray-600 mb-3">
          Edit the code below to see how <code>headers()</code> triggers dynamic route detection.
          Hover over the blue underline to see the info message.
        </p>
        <CodeMirrorEditor initialValue={DYNAMIC_CODE} mockDiagnostics={mockDiagnostics} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Static View (Reference)</h2>
        <CodeBlock code={DYNAMIC_CODE} title="page.tsx (Dynamic Route)" highlightLines={[5]} />
      </div>

      <div className="space-y-3">
        <DiagnosticBox
          type="info"
          title="Dynamic route detected"
          code="dynamic-api-usage"
          message="This route uses headers(), which requires request-time data. It will be rendered on-demand for each request, not pre-generated at build time."
          fix="This is informational. If you want static rendering, remove dynamic API usage."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Static Route</h3>
          <CodeBlock code={STATIC_CODE} title="Static" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">ISR Route</h3>
          <CodeBlock code={ISR_CODE} title="ISR" />
        </div>
      </div>

      <div className="rounded-lg bg-purple-50 border border-purple-300 p-4">
        <h3 className="font-semibold text-purple-900 mb-2">Comparison: Static vs ISR vs Dynamic</h3>
        <div className="text-sm text-purple-800 space-y-3">
          <div>
            <strong>Static (Default):</strong> Generated at build time. Fastest, same for all users.
            Use for content that rarely changes.
          </div>
          <div>
            <strong>ISR (with revalidate):</strong> Static but regenerates periodically. Balance of
            freshness + speed. Use for content that updates regularly.
          </div>
          <div>
            <strong>Dynamic (This Page):</strong> Rendered per request. Slowest, but personalized.
            Use for user-specific or real-time data.
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Why This Matters</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Rendering strategy</strong> impacts performance, cost, and user experience.
            Static routes are fastest (served from CDN), dynamic routes are slowest (rendered per
            request on the server).
          </p>
          <p>
            <strong>Dynamic APIs</strong> like headers(), cookies(), and searchParams require
            request-time data, so they force the route to be dynamic. The analyzer helps you
            understand which routes are dynamic and why.
          </p>
          <p>
            <strong>Best practice:</strong> Use static/ISR when possible for speed, dynamic only
            when you need request-specific data.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">How the Analyzer Detects This</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Scans for imports and calls to cookies(), headers(), searchParams</li>
          <li>Checks for dynamic route segment config exports (dynamic = 'force-dynamic')</li>
          <li>Detects unstable_noStore() and other cache opt-out APIs</li>
          <li>Classifies routes as static, ISR, or dynamic based on these signals</li>
          <li>Reports rendering strategy to help optimize performance</li>
        </ul>
      </div>

      <div className="rounded-lg bg-gray-50 border border-gray-300 p-4">
        <h3 className="font-semibold mb-2">Live Demo (This Page is Dynamic)</h3>
        <p className="text-sm text-gray-600 mb-3">
          This page uses <code>headers()</code>, making it dynamic. Here's the request-specific data
          it accesses:
        </p>
        <div className="rounded-lg border border-gray-300 bg-white p-4">
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="font-medium text-gray-600">User Agent:</span>
              <span className="truncate text-gray-800">{userAgent}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-gray-600">Host:</span>
              <span className="text-gray-800">{host}</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              These values change per request, which is why this route must be dynamic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
