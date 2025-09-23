const STORE_KEY = '__SCX_HYDRATION__';
const START_MARK_PREFIX = 'scx-hydration-start:';
const END_MARK_PREFIX = 'scx-hydration-end:';
const MEASURE_PREFIX = 'scx-hydration:';

type HydrationStore = {
  durations: Record<string, number>;
  pending: Record<string, number>;
};

type GlobalWithStore = typeof globalThis & {
  [STORE_KEY]?: HydrationStore;
};

const perf: Performance | null = typeof performance !== 'undefined' ? performance : null;

function now(): number {
  if (perf && typeof perf.now === 'function') {
    return perf.now();
  }
  return Date.now();
}

function ensureStore(): HydrationStore {
  const globalObject = globalThis as GlobalWithStore;
  if (!globalObject[STORE_KEY]) {
    globalObject[STORE_KEY] = {
      durations: Object.create(null),
      pending: Object.create(null),
    };
  }
  return globalObject[STORE_KEY]!;
}

function clearMarks(nodeId: string) {
  if (!perf || typeof perf.clearMarks !== 'function') return;
  try {
    perf.clearMarks(`${START_MARK_PREFIX}${nodeId}`);
    perf.clearMarks(`${END_MARK_PREFIX}${nodeId}`);
  } catch {
    // non-fatal; keep going even if marks were already cleared
  }
}

function measure(nodeId: string) {
  if (!perf || typeof perf.measure !== 'function') return;
  try {
    perf.measure(
      `${MEASURE_PREFIX}${nodeId}`,
      `${START_MARK_PREFIX}${nodeId}`,
      `${END_MARK_PREFIX}${nodeId}`
    );
  } catch {
    // swallow measure failures; marks may be missing in some envs
  } finally {
    clearMarks(nodeId);
  }
}

export function markHydrationStart(nodeId: string) {
  if (!nodeId) return;
  const store = ensureStore();
  store.pending[nodeId] = now();
  if (perf && typeof perf.mark === 'function') {
    try {
      perf.mark(`${START_MARK_PREFIX}${nodeId}`);
    } catch {
      // ignore mark failure
    }
  }
}

export function markHydrationEnd(nodeId: string) {
  if (!nodeId) return;
  const store = ensureStore();
  const start = store.pending[nodeId];
  if (typeof start !== 'number') {
    return;
  }
  const duration = Math.max(0, now() - start);
  store.durations[nodeId] = duration;
  delete store.pending[nodeId];
  if (perf && typeof perf.mark === 'function') {
    try {
      perf.mark(`${END_MARK_PREFIX}${nodeId}`);
    } catch {
      // ignore mark failure
    }
    measure(nodeId);
  }
}

export function getHydrationDuration(nodeId: string): number | undefined {
  if (!nodeId) return undefined;
  const store = ensureStore();
  const value = store.durations[nodeId];
  return typeof value === 'number' ? value : undefined;
}

export function getHydrationDurations(): Record<string, number> {
  const store = ensureStore();
  return { ...store.durations };
}

export function resetHydrationMetrics() {
  const store = ensureStore();
  store.durations = Object.create(null);
  store.pending = Object.create(null);
}

type UseEffect = (effect: () => void | (() => void | undefined), deps?: unknown[]) => void;
type UseRef = <T>(initial: T) => { current: T };

export function createHydrationHook({
  useEffect,
  useRef,
}: {
  useEffect: UseEffect;
  useRef: UseRef;
}) {
  return function useHydrationTimings(nodeId: string) {
    if (typeof nodeId !== 'string' || nodeId.length === 0) {
      throw new Error('useHydrationTimings requires a non-empty nodeId');
    }

    const startedRef = useRef<string | null>(null);
    const completedRef = useRef(false);

    if (startedRef.current !== nodeId) {
      markHydrationStart(nodeId);
      startedRef.current = nodeId;
      completedRef.current = false;
    }

    useEffect(() => {
      if (completedRef.current) {
        return;
      }
      markHydrationEnd(nodeId);
      completedRef.current = true;
    }, [nodeId]);
  };
}
