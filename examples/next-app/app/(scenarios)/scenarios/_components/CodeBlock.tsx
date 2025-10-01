interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  highlightLines?: number[];
}

export function CodeBlock({
  code,
  language = 'typescript',
  title,
  highlightLines = [],
}: CodeBlockProps): JSX.Element {
  const lines = code.split('\n');

  return (
    <div className="rounded-lg border border-gray-300 bg-gray-50 overflow-hidden">
      {title && (
        <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-sm">
        <code className={`language-${language}`}>
          {lines.map((line, idx) => (
            <div
              key={idx}
              className={highlightLines.includes(idx + 1) ? 'bg-red-100' : ''}
              style={{
                padding: '0 0.5rem',
                margin: '0 -0.5rem',
              }}
            >
              <span className="inline-block w-8 text-right text-gray-400 select-none mr-4">
                {idx + 1}
              </span>
              {line}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
