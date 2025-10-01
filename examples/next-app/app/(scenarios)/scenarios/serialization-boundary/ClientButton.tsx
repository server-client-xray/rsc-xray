'use client';

import { useEffect, useState } from 'react';

interface ClientButtonProps {
  onClick: () => void;
  label: string;
  timestamp: Date;
}

export function ClientButton({ onClick, label, timestamp }: ClientButtonProps) {
  const [clickResult, setClickResult] = useState<string>('');
  const [timestampInfo, setTimestampInfo] = useState<string>('');

  useEffect(() => {
    // Demonstrate what happened to the props during serialization
    const onClickType = typeof onClick;
    const timestampType = typeof timestamp;
    const hasToISOString = timestamp && typeof timestamp.toISOString === 'function';

    setTimestampInfo(
      `Type: ${timestampType}${hasToISOString ? ', has .toISOString()' : ', missing .toISOString()'}`
    );

    console.log('Props received on client:');
    console.log('  onClick:', onClickType, onClick);
    console.log('  timestamp:', timestampType, timestamp);
    console.log('  timestamp.toISOString:', typeof timestamp?.toISOString);
  }, [onClick, timestamp]);

  const handleClick = () => {
    if (typeof onClick === 'function') {
      try {
        onClick();
        setClickResult('✓ Function executed');
      } catch (e) {
        setClickResult(`✗ Error: ${e}`);
      }
    } else {
      setClickResult(`✗ onClick is ${typeof onClick}, not a function!`);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-gray-300 bg-white p-4">
      <div className="text-sm">
        <strong>Prop Analysis:</strong>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-gray-600">
          <li>
            onClick: <code className="text-red-600">{typeof onClick}</code>
            {typeof onClick !== 'function' && ' (should be function!)'}
          </li>
          <li>
            timestamp: <code className="text-red-600">{timestampInfo}</code>
          </li>
        </ul>
      </div>
      <button
        onClick={handleClick}
        className="rounded bg-blue-500 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
      >
        {label}
      </button>
      {clickResult && (
        <div
          className={`rounded p-2 text-xs ${
            clickResult.startsWith('✓') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {clickResult}
        </div>
      )}
    </div>
  );
}
