'use client';

// Simulate a large charting library
const LARGE_DATA = Array(5000)
  .fill(0)
  .map((_, i) => ({
    x: i,
    y: Math.sin(i / 100) * 100,
  }));

interface ChartComponentProps {
  title: string;
  color: string;
}

export function ChartComponent({ title, color }: ChartComponentProps): JSX.Element {
  return (
    <div className="rounded-lg border border-gray-300 p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div
        className="h-32 rounded"
        style={{
          background: `linear-gradient(135deg, ${color}20 0%, ${color}40 100%)`,
        }}
      >
        <div className="p-2 text-xs text-gray-600">
          Chart with {LARGE_DATA.length} data points (simulated heavy library)
        </div>
      </div>
    </div>
  );
}
