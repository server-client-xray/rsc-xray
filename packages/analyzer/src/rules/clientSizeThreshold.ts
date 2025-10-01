import type { Diagnostic } from '@rsc-xray/schemas';

import type { ClientComponentBundle } from '../lib/clientBundles.js';

const OVERSIZED_RULE = 'client-component-oversized';
const DUPLICATE_DEPS_RULE = 'duplicate-dependencies';

const DEFAULT_THRESHOLD_BYTES = 51200; // 50KB

export interface SizeThresholdConfig {
  thresholdBytes?: number;
}

interface ChunkUsage {
  chunk: string;
  components: string[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  const kb = bytes / 1024;
  return `${kb.toFixed(1)}KB`;
}

function toDiagnostic(
  filePath: string,
  rule: string,
  message: string,
  level: 'error' | 'warn'
): Diagnostic {
  return {
    rule,
    level,
    message,
    loc: {
      file: filePath,
      line: 1,
      col: 1,
    },
  };
}

/**
 * Find chunks shared across multiple components
 */
function findDuplicateDependencies(bundles: ClientComponentBundle[]): ChunkUsage[] {
  const chunkToComponents = new Map<string, Set<string>>();

  for (const bundle of bundles) {
    for (const chunk of bundle.chunks) {
      const components = chunkToComponents.get(chunk) || new Set<string>();
      components.add(bundle.filePath);
      chunkToComponents.set(chunk, components);
    }
  }

  const duplicates: ChunkUsage[] = [];
  for (const [chunk, components] of chunkToComponents.entries()) {
    if (components.size > 1) {
      duplicates.push({
        chunk,
        components: Array.from(components).sort(),
      });
    }
  }

  return duplicates;
}

/**
 * Detect client components exceeding size thresholds and duplicate dependencies
 */
export function detectClientSizeIssues(
  bundles: ClientComponentBundle[] | undefined,
  config: SizeThresholdConfig = {}
): Diagnostic[] {
  if (!bundles || bundles.length === 0) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];
  const threshold = config.thresholdBytes ?? DEFAULT_THRESHOLD_BYTES;

  // Check for oversized components
  for (const bundle of bundles) {
    if (bundle.totalBytes > threshold) {
      const overage = bundle.totalBytes - threshold;
      const percentage = ((overage / threshold) * 100).toFixed(0);

      diagnostics.push(
        toDiagnostic(
          bundle.filePath,
          OVERSIZED_RULE,
          `Client component is ${formatBytes(bundle.totalBytes)} (${percentage}% over ${formatBytes(threshold)} threshold). Consider code splitting or lazy loading.`,
          'warn'
        )
      );
    }
  }

  // Check for duplicate dependencies
  const duplicates = findDuplicateDependencies(bundles);

  // Group duplicates by components that share them
  const componentPairsDuplicates = new Map<string, Set<string>>();

  for (const { chunk, components } of duplicates) {
    const pairKey = components.join('|');
    const chunks = componentPairsDuplicates.get(pairKey) || new Set<string>();
    chunks.add(chunk);
    componentPairsDuplicates.set(pairKey, chunks);
  }

  // Report duplicate dependencies
  for (const [pairKey, chunks] of componentPairsDuplicates.entries()) {
    const components = pairKey.split('|');
    if (chunks.size >= 3) {
      // Only report when multiple chunks are duplicated
      for (const component of components) {
        diagnostics.push(
          toDiagnostic(
            component,
            DUPLICATE_DEPS_RULE,
            `Component shares ${chunks.size} dependencies with ${components.length - 1} other component(s). Consider extracting shared code to a common module or using dynamic imports.`,
            'warn'
          )
        );
      }
    }
  }

  return diagnostics;
}
