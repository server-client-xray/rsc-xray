import { cookies } from 'next/headers';
import { CodeMirrorEditor } from '../_components/CodeMirrorEditor';
import { CodeBlock } from '../_components/CodeBlock';
import { DiagnosticBox } from '../_components/DiagnosticBox';
import { findTextDiagnostic } from '../_components/diagnosticUtils';

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

const FAULTY_CODE = `// ❌ Configuration conflict
export const dynamic = 'force-static';

export default async function Page() {
  const cookies = await cookies();  // Error: Can't use cookies() with force-static!
  const theme = cookies.get('theme');
  
  return <div>Theme: {theme?.value}</div>;
}`;

const FIXED_CODE = `// ✅ Option 1: Remove force-static (allow dynamic)
export default async function Page() {
  const cookies = await cookies();
  const theme = cookies.get('theme');
  
  return <div>Theme: {theme?.value}</div>;
}

// ✅ Option 2: Keep force-static, remove dynamic APIs
export const dynamic = 'force-static';

export default function Page() {
  // No cookies(), headers(), or searchParams
  return <div>Theme: default</div>;
}

// ✅ Option 3: Explicit dynamic config
export const dynamic = 'force-dynamic';

export default async function Page() {
  const cookies = await cookies();
  const theme = cookies.get('theme');
  
  return <div>Theme: {theme?.value}</div>;
}`;

export default async function RouteConfigConflictPage() {
  // This conflicts with dynamic = 'force-static'!
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme');

  // Create mock diagnostics for the interactive editor
  const mockDiagnostics = [
    findTextDiagnostic(
      FAULTY_CODE,
      "export const dynamic = 'force-static';",
      'error',
      'Route config conflict: dynamic = "force-static" is incompatible with cookies() usage. Either remove this export or avoid using dynamic APIs.',
      'rsc-xray'
    ),
    findTextDiagnostic(
      FAULTY_CODE,
      'const cookies = await cookies();',
      'error',
      'Dynamic API cookies() cannot be used when dynamic = "force-static". This will cause a build error.',
      'rsc-xray'
    ),
  ].filter((d) => d !== null);

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Route Segment Config Conflict</h1>
        <p className="text-gray-600">
          Detects conflicts between Next.js route segment configuration (dynamic, revalidate,
          fetchCache, runtime) and actual code behavior (dynamic APIs, Node.js modules).
        </p>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-300 p-4">
        <h2 className="font-semibold text-blue-900 mb-2">Rule: route-segment-config-conflict</h2>
        <p className="text-sm text-blue-800">
          Flags routes where segment configuration conflicts with code behavior. Common conflicts:
          force-static + cookies(), ISR + force-dynamic, edge runtime + Node APIs.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Interactive Code Editor</h2>
        <p className="text-sm text-gray-600 mb-3">
          Edit the code below to see the conflict. Hover over the red underlines to see error
          messages. Try removing the export or the cookies() call!
        </p>
        <CodeMirrorEditor initialValue={FAULTY_CODE} mockDiagnostics={mockDiagnostics} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Static View (Reference)</h2>
        <CodeBlock code={FAULTY_CODE} title="page.tsx (❌ Conflict)" highlightLines={[2, 5]} />
      </div>

      <div className="space-y-3">
        <DiagnosticBox
          type="error"
          title="Route segment config conflict"
          code="route-segment-config-conflict"
          message="dynamic = 'force-static' conflicts with cookies() usage. Next.js cannot statically generate a route that reads request-time cookies."
          fix="Remove 'export const dynamic = force-static' or avoid using cookies()/headers()/searchParams"
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Fixed Code (3 Options)</h2>
        <CodeBlock code={FIXED_CODE} title="page.tsx (✅ Fixed)" />
      </div>

      <div className="rounded-lg bg-yellow-50 border border-yellow-300 p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">Other Common Conflicts</h3>
        <div className="text-sm text-yellow-800 space-y-2">
          <p>
            <strong>ISR + force-dynamic:</strong> revalidate (number) + dynamic = 'force-dynamic' →
            ISR won't work with force-dynamic
          </p>
          <p>
            <strong>Edge + Node APIs:</strong> runtime = 'edge' + fs/path/os → Edge runtime doesn't
            support Node.js APIs
          </p>
          <p>
            <strong>Cache conflicts:</strong> fetchCache = 'force-no-store' + revalidate →
            Conflicting cache strategies
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Why This Matters</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Route segment config</strong> tells Next.js how to render your route (static at
            build time, dynamic per request, ISR with revalidation). If your code behavior
            contradicts this config, it causes build errors or unexpected runtime behavior.
          </p>
          <p>
            <strong>force-static</strong> means "render at build time, never per request." But
            cookies(), headers(), and searchParams are request-time APIs that can't be statically
            generated. This creates an impossible conflict.
          </p>
          <p>
            <strong>Best practice:</strong> Let Next.js auto-detect your route type, or explicitly
            set it to match your code's actual behavior.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">How the Analyzer Detects This</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Parses route segment config exports (dynamic, revalidate, fetchCache, runtime)</li>
          <li>Analyzes code for dynamic API usage (cookies, headers, searchParams)</li>
          <li>Checks for Node.js built-in module imports (fs, path, os, etc.)</li>
          <li>Cross-references config with actual behavior to detect conflicts</li>
          <li>Suggests specific fixes based on the conflict type</li>
        </ul>
      </div>

      <div className="rounded-lg bg-gray-50 border border-gray-300 p-4">
        <h3 className="font-semibold mb-2">Live Demo (This Page)</h3>
        <p className="text-sm text-gray-600 mb-2">
          This page itself has the conflict! It exports <code>dynamic = 'force-static'</code> but
          uses <code>cookies()</code>. In development mode, Next.js allows this. In production
          build, it would error or be forced to dynamic.
        </p>
        <div className="rounded-lg border border-gray-300 bg-white p-4">
          <p className="text-sm text-gray-700">
            Theme from cookie: <strong>{theme?.value || 'default'}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
