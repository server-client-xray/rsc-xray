import { describe, it, expect } from 'vitest';

import type { ClientComponentBundle } from '../../lib/clientBundles';
import { detectClientSizeIssues } from '../clientSizeThreshold';

function createBundle(
  filePath: string,
  totalBytes: number,
  chunks: string[] = []
): ClientComponentBundle {
  return { filePath, totalBytes, chunks };
}

describe('Client Size Threshold Analyzer', () => {
  describe('oversized components', () => {
    it('detects components exceeding default threshold (50KB)', () => {
      const bundles: ClientComponentBundle[] = [
        createBundle('app/components/LargeComponent.tsx', 102400), // 100KB
      ];

      const diagnostics = detectClientSizeIssues(bundles);

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0]?.rule).toBe('client-component-oversized');
      expect(diagnostics[0]?.level).toBe('warn');
      expect(diagnostics[0]?.message).toContain('100.0KB');
      expect(diagnostics[0]?.message).toContain('100% over');
      expect(diagnostics[0]?.loc?.file).toBe('app/components/LargeComponent.tsx');
    });

    it('passes components under threshold', () => {
      const bundles: ClientComponentBundle[] = [
        createBundle('app/components/SmallComponent.tsx', 25600), // 25KB
      ];

      const diagnostics = detectClientSizeIssues(bundles);

      const oversized = diagnostics.filter((d) => d.rule === 'client-component-oversized');
      expect(oversized).toHaveLength(0);
    });

    it('handles components exactly at threshold', () => {
      const bundles: ClientComponentBundle[] = [
        createBundle('app/components/ExactComponent.tsx', 51200), // Exactly 50KB
      ];

      const diagnostics = detectClientSizeIssues(bundles);

      const oversized = diagnostics.filter((d) => d.rule === 'client-component-oversized');
      expect(oversized).toHaveLength(0);
    });

    it('respects custom threshold configuration', () => {
      const bundles: ClientComponentBundle[] = [
        createBundle('app/components/Component.tsx', 76800), // 75KB
      ];

      const diagnostics = detectClientSizeIssues(bundles, { thresholdBytes: 102400 }); // 100KB threshold

      const oversized = diagnostics.filter((d) => d.rule === 'client-component-oversized');
      expect(oversized).toHaveLength(0);
    });

    it('detects multiple oversized components', () => {
      const bundles: ClientComponentBundle[] = [
        createBundle('app/components/Large1.tsx', 102400), // 100KB
        createBundle('app/components/Small.tsx', 10240), // 10KB
        createBundle('app/components/Large2.tsx', 153600), // 150KB
      ];

      const diagnostics = detectClientSizeIssues(bundles);

      const oversized = diagnostics.filter((d) => d.rule === 'client-component-oversized');
      expect(oversized).toHaveLength(2);
      expect(oversized.map((d) => d.loc?.file)).toContain('app/components/Large1.tsx');
      expect(oversized.map((d) => d.loc?.file)).toContain('app/components/Large2.tsx');
    });

    it('provides actionable suggestions in message', () => {
      const bundles: ClientComponentBundle[] = [
        createBundle('app/components/HugeComponent.tsx', 204800), // 200KB
      ];

      const diagnostics = detectClientSizeIssues(bundles);

      expect(diagnostics[0]?.message).toContain('code splitting');
      expect(diagnostics[0]?.message).toContain('lazy loading');
    });
  });

  describe('duplicate dependencies', () => {
    it('detects chunks shared across multiple components', () => {
      const bundles: ClientComponentBundle[] = [
        createBundle('app/components/Component1.tsx', 10240, [
          'static/chunks/shared1.js',
          'static/chunks/shared2.js',
          'static/chunks/shared3.js',
          'static/chunks/unique1.js',
        ]),
        createBundle('app/components/Component2.tsx', 10240, [
          'static/chunks/shared1.js',
          'static/chunks/shared2.js',
          'static/chunks/shared3.js',
          'static/chunks/unique2.js',
        ]),
      ];

      const diagnostics = detectClientSizeIssues(bundles);

      const duplicates = diagnostics.filter((d) => d.rule === 'duplicate-dependencies');
      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates[0]?.message).toContain('3 dependencies');
    });

    it('skips when components share fewer than 3 chunks', () => {
      const bundles: ClientComponentBundle[] = [
        createBundle('app/components/Component1.tsx', 10240, [
          'static/chunks/shared1.js',
          'static/chunks/shared2.js',
        ]),
        createBundle('app/components/Component2.tsx', 10240, [
          'static/chunks/shared1.js',
          'static/chunks/shared2.js',
        ]),
      ];

      const diagnostics = detectClientSizeIssues(bundles);

      const duplicates = diagnostics.filter((d) => d.rule === 'duplicate-dependencies');
      expect(duplicates).toHaveLength(0);
    });

    it('handles no shared chunks', () => {
      const bundles: ClientComponentBundle[] = [
        createBundle('app/components/Component1.tsx', 10240, ['static/chunks/unique1.js']),
        createBundle('app/components/Component2.tsx', 10240, ['static/chunks/unique2.js']),
      ];

      const diagnostics = detectClientSizeIssues(bundles);

      const duplicates = diagnostics.filter((d) => d.rule === 'duplicate-dependencies');
      expect(duplicates).toHaveLength(0);
    });

    it('provides actionable suggestions for duplicate dependencies', () => {
      const bundles: ClientComponentBundle[] = [
        createBundle('app/components/Component1.tsx', 10240, [
          'static/chunks/shared1.js',
          'static/chunks/shared2.js',
          'static/chunks/shared3.js',
        ]),
        createBundle('app/components/Component2.tsx', 10240, [
          'static/chunks/shared1.js',
          'static/chunks/shared2.js',
          'static/chunks/shared3.js',
        ]),
      ];

      const diagnostics = detectClientSizeIssues(bundles);

      const duplicates = diagnostics.filter((d) => d.rule === 'duplicate-dependencies');
      expect(duplicates[0]?.message).toContain('common module');
      expect(duplicates[0]?.message).toContain('dynamic imports');
    });

    it('handles multiple component groups with different shared chunks', () => {
      const bundles: ClientComponentBundle[] = [
        // Group 1: Component1 & Component2 share chunks A, B, C
        createBundle('app/components/Component1.tsx', 10240, [
          'static/chunks/A.js',
          'static/chunks/B.js',
          'static/chunks/C.js',
        ]),
        createBundle('app/components/Component2.tsx', 10240, [
          'static/chunks/A.js',
          'static/chunks/B.js',
          'static/chunks/C.js',
        ]),
        // Group 2: Component3 & Component4 share chunks X, Y, Z
        createBundle('app/components/Component3.tsx', 10240, [
          'static/chunks/X.js',
          'static/chunks/Y.js',
          'static/chunks/Z.js',
        ]),
        createBundle('app/components/Component4.tsx', 10240, [
          'static/chunks/X.js',
          'static/chunks/Y.js',
          'static/chunks/Z.js',
        ]),
      ];

      const diagnostics = detectClientSizeIssues(bundles);

      const duplicates = diagnostics.filter((d) => d.rule === 'duplicate-dependencies');
      // Each component in each group should get a diagnostic
      expect(duplicates.length).toBe(4);
    });
  });

  describe('combined scenarios', () => {
    it('detects both oversized and duplicate dependencies', () => {
      const bundles: ClientComponentBundle[] = [
        createBundle('app/components/Large1.tsx', 102400, [
          // 100KB + duplicates
          'static/chunks/shared1.js',
          'static/chunks/shared2.js',
          'static/chunks/shared3.js',
        ]),
        createBundle('app/components/Large2.tsx', 102400, [
          // 100KB + duplicates
          'static/chunks/shared1.js',
          'static/chunks/shared2.js',
          'static/chunks/shared3.js',
        ]),
      ];

      const diagnostics = detectClientSizeIssues(bundles);

      const oversized = diagnostics.filter((d) => d.rule === 'client-component-oversized');
      const duplicates = diagnostics.filter((d) => d.rule === 'duplicate-dependencies');

      expect(oversized).toHaveLength(2);
      expect(duplicates).toHaveLength(2);
    });

    it('handles real-world complex scenario', () => {
      const bundles: ClientComponentBundle[] = [
        createBundle('app/components/Dashboard.tsx', 204800, [
          // 200KB
          'static/chunks/framework.js',
          'static/chunks/charts.js',
          'static/chunks/tables.js',
          'static/chunks/dashboard.js',
        ]),
        createBundle('app/components/Analytics.tsx', 153600, [
          // 150KB
          'static/chunks/framework.js',
          'static/chunks/charts.js',
          'static/chunks/tables.js',
          'static/chunks/analytics.js',
        ]),
        createBundle('app/components/SmallWidget.tsx', 10240, [
          // 10KB
          'static/chunks/widget.js',
        ]),
      ];

      const diagnostics = detectClientSizeIssues(bundles);

      // Dashboard and Analytics are oversized
      const oversized = diagnostics.filter((d) => d.rule === 'client-component-oversized');
      expect(oversized).toHaveLength(2);

      // Dashboard and Analytics share 3 chunks (framework, charts, tables)
      const duplicates = diagnostics.filter((d) => d.rule === 'duplicate-dependencies');
      expect(duplicates).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('handles empty bundles array', () => {
      const diagnostics = detectClientSizeIssues([]);
      expect(diagnostics).toHaveLength(0);
    });

    it('handles undefined bundles', () => {
      const diagnostics = detectClientSizeIssues(undefined);
      expect(diagnostics).toHaveLength(0);
    });

    it('handles components with zero bytes', () => {
      const bundles: ClientComponentBundle[] = [createBundle('app/components/Empty.tsx', 0)];

      const diagnostics = detectClientSizeIssues(bundles);

      const oversized = diagnostics.filter((d) => d.rule === 'client-component-oversized');
      expect(oversized).toHaveLength(0);
    });

    it('handles components with no chunks', () => {
      const bundles: ClientComponentBundle[] = [
        createBundle('app/components/NoChunks.tsx', 102400, []),
      ];

      const diagnostics = detectClientSizeIssues(bundles);

      const oversized = diagnostics.filter((d) => d.rule === 'client-component-oversized');
      expect(oversized).toHaveLength(1);

      const duplicates = diagnostics.filter((d) => d.rule === 'duplicate-dependencies');
      expect(duplicates).toHaveLength(0);
    });

    it('provides accurate location information', () => {
      const bundles: ClientComponentBundle[] = [createBundle('app/components/Large.tsx', 102400)];

      const diagnostics = detectClientSizeIssues(bundles);

      expect(diagnostics[0]?.loc).toBeDefined();
      expect(diagnostics[0]?.loc?.file).toBe('app/components/Large.tsx');
      expect(diagnostics[0]?.loc?.range).toBeDefined();
      expect(diagnostics[0]?.loc?.range?.from).toBe(0);
      expect(diagnostics[0]?.loc?.range?.to).toBe(0); // No source file provided, fallback to 0,0
    });
  });
});
