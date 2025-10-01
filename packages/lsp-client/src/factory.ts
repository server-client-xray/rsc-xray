import { ILspClient, LspClientConfig } from './types';
import { MockLspClient } from './MockLspClient';
import { HttpLspClient } from './HttpLspClient';

/**
 * Create an LSP client based on configuration
 *
 * @example
 * ```typescript
 * // OSS demo (mock)
 * const client = createLspClient({ type: 'mock' });
 *
 * // Pro demo (real API)
 * const client = createLspClient({
 *   type: 'http',
 *   http: { apiUrl: '/api/lsp' }
 * });
 *
 * // Auto-detect (checks environment)
 * const client = createLspClient({ type: 'auto' });
 * ```
 */
export function createLspClient(config: LspClientConfig = {}): ILspClient {
  const type = config.type ?? 'auto';

  if (type === 'mock') {
    return new MockLspClient();
  }

  if (type === 'http') {
    if (!config.http?.apiUrl) {
      throw new Error('http.apiUrl is required for HTTP LSP client');
    }
    return new HttpLspClient(config.http);
  }

  // Auto-detect based on environment
  if (type === 'auto') {
    // Check if API URL is configured
    const apiUrl =
      config.http?.apiUrl ||
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LSP_API_URL) ||
      (typeof window !== 'undefined' &&
        (window as unknown as { ENV?: { LSP_API_URL?: string } }).ENV?.LSP_API_URL);

    if (apiUrl) {
      return new HttpLspClient({
        apiUrl,
        ...config.http,
      });
    }

    // Default to mock
    return new MockLspClient();
  }

  throw new Error(`Unknown LSP client type: ${type}`);
}

/**
 * Check if real LSP API is available
 * Useful for showing "This is a mock" banner in OSS demo
 */
export function isRealLspAvailable(): boolean {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LSP_API_URL) {
    return true;
  }

  if (typeof window !== 'undefined') {
    const env = (window as unknown as { ENV?: { LSP_API_URL?: string } }).ENV;
    return Boolean(env?.LSP_API_URL);
  }

  return false;
}
