import type { ReactElement } from 'react';
import { DemoApp } from './components/DemoApp';

/**
 * Home page - Interactive RSC X-Ray Demo
 *
 * Features:
 * - Split-panel tutorial interface
 * - Real-time LSP analysis with CodeMirror
 * - Categorized scenarios (Fundamentals, Performance, Pro)
 * - Pro feature teasers and upgrade CTAs
 */
export default function HomePage(): ReactElement {
  return <DemoApp />;
}
