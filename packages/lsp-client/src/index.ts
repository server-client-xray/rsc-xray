/**
 * @rsc-xray/lsp-client
 *
 * LSP client with both mock (OSS) and real (Pro) implementations.
 *
 * This package enables:
 * - OSS demo to work with hardcoded diagnostics (MockLspClient)
 * - Pro demo to use real LSP API (HttpLspClient)
 * - Same codebase for both deployments
 *
 * @example
 * ```typescript
 * import { createLspClient } from '@rsc-xray/lsp-client';
 *
 * // Auto-detect (uses env vars)
 * const client = createLspClient({ type: 'auto' });
 *
 * const result = await client.analyze({
 *   code: 'const x = 1;',
 *   fileName: 'demo.tsx',
 *   scenario: 'serialization-boundary',
 * });
 *
 * console.log(result.diagnostics);
 * ```
 */

export { createLspClient, isRealLspAvailable } from './factory';
export { MockLspClient } from './MockLspClient';
export { HttpLspClient } from './HttpLspClient';
export type { ILspClient, HttpLspClientConfig, LspClientConfig } from './types';
