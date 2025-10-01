import { CodeMirrorEditor } from '../_components/CodeMirrorEditor';
import { CodeBlock } from '../_components/CodeBlock';
import { DiagnosticBox } from '../_components/DiagnosticBox';
import { findTextDiagnostic } from '../_components/diagnosticUtils';

const FAULTY_CODE = `"use client";

import fs from 'fs';

export function FileReader(): JSX.Element {
  const files = fs.readdirSync('/tmp');
  return <div>Files: {files.length}</div>;
}`;

const FIXED_CODE = `// Move to server component
import fs from 'fs';

export async function FileReader() {
  const files = fs.readdirSync('/tmp');
  return <div>Files: {files.length}</div>;
}`;

export default function ClientForbiddenImportPage() {
  const mockDiagnostics = [
    findTextDiagnostic(
      FAULTY_CODE,
      "import fs from 'fs';",
      'error',
      'Forbidden import: Node.js fs module is not available in the browser.',
      'rsc-xray'
    ),
  ].filter((d) => d !== null);

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Client Forbidden Import</h1>
        <p className="text-gray-600">
          Detects Node.js built-in imports in client components, which cause runtime errors.
        </p>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-300 p-4">
        <h2 className="font-semibold text-blue-900 mb-2">Rule: client-forbidden-import</h2>
        <p className="text-sm text-blue-800">
          Flags Node.js built-in modules (fs, path, os, etc.) imported in client components.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Interactive Code Editor</h2>
        <p className="text-sm text-gray-600 mb-3">
          Hover over the red underline to see the error message.
        </p>
        <CodeMirrorEditor initialValue={FAULTY_CODE} mockDiagnostics={mockDiagnostics} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Static View</h2>
        <CodeBlock code={FAULTY_CODE} title="❌ Client Component" highlightLines={[3]} />
      </div>

      <DiagnosticBox
        type="error"
        title="Forbidden Node.js import"
        code="client-forbidden-import"
        message="Client component imports fs module which is not available in the browser."
        fix="Move to server component or fetch from API route"
      />

      <div>
        <h2 className="text-xl font-semibold mb-3">Fixed Code</h2>
        <CodeBlock code={FIXED_CODE} title="✅ Server Component" />
      </div>
    </div>
  );
}
