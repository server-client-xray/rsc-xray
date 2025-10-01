import { LspAnalysisRequest, LspAnalysisResponse } from '@rsc-xray/schemas';
import { ILspClient, HttpLspClientConfig } from './types';

/**
 * HTTP LSP Client for Pro demo
 *
 * Calls a real LSP API endpoint for analysis.
 * Used when NEXT_PUBLIC_LSP_API_URL is set.
 */
export class HttpLspClient implements ILspClient {
  private readonly config: Required<HttpLspClientConfig>;

  constructor(config: HttpLspClientConfig) {
    this.config = {
      timeout: 10000,
      headers: {},
      ...config,
    };
  }

  async analyze(request: LspAnalysisRequest): Promise<LspAnalysisResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data: LspAnalysisResponse = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Return error response instead of throwing
      return {
        diagnostics: [],
        cached: false,
        duration: 0,
        version: '0.1.0',
        error: {
          code: error instanceof Error ? error.name : 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to analyze code',
          details: error,
        },
      };
    }
  }

  isMock(): boolean {
    return false;
  }

  getType(): 'mock' | 'http' {
    return 'http';
  }
}
