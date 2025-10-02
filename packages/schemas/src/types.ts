export const SERVER_PARALLEL_SUGGESTION_RULE = 'server-promise-all' as const;
export const ROUTE_WATERFALL_SUGGESTION_RULE = 'route-waterfall' as const;

export type NodeKind = 'server' | 'client' | 'suspense' | 'route';

export type CacheDynamicMode = 'auto' | 'force-dynamic' | 'force-static' | 'error';

export type RouteSegmentFetchCache =
  | 'auto'
  | 'default-cache'
  | 'only-cache'
  | 'force-cache'
  | 'force-no-store'
  | 'default-no-store'
  | 'only-no-store';

export type RouteSegmentRuntime = 'nodejs' | 'edge';

export interface DiagnosticLocation {
  file: string;
  /**
   * Character offset range in the file (0-indexed)
   * Provides precise positioning for editors without line/col conversion
   */
  range: {
    /** Start character offset (0-indexed) */
    from: number;
    /** End character offset (0-indexed) */
    to: number;
  };
}

export interface Diagnostic {
  rule: string;
  level: 'warn' | 'error';
  message: string;
  loc?: DiagnosticLocation;
}

export interface Suggestion {
  rule: string;
  level: 'info' | 'warn';
  message: string;
  loc?: DiagnosticLocation;
}

/**
 * Unified LSP Diagnostic Schema
 *
 * This is the standard diagnostic format used across all RSC X-Ray packages
 * for LSP server communication. It provides a rich, extensible format that
 * can be adapted to different consumer needs (VS Code, CLI, overlay, etc.)
 */
export interface RscXrayDiagnostic {
  // Location
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;

  // Classification
  severity: 'error' | 'warning' | 'info' | 'hint';
  rule: string;
  category: 'performance' | 'correctness' | 'best-practice' | 'security';

  // Content
  message: string;
  suggestion?: string;

  // Metadata
  source: 'rsc-xray' | 'rsc-xray-pro';
  timestamp?: number;

  // Context
  codeFrame?: string;
  relatedInformation?: Array<{
    file: string;
    line: number;
    message: string;
  }>;

  // Actions
  fixes?: Array<{
    title: string;
    kind: 'quickfix' | 'refactor' | 'source';
    edits: Array<{
      file: string;
      startLine: number;
      startColumn: number;
      endLine: number;
      endColumn: number;
      newText: string;
    }>;
  }>;

  // Analytics
  impact?: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    estimatedTimeSaving?: number; // ms
    estimatedByteSaving?: number; // bytes
  };
}

/**
 * LSP Analysis Request
 */
export interface LspAnalysisRequest {
  // What to analyze
  files?: Array<{
    path: string;
    content: string;
  }>;

  // Or single file for quick analysis
  code?: string;
  fileName?: string;

  // Configuration
  scenario?: string; // For demo scenarios
  rules?: string[]; // Specific rules to run
  clientComponents?: string[]; // Known client components

  // Options
  timeout?: number;
  cacheKey?: string;
}

/**
 * LSP Analysis Response
 */
export interface LspAnalysisResponse {
  diagnostics: RscXrayDiagnostic[];

  // Metadata
  duration: number; // ms
  cached: boolean;
  version: string;

  // Rate limiting (for HTTP API)
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: number; // Unix timestamp
  };

  // Errors
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface XNode {
  id: string;
  file?: string;
  name?: string;
  kind: NodeKind;
  bytes?: number;
  hydrationMs?: number;
  diagnostics?: Diagnostic[];
  suggestions?: Suggestion[];
  children?: string[];
  tags?: string[];
  cache?: NodeCacheMetadata;
  mutations?: NodeMutationMetadata;
}

export interface RouteEntry {
  route: string;
  rootNodeId: string;
  changedAt?: string;
  chunks?: string[];
  totalBytes?: number;
  cache?: RouteCacheMetadata;
  segmentConfig?: RouteSegmentConfig;
}

export interface BuildInfo {
  nextVersion: string;
  timestamp: string;
}

export interface FlightSample {
  route: string;
  ts: number;
  chunkIndex: number;
  label?: string;
}

export interface FlightData {
  samples: FlightSample[];
}

export interface Model {
  version: '0.1';
  routes: RouteEntry[];
  nodes: Record<string, XNode>;
  build: BuildInfo;
  flight?: FlightData;
}

export interface NodeCacheMetadata {
  modes?: Array<'force-cache' | 'no-store'>;
  revalidateSeconds?: number[];
  hasRevalidateFalse?: boolean;
  dynamic?: CacheDynamicMode;
  experimentalPpr?: boolean;
}

export interface NodeMutationMetadata {
  tags?: string[];
  paths?: string[];
}

export interface RouteSegmentConfig {
  dynamic?: CacheDynamicMode;
  revalidate?: number | false;
  fetchCache?: RouteSegmentFetchCache;
  runtime?: RouteSegmentRuntime;
  preferredRegion?: string | string[];
}

export interface RouteCacheMetadata {
  revalidateSeconds?: number | false;
  tags?: string[];
  dynamic?: CacheDynamicMode;
  experimentalPpr?: boolean;
}

export interface RouteConfigDiagnostic {
  config?: RouteSegmentConfig;
  conflicts?: string[];
}
