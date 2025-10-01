import { getProduct, getProductReviews } from '../../../../data/products';
import { CodeBlock } from '../_components/CodeBlock';
import { DiagnosticBox } from '../_components/DiagnosticBox';
import { CodeMirrorEditor } from '../_components/CodeMirrorEditor';
import { findAllTextDiagnostics } from '../_components/diagnosticUtils';

export const metadata = {
  title: 'Sequential awaits – Server Promise.all',
  description: 'Demonstrates the Promise.all suggestion triggered by serial awaits.',
};

const FAULTY_CODE = `export default async function Page() {
  // Sequential awaits - creates a waterfall!
  const product = await getProduct('analyzer');  // Wait 200ms
  const related = await getProduct('overlay');    // Wait another 200ms
  const reviews = await getProductReviews(product.id); // Wait another 150ms
  
  // Total time: 550ms (sequential)
  return <div>{product.name} + {related.name}</div>;
}`;

const FIXED_CODE = `export default async function Page() {
  // Parallel fetches - much faster!
  const [product, related] = await Promise.all([
    getProduct('analyzer'),  // All run in parallel
    getProduct('overlay'),
  ]);
  
  // Dependent fetch runs after
  const reviews = await getProductReviews(product.id);
  
  // Total time: ~350ms (200ms parallel + 150ms dependent)
  return <div>{product.name} + {related.name}</div>;
}`;

export default async function ServerPromiseAllScenario(): Promise<JSX.Element> {
  const product = await getProduct('analyzer');
  const related = await getProduct('overlay');
  const reviews = await getProductReviews(product?.id ?? 'analyzer');

  // Create mock diagnostics for the interactive editor
  const mockDiagnostics = findAllTextDiagnostics(
    FAULTY_CODE,
    'await getProduct',
    'warning',
    'Sequential await detected. These independent requests could run in parallel using Promise.all.',
    'rsc-xray'
  );

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Sequential Server Awaits</h1>
        <p className="text-gray-600">
          Detects sequential await statements that could be parallelized with Promise.all, reducing
          total request time.
        </p>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-300 p-4">
        <h2 className="font-semibold text-blue-900 mb-2">Rule: server-promise-all</h2>
        <p className="text-sm text-blue-800">
          Flags sequential awaits in server components where requests are independent and could run
          in parallel.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Interactive Code Editor</h2>
        <p className="text-sm text-gray-600 mb-3">
          Edit the code below to see diagnostics on sequential awaits. Hover over the yellow
          underlines to see optimization suggestions.
        </p>
        <CodeMirrorEditor initialValue={FAULTY_CODE} mockDiagnostics={mockDiagnostics} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Static View (Reference)</h2>
        <CodeBlock code={FAULTY_CODE} title="page.tsx" highlightLines={[3, 4]} />
      </div>

      <DiagnosticBox
        type="warning"
        title="Sequential awaits detected"
        message="Multiple independent await statements found. These requests run sequentially, creating a waterfall. Consider using Promise.all() to run them in parallel."
        code="const related = await getProduct('overlay');"
        fix={FIXED_CODE}
      />

      <div>
        <h2 className="text-xl font-semibold mb-3">Performance Impact</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-300 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-2">❌ Sequential (Slow)</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>Product: 200ms</li>
              <li>Related: 200ms</li>
              <li>Reviews: 150ms</li>
              <li className="font-bold pt-2 border-t border-red-300">Total: ~550ms</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-300 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">✓ Parallel (Fast)</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>Product + Related: 200ms</li>
              <li>Reviews: 150ms</li>
              <li className="opacity-50">-</li>
              <li className="font-bold pt-2 border-t border-green-300">Total: ~350ms</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-3">Live Example (Sequential)</h2>
        <p className="text-sm text-gray-600 mb-4">
          This page uses sequential awaits. Check Network tab to see the waterfall effect.
        </p>
        <div className="grid gap-4 max-w-2xl">
          <div className="bg-slate-800 rounded-lg p-4 text-white">
            <h3 className="font-bold">{product?.name ?? 'Analyzer'}</h3>
            <p className="text-sm text-slate-300">{product?.description}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 text-white">
            <h3 className="font-bold">{related?.name ?? 'Overlay'}</h3>
            <p className="text-sm text-slate-300">{related?.description}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Reviews:</h3>
            <ul className="text-sm space-y-1">
              {reviews.map((review) => (
                <li key={review.id}>
                  <strong>{review.author}:</strong> {review.comment}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
