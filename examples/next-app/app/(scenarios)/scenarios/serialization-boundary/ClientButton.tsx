'use client';

interface ClientButtonProps {
  onClick: () => void;
  label: string;
  timestamp: Date;
}

export function ClientButton({ onClick, label, timestamp }: ClientButtonProps) {
  return (
    <button
      onClick={onClick}
      className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
    >
      {label} - {timestamp.toISOString()}
    </button>
  );
}
