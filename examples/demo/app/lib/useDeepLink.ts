/**
 * Deep linking utilities for demo
 *
 * Supports URL parameters:
 * - ?scenario=<scenario-id> - Load specific scenario
 * - ?line=<line-number> - Highlight specific line in editor
 *
 * Examples:
 * - /demo?scenario=serialization-boundary
 * - /demo?scenario=suspense-boundary&line=4
 */

import { useEffect, useState } from 'react';

export interface DeepLinkParams {
  scenario: string | null;
  line: number | null;
}

/**
 * Parse URL search params for deep linking
 */
export function parseDeepLink(): DeepLinkParams {
  if (typeof window === 'undefined') {
    return { scenario: null, line: null };
  }

  const params = new URLSearchParams(window.location.search);
  const scenario = params.get('scenario');
  const lineStr = params.get('line');
  const line = lineStr ? parseInt(lineStr, 10) : null;

  return {
    scenario,
    line: line && !isNaN(line) && line > 0 ? line : null,
  };
}

/**
 * Update URL with current scenario (without page reload)
 */
export function updateDeepLink(config: { scenario: string; line?: number | null }): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams();
  params.set('scenario', config.scenario);

  if (config.line && config.line > 0) {
    params.set('line', config.line.toString());
  }

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
}

/**
 * Hook to manage deep linking state
 *
 * Returns initial params from URL and a function to update the URL
 */
export function useDeepLink(): {
  initialParams: DeepLinkParams;
  updateUrl: (config: { scenario: string; line?: number | null }) => void;
} {
  const [initialParams] = useState<DeepLinkParams>(() => parseDeepLink());

  return {
    initialParams,
    updateUrl: updateDeepLink,
  };
}

/**
 * Hook to sync URL with scenario changes
 *
 * Call this when scenario changes to update the URL
 */
export function useSyncUrlOnScenarioChange(scenarioId: string, enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;

    updateDeepLink({ scenario: scenarioId });
  }, [scenarioId, enabled]);
}
