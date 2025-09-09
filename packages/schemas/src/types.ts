export type NodeKind = "server" | "client" | "suspense" | "route";
export interface XNode {
  id: string;
  file?: string;
  name?: string;
  kind: NodeKind;
  bytes?: number;
  hydrationMs?: number;
  diagnostics?: Array<{ rule: string; level: "warn"|"error"; message: string; loc?: {file:string; line:number; col:number} }>;
  children?: string[];
  tags?: string[];
}
export interface RouteEntry { route: string; rootNodeId: string; changedAt?: string; }
export interface Model {
  version: "0.1";
  routes: RouteEntry[];
  nodes: Record<string, XNode>;
  build: { nextVersion: string; timestamp: string; };
  flight?: { samples: Array<{ route: string; ts: number; chunkIndex: number; label?: string }>; };
}
