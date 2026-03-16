export default function StatCard({ label, value, sub }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-2xl font-bold text-white">{value ?? '—'}</span>
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  )
}
