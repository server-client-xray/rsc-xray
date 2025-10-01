import { ClientButton } from './ClientButton';
import { CodeBlock } from '../_components/CodeBlock';
import { DiagnosticBox } from '../_components/DiagnosticBox';

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

const FAULTY_CODE = `// Server Component
export default function Page() {
  const handleClick = () => {
    console.log('This function will be undefined on the client!');
  };

  const timestamp = new Date();

  return (
    <ClientButton 
      onClick={handleClick}    // ❌ Function prop
      timestamp={timestamp}     // ❌ Date instance
      label="Click Me" 
    />
  );
}`;

const FIXED_CODE = `// Server Component
async function handleClick() {
  'use server';
  console.log('This runs on the server!');
}

export default function Page() {
  const timestamp = new Date().toISOString(); // ✅ Serialized

  return (
    <ClientButton 
      onClick={handleClick}     // ✅ Server Action
      timestamp={timestamp}      // ✅ ISO string
      label="Click Me" 
    />
  );
}`;

export default function SerializationBoundaryPage() {
  const handleClick = () => {
    console.log('This function will be undefined on the client!');
  };

  const timestamp = new Date();

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Serialization Boundary Violation</h1>
        <p className="text-gray-600">
          Detects non-serializable props passed from server to client components. Props must be
          JSON-serializable to cross the server/client boundary.
        </p>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-300 p-4">
        <h2 className="font-semibold text-blue-900 mb-2">
          Rule: server-client-serialization-violation
        </h2>
        <p className="text-sm text-blue-800">
          Flags functions, Date instances, Map/Set, class instances, and other non-serializable
          values passed as props to client components.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Faulty Code</h2>
        <CodeBlock code={FAULTY_CODE} title="page.tsx" highlightLines={[8, 9]} />
      </div>

      <div className="space-y-3">
        <DiagnosticBox
          type="error"
          title="Non-serializable prop: onClick"
          message="Function props cannot be passed to client components. Functions are not JSON-serializable and will become undefined on the client."
          code="onClick={handleClick}"
          fix={FIXED_CODE}
        />
        <DiagnosticBox
          type="error"
          title="Non-serializable prop: timestamp"
          message="Date instances lose their prototype methods during serialization. Use ISO string format instead."
          code="timestamp={timestamp}"
          fix="timestamp={new Date().toISOString()}"
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">How the Analyzer Detects This</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>AST traversal identifies JSX elements rendering client components</li>
          <li>Symbol table tracks variable declarations and their initializers</li>
          <li>
            Pattern matching detects non-serializable expressions (arrow functions, new Date(),
            etc.)
          </li>
          <li>Resolves identifiers to their original declarations for non-inline props</li>
        </ul>
      </div>

      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-3">Live Example</h2>
        <p className="text-sm text-gray-600 mb-4">
          The component below receives non-serializable props (intentionally). Check the browser
          console to see the runtime behavior.
        </p>
        <ClientButton onClick={handleClick} label="Click Me" timestamp={timestamp} />
      </div>
    </div>
  );
}
