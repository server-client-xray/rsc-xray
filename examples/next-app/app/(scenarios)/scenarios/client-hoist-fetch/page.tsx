'use client';

import { useEffect, useState } from 'react';

export default function ClientFetchScenario(): JSX.Element {
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded'>('idle');
  const [timestamp, setTimestamp] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus('loading');
      const response = await fetch('/api/demo', { cache: 'no-store' });
      if (cancelled) return;
      if (response.ok) {
        const body = await response.json();
        setTimestamp(body.timestamp);
      }
      setStatus('loaded');
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main style={{ padding: '32px', maxWidth: 640 }}>
      <h1>Client fetch (should be hoisted)</h1>
      <p>
        This client component fetches API data during hydration. The analyzer raises the
        <strong> client-hoist-fetch</strong> warning so you know to move this call to a server
        component or loader.
      </p>
      <div
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 12,
          background: 'rgba(15,23,42,0.6)',
          border: '1px solid rgba(56,189,248,0.25)',
        }}
      >
        <p>Status: {status}</p>
        <p>Last fetch timestamp: {timestamp ?? 'none yet'}</p>
      </div>
    </main>
  );
}
