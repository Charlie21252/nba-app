import { useNavigate } from 'react-router-dom'
import { useOdds } from '../hooks/useOdds'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatOdds, impliedProb } from '../utils/oddsUtils'

function MarchMadnessCard({ game }) {
  const home = game.home_team
  const away = game.away_team
  const time = new Date(game.commence_time).toLocaleString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Chicago',
  })
  const mlHome = game.moneyline?.home
  const mlAway = game.moneyline?.away
  const spread = game.spread?.home
  const total = game.total?.over

  return (
    <div
      className="rounded-2xl border border-slate-700/50 p-5 space-y-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.75)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{time} CT</p>
        {game.bookmakers_count > 0 && (
          <span className="text-xs text-slate-600">{game.bookmakers_count} books</span>
        )}
      </div>

      {/* Teams */}
      <div className="space-y-3">
        {[{ name: away, ml: mlAway }, { name: home, ml: mlHome }].map(({ name, ml }) => (
          <div key={name} className="flex items-center justify-between gap-3">
            <span className="text-white font-semibold text-sm truncate">{name}</span>
            {ml && (
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-slate-500 text-xs">{Math.round(impliedProb(ml.price) * 100)}%</span>
                <span className={`font-bold text-sm w-12 text-right ${ml.price > 0 ? 'text-green-400' : 'text-slate-200'}`}>
                  {formatOdds(ml.price)}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Spread + total row */}
      {(spread || total) && (
        <div className="flex gap-3 pt-2 border-t border-slate-800/60">
          {spread && (
            <div className="flex-1 text-center">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-0.5">Spread</p>
              <p className="text-slate-300 text-sm font-bold">
                {home.split(' ').pop()} {spread.point > 0 ? `+${spread.point}` : spread.point}
              </p>
              <p className="text-slate-500 text-xs">{formatOdds(spread.price)}</p>
            </div>
          )}
          {total && (
            <div className="flex-1 text-center">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-0.5">Total</p>
              <p className="text-slate-300 text-sm font-bold">O/U {total.point}</p>
              <p className="text-slate-500 text-xs">{formatOdds(total.price)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CollegeBasketball() {
  const navigate = useNavigate()
  const { data: games, isLoading, error } = useOdds('h2h,spreads,totals', 'basketball_ncaab')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl border border-slate-700/40 min-h-[180px] flex items-center p-8"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #f9731618 100%)' }}
      >
        <div className="absolute right-0 top-0 w-2/3 h-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at right center, #f9731620 0%, transparent 65%)' }} />
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400 mb-2">NCAA Tournament</p>
          <h1 className="text-5xl font-black text-white tracking-tight leading-none">
            March <span className="text-orange-400">Madness</span>
          </h1>
          <p className="text-slate-400 mt-3 text-sm">Live tournament odds · updated every 60 seconds</p>
          <button
            onClick={() => navigate('/betting')}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 transition-colors"
          >
            Track bets → Betting page
          </button>
        </div>
      </div>

      {isLoading && <LoadingSpinner text="Fetching March Madness odds..." />}

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
          <p className="text-lg font-semibold">No tournament games available right now</p>
          <p className="text-sm mt-1">Check back when the bracket is active</p>
        </div>
      )}

      {games && games.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-orange-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {games.length} Game{games.length !== 1 ? 's' : ''} · Best Available Lines
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map(game => (
              <MarchMadnessCard key={game.id} game={game} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
