import { formatOdds } from '../../utils/oddsUtils'
import ConfidenceBadge from './ConfidenceBadge'

export default function RecommendationCard({ rec, onBet }) {
  const time = new Date(rec.commence_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/Chicago' })

  return (
    <div
      className="rounded-2xl border border-slate-700/50 p-5 flex flex-col gap-3"
      style={{ backgroundColor: 'rgba(15,23,42,0.8)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-slate-500 mb-1">{rec.game} · {time} CT</p>
          <p className="text-white font-bold text-base leading-tight">{rec.pick}</p>
          <p className="text-slate-400 text-xs mt-0.5 capitalize">{rec.bet_type} · {rec.bookmaker}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <ConfidenceBadge label={rec.confidence_label} score={rec.confidence} />
          <span className="text-lg font-black" style={{ color: '#f97316' }}>{formatOdds(rec.odds)}</span>
        </div>
      </div>

      {rec.edge_pct > 0 && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(rec.edge_pct * 5, 100)}%`, backgroundColor: '#f97316' }}
            />
          </div>
          <span className="text-xs text-orange-400 font-bold shrink-0">+{rec.edge_pct}% edge</span>
        </div>
      )}

      {rec.reasons?.length > 0 && (
        <ul className="space-y-1">
          {rec.reasons.map((r, i) => (
            <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
              <span className="text-slate-600 mt-0.5">›</span>
              {r}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => onBet(rec)}
        className="mt-1 w-full py-2 rounded-xl text-sm font-bold transition-all border border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
      >
        + Log This Bet
      </button>
    </div>
  )
}
