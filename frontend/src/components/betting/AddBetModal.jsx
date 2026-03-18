import { useState } from 'react'
import { calcPayout, formatOdds } from '../../utils/oddsUtils'

function buildPickOptions(game) {
  if (!game) return []
  const home = game.home_team
  const away = game.away_team
  const opts = []

  // Moneyline
  if (game.moneyline?.away?.price != null)
    opts.push({ group: 'Moneyline', label: `${away} to win`, sublabel: formatOdds(game.moneyline.away.price), odds: game.moneyline.away.price, pick: `${away} ML`, betType: 'moneyline', bookmaker: game.moneyline.away.bookmaker })
  if (game.moneyline?.home?.price != null)
    opts.push({ group: 'Moneyline', label: `${home} to win`, sublabel: formatOdds(game.moneyline.home.price), odds: game.moneyline.home.price, pick: `${home} ML`, betType: 'moneyline', bookmaker: game.moneyline.home.bookmaker })

  // Spread
  const asp = game.spread?.away
  const hsp = game.spread?.home
  if (asp?.price != null)
    opts.push({ group: 'Spread', label: `${away} ${asp.point > 0 ? '+' : ''}${asp.point}`, sublabel: formatOdds(asp.price), odds: asp.price, pick: `${away} ${asp.point > 0 ? '+' : ''}${asp.point}`, betType: 'spread', bookmaker: asp.bookmaker })
  if (hsp?.price != null)
    opts.push({ group: 'Spread', label: `${home} ${hsp.point > 0 ? '+' : ''}${hsp.point}`, sublabel: formatOdds(hsp.price), odds: hsp.price, pick: `${home} ${hsp.point > 0 ? '+' : ''}${hsp.point}`, betType: 'spread', bookmaker: hsp.bookmaker })

  // Total
  const ov = game.total?.over
  const un = game.total?.under
  if (ov?.price != null)
    opts.push({ group: 'Total', label: `Over ${ov.point}`, sublabel: formatOdds(ov.price), odds: ov.price, pick: `Over ${ov.point}`, betType: 'total', bookmaker: ov.bookmaker })
  if (un?.price != null)
    opts.push({ group: 'Total', label: `Under ${un.point}`, sublabel: formatOdds(un.price), odds: un.price, pick: `Under ${un.point}`, betType: 'total', bookmaker: un.bookmaker })

  return opts
}

export default function AddBetModal({ prefill = {}, onAdd, onClose }) {
  const game = prefill.game || null
  const pickOptions = buildPickOptions(game)

  const [form, setForm] = useState({
    homeTeam: prefill.homeTeam || prefill.home_team || '',
    awayTeam: prefill.awayTeam || prefill.away_team || '',
    betType: prefill.bet_type || prefill.betType || 'moneyline',
    pick: prefill.pick || '',
    odds: prefill.odds != null ? String(prefill.odds) : '',
    stake: '',
    bookmaker: prefill.bookmaker || '',
    notes: '',
    fromRecommendation: Boolean(prefill.confidence),
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  function selectPick(opt) {
    setForm(f => ({ ...f, pick: opt.pick, odds: String(opt.odds), betType: opt.betType, bookmaker: opt.bookmaker || f.bookmaker }))
  }

  const odds = Number(form.odds)
  const stake = Number(form.stake)
  const payout = odds && stake ? calcPayout(stake, odds) : null
  const profit = payout ? payout - stake : null

  function submit(e) {
    e.preventDefault()
    if (!form.odds || !form.stake || !form.pick) return
    onAdd({ ...form, odds: Number(form.odds), stake: Number(form.stake), gameDate: new Date().toISOString().slice(0, 10) })
    onClose()
  }

  const groups = [...new Set(pickOptions.map(o => o.group))]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-md rounded-2xl border border-slate-700 p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#0f172a' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-bold text-lg">Log a Bet</h2>
            {form.awayTeam && form.homeTeam && (
              <p className="text-slate-500 text-xs mt-0.5">{form.awayTeam} @ {form.homeTeam}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={submit} className="space-y-5">

          {/* Pick buttons (when game data is available) */}
          {pickOptions.length > 0 ? (
            <div>
              <label className="text-xs text-slate-500 mb-2 block">Your Pick *</label>
              <div className="space-y-3">
                {groups.map(group => (
                  <div key={group}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1.5">{group}</p>
                    <div className="flex gap-2 flex-wrap">
                      {pickOptions.filter(o => o.group === group).map(opt => {
                        const selected = form.pick === opt.pick
                        return (
                          <button
                            key={opt.pick}
                            type="button"
                            onClick={() => selectPick(opt)}
                            className={`flex flex-col items-center px-4 py-2.5 rounded-xl border text-left transition-all ${
                              selected
                                ? 'border-orange-500/60 scale-[1.03]'
                                : 'border-slate-700 bg-slate-800/60 hover:border-slate-600'
                            }`}
                            style={selected ? { backgroundColor: 'rgba(249,115,22,0.12)', boxShadow: '0 0 16px rgba(249,115,22,0.2)' } : {}}
                          >
                            <span className={`text-sm font-bold ${selected ? 'text-orange-400' : 'text-slate-200'}`}>{opt.label}</span>
                            <span className={`text-xs font-semibold mt-0.5 ${opt.odds > 0 ? 'text-green-400' : 'text-slate-400'}`}>{opt.sublabel}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {!form.pick && <p className="text-xs text-slate-600 mt-1">Tap a pick above to select it</p>}
            </div>
          ) : (
            /* Fallback text input for manual entry */
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Your Pick *</label>
              <input value={form.pick} onChange={e => set('pick', e.target.value)} required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-500"
                placeholder="e.g. Warriors -2.5 or Over 224.5" />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Away Team</label>
                  <input value={form.awayTeam} onChange={e => set('awayTeam', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-500"
                    placeholder="e.g. Celtics" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Home Team</label>
                  <input value={form.homeTeam} onChange={e => set('homeTeam', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-500"
                    placeholder="e.g. Warriors" />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs text-slate-500 mb-1 block">Odds (American)</label>
                <input value={form.odds} onChange={e => set('odds', e.target.value)} type="number"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-500"
                  placeholder="-110" />
              </div>
            </div>
          )}

          {/* Stake */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Stake ($) *</label>
            <input value={form.stake} onChange={e => set('stake', e.target.value)} required type="number" min="0.01" step="0.01"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-500"
              placeholder="50" />
          </div>

          {/* Payout preview */}
          {payout && (
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 px-4 py-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Stake</span>
                <span className="text-slate-300">${stake.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Profit if win</span>
                <span className="text-green-400 font-semibold">+${profit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-slate-700/50 pt-1.5">
                <span className="text-slate-400 font-medium">Total payout</span>
                <span className="text-white font-bold">${payout.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Bookmaker */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Bookmaker</label>
            <input value={form.bookmaker} onChange={e => set('bookmaker', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-500"
              placeholder="DraftKings, FanDuel…" />
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-500 resize-none"
              placeholder="Optional notes..." />
          </div>

          <button type="submit" disabled={!form.pick || !form.stake}
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)' }}>
            Save Bet
          </button>
        </form>
      </div>
    </div>
  )
}
