export default function CacheLensProTeaser(): JSX.Element {
  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Cache Lens</h1>
            <p className="text-blue-100">
              Visualize revalidation relationships, ISR policies, and cache dependencies
            </p>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-600">
            Pro Feature
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-blue-300 bg-blue-50 p-4">
        <h2 className="font-semibold text-blue-900 mb-2">✨ Available in Pro Plan</h2>
        <p className="text-sm text-blue-800">
          Cache Lens is a powerful Pro feature that helps you understand your app's caching behavior
          at a glance.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">What Cache Lens Shows You</h2>
        <div className="grid gap-4">
          <div className="rounded-lg border border-gray-300 bg-white p-4">
            <h3 className="font-semibold text-gray-900 mb-2">🏷️ Tag Relationships</h3>
            <p className="text-sm text-gray-600 mb-2">
              See which routes share revalidateTag() calls - know exactly what gets refreshed
              together
            </p>
            <div className="rounded bg-gray-100 p-2 text-xs font-mono text-gray-700">
              Tag "products" → affects /shop, /shop/cart, /shop/[id]
            </div>
          </div>

          <div className="rounded-lg border border-gray-300 bg-white p-4">
            <h3 className="font-semibold text-gray-900 mb-2">📍 Path Impact Analysis</h3>
            <p className="text-sm text-gray-600 mb-2">
              Track revalidatePath() calls and understand which routes get invalidated
            </p>
            <div className="rounded bg-gray-100 p-2 text-xs font-mono text-gray-700">
              revalidatePath("/shop") → affects /shop and all child routes
            </div>
          </div>

          <div className="rounded-lg border border-gray-300 bg-white p-4">
            <h3 className="font-semibold text-gray-900 mb-2">⚡ ISR/PPR Policy Detection</h3>
            <p className="text-sm text-gray-600 mb-2">
              Automatically detects ISR/PPR configuration and shows revalidation intervals
            </p>
            <div className="rounded bg-gray-100 p-2 text-xs font-mono text-gray-700">
              /products: ISR with revalidate=60s
            </div>
          </div>

          <div className="rounded-lg border border-gray-300 bg-white p-4">
            <h3 className="font-semibold text-gray-900 mb-2">⚠️ Policy Conflict Detection</h3>
            <p className="text-sm text-gray-600 mb-2">
              Flags mismatched cache policies that could cause unexpected behavior
            </p>
            <div className="rounded bg-red-100 border border-red-300 p-2 text-xs font-mono text-red-700">
              Warning: Route has dynamic=&apos;force-static&apos; but uses revalidatePath()
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-3">How It Works</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>
            Install <code className="bg-blue-100 px-1 rounded">@rsc-xray/pro-overlay</code>
          </li>
          <li>Add the overlay to your app</li>
          <li>Open the Cache Lens tab in the developer overlay</li>
          <li>Search, filter, and explore your caching strategy visually</li>
        </ol>
      </div>

      <div className="text-center pt-4">
        <a
          href="https://rsc-xray.dev/pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Upgrade to Pro
        </a>
        <p className="mt-2 text-sm text-gray-600">
          or{' '}
          <a href="https://rsc-xray.dev/docs/cache-lens" className="text-blue-600 hover:underline">
            learn more in the docs
          </a>
        </p>
      </div>
    </div>
  );
}
