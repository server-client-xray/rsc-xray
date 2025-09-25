import Link from 'next/link';

type ScenarioKind = 'valid' | 'violation' | 'coming-soon' | 'pro';

interface ScenarioCard {
  title: string;
  description: string;
  href: string;
  kind: ScenarioKind;
  badge?: string;
}

const SCENARIOS: ScenarioCard[] = [
  {
    title: 'Product Listing (Valid)',
    description: 'Baseline route showcasing Suspense islands and client hydration.',
    href: '/products',
    kind: 'valid',
  },
  {
    title: 'Sequential server awaits',
    description: 'Triggers the Promise.all suggestion by awaiting fetches in series.',
    href: '/scenarios/server-promise-all',
    kind: 'violation',
    badge: 'Violation',
  },
  {
    title: 'Client fetch on hydration',
    description: 'Shows the hoist-to-server warning by calling fetch inside a client component.',
    href: '/scenarios/client-hoist-fetch',
    kind: 'violation',
    badge: 'Violation',
  },
  {
    title: 'Client forbidden import',
    description: 'Documents the client-forbidden-import diagnostic with a bundled example.',
    href: '/scenarios/client-forbidden-import',
    kind: 'violation',
    badge: 'Violation',
  },
  {
    title: 'Cache lens scenario',
    description: 'Coming soon: data-tagged pages to exercise cache invalidation flows.',
    href: '/scenarios/cache-lens-coming-soon',
    kind: 'coming-soon',
    badge: 'Coming Soon',
  },
  {
    title: 'CI budget regression (Pro)',
    description: 'Illustrates a future Pro flow surfacing budget deltas inside the overlay.',
    href: '/scenarios/pro-budget-coming-soon',
    kind: 'pro',
    badge: 'Pro',
  },
];

const KIND_COLORS: Record<ScenarioKind, string> = {
  valid: 'rgba(34,197,94,0.25)',
  violation: 'rgba(248,113,113,0.25)',
  'coming-soon': 'rgba(251,191,36,0.25)',
  pro: 'rgba(14,165,233,0.25)',
};

export default function HomePage(): JSX.Element {
  return (
    <main style={{ padding: '24px 32px' }}>
      <section style={{ maxWidth: 840, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>RSC XRay Demo</h1>
        <p style={{ marginBottom: 16 }}>
          Use the scenarios below to generate analyzer output or to exercise the Pro overlay. Each
          card links to a route designed to highlight a specific rule or future capability.
        </p>
        <div
          style={{
            display: 'grid',
            gap: 20,
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          }}
        >
          {SCENARIOS.map((scenario) => (
            <Link
              key={scenario.href}
              href={scenario.href}
              style={{
                display: 'block',
                borderRadius: 12,
                border: '1px solid rgba(148, 163, 184, 0.2)',
                padding: '20px',
                background: 'rgba(15, 23, 42, 0.55)',
                boxShadow: '0 12px 30px -18px rgba(15, 23, 42, 0.8)',
                transition: 'transform 120ms ease, box-shadow 120ms ease',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                  fontWeight: 600,
                  marginBottom: 12,
                  color: 'rgba(226,232,240,0.9)',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 10px',
                    borderRadius: 999,
                    background: KIND_COLORS[scenario.kind],
                    color: '#0f172a',
                  }}
                >
                  {scenario.badge ?? 'Valid'}
                </span>
              </span>
              <h2 style={{ fontSize: 20, marginBottom: 8, color: '#f8fafc' }}>{scenario.title}</h2>
              <p style={{ fontSize: 14, color: 'rgba(148, 163, 184, 0.85)' }}>
                {scenario.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
