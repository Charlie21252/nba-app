import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getLeaders } from '../api/nba'
import LoadingSpinner from '../components/LoadingSpinner'
import AnimatedList from '../components/AnimatedList'

const STAT_OPTIONS = [
  { key: 'PTS', label: 'Points', color: '#f97316', desc: 'Points per game' },
  { key: 'REB', label: 'Rebounds', color: '#38bdf8', desc: 'Rebounds per game' },
  { key: 'AST', label: 'Assists', color: '#4ade80', desc: 'Assists per game' },
  { key: 'STL', label: 'Steals', color: '#a78bfa', desc: 'Steals per game' },
  { key: 'BLK', label: 'Blocks', color: '#fb7185', desc: 'Blocks per game' },
]

const PODIUM = [
  { idx: 1, rank: '2', ring: '#94a3b8', bg: 'rgba(148,163,184,0.07)', height: 240, statSize: '1.8rem' },
  { idx: 0, rank: '1', ring: '#fbbf24', bg: 'rgba(251,191,36,0.09)', height: 300, statSize: '2.4rem' },
  { idx: 2, rank: '3', ring: '#ea580c', bg: 'rgba(234,88,12,0.07)', height: 240, statSize: '1.8rem' },
]

export default function Dashboard() {
  const [stat, setStat] = useState('PTS')
  const navigate = useNavigate()
  const activeStat = STAT_OPTIONS.find((s) => s.key === stat)

  const { data, isLoading, error } = useQuery({
    queryKey: ['leaders', stat],
    queryFn: () => getLeaders(stat, '2024-25', 15).then((r) => r.data),
  })

  const top3 = data?.slice(0, 3) ?? []
  const rest = data?.slice(3) ?? []
  const leader = top3[0]

  return (
    <div className="space-y-6">

      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden rounded-2xl border border-slate-700/40 min-h-[200px] flex items-center p-8"
        style={{ background: `linear-gradient(135deg, #0f172a 0%, #1e293b 60%, ${activeStat.color}18 100%)` }}
      >
        {/* Radial glow right side */}
        <div className="absolute right-0 top-0 w-3/4 h-full pointer-events-none"
          style={{ background: `radial-gradient(ellipse at right center, ${activeStat.color}22 0%, transparent 65%)` }} />

        {/* Ghost headshot of leader */}
        {leader && (
          <img
            src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${leader.PLAYER_ID}.png`}
            alt=""
            aria-hidden="true"
            className="absolute right-0 top-0 h-full w-auto object-cover object-top opacity-[0.12] pointer-events-none select-none"
            style={{ maskImage: 'linear-gradient(to left, black 30%, transparent 85%)' }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        )}

        <div className="relative z-10 flex items-end justify-between w-full gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: activeStat.color }}>
              2024–25 NBA Season
            </p>
            <h1 className="text-5xl font-black text-white tracking-tight leading-none">
              League <span style={{ color: activeStat.color }}>Leaders</span>
            </h1>
            <p className="text-slate-400 mt-3 text-sm">{activeStat.desc} — top 15 players in the league</p>
          </div>

          {leader && (
            <div className="hidden sm:flex flex-col items-end shrink-0">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Current Leader</p>
              <p className="text-white font-bold text-base leading-tight">{leader.PLAYER}</p>
              <p className="font-black tabular-nums leading-none mt-0.5" style={{ color: activeStat.color, fontSize: '3rem' }}>
                {leader[stat]}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Stat tabs ── */}
      <div className="flex flex-wrap gap-2">
        {STAT_OPTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setStat(s.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              stat === s.key
                ? 'text-slate-900 scale-105'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
            }`}
            style={stat === s.key ? { backgroundColor: s.color, boxShadow: `0 6px 24px ${s.color}45` } : {}}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading && <LoadingSpinner text={`Fetching ${activeStat.label} leaders...`} />}
      {error && <p className="text-red-400 text-sm">Failed to load leaders.</p>}

      {data && (
        <>
          {/* ── Podium (Top 3) ── */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-3 items-end">
              {PODIUM.map(({ idx, rank, ring, bg, height, statSize }) => {
                const player = top3[idx]
                if (!player) return null
                const isCenter = idx === 0
                return (
                  <div
                    key={player.PLAYER_ID}
                    onClick={() => navigate(`/players/${player.PLAYER_ID}`)}
                    className="group relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.03]"
                    style={{
                      background: bg,
                      border: `1px solid ${ring}35`,
                      boxShadow: isCenter ? `0 0 50px ${ring}18, 0 0 0 1px ${ring}20` : `0 0 20px ${ring}10`,
                      height: `${height}px`,
                    }}
                  >
                    {/* Stat glow */}
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: `radial-gradient(ellipse at bottom, ${activeStat.color}15 0%, transparent 65%)` }} />

                    {/* Headshot */}
                    <div className="absolute inset-0 overflow-hidden">
                      <img
                        src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${player.PLAYER_ID}.png`}
                        alt={player.PLAYER}
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[85%] w-auto object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = `https://cdn.nba.com/headshots/nba/latest/260x190/${player.PLAYER_ID}.png`
                        }}
                      />
                      {/* Bottom gradient */}
                      <div className="absolute bottom-0 left-0 right-0 h-[55%]"
                        style={{ background: 'linear-gradient(to top, #0f172a 30%, transparent 100%)' }} />
                    </div>

                    {/* Top badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                      <span className={`font-black tabular-nums leading-none`} style={{ color: ring, fontSize: isCenter ? '1.6rem' : '1.2rem', opacity: 0.9 }}>#{rank}</span>
                      <div className="px-2 py-0.5 rounded-full text-[10px] font-black"
                        style={{ backgroundColor: `${ring}20`, color: ring, border: `1px solid ${ring}35` }}>
                        #{player.RANK}
                      </div>
                    </div>

                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                      <div className="flex items-baseline gap-1.5 mb-0.5">
                        <span className="font-black tabular-nums leading-none" style={{ color: activeStat.color, fontSize: statSize }}>
                          {player[stat]}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{activeStat.key}</span>
                      </div>
                      <p className={`font-bold text-white leading-tight truncate ${isCenter ? 'text-base' : 'text-sm'}`}>
                        {player.PLAYER}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">{player.TEAM} · {player.GP} GP</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Ranks 4–15 ── */}
          {rest.length > 0 && (
            <div className="rounded-2xl border border-slate-700/50 overflow-hidden" style={{ backgroundColor: 'rgba(15,23,42,0.6)' }}>
              <div className="px-5 py-3 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeStat.color }} />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Ranks 4 – 15</span>
                </div>
                <span className="text-xs text-slate-600">{activeStat.desc}</span>
              </div>

              <div style={{ height: '480px' }}>
                <AnimatedList
                  items={rest}
                  showGradients
                  enableArrowNavigation
                  displayScrollbar
                  onItemSelect={(player) => navigate(`/players/${player.PLAYER_ID}`)}
                  renderItem={(player, idx, isSelected) => {
                    const barWidth = data[0]?.[stat] ? Math.round((player[stat] / data[0][stat]) * 100) : 0
                    return (
                      <div className={`group relative flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-200 overflow-hidden ${isSelected ? 'bg-slate-800/70' : ''}`}>
                        {/* Left accent */}
                        <div className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full transition-all duration-200 ${isSelected ? 'opacity-100' : 'opacity-0'}`}
                          style={{ backgroundColor: activeStat.color }} />
                        {/* Ghost rank */}
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-7xl font-black pointer-events-none select-none"
                          style={{ color: activeStat.color, opacity: isSelected ? 0.06 : 0.025, lineHeight: 1 }}>
                          {player.RANK}
                        </span>
                        {/* Rank number */}
                        <span className={`text-xs font-black w-5 shrink-0 text-right tabular-nums ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                          {player.RANK}
                        </span>
                        {/* Headshot */}
                        <img
                          src={`https://cdn.nba.com/headshots/nba/latest/260x190/${player.PLAYER_ID}.png`}
                          alt={player.PLAYER}
                          className={`w-11 h-11 rounded-full object-cover object-top bg-slate-800 shrink-0 ring-1 transition-all duration-200 ${isSelected ? 'ring-slate-400 scale-110' : 'ring-slate-700'}`}
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                        {/* Name + bar */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className={`font-semibold text-sm truncate transition-colors ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                              {player.PLAYER}
                            </span>
                            <span className="text-slate-600 text-xs shrink-0">{player.TEAM}</span>
                          </div>
                          <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden w-full max-w-[220px]">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${barWidth}%`, backgroundColor: activeStat.color, opacity: isSelected ? 0.9 : 0.45 }}
                            />
                          </div>
                        </div>
                        {/* Stat value */}
                        <div className="shrink-0 px-3 py-1.5 rounded-xl text-sm font-black tabular-nums"
                          style={{ backgroundColor: `${activeStat.color}15`, color: activeStat.color }}>
                          {player[stat]}
                        </div>
                      </div>
                    )
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
