/* Minimal dependency-free horizontal bar chart for analytics. */
export default function BarChart({ data = [], color = '#1f3df5' }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <p className="text-sm text-slate-400">No data yet.</p>;
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 truncate text-slate-600" title={d.label}>{d.label}</span>
          <div className="h-4 flex-1 rounded bg-slate-100">
            <div className="h-4 rounded" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
          </div>
          <span className="w-8 text-right font-medium text-slate-700">{d.value}</span>
        </div>
      ))}
    </div>
  );
}
