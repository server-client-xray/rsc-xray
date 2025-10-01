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

export default async function CacheOpportunityPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h1 className="mb-4 text-2xl font-bold text-blue-900">React 19 cache() Opportunity Demo</h1>
        <p className="mb-4 text-sm text-blue-700">
          This page demonstrates a cache() migration opportunity. The analyzer should detect that{' '}
          <code className="rounded bg-blue-100 px-1 py-0.5">fetchUser</code> is called multiple
          times with the same arguments.
        </p>
        <div className="rounded bg-blue-100 p-3">
          <p className="text-xs font-mono text-blue-800">
            Suggestion: <strong>react19-cache-opportunity</strong>
            <br />
            File: app/(scenarios)/scenarios/cache-opportunity/page.tsx
            <br />
            Fix: Wrap fetchUser in cache() for automatic deduplication
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-yellow-600 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ fetchUser('1') is called 3 times below (check console logs)
        </p>
      </div>

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

      <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Recommended Fix (React 19):</h3>
        <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-xs text-green-400">
          {`import { cache } from 'react';

// Wrap in cache() for automatic deduplication
const fetchUser = cache(async (id: string) => {
  console.log(\`[fetchUser] Called with id: \${id}\`);
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    id,
    name: \`User \${id}\`,
    email: \`user\${id}@example.com\`,
    role: id === '1' ? 'Admin' : 'User',
  };
});

// Now all 3 components will share the same cached result!
// Only 1 network call instead of 3.`}
        </pre>
        <p className="mt-3 text-xs text-gray-600">
          <strong>Note:</strong> cache() is a React 19 feature. For React 18, consider using a
          manual cache or moving the fetch to a parent component.
        </p>
      </div>
    </div>
  );
}
