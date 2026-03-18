import { useState } from 'react'
import { useBets } from '../hooks/useBets'
import OddsBoard from '../components/betting/OddsBoard'
import BetTracker from '../components/betting/BetTracker'
import BankrollDashboard from '../components/betting/BankrollDashboard'
import AddBetModal from '../components/betting/AddBetModal'

const TABS = [
  { key: 'nba',  label: 'NBA',           sport: 'basketball_nba'   },
  { key: 'ncaab', label: 'March Madness', sport: 'basketball_ncaab' },
]

export default function Betting() {
  const [tab, setTab] = useState('nba')
  const [modal, setModal] = useState(null)
  const { bets, addBet, settleBet, deleteBet, stats, chartData } = useBets()

  const activeSport = TABS.find(t => t.key === tab).sport

  function openModal(prefill = {}) { setModal(prefill) }
  function closeModal() { setModal(null) }

  function handleLogBet(game) {
    openModal({ homeTeam: game.home_team, awayTeam: game.away_team, game })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400 mb-1">Betting</p>
        <h1 className="text-4xl font-black text-white tracking-tight">
          Odds & <span className="text-orange-400">Tracker</span>
        </h1>
      </div>

      {/* Sport tabs */}
      <div className="flex gap-2">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border ${
              tab === t.key
                ? 'text-slate-900 border-transparent scale-105'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700'
            }`}
            style={tab === t.key ? { backgroundColor: '#f97316', boxShadow: '0 6px 24px #f9731645' } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-slate-700/40 bg-slate-800/30 px-4 py-3 text-xs text-slate-500">
        Odds are for informational purposes only. Sports betting involves financial risk.
        Gamble responsibly. Help: <span className="text-slate-400">1-800-522-4700</span>
      </div>

      {/* Bankroll + tracker (shared across sports) */}
      <section>
        <SectionHeader>Your Bankroll</SectionHeader>
        <BankrollDashboard stats={stats} chartData={chartData} />
      </section>

      <section>
        <SectionHeader>Bet Tracker</SectionHeader>
        <BetTracker
          bets={bets}
          onSettle={settleBet}
          onDelete={deleteBet}
          onAdd={() => openModal({})}
        />
      </section>

      {/* Odds board — switches sport based on tab */}
      <section>
        <SectionHeader>
          {tab === 'nba' ? "Today's NBA Odds" : 'March Madness Odds'}
        </SectionHeader>
        {tab === 'ncaab' && (
          <div className="mb-4 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-xs text-orange-300">
            Showing NCAA Tournament (March Madness) odds. Lines update as the bracket progresses.
          </div>
        )}
        <OddsBoard onLogBet={handleLogBet} sport={activeSport} />
      </section>

      {modal !== null && (
        <AddBetModal prefill={modal} onAdd={addBet} onClose={closeModal} />
      )}
    </div>
  )
}

function SectionHeader({ children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 rounded-full bg-orange-400" />
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">{children}</h2>
    </div>
  )
}
