import { LargeComponent } from './LargeComponent';
import { CodeBlock } from '../_components/CodeBlock';
import { DiagnosticBox } from '../_components/DiagnosticBox';
import { CodeMirrorEditor } from '../_components/CodeMirrorEditor';
import { findTextDiagnostic } from '../_components/diagnosticUtils';

/**
 * Oversized Client Component - Demo
 *
 * Demonstrates the analyzer detecting client components
 * that exceed the 50KB bundle size threshold.
 */

const FAULTY_CODE = `'use client';

// This component includes massive data sets
const LARGE_DATA = {
  items: [...], // 1000+ items
  lookup: {...}, // Large lookup table
  translations: {...}, // Translation strings
  // Total bundle size: >50KB
};

export function LargeComponent(): JSX.Element {
  return <div>{LARGE_DATA.items.map(...)}</div>;
}`;

const FIXED_CODE_LAZY = `import { lazy, Suspense } from 'react';

// Option 1: Lazy load component
const LargeComponent = lazy(() => import('./LargeComponent'));

export default function Page(): JSX.Element {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LargeComponent />
    </Suspense>
  );
}`;

const FIXED_CODE_SERVER = `// Option 2: Move data to server
async function getData() {
  'use server';
  const items = await db.query('SELECT * FROM items');
  return items;
}

export default async function Page(): Promise<JSX.Element> {
  const data = await getData();
  return <ClientComponent data={data} />;
}`;

export default function ClientOversizedPage(): JSX.Element {
  // Create mock diagnostics for the interactive editor
  const mockDiagnostics = [
    findTextDiagnostic(
      FAULTY_CODE,
      "'use client';",
      'warning',
      'Client component exceeds 50KB bundle size threshold. Consider code splitting with dynamic imports or moving data fetching to the server.',
      'rsc-xray'
    ),
  ].filter((d) => d !== null);

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Oversized Client Component</h1>
        <p className="text-gray-600">
          Detects client components that exceed the configurable size threshold (default 50KB),
          which impacts bundle size and initial load performance.
        </p>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-300 p-4">
        <h2 className="font-semibold text-blue-900 mb-2">Rule: client-component-oversized</h2>
        <p className="text-sm text-blue-800">
          Flags client components whose bundle size exceeds 50KB. Large client bundles increase
          download time, parse time, and memory usage.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Interactive Code Editor</h2>
        <p className="text-sm text-gray-600 mb-3">
          Edit the code below to see the diagnostic. This client component is too large and should
          be code-split or moved to the server.
        </p>
        <CodeMirrorEditor initialValue={FAULTY_CODE} mockDiagnostics={mockDiagnostics} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Static View (Reference)</h2>
        <CodeBlock code={FAULTY_CODE} title="LargeComponent.tsx" highlightLines={[4, 5, 6, 7, 8]} />
      </div>

      <DiagnosticBox
        type="warning"
        title="Client component exceeds size threshold"
        message="LargeComponent.tsx is 87.4 KB (exceeds 50 KB threshold by 74%). Large client bundles increase download time, parse time, and hurt performance."
        code="<LargeComponent />"
        fix={`${FIXED_CODE_LAZY}\n\n${FIXED_CODE_SERVER}\n\n// Option 3: Paginate data\n// Only load what's visible initially`}
      />

      <div>
        <h2 className="text-xl font-semibold mb-3">Why This Matters</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>
            <strong>Download Time:</strong> Every KB sent to the client increases load time,
            especially on slow networks
          </li>
          <li>
            <strong>Parse/Compile Time:</strong> JavaScript must be parsed and compiled before
            execution
          </li>
          <li>
            <strong>Memory Usage:</strong> Large bundles consume more browser memory
          </li>
          <li>
            <strong>Hydration Cost:</strong> More JavaScript means longer time-to-interactive
          </li>
        </ul>
      </div>

      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-3">Live Example</h2>
        <p className="text-sm text-gray-600 mb-4">
          The component below contains ~1000 items + lookup tables. Check DevTools Network tab to
          see the bundle size.
        </p>
        <LargeComponent />
      </div>
    </div>
  );
}
