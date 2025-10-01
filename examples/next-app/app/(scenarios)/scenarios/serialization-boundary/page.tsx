import { ClientButton } from './ClientButton';

/**
 * Demonstrates serialization boundary violation (T5.4)
 *
 * This server component passes non-serializable props to a client component:
 * 1. Function (handleClick) - will become undefined on the client
 * 2. Date instance (timestamp) - will be serialized as string, losing methods
 *
 * The analyzer should detect these violations and suggest:
 * - Use Server Actions for functions
 * - Serialize Date as ISO string
 *
 * Note: We force dynamic rendering to avoid build-time errors from Next.js
 * detecting the serialization violations. The analyzer will still detect them.
 */
export const dynamic = 'force-dynamic';

export default function SerializationBoundaryPage() {
  const handleClick = () => {
    console.log('This function will be undefined on the client!');
  };

  const timestamp = new Date();

  return (
    <div className="space-y-4 p-8">
      <h1 className="text-2xl font-bold">Serialization Boundary Violation</h1>
      <p className="text-gray-600">
        This page demonstrates passing non-serializable props from a server component to a client
        component. The analyzer should flag these violations.
      </p>

      <div className="rounded border border-red-500 bg-red-50 p-4">
        <h2 className="font-semibold text-red-700">Violations Detected:</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-600">
          <li>
            <code>onClick</code> prop is a function (arrow function) - will become undefined
          </li>
          <li>
            <code>timestamp</code> prop is a Date instance - will lose prototype methods
          </li>
        </ul>
      </div>

      <div className="rounded bg-gray-100 p-4">
        <h3 className="font-semibold">Suggested Fixes:</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700">
          <li>
            Convert <code>handleClick</code> to a Server Action (<code>&apos;use server&apos;</code>
            )
          </li>
          <li>
            Serialize <code>timestamp</code> as ISO string: <code>timestamp.toISOString()</code>
          </li>
        </ul>
      </div>

      <ClientButton onClick={handleClick} label="Click Me" timestamp={timestamp} />
    </div>
  );
}
