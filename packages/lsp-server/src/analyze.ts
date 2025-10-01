/**
 * OSS LSP analysis entry point
 *
 * This is a thin wrapper around the OSS analyzer for browser-side usage.
 * It provides error handling and version metadata.
 */

import { analyzeLspRequest } from '@rsc-xray/analyzer';
import type { LspAnalysisRequest, LspAnalysisResponse } from './types.js';

/**
 * Analyze code using OSS analyzer (browser-side, no rate limiting)
 *
 * This is a simple wrapper that adds error handling and version info.
 * For server-side deployment with rate limiting, see @rsc-xray/pro-lsp-server
 *
 * @example
 * ```typescript
 * import { analyze } from '@rsc-xray/lsp-server';
 *
 * const result = await analyze({
 *   code: 'export default function Page() { ... }',
 *   fileName: 'app/page.tsx',
 *   scenario: 'serialization-boundary'
 * });
 * ```
 */
export async function analyze(request: LspAnalysisRequest): Promise<LspAnalysisResponse> {
  const startTime = Date.now();

  try {
    const ossAnalysisResult = analyzeLspRequest(request);

    return {
      ...ossAnalysisResult,
      duration: Date.now() - startTime,
      version: getAnalyzerVersion(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed';

    return {
      diagnostics: [],
      duration: Date.now() - startTime,
      rulesExecuted: [],
      version: getAnalyzerVersion(),
      error: {
        code: 'ANALYSIS_ERROR',
        message,
        details: error instanceof Error ? error.stack : undefined,
      },
    };
  }
}

/**
 * Get the current analyzer version
 */
function getAnalyzerVersion(): string {
  // In production, this would read from package.json
  return '0.6.0'; // Match current OSS analyzer version
}
