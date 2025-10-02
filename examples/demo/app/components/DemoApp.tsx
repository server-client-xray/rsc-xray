'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import type { RscXrayDiagnostic } from '@rsc-xray/schemas';
import { scenarios, getScenario } from '../lib/scenarios';
import { Header } from './Header';
import { SplitPanel } from './SplitPanel';
import { ExplanationPanel } from './ExplanationPanel';
import { CodeEditor } from './CodeEditor';
import { StatusBar } from './StatusBar';
import { ProModal, type ProFeature } from './ProPreview';
import styles from './DemoApp.module.css';

/**
 * Main demo application with state management
 *
 * Manages:
 * - Selected scenario
 * - Analysis status (idle/analyzing/error)
 * - Diagnostics from LSP analysis
 * - Code editor state and real-time analysis
 * - Pro feature modal state
 */
export function DemoApp(): ReactElement {
  const [selectedScenarioId, setSelectedScenarioId] = useState(scenarios[0].id);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'error'>('idle');
  const [diagnostics, setDiagnostics] = useState<RscXrayDiagnostic[]>([]);
  const [analysisDuration, setAnalysisDuration] = useState<number | undefined>(undefined);
  const [proModalState, setProModalState] = useState<{
    isOpen: boolean;
    feature: ProFeature | null;
  }>({
    isOpen: false,
    feature: null,
  });

  const scenario = getScenario(selectedScenarioId) || scenarios[0];

  const handleSelectScenario = (scenarioId: string): void => {
    setSelectedScenarioId(scenarioId);
    setAnalysisStatus('idle');
    setDiagnostics([]);
    setAnalysisDuration(undefined);
  };

  const handleAnalysisComplete = (config: {
    diagnostics: RscXrayDiagnostic[];
    duration: number;
    status: 'idle' | 'analyzing' | 'error';
  }): void => {
    setDiagnostics(config.diagnostics);
    setAnalysisDuration(config.duration);
    setAnalysisStatus(config.status);
  };

  const handleOpenProModal = (feature: ProFeature): void => {
    setProModalState({ isOpen: true, feature });
  };

  const handleCloseProModal = (): void => {
    setProModalState({ isOpen: false, feature: null });
  };

  return (
    <div className={styles.app}>
      <Header showUpgradeCTA={true} />

      <main className={styles.main}>
        <SplitPanel
          leftPanel={
            <ExplanationPanel
              scenario={scenario}
              diagnosticsCount={diagnostics.length}
              onSelectScenario={handleSelectScenario}
              onOpenProModal={handleOpenProModal}
            />
          }
          rightPanel={
            <CodeEditor
              key={selectedScenarioId} // Force remount on scenario change
              scenario={scenario}
              onAnalysisComplete={handleAnalysisComplete}
            />
          }
        />
      </main>

      <StatusBar
        status={analysisStatus}
        diagnosticsCount={diagnostics.length}
        duration={analysisDuration}
      />

      {proModalState.feature && (
        <ProModal
          feature={proModalState.feature}
          isOpen={proModalState.isOpen}
          onClose={handleCloseProModal}
        />
      )}
    </div>
  );
}
