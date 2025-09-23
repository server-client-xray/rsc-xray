const SAMPLE = `"use client";\n\nimport fs from 'fs';\n\nexport function ForbiddenImportExample() {\n  console.log(fs.readdirSync?.('/tmp'));\n  return <div>Forbidden import demo</div>;\n}`;

export default function ClientForbiddenImportScenario(): JSX.Element {
  return (
    <main style={{ padding: '32px', maxWidth: 720 }}>
      <h1>Client forbidden import</h1>
      <p>
        This scenario documents the <code>client-forbidden-import</code> diagnostic. The analyzer
        watches for client components that import Node built-ins such as <code>fs</code>,
        <code>path</code>, or <code>child_process</code>.
      </p>
      <p>
        The example component lives alongside this page in <code>ForbiddenImportExample.tsx</code>.
        It is intentionally not imported here so that the Next.js demo continues to build, but the
        analyzer still scans it and surfaces the violation.
      </p>
      <ol>
        <li>
          Run the build/analyze/report workflow from <code>docs/WORKFLOWS.md</code>.
        </li>
        <li>
          Open <code>report.html</code> or inspect <code>model.json</code> to find
          <code>
            module:app/(scenarios)/scenarios/client-forbidden-import/ForbiddenImportExample.tsx
          </code>
          .
        </li>
        <li>The node includes a red diagnostic entry explaining why the import is disallowed.</li>
      </ol>
      <pre
        style={{
          marginTop: 32,
          padding: 16,
          borderRadius: 12,
          background: 'rgba(15,23,42,0.8)',
          border: '1px solid rgba(248,113,113,0.35)',
          overflowX: 'auto',
        }}
      >
        {SAMPLE}
      </pre>
    </main>
  );
}
