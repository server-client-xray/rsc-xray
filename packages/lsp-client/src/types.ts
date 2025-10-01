import { LspAnalysisRequest, LspAnalysisResponse } from '@rsc-xray/schemas';

/**
 * LSP Client interface
 *
 * This interface is implemented by both MockLspClient (OSS demo)
 * and HttpLspClient (Pro demo with real API)
 */
export interface ILspClient {
  /**
   * Analyze code and return diagnostics
   */
  analyze(request: LspAnalysisRequest): Promise<LspAnalysisResponse>;

  /**
   * Check if this is a mock client (for UI hints)
   */
  isMock(): boolean;

  /**
   * Get client type for analytics
   */
  getType(): 'mock' | 'http';
}

/**
 * Configuration for HTTP LSP client
 */
export interface HttpLspClientConfig {
  /**
   * API endpoint URL
   * @example '/api/lsp' or 'https://demo-pro.rsc-xray.dev/api/lsp'
   */
  apiUrl: string;

  /**
   * Request timeout in milliseconds
   * @default 10000
   */
  timeout?: number;

  /**
   * Custom headers
   */
  headers?: Record<string, string>;
}

/**
 * Factory configuration for creating LSP clients
 */
export interface LspClientConfig {
  /**
   * Client type
   * - 'mock': Use hardcoded diagnostics (OSS demo)
   * - 'http': Call real LSP API (Pro demo)
   * - 'auto': Auto-detect based on environment
   */
  type?: 'mock' | 'http' | 'auto';

  /**
   * HTTP client configuration (only for 'http' type)
   */
  http?: HttpLspClientConfig;
}
