/**
 * Public API for RSC X-Ray OSS LSP Server
 *
 * This is a thin wrapper around the OSS analyzer for browser-side LSP usage.
 * It uses only OSS analyzer rules (8 basic correctness rules).
 *
 * For advanced performance rules and Pro features, see @rsc-xray/pro-lsp-server
 */

export { analyze } from './analyze.js';

export type { LspAnalysisRequest, LspAnalysisResponse } from './types.js';
