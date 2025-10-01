import { CodeMirrorEditor } from '../_components/CodeMirrorEditor';
import { CodeBlock } from '../_components/CodeBlock';
import { DiagnosticBox } from '../_components/DiagnosticBox';
import { findAllTextDiagnostics } from '../_components/diagnosticUtils';

/**
 * React 19 cache() Opportunity - M4 Analyzer Demo
 *
 * This scenario demonstrates the analyzer detecting opportunities to use
 * React 19's cache() API for request deduplication.
 *
 * Issue: fetchUser is called multiple times with the same arguments,
 * causing duplicate network requests.
 *
 * Analyzer should flag: "react19-cache-opportunity"
 * Suggestion: Wrap fetchUser in cache() for automatic deduplication
 */

// Simulated API call (would be a real fetch in production)
async function fetchUser(id: string) {
  console.log(`[fetchUser] Called with id: ${id}`);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    id,
    name: `User ${id}`,
    email: `user${id}@example.com`,
    role: id === '1' ? 'Admin' : 'User',
  };
}

// These components make duplicate calls to fetchUser
async function UserProfile({ userId }: { userId: string }) {
  const user = await fetchUser(userId); // First call

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4">
      <h3 className="font-semibold">{user.name}</h3>
      <p className="text-sm text-gray-600">{user.email}</p>
    </div>
  );
}

async function UserRole({ userId }: { userId: string }) {
  const user = await fetchUser(userId); // Duplicate call!

  return <div className="rounded bg-gray-100 px-3 py-1 text-sm font-medium">{user.role}</div>;
}

async function UserStats({ userId }: { userId: string }) {
  const user = await fetchUser(userId); // Another duplicate call!

  return <div className="text-sm text-gray-500">User ID: {user.id}</div>;
}

const FAULTY_CODE = `// ❌ fetchUser is called 3 times with the same argument
async function fetchUser(id: string) {
  console.log(\`[fetchUser] Called with id: \${id}\`);
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  return {
    id,
    name: \`User \${id}\`,
    email: \`user\${id}@example.com\`,
    role: id === '1' ? 'Admin' : 'User',
  };
}

async function UserProfile({ userId }: { userId: string }) {
  const user = await fetchUser(userId); // Call #1
  return <div>{user.name}</div>;
}

async function UserRole({ userId }: { userId: string }) {
  const user = await fetchUser(userId); // Call #2 (duplicate!)
  return <div>{user.role}</div>;
}

async function UserStats({ userId }: { userId: string }) {
  const user = await fetchUser(userId); // Call #3 (duplicate!)
  return <div>User ID: {user.id}</div>;
}

// Result: 3 network requests for the same data`;

const FIXED_CODE = `// ✅ Wrap in cache() for automatic deduplication (React 19)
import { cache } from 'react';

const fetchUser = cache(async (id: string) => {
  console.log(\`[fetchUser] Called with id: \${id}\`);
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  return {
    id,
    name: \`User \${id}\`,
    email: \`user\${id}@example.com\`,
    role: id === '1' ? 'Admin' : 'User',
  };
});

async function UserProfile({ userId }: { userId: string }) {
  const user = await fetchUser(userId); // Cached result
  return <div>{user.name}</div>;
}

async function UserRole({ userId }: { userId: string }) {
  const user = await fetchUser(userId); // Reuses cached result
  return <div>{user.role}</div>;
}

async function UserStats({ userId }: { userId: string }) {
  const user = await fetchUser(userId); // Reuses cached result
  return <div>User ID: {user.id}</div>;
}

// Result: Only 1 network request, shared across all 3 components`;

export default async function CacheOpportunityPage() {
  // Create mock diagnostics for duplicate fetchUser calls
  const mockDiagnostics = findAllTextDiagnostics(
    FAULTY_CODE,
    'await fetchUser(userId)',
    'warning',
    'Duplicate function call detected. Consider wrapping fetchUser in cache() to deduplicate requests automatically (React 19).',
    'rsc-xray'
  );

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">React 19 cache() Opportunity</h1>
        <p className="text-gray-600">
          Detects async functions that are called multiple times with the same arguments, creating
          duplicate network requests. Suggests wrapping in React 19's <code>cache()</code> API for
          automatic deduplication.
        </p>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-300 p-4">
        <h2 className="font-semibold text-blue-900 mb-2">Rule: react19-cache-opportunity</h2>
        <p className="text-sm text-blue-800">
          Flags async functions that are invoked multiple times with identical arguments across
          different components in the same request.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Interactive Code Editor</h2>
        <p className="text-sm text-gray-600 mb-3">
          Edit the code below to see how duplicate function calls waste resources. Hover over the
          yellow underlines to see optimization suggestions.
        </p>
        <CodeMirrorEditor initialValue={FAULTY_CODE} mockDiagnostics={mockDiagnostics} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Static View (Reference)</h2>
        <CodeBlock
          code={FAULTY_CODE}
          title="page.tsx (❌ Duplicates)"
          highlightLines={[12, 17, 22]}
        />
      </div>

      <div className="space-y-3">
        <DiagnosticBox
          type="warning"
          title="Duplicate function calls detected"
          code="react19-cache-opportunity"
          message="fetchUser() is called 3 times with the same argument 'userId'. Each call triggers a separate network request. Wrap in cache() to deduplicate automatically."
          fix="import { cache } from 'react'; const fetchUser = cache(async (id: string) => { ... });"
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Fixed Code (With cache())</h2>
        <CodeBlock code={FIXED_CODE} title="page.tsx (✅ Cached)" />
      </div>

      <div className="rounded-lg bg-green-50 border border-green-300 p-4">
        <h3 className="font-semibold text-green-900 mb-2">Performance Impact</h3>
        <div className="text-sm text-green-800 space-y-2">
          <p>
            <strong>Before:</strong> 3 network requests × 100ms = <strong>300ms wasted</strong>
          </p>
          <p>
            <strong>After:</strong> 1 network request × 100ms = <strong>100ms total</strong>
          </p>
          <p className="font-semibold mt-2">
            ⚡ Result: <strong>67% faster</strong> (200ms saved + reduced server load)
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Why This Matters</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Duplicate requests</strong> waste bandwidth, increase server load, and slow down
            page rendering. Each call waits for its own network round-trip, even when fetching
            identical data.
          </p>
          <p>
            <strong>React 19's cache()</strong> automatically deduplicates function calls within the
            same request. If multiple components call the same cached function with the same
            arguments, React executes it only once and shares the result.
          </p>
          <p>
            <strong>Best for:</strong> Data fetching functions used across multiple components,
            especially on dashboard or detail pages where the same entity is displayed in different
            ways.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">How the Analyzer Detects This</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Tracks all async function calls in server components</li>
          <li>Identifies functions called multiple times with identical arguments</li>
          <li>Checks if the function is already wrapped in cache()</li>
          <li>Calculates potential savings (number of duplicate calls × average latency)</li>
          <li>Suggests wrapping in cache() when duplicates exceed a threshold</li>
        </ul>
      </div>

      <div className="rounded-lg bg-gray-50 border border-gray-300 p-4">
        <h3 className="font-semibold mb-2">Live Demo (Reload to See Console Logs)</h3>
        <p className="text-sm text-gray-600 mb-4">
          The components below call <code>fetchUser('1')</code> three times. Open your browser
          console to see the duplicate calls. In a real app with <code>cache()</code>, you'd only
          see one call.
        </p>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="mb-3 text-sm font-medium text-gray-700">User Profile (call #1):</p>
            <UserProfile userId="1" />
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="mb-3 text-sm font-medium text-gray-700">
              User Role (call #2 - duplicate!):
            </p>
            <UserRole userId="1" />
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="mb-3 text-sm font-medium text-gray-700">
              User Stats (call #3 - duplicate!):
            </p>
            <UserStats userId="1" />
          </div>
        </div>

        <div className="mt-4 rounded bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
          <strong>⚠️ Note:</strong> Check your browser console to see 3 separate "[fetchUser] Called
          with id: 1" logs, proving the duplicate calls.
        </div>
      </div>
    </div>
  );
}
