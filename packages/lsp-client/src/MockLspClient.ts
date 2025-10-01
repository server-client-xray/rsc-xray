import { LspAnalysisRequest, LspAnalysisResponse, RscXrayDiagnostic } from '@rsc-xray/schemas';
import { ILspClient } from './types';

/**
 * Mock LSP Client for OSS demo
 *
 * Returns hardcoded diagnostics based on code patterns.
 * This allows the OSS demo to work without a real analyzer.
 */
export class MockLspClient implements ILspClient {
  async analyze(request: LspAnalysisRequest): Promise<LspAnalysisResponse> {
    const startTime = Date.now();

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));

    const diagnostics = this.getMockDiagnostics(request);

    return {
      diagnostics,
      cached: false,
      duration: Date.now() - startTime,
      version: '0.1.0-mock',
    };
  }

  isMock(): boolean {
    return true;
  }

  getType(): 'mock' | 'http' {
    return 'mock';
  }

  /**
   * Generate mock diagnostics based on code content
   */
  private getMockDiagnostics(request: LspAnalysisRequest): RscXrayDiagnostic[] {
    const code = request.code ?? '';
    const fileName = request.fileName ?? 'demo.tsx';
    const scenario = request.scenario ?? 'all';

    const diagnostics: RscXrayDiagnostic[] = [];

    // Serialization boundary violations
    if (scenario === 'serialization-boundary' || scenario === 'all') {
      if (code.includes('onClick={') && code.includes('onClick')) {
        diagnostics.push({
          file: fileName,
          line: this.findLine(code, 'onClick'),
          column: 10,
          severity: 'error',
          rule: 'server-client-serialization-violation',
          category: 'correctness',
          message: 'Function props cannot be passed from Server to Client components',
          suggestion:
            'Convert the function to a serializable callback or move it to the client component',
          source: 'rsc-xray',
          timestamp: Date.now(),
        });
      }
    }

    // Suspense boundary missing
    if (scenario === 'suspense-boundary' || scenario === 'all') {
      if (
        code.includes('async function') &&
        code.includes('await') &&
        !code.includes('<Suspense')
      ) {
        diagnostics.push({
          file: fileName,
          line: this.findLine(code, 'async function'),
          column: 1,
          severity: 'warning',
          rule: 'suspense-boundary-missing',
          category: 'performance',
          message: 'Async Server Component should be wrapped in Suspense boundary',
          suggestion: 'Wrap this component with <Suspense fallback={...}>',
          source: 'rsc-xray',
          timestamp: Date.now(),
        });
      }
    }

    // React 19 cache opportunity
    if (scenario === 'react19-cache' || scenario === 'all') {
      if (code.includes('fetch(') && !code.includes('cache(')) {
        diagnostics.push({
          file: fileName,
          line: this.findLine(code, 'fetch('),
          column: 1,
          severity: 'info',
          rule: 'react19-cache-opportunity',
          category: 'performance',
          message: 'Consider using React 19 cache() for automatic request deduplication',
          suggestion: 'Wrap this fetch in cache() from "react"',
          source: 'rsc-xray',
          timestamp: Date.now(),
        });
      }
    }

    // Client component oversized
    if (scenario === 'client-oversized' || scenario === 'all') {
      if (code.includes('"use client"') && code.length > 1000) {
        diagnostics.push({
          file: fileName,
          line: 1,
          column: 1,
          severity: 'warning',
          rule: 'client-component-oversized',
          category: 'performance',
          message: 'Client component bundle may be large',
          suggestion: 'Consider code splitting or moving logic to Server Components',
          source: 'rsc-xray',
          timestamp: Date.now(),
          impact: {
            severity: 'medium',
            estimatedByteSaving: 5000,
          },
        });
      }
    }

    // Client forbidden imports
    if (scenario === 'client-forbidden-import' || scenario === 'all') {
      if (
        code.includes('"use client"') &&
        (code.includes('import fs') || code.includes('import path'))
      ) {
        diagnostics.push({
          file: fileName,
          line: this.findLine(code, 'import fs') || this.findLine(code, 'import path'),
          column: 1,
          severity: 'error',
          rule: 'client-forbidden-import',
          category: 'correctness',
          message: 'Node.js built-in modules cannot be used in Client Components',
          suggestion: 'Move this logic to a Server Component or Server Action',
          source: 'rsc-xray',
          timestamp: Date.now(),
        });
      }
    }

    // Promise.all opportunity
    if (scenario === 'server-promise-all' || scenario === 'all') {
      const awaitCount = (code.match(/await /g) || []).length;
      if (awaitCount > 1 && !code.includes('Promise.all')) {
        diagnostics.push({
          file: fileName,
          line: this.findLine(code, 'await'),
          column: 1,
          severity: 'warning',
          rule: 'server-promise-all',
          category: 'performance',
          message:
            'Sequential awaits detected. Consider using Promise.all() for parallel execution',
          suggestion: 'Combine these awaits with Promise.all() to improve performance',
          source: 'rsc-xray',
          timestamp: Date.now(),
          impact: {
            severity: 'high',
            estimatedTimeSaving: 500,
          },
        });
      }
    }

    // Route segment config conflict
    if (scenario === 'route-config-conflict' || scenario === 'all') {
      if (code.includes('export const dynamic') && code.includes('export const revalidate')) {
        diagnostics.push({
          file: fileName,
          line: this.findLine(code, 'export const dynamic'),
          column: 1,
          severity: 'error',
          rule: 'route-segment-config-conflict',
          category: 'correctness',
          message: 'Conflicting route segment config: dynamic and revalidate cannot both be set',
          suggestion: 'Remove one of these exports or adjust the configuration',
          source: 'rsc-xray',
          timestamp: Date.now(),
        });
      }
    }

    return diagnostics;
  }

  /**
   * Find line number for a given substring
   */
  private findLine(code: string, search: string): number {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(search)) {
        return i + 1; // 1-indexed
      }
    }
    return 1;
  }
}
