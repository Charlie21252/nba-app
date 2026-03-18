import { useState } from 'react'
import BetRow from './BetRow'

export default function BetTracker({ bets, onSettle, onDelete, onAdd }) {
  const [tab, setTab] = useState('active')

  const pending = bets.filter(b => b.status === 'pending')
  const history = bets.filter(b => b.status !== 'pending')
  const shown = tab === 'active' ? pending : history

  return (
    <div className="rounded-2xl border border-slate-700/50 overflow-hidden" style={{ backgroundColor: 'rgba(15,23,42,0.7)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80">
        <div className="flex gap-1">
          {[['active', `Active (${pending.length})`], ['history', `History (${history.length})`]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                tab === key ? 'bg-orange-500/20 text-orange-400' : 'text-slate-500 hover:text-slate-300'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={onAdd}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 transition-colors">
          + Log Bet
        </button>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-5 py-2 border-b border-slate-800/60">
        {['Status', 'Pick', 'Odds', 'Stake', 'P&L'].map(h => (
          <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div className="max-h-96 overflow-y-auto">
        {shown.length === 0 ? (
          <div className="text-center py-10 text-slate-600">
            <p>{tab === 'active' ? 'No active bets. Log one above!' : 'No settled bets yet.'}</p>
          </div>
        ) : (
          shown.map(bet => (
            <BetRow key={bet.id} bet={bet} onSettle={onSettle} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  )
}
