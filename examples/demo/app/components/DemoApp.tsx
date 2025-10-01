'use client';

import { useState } from 'react';
import { scenarios, getScenario } from '../lib/scenarios';
import { Header } from './Header';
import { SplitPanel } from './SplitPanel';
import { ExplanationPanel } from './ExplanationPanel';
import { StatusBar } from './StatusBar';
import styles from './DemoApp.module.css';

/**
 * Main demo application with state management
 *
 * Manages:
 * - Selected scenario
 * - Analysis status
 * - Diagnostics count
 * - Code editor state (placeholder for now)
 */
export function DemoApp(): JSX.Element {
  const [selectedScenarioId, setSelectedScenarioId] = useState(scenarios[0].id);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'error'>('idle');
  const [diagnosticsCount, setDiagnosticsCount] = useState(0);

  const scenario = getScenario(selectedScenarioId) || scenarios[0];

  const handleSelectScenario = (scenarioId: string): void => {
    setSelectedScenarioId(scenarioId);
    setAnalysisStatus('idle');
    setDiagnosticsCount(0);
    // TODO: Update code editor and trigger analysis
  };

  return (
    <div className={styles.app}>
      <Header showUpgradeCTA={true} />

      <main className={styles.main}>
        <SplitPanel
          leftPanel={
            <ExplanationPanel
              scenario={scenario}
              diagnosticsCount={diagnosticsCount}
              onSelectScenario={handleSelectScenario}
            />
          }
          rightPanel={
            <div className={styles.editorPlaceholder}>
              <h2>Code Editor</h2>
              <p>CodeMirror integration coming next...</p>
              <pre className={styles.codePreview}>{scenario.code}</pre>
            </div>
          }
        />
      </main>

      <StatusBar status={analysisStatus} diagnosticsCount={diagnosticsCount} />
    </div>
  );
}
