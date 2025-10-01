'use client';

// Simulate another large library that depends on same core utilities
const LARGE_DATA = Array(3000)
  .fill(0)
  .map((_, i) => ({
    id: i,
    name: `Item ${i}`,
    value: Math.random() * 1000,
  }));

interface TableComponentProps {
  title: string;
}

export function TableComponent({ title }: TableComponentProps) {
  return (
    <div className="rounded-lg border border-gray-300 p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left p-1">ID</th>
              <th className="text-left p-1">Name</th>
              <th className="text-right p-1">Value</th>
            </tr>
          </thead>
          <tbody>
            {LARGE_DATA.slice(0, 5).map((row) => (
              <tr key={row.id} className="border-b">
                <td className="p-1">{row.id}</td>
                <td className="p-1">{row.name}</td>
                <td className="text-right p-1">{row.value.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 text-xs text-gray-600">
          ...and {LARGE_DATA.length - 5} more rows (simulated heavy library)
        </div>
      </div>
    </div>
  );
}
