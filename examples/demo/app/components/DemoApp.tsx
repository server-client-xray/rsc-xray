'use client';

import { useState } from 'react';
import type { Diagnostic, Suggestion } from '@rsc-xray/schemas';
import { scenarios, getScenario } from '../lib/scenarios';
import { useDeepLink, useSyncUrlOnScenarioChange } from '../lib/useDeepLink';
import { Header } from './Header';
import { SplitPanel } from './SplitPanel';
import { ExplanationPanel } from './ExplanationPanel';
import { CodeEditor } from './CodeEditor';
import { StatusBar } from './StatusBar';
import { ProModal, type ProFeature } from './ProPreview';
import { ContextTabs } from './ContextTabs';
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
  const [activeTab, setActiveTab] = useState<'main' | number>('main'); // 'main' or contextFile index
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
    setActiveTab('main'); // Reset to main tab on scenario change
  };

  const handleAnalysisComplete = (config: {
    diagnostics: Array<Diagnostic | Suggestion>;
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
            <div className={styles.rightPanelContainer}>
              {/* Tab navigation */}
              <div className={styles.tabNavigation}>
                <button
                  className={`${styles.tabButton} ${activeTab === 'main' ? styles.activeTabButton : ''}`}
                  onClick={() => setActiveTab('main')}
                >
                  demo.tsx
                </button>
                {scenario.contextFiles?.map((file, index) => (
                  <button
                    key={file.fileName}
                    className={`${styles.tabButton} ${activeTab === index ? styles.activeTabButton : ''}`}
                    onClick={() => setActiveTab(index)}
                    title={file.description}
                  >
                    {file.fileName}
                  </button>
                ))}
              </div>

              {/* Editor content */}
              <div className={styles.editorContent}>
                {activeTab === 'main' ? (
                  <CodeEditor
                    key={selectedScenarioId} // Force remount on scenario change
                    scenario={scenario}
                    highlightLine={initialParams.line}
                    onAnalysisComplete={handleAnalysisComplete}
                    diagnostics={diagnostics}
                  />
                ) : (
                  scenario.contextFiles?.[activeTab as number] && (
                    <ContextTabs
                      key={`${selectedScenarioId}-${activeTab}`} // Force remount on tab change
                      file={scenario.contextFiles[activeTab as number]}
                      diagnostics={diagnostics}
                    />
                  )
                )}
              </div>
            </div>
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
