import { formatOdds } from '../../utils/oddsUtils'

const STATUS = {
  pending: { label: 'Pending', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  won:     { label: 'Won',     color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
  lost:    { label: 'Lost',    color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  push:    { label: 'Push',    color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
}

export default function BetRow({ bet, onSettle, onDelete }) {
  const s = STATUS[bet.status] ?? STATUS.pending
  const plColor = bet.profitLoss > 0 ? '#4ade80' : bet.profitLoss < 0 ? '#f87171' : '#94a3b8'

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors group">
      {/* Status badge */}
      <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
        style={{ color: s.color, backgroundColor: s.bg }}>
        {s.label}
      </span>

      {/* Pick info */}
      <div className="flex-1 min-w-0">
        <p className="text-slate-200 text-sm font-medium truncate">{bet.pick}</p>
        <p className="text-slate-500 text-xs truncate">
          {bet.awayTeam && bet.homeTeam ? `${bet.awayTeam} @ ${bet.homeTeam}` : bet.gameDate}
          {bet.bookmaker ? ` · ${bet.bookmaker}` : ''}
        </p>
      </div>

      {/* Odds */}
      <span className="text-sm font-bold text-slate-300 shrink-0">{formatOdds(bet.odds)}</span>

      {/* Stake */}
      <span className="text-sm text-slate-400 shrink-0">${bet.stake.toFixed(2)}</span>

      {/* P&L */}
      {bet.status !== 'pending' ? (
        <span className="text-sm font-bold shrink-0 w-16 text-right" style={{ color: plColor }}>
          {bet.profitLoss >= 0 ? '+' : ''}${bet.profitLoss?.toFixed(2)}
        </span>
      ) : (
        <span className="text-xs text-slate-600 shrink-0 w-16 text-right">
          → ${bet.potentialPayout?.toFixed(2)}
        </span>
      )}

      {/* Actions */}
      {bet.status === 'pending' && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onSettle(bet.id, 'won')}
            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20">
            Won
          </button>
          <button onClick={() => onSettle(bet.id, 'lost')}
            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20">
            Lost
          </button>
          <button onClick={() => onSettle(bet.id, 'push')}
            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20">
            Push
          </button>
        </div>
      )}
      <button onClick={() => onDelete(bet.id)}
        className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-sm shrink-0"
        title="Delete">
        ×
      </button>
    </div>
  )
}
