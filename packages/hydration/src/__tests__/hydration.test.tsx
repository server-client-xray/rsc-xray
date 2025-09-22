import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import React from 'react';

import {
  createHydrationHook,
  getHydrationDuration,
  getHydrationDurations,
  markHydrationEnd,
  markHydrationStart,
  resetHydrationMetrics,
} from '..';

const NODE_ID = 'module:app/components/Button.tsx';

describe('hydration metrics', () => {
  beforeEach(() => {
    resetHydrationMetrics();
  });

  afterEach(() => {
    resetHydrationMetrics();
  });

  it('records durations when start/end invoked', () => {
    const spy = vi
      .spyOn(performance, 'now')
      .mockImplementationOnce(() => 10)
      .mockImplementationOnce(() => 42.5);
    markHydrationStart(NODE_ID);
    markHydrationEnd(NODE_ID);
    spy.mockRestore();

    expect(getHydrationDuration(NODE_ID)).toBeCloseTo(32.5);
    expect(getHydrationDurations()).toMatchObject({ [NODE_ID]: expect.any(Number) });
  });

  it('ignores end without start', () => {
    markHydrationEnd('another');
    expect(getHydrationDurations()).toEqual({});
  });

  it('useHydrationTimings wraps hydration lifecycle', async () => {
    const useHydrationTimings = createHydrationHook(React);
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);

    function Demo() {
      useHydrationTimings(NODE_ID);
      return <button type="button">demo</button>;
    }

    await act(async () => {
      root.render(<Demo />);
      await Promise.resolve();
    });

    const durations = getHydrationDurations();
    expect(durations[NODE_ID]).toBeTypeOf('number');
    expect(durations[NODE_ID]).toBeGreaterThanOrEqual(0);

    act(() => {
      root.unmount();
    });
    document.body.removeChild(div);
  });
});
