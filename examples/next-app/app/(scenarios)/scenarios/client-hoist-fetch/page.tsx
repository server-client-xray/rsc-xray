import { CodeMirrorEditor } from '../_components/CodeMirrorEditor';
import { CodeBlock } from '../_components/CodeBlock';
import { DiagnosticBox } from '../_components/DiagnosticBox';
import { findTextDiagnostic } from '../_components/diagnosticUtils';

/**
 * Client Fetch Hoist - Performance Demo
 *
 * This scenario demonstrates the analyzer detecting data fetching in client
 * components during hydration, which delays interactivity and wastes resources.
 * Data should be fetched on the server and passed as props.
 */

const FAULTY_CODE = `"use client";

import { useEffect, useState } from 'react';

export function UserProfile({ userId }: { userId: string }): JSX.Element {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // ❌ Fetching after hydration - slow and wasteful!
    fetch(\`/api/users/\${userId}\`)
      .then(r => r.json())
      .then(setUser);
  }, [userId]);
  
  if (!user) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}

// Problems:
// 1. User sees "Loading..." even though data could have been server-rendered
// 2. Waterfall: HTML loads → JS loads → hydration → fetch → render
// 3. Wasted bandwidth: Server already had this data
// 4. SEO: Content not in initial HTML`;

const FIXED_CODE = `// ✅ Option 1: Server component with direct fetch
export async function UserProfile({ userId }: { userId: string }) {
  const user = await fetch(\`/api/users/\${userId}\`).then(r => r.json());
  
  return <div>{user.name}</div>;
}

// Benefits:
// - Data fetched during SSR, included in initial HTML
// - No loading state, no waterfall
// - Better SEO, faster perceived performance


// ✅ Option 2: Server component passes data to client component
async function UserProfilePage() {
  const user = await fetch('/api/user').then(r => r.json());
  
  return <UserProfileClient user={user} />;
}

"use client";
function UserProfileClient({ user }: { user: User }) {
  // Client component receives data as props
  // Can still have interactivity
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div onClick={() => setIsExpanded(!isExpanded)}>
      {user.name}
      {isExpanded && <div>{user.bio}</div>}
    </div>
  );
}


// ✅ Option 3: Use React 19 server actions
"use client";

import { useActionState } from 'react';

async function getUser(formData: FormData) {
  'use server';
  const userId = formData.get('userId');
  return fetch(\`/api/users/\${userId}\`).then(r => r.json());
}

export function UserProfile(): JSX.Element {
  const [user, dispatch] = useActionState(getUser, null);

  return (
    <form action={dispatch}>
      <input name="userId" />
      <button>Load</button>
      {user && <div>{user.name}</div>}
    </form>
  );
}`;

export default function ClientFetchHoistPage(): JSX.Element {
  // Create mock diagnostic for useEffect fetch
  const mockDiagnostics = [
    findTextDiagnostic(
      FAULTY_CODE,
      'fetch(`/api/users/${userId}`)',
      'warning',
      'Client-side data fetching detected in useEffect. This delays interactivity and wastes resources. Consider fetching on the server and passing data as props.',
      'rsc-xray'
    ),
  ].filter((d) => d !== null);

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Client Fetch Hoist</h1>
        <p className="text-gray-600">
          Detects data fetching in client components (typically in useEffect), which delays
          interactivity and creates unnecessary waterfalls. Data should be fetched on the server and
          passed as props.
        </p>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-300 p-4">
        <h2 className="font-semibold text-blue-900 mb-2">Rule: client-hoist-fetch</h2>
        <p className="text-sm text-blue-800">
          Flags fetch() calls in client components, especially in useEffect hooks. Server-side
          fetching is faster, reduces waterfalls, and improves SEO.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Interactive Code Editor</h2>
        <p className="text-sm text-gray-600 mb-3">
          Edit the code below to see the client-side fetch diagnostic. Hover over the yellow
          underline to see why this is problematic.
        </p>
        <CodeMirrorEditor initialValue={FAULTY_CODE} mockDiagnostics={mockDiagnostics} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Static View (Reference)</h2>
        <CodeBlock
          code={FAULTY_CODE}
          title="UserProfile.tsx (❌ Client Fetch)"
          highlightLines={[10]}
        />
      </div>

      <div className="space-y-3">
        <DiagnosticBox
          type="warning"
          title="Client-side data fetching detected"
          code="client-hoist-fetch"
          message="This component fetches data in useEffect, which runs after hydration. This delays rendering, creates a waterfall, and hurts SEO. Consider fetching on the server instead."
          fix="Move fetch to server component, use server actions, or pass data as props from parent"
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Fixed Code (3 Options)</h2>
        <CodeBlock code={FIXED_CODE} title="UserProfile.tsx (✅ Fixed)" />
      </div>

      <div className="rounded-lg bg-red-50 border border-red-300 p-4">
        <h3 className="font-semibold text-red-900 mb-2">Performance Impact</h3>
        <div className="text-sm text-red-800 space-y-3">
          <div>
            <strong>Client-side fetch waterfall:</strong>
            <div className="mt-1 text-xs font-mono">
              HTML → JS → Hydration → Fetch → Render
              <br />
              (200ms + 500ms + 100ms + 300ms + 50ms = 1150ms total)
            </div>
          </div>
          <div>
            <strong>Server-side fetch (parallel):</strong>
            <div className="mt-1 text-xs font-mono">
              HTML + Data → Render
              <br />
              (300ms + 50ms = 350ms total)
            </div>
          </div>
          <div className="font-semibold">
            ⚡ Result: <strong>70% faster</strong> (800ms saved)
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Why This Matters</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Client-side fetching creates waterfalls:</strong> The browser must download
            HTML, parse it, download JS, execute it, hydrate React, THEN start fetching data. Each
            step waits for the previous one.
          </p>
          <p>
            <strong>Server-side fetching is parallel:</strong> While the server fetches data, the
            client can download HTML/JS. Data arrives with the initial HTML, so no loading state is
            needed.
          </p>
          <p>
            <strong>SEO benefits:</strong> Content fetched on the server is in the initial HTML, so
            search engines can index it. Client-side fetched content is invisible to crawlers.
          </p>
          <p>
            <strong>Best practice:</strong> Fetch data on the server, pass it as props to client
            components that need interactivity.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">How the Analyzer Detects This</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Identifies client components by "use client" directive</li>
          <li>Scans for fetch() calls, especially within useEffect hooks</li>
          <li>Checks for axios, useSWR, useQuery, and other data fetching patterns</li>
          <li>Flags components that could fetch on the server instead</li>
          <li>Suggests moving to server component or using server actions</li>
        </ul>
      </div>

      <div className="rounded-lg bg-yellow-50 border border-yellow-300 p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">When Client Fetching is OK</h3>
        <p className="text-sm text-yellow-800 mb-2">Not all client-side fetching is bad:</p>
        <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
          <li>
            <strong>User interactions:</strong> Fetching in response to button clicks, form
            submissions
          </li>
          <li>
            <strong>Infinite scroll/pagination:</strong> Loading more data as user scrolls
          </li>
          <li>
            <strong>Real-time updates:</strong> WebSocket connections, polling for live data
          </li>
          <li>
            <strong>Client-only features:</strong> Geolocation, device APIs, localStorage access
          </li>
        </ul>
        <p className="mt-2 text-xs text-yellow-600">
          The analyzer focuses on initial data fetching that could be moved to the server.
        </p>
      </div>

      <div className="rounded-lg bg-gray-50 border border-gray-300 p-4">
        <h3 className="font-semibold mb-2">Comparison Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Aspect</th>
                <th className="text-left p-2">Client Fetch</th>
                <th className="text-left p-2">Server Fetch</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 font-medium">Speed</td>
                <td className="p-2 text-red-600">Slow (waterfall)</td>
                <td className="p-2 text-green-600">Fast (parallel)</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">SEO</td>
                <td className="p-2 text-red-600">Poor (not in HTML)</td>
                <td className="p-2 text-green-600">Good (in HTML)</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">Loading State</td>
                <td className="p-2 text-red-600">Required</td>
                <td className="p-2 text-green-600">Not needed</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-medium">Bundle Size</td>
                <td className="p-2 text-red-600">Larger (fetch libs)</td>
                <td className="p-2 text-green-600">Smaller</td>
              </tr>
              <tr>
                <td className="p-2 font-medium">Best For</td>
                <td className="p-2">User interactions</td>
                <td className="p-2">Initial page load</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
