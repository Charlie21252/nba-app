import { useState } from 'react'
import { useOdds } from '../../hooks/useOdds'
import GameOddsCard from './GameOddsCard'
import LoadingSpinner from '../LoadingSpinner'

const LEGEND = [
  { label: 'Best Value', color: '#fbbf24', desc: 'Lowest house edge on today\'s slate. Best odds available.' },
  { label: 'Good Value', color: '#4ade80', desc: 'Below-average vig. Solid lines worth considering.' },
  { label: 'Fair',       color: '#60a5fa', desc: 'Average house edge. Nothing special, but playable.' },
]

function ScoreExplainer() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        <span className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-400">?</span>
        How is value scored?
        <span className="text-slate-600">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 space-y-3">
          <p className="text-xs text-slate-400 leading-relaxed">
            Each game is scored <span className="text-white font-semibold">0–100</span> based on how favorable the odds are <span className="text-white font-semibold">for you</span> (not the house). Games are ranked relative to today's slate — there's always exactly one <span className="text-yellow-400 font-semibold">Best Value</span> pick.
          </p>

          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">What raises the score</p>
            {[
              ['Low vig (house edge)', 'The main factor. Vig ≤ 3% is excellent, ≤ 4% is good, ≥ 7% is bad. Lower vig means you keep more of your winnings.'],
              ['+Money available', 'If either team has positive odds (e.g. +130), the underdog is priced with more value.'],
              ['Close matchup', 'When both teams are near 50/50, lines are more competitive across books.'],
              ['Tight spread/total juice', 'Juice near -110 means the book isn\'t padding extra margin on those markets.'],
            ].map(([title, detail]) => (
              <div key={title} className="flex gap-2">
                <span className="text-green-500 mt-0.5 shrink-0">+</span>
                <div>
                  <span className="text-xs text-slate-300 font-medium">{title}: </span>
                  <span className="text-xs text-slate-500">{detail}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 pt-1 border-t border-slate-700/50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Labels</p>
            {LEGEND.map(l => (
              <div key={l.label} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                <span className="text-xs font-semibold" style={{ color: l.color }}>{l.label}</span>
                <span className="text-xs text-slate-500">— {l.desc}</span>
              </div>
            ))}
            <p className="text-xs text-slate-600 pt-1">Labels are relative to today's games, not an absolute scale — so "Best Value" just means the best of what's available today.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Assign labels based on rank within today's slate (relative, not absolute)
function assignRelativeLabels(sorted) {
  return sorted.map((game, i) => {
    let value_label = null
    if (i === 0) value_label = 'Best Value'
    else if (i <= 2) value_label = 'Good Value'
    else if (i <= 4) value_label = 'Fair'
    return { ...game, value_label }
  })
}

export default function OddsBoard({ onLogBet, sport = 'basketball_nba' }) {
  const { data: games, isLoading, error, dataUpdatedAt } = useOdds('h2h,spreads,totals', sport)
  const [filter, setFilter] = useState('')

  const sorted = [...(games || [])]
    .sort((a, b) => (b.value_score ?? 0) - (a.value_score ?? 0))

  const labeled = assignRelativeLabels(sorted)

  const filtered = labeled.filter(g => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return g.home_team.toLowerCase().includes(q) || g.away_team.toLowerCase().includes(q)
  })

  const updatedTime = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter by team..."
          className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500 w-52"
        />
        {updatedTime && (
          <span className="text-xs text-slate-600">Updated {updatedTime} · auto-refreshes every 60s</span>
        )}
      </div>

      <ScoreExplainer />

      {isLoading && <LoadingSpinner text="Fetching live odds..." />}

      {error && (
        <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-6 text-center">
          <p className="text-red-400 font-semibold">Could not load odds</p>
          <p className="text-slate-500 text-sm mt-1">
            Make sure your <code className="text-slate-400">ODDS_API_KEY</code> is set in <code className="text-slate-400">backend/.env</code>
          </p>
        </div>
      )}

      {games && games.length === 0 && !isLoading && (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg font-semibold">No games scheduled today</p>
          <p className="text-sm mt-1">Check back when the slate is posted</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(game => (
          <GameOddsCard key={game.id} game={game} onLogBet={onLogBet} />
        ))}
      </div>
    </div>
  )
}
