/**
 * Types for OSS LSP Server
 *
 * This is a thin wrapper around the OSS analyzer for browser-side LSP usage.
 * For Pro features and server-side deployment, see @rsc-xray/pro-lsp-server
 */

import type {
  LspAnalysisRequest as BaseLspAnalysisRequest,
  LspAnalysisResponse as BaseLspAnalysisResponse,
} from '@rsc-xray/analyzer';

/**
 * OSS LSP analysis request (re-export from analyzer)
 */
export type LspAnalysisRequest = BaseLspAnalysisRequest;

/**
 * OSS LSP analysis response with additional metadata
 */
export interface LspAnalysisResponse extends BaseLspAnalysisResponse {
  /** Version of the analyzer */
  version: string;

  /** Error information if analysis fails */
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
