import { Header } from './components/Header';
import { SplitPanel } from './components/SplitPanel';
import { StatusBar } from './components/StatusBar';
import styles from './page.module.css';

export default function HomePage(): JSX.Element {
  return (
    <div className={styles.app}>
      <Header showUpgradeCTA={true} />

      <main className={styles.main}>
        <SplitPanel
          leftPanel={
            <div className={styles.placeholder}>
              <h2>Explanation Panel</h2>
              <p>Rule explanation will appear here</p>
            </div>
          }
          rightPanel={
            <div className={styles.placeholder}>
              <h2>Code Editor Panel</h2>
              <p>CodeMirror editor will appear here</p>
            </div>
          }
        />
      </main>

      <StatusBar status="idle" diagnosticsCount={0} />
    </div>
  );
}
