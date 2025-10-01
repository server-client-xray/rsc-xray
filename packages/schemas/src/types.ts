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
  line: number;
  col: number;
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
