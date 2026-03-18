import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'

function StatCard({ label, value, color = '#f97316' }) {
  return (
    <div className="rounded-2xl border border-slate-700/50 p-4" style={{ backgroundColor: 'rgba(15,23,42,0.7)' }}>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-black" style={{ color }}>{value ?? '—'}</p>
    </div>
  )
}

export default function BankrollDashboard({ stats, chartData }) {
  const { wins, losses, settled, netPL, winRate, roi } = stats

  const netColor = netPL > 0 ? '#4ade80' : netPL < 0 ? '#f87171' : '#94a3b8'
  const roiColor = parseFloat(roi) > 0 ? '#4ade80' : parseFloat(roi) < 0 ? '#f87171' : '#94a3b8'

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Record" value={settled ? `${wins}-${losses}` : '—'} color="#94a3b8" />
        <StatCard label="Win Rate" value={winRate ? `${winRate}%` : '—'} color={winRate >= 52.4 ? '#4ade80' : '#f87171'} />
        <StatCard label="Net P&L" value={settled ? `${netPL >= 0 ? '+' : ''}$${netPL.toFixed(2)}` : '—'} color={netColor} />
        <StatCard label="ROI" value={roi ? `${roi}%` : '—'} color={roiColor} />
      </div>

      {/* P&L chart */}
      {chartData.length > 1 && (
        <div className="rounded-2xl border border-slate-700/50 p-5" style={{ backgroundColor: 'rgba(15,23,42,0.7)' }}>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Cumulative P&L</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="plGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false}
                tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8', fontSize: 12 }}
                formatter={v => [`$${v.toFixed(2)}`, 'Cumulative P&L']}
              />
              <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 2" />
              <Area type="monotone" dataKey="cumulative" stroke="#f97316" strokeWidth={2}
                fill="url(#plGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
