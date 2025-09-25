import type { RouteCacheMetadata } from '@rsc-xray/schemas';

export interface NextBuildManifest {
  pages: Record<string, string[]>;
  app: Record<string, string[]>;
  ampFirstPages?: string[];
}

export interface NextAppBuildManifest {
  pages: Record<string, string[]>;
  rootMainFiles: string[];
  pageCss?: Record<string, string[]>;
  appCss?: Record<string, string[]>;
  rscCss?: Record<string, string[]>;
}

export interface ParsedRouteAsset {
  route: string;
  chunks: string[];
  totalBytes?: number;
  cache?: RouteCacheMetadata;
}

export interface ParsedManifests {
  routes: ParsedRouteAsset[];
}
