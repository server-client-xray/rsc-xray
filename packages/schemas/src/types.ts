export type NodeKind = 'server' | 'client' | 'suspense' | 'route';

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
}

export interface RouteEntry {
  route: string;
  rootNodeId: string;
  changedAt?: string;
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
