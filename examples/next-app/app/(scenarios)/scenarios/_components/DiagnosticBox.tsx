interface DiagnosticBoxProps {
  type: 'error' | 'warning' | 'info' | 'suggestion';
  title: string;
  message: string;
  code?: string;
  fix?: string;
}

const DIAGNOSTIC_STYLES = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    title: 'text-red-700',
    text: 'text-red-600',
    icon: '✕',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    title: 'text-yellow-700',
    text: 'text-yellow-600',
    icon: '⚠',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    title: 'text-blue-700',
    text: 'text-blue-600',
    icon: 'ℹ',
  },
  suggestion: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    title: 'text-green-700',
    text: 'text-green-600',
    icon: '💡',
  },
};

export function DiagnosticBox({ type, title, message, code, fix }: DiagnosticBoxProps) {
  const styles = DIAGNOSTIC_STYLES[type];

  return (
    <div className={`rounded-lg border ${styles.border} ${styles.bg} p-4`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{styles.icon}</span>
        <div className="flex-1">
          <h3 className={`font-semibold ${styles.title} mb-1`}>{title}</h3>
          <p className={`text-sm ${styles.text} mb-2`}>{message}</p>
          {code && (
            <div className="mt-2 mb-2">
              <code
                className={`text-xs px-2 py-1 rounded ${styles.bg} border ${styles.border} font-mono`}
              >
                {code}
              </code>
            </div>
          )}
          {fix && (
            <details className="mt-3">
              <summary className={`text-sm font-medium ${styles.title} cursor-pointer`}>
                Suggested Fix
              </summary>
              <div className="mt-2 p-3 bg-white rounded border border-gray-300">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">{fix}</pre>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
