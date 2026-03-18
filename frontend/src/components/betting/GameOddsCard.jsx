import { formatOdds, impliedProb, vigLabel } from '../../utils/oddsUtils'

const VALUE_STYLES = {
  'Best Value': { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', glow: '0 0 20px rgba(251,191,36,0.15)' },
  'Good Value': { color: '#4ade80', bg: 'rgba(74,222,128,0.10)', border: 'rgba(74,222,128,0.25)', glow: 'none' },
  'Fair':       { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)',  glow: 'none' },
}

function OddsCell({ price, point }) {
  if (!price) return <div className="text-slate-600 text-xs">—</div>
  return (
    <div className="flex flex-col items-center">
      {point != null && <span className="text-slate-400 text-xs">{point > 0 ? `+${point}` : point}</span>}
      <span className={`font-bold text-sm ${price > 0 ? 'text-green-400' : 'text-slate-200'}`}>
        {formatOdds(price)}
      </span>
      <span className="text-slate-600 text-[10px]">{Math.round(impliedProb(price) * 100)}%</span>
    </div>
  )
}

export default function GameOddsCard({ game, onLogBet }) {
  const home = game.home_team
  const away = game.away_team
  const time = new Date(game.commence_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/Chicago' })
  const vig = vigLabel(game.moneyline?.home?.price, game.moneyline?.away?.price)
  const valueLabel = game.value_label
  const vs = VALUE_STYLES[valueLabel]

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        backgroundColor: 'rgba(15,23,42,0.7)',
        borderColor: vs ? vs.border : 'rgba(51,65,85,0.5)',
        boxShadow: vs ? vs.glow : 'none',
      }}
    >
      {/* Value banner */}
      {vs && (
        <div className="flex items-center gap-2 px-4 py-1.5" style={{ backgroundColor: vs.bg }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: vs.color }} />
          <span className="text-xs font-bold" style={{ color: vs.color }}>{valueLabel}</span>
          <span className="text-xs ml-auto" style={{ color: vs.color, opacity: 0.6 }}>
            Score {game.value_score}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
        <div>
          <p className="text-white font-semibold text-sm">{away} <span className="text-slate-500">@</span> {home}</p>
          <p className="text-slate-500 text-xs mt-0.5">{time} CT · {game.bookmakers_count} books</p>
        </div>
        {vig && (
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
            Vig {vig}
          </span>
        )}
      </div>

      {/* Odds grid */}
      <div className="grid grid-cols-4 gap-0 text-center">
        {['', 'Moneyline', 'Spread', 'Total'].map(h => (
          <div key={h} className="px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 border-b border-slate-800/60">
            {h}
          </div>
        ))}

        <div className="px-3 py-3 flex items-center border-b border-slate-800/40">
          <span className="text-slate-300 text-sm font-medium truncate">{away}</span>
        </div>
        <div className="px-3 py-3 border-b border-slate-800/40 flex justify-center items-center">
          <OddsCell price={game.moneyline?.away?.price} />
        </div>
        <div className="px-3 py-3 border-b border-slate-800/40 flex justify-center items-center">
          <OddsCell price={game.spread?.away?.price} point={game.spread?.away?.point} />
        </div>
        <div className="px-3 py-3 border-b border-slate-800/40 flex justify-center items-center">
          <OddsCell price={game.total?.over?.price} point={game.total?.over?.point} />
        </div>

        <div className="px-3 py-3 flex items-center">
          <span className="text-slate-300 text-sm font-medium truncate">{home}</span>
        </div>
        <div className="px-3 py-3 flex justify-center items-center">
          <OddsCell price={game.moneyline?.home?.price} />
        </div>
        <div className="px-3 py-3 flex justify-center items-center">
          <OddsCell price={game.spread?.home?.price} point={game.spread?.home?.point} />
        </div>
        <div className="px-3 py-3 flex justify-center items-center">
          <OddsCell price={game.total?.under?.price} point={game.total?.under?.point} />
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-slate-800/60 flex items-center justify-between gap-3">
        {vig && (() => {
          const v = parseFloat(vig)
          const dollarsPerHundred = v.toFixed(2)
          const isGood = v <= 4
          return (
            <span className="text-xs text-slate-600 leading-tight" title={`The bookmaker keeps ~$${dollarsPerHundred} of every $100 wagered on this game`}>
              Book keeps{' '}
              <span className={`font-semibold ${isGood ? 'text-green-500' : 'text-slate-400'}`}>
                ~${dollarsPerHundred}
              </span>
              {' '}per $100 bet{isGood ? ' ✓' : ''}
            </span>
          )
        })()}
        <button
          onClick={() => onLogBet(game)}
          className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg border border-slate-700 transition-colors ml-auto shrink-0"
        >
          + Log Bet
        </button>
      </div>
    </div>
  )
}
