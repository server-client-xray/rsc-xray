/**
 * Boundary Tree Preview Component
 *
 * ⚠️ DEMO PREVIEW ONLY - Visual replica of Pro Overlay feature
 *
 * This is a simplified visual representation showing what the Pro Overlay looks like.
 * It uses static mock data and contains NO Pro business logic or analysis algorithms.
 *
 * Actual Pro version includes:
 * - Real-time AST analysis
 * - Interactive tree navigation with filtering
 * - Live hydration timing overlay
 * - Bundle size attribution
 * - Cache tag visualization
 * - Hot-reload support
 */

'use client';

import type { ReactElement } from 'react';
import { mockBoundaryTree, type MockNode } from './mockData';
import styles from './ProPreview.module.css';

export function BoundaryTreePreview(): ReactElement {
  const { route, nodes } = mockBoundaryTree;

  return (
    <div className={styles.preview}>
      <div className={styles.disclaimer}>
        ⚠️ Demo Preview - Pro version includes live analysis & interactions
      </div>

      <div className={styles.header}>
        <h3 className={styles.title}>Component Boundary Tree</h3>
        <span className={styles.route}>{route}</span>
      </div>

      <div className={styles.tree}>
        {nodes.map((node) => (
          <NodePreview key={node.id} node={node} level={getNodeLevel(node.id, nodes)} />
        ))}
      </div>

      <div className={styles.features}>
        <h4>Pro Features:</h4>
        <ul>
          <li>✨ Real-time component analysis</li>
          <li>🔍 Interactive tree navigation</li>
          <li>⚡ Live hydration timing overlay</li>
          <li>📊 Bundle size attribution per component</li>
          <li>🏷️ Cache tag relationships</li>
          <li>🔥 Hot-reload with preserves state</li>
        </ul>
      </div>
    </div>
  );
}

function NodePreview({ node, level }: { node: MockNode; level: number }): ReactElement {
  const icon = getNodeIcon(node.kind);
  const color = getNodeColor(node.kind);

  return (
    <div className={styles.node} style={{ paddingLeft: `${level * 20}px` }}>
      <span className={styles.icon}>{icon}</span>
      <span className={`${styles.nodeName} ${color}`}>{node.name}</span>
      {node.bytes && <span className={styles.badge}>{formatBytes(node.bytes)}</span>}
      {node.hydrationMs && <span className={styles.badge}>{node.hydrationMs}ms</span>}
      {node.file && <span className={styles.file}>{node.file}</span>}
    </div>
  );
}

// Simple visual helpers - NO Pro algorithms
function getNodeIcon(kind: string): string {
  switch (kind) {
    case 'route':
      return '📄';
    case 'server':
      return '🟢';
    case 'client':
      return '🔵';
    case 'suspense':
      return '⏸️';
    default:
      return '⚪';
  }
}

function getNodeColor(kind: string): string {
  switch (kind) {
    case 'route':
      return styles.route;
    case 'server':
      return styles.server;
    case 'client':
      return styles.client;
    case 'suspense':
      return styles.suspense;
    default:
      return '';
  }
}

function getNodeLevel(nodeId: string, nodes: MockNode[]): number {
  // Simple mock hierarchy calculation
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return 0;

  let level = 0;
  let current = node;

  while (current) {
    const parent = nodes.find((n) => n.children?.includes(current!.id));
    if (!parent) break;
    level++;
    current = parent;
  }

  return level;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
