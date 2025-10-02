'use client';

import { useState } from 'react';
import type { Diagnostic, Suggestion } from '@rsc-xray/schemas';
import { scenarios, getScenario } from '../lib/scenarios';
import { useDeepLink, useSyncUrlOnScenarioChange } from '../lib/useDeepLink';
import { Header } from './Header';
import { SplitPanel } from './SplitPanel';
import { ExplanationPanel } from './ExplanationPanel';
import { StatusBar } from './StatusBar';
import { ProModal, type ProFeature } from './ProPreview';
import { MultiFileCodeViewer, type CodeFile } from './MultiFileCodeViewer';
import styles from './DemoApp.module.css';

/**
 * Main demo application with state management
 *
 * Manages:
 * - Selected scenario (with deep linking support)
 * - Analysis status (idle/analyzing/error)
 * - Diagnostics from LSP analysis
 * - Code editor state and real-time analysis
 * - Pro feature modal state
 *
 * Deep linking:
 * - ?scenario=<id> - Load specific scenario
 * - ?line=<number> - Highlight specific line in editor
 */
export function DemoApp() {
  const { initialParams } = useDeepLink();

  // Initialize scenario from URL param or default to first scenario
  const getInitialScenario = (): string => {
    if (initialParams.scenario) {
      const scenario = getScenario(initialParams.scenario);
      if (scenario) return scenario.id;
    }
    return scenarios[0].id;
  };

  const [selectedScenarioId, setSelectedScenarioId] = useState(getInitialScenario());
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'error'>('idle');
  const [diagnostics, setDiagnostics] = useState<Array<Diagnostic | Suggestion>>([]);
  const [analysisDuration, setAnalysisDuration] = useState<number | undefined>(undefined);
  const [proModalState, setProModalState] = useState<{
    isOpen: boolean;
    feature: ProFeature | null;
  }>({
    isOpen: false,
    feature: null,
  });

  // Sync URL with scenario changes
  useSyncUrlOnScenarioChange(selectedScenarioId);

  const scenario = getScenario(selectedScenarioId) || scenarios[0];

  const handleSelectScenario = (scenarioId: string): void => {
    setSelectedScenarioId(scenarioId);
    setAnalysisStatus('idle');
    setDiagnostics([]);
    setAnalysisDuration(undefined);
  };

  // Create analysis callback for MultiFileCodeViewer
  const handleAnalyze = async (
    fileName: string,
    code: string
  ): Promise<Array<Diagnostic | Suggestion>> => {
    setAnalysisStatus('analyzing');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          code,
          fileName,
          scenario: scenario.id,
          context: scenario.context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      setAnalysisStatus('idle');
      setDiagnostics(result.diagnostics || []);
      setAnalysisDuration(result.duration);

      return result.diagnostics || [];
    } catch (error) {
      console.error('[DemoApp] Analysis error:', error);
      setAnalysisStatus('error');
      return [];
    }
  };

  // Prepare files for MultiFileCodeViewer
  const allFiles: CodeFile[] = [
    {
      fileName: 'demo.tsx',
      code: scenario.code,
      description: scenario.description,
      editable: true, // Main file is editable
    },
    ...(scenario.contextFiles || []).map((file) => ({
      ...file,
      editable: false, // Context files are read-only
    })),
  ];

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
            <MultiFileCodeViewer
              key={selectedScenarioId} // Force remount on scenario change
              files={allFiles}
              diagnostics={diagnostics}
              initialFile="demo.tsx"
              enableRealTimeAnalysis={true}
              onAnalyze={handleAnalyze}
              analysisDebounceMs={300}
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
