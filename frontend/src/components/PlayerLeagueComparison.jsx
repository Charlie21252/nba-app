import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ReferenceLine, Cell, ResponsiveContainer,
} from 'recharts'

// ── Stat definitions ────────────────────────────────────────────────────────

const STAT_DEFS = {
  // Normal – Individual Success
  ppg:         { label: 'PPG',          tab: 'normal', section: 'individual', fmt: v => v.toFixed(1),        desc: 'Points per game' },
  rpg:         { label: 'RPG',          tab: 'normal', section: 'individual', fmt: v => v.toFixed(1),        desc: 'Rebounds per game' },
  fg_pct:      { label: 'FG%',          tab: 'normal', section: 'individual', fmt: v => v.toFixed(1) + '%',  desc: 'Field goal percentage' },
  fg3_pct:     { label: '3P%',          tab: 'normal', section: 'individual', fmt: v => v.toFixed(1) + '%',  desc: '3-point percentage' },
  ft_pct:      { label: 'FT%',          tab: 'normal', section: 'individual', fmt: v => v.toFixed(1) + '%',  desc: 'Free throw percentage' },
  mpg:         { label: 'MPG',          tab: 'normal', section: 'individual', fmt: v => v.toFixed(1),        desc: 'Minutes per game' },
  // Normal – Team Impact
  apg:         { label: 'APG',          tab: 'normal', section: 'team',       fmt: v => v.toFixed(1),        desc: 'Assists per game' },
  spg:         { label: 'SPG',          tab: 'normal', section: 'team',       fmt: v => v.toFixed(1),        desc: 'Steals per game' },
  bpg:         { label: 'BPG',          tab: 'normal', section: 'team',       fmt: v => v.toFixed(1),        desc: 'Blocks per game' },
  stocks:      { label: 'Stocks/G',     tab: 'normal', section: 'team',       fmt: v => v.toFixed(1),        desc: 'Steals + blocks per game' },
  // Advanced – Individual Success
  ts_pct:      { label: 'TS%',          tab: 'advanced', section: 'individual', fmt: v => v.toFixed(1) + '%', desc: 'True shooting %' },
  efg_pct:     { label: 'eFG%',         tab: 'advanced', section: 'individual', fmt: v => v.toFixed(1) + '%', desc: 'Effective FG %' },
  per36_pts:   { label: 'Per-36 PTS',   tab: 'advanced', section: 'individual', fmt: v => v.toFixed(1),       desc: 'Points per 36 minutes' },
  per36_reb:   { label: 'Per-36 REB',   tab: 'advanced', section: 'individual', fmt: v => v.toFixed(1),       desc: 'Rebounds per 36 minutes' },
  // Advanced – Team Impact
  bpm:         { label: 'BPM',          tab: 'advanced', section: 'team',       fmt: v => (v >= 0 ? '+' : '') + v.toFixed(1), desc: 'Box Plus/Minus — estimated pt differential vs avg' },
  ast_to:      { label: 'AST/TO',       tab: 'advanced', section: 'team',       fmt: v => v.toFixed(2),       desc: 'Assist-to-turnover ratio' },
  versatility: { label: 'Versatility',  tab: 'advanced', section: 'team',       fmt: v => v.toFixed(1) + '/10', desc: 'Custom composite: scoring, playmaking, rebounding, defence' },
  per36_ast:   { label: 'Per-36 AST',   tab: 'advanced', section: 'team',       fmt: v => v.toFixed(1),       desc: 'Assists per 36 minutes' },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function pctColor(pct) {
  if (pct == null) return { bar: '#475569', text: 'text-slate-400', badge: 'bg-slate-700 text-slate-400' }
  if (pct >= 75)   return { bar: '#22c55e', text: 'text-green-400',  badge: 'bg-green-500/15 text-green-400' }
  if (pct >= 50)   return { bar: '#eab308', text: 'text-yellow-400', badge: 'bg-yellow-500/15 text-yellow-400' }
  return                  { bar: '#475569', text: 'text-slate-400',  badge: 'bg-slate-700/60 text-slate-400' }
}

function ordinal(n) {
  if (n == null) return '—'
  const s = ['th','st','nd','rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-slate-700/60" />
    </div>
  )
}

function PercentileBar({ statKey, def, data, onClick }) {
  const { percentile, player_value } = data ?? {}
  const col = pctColor(percentile)
  const displayVal = player_value != null ? def.fmt(player_value) : '—'

  return (
    <button
      onClick={() => onClick(statKey)}
      className="w-full text-left group hover:bg-slate-700/30 rounded-lg px-3 py-2 transition-colors"
    >
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors truncate">
          {def.label}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-white">{displayVal}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${col.badge}`}>
            {ordinal(percentile)}
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.max(0, percentile ?? 0)}%`, backgroundColor: col.bar }}
        />
      </div>
    </button>
  )
}

function DistributionModal({ statKey, def, data, playerName, onClose }) {
  if (!data?.buckets?.length) return null

  const { buckets, player_value, percentile } = data
  const col = pctColor(percentile)
  const totalPlayers = buckets.reduce((s, b) => s + b.count, 0)

  const chartData = buckets.map(b => ({
    label: b.range.split('–')[0],
    count: b.count,
    isPlayer: b.contains_player,
  }))

  const playerBucket = buckets.find(b => b.contains_player)
  const refX = playerBucket ? playerBucket.range.split('–')[0] : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 z-10 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-base font-bold text-white">{def.label} — League Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">{def.desc}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white w-8 h-8 rounded-full hover:bg-slate-700 transition-colors flex items-center justify-center text-xl shrink-0 ml-4"
          >×</button>
        </div>

        {/* Player callout */}
        <div className={`flex items-center gap-3 rounded-lg px-3 py-2 mb-4 mt-3 ${col.badge}`}>
          <span className="text-xs text-slate-300 truncate">{playerName}</span>
          <span className={`text-sm font-black ml-auto ${col.text}`}>{def.fmt(player_value)}</span>
          <span className={`text-xs font-bold ${col.text}`}>{ordinal(percentile)} pct</span>
        </div>

        {/* Histogram */}
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: '#475569', fontSize: 8 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#475569', fontSize: 8 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 8,
                fontSize: 11,
                padding: '6px 10px',
              }}
              formatter={(v) => [v + ' players', 'Count']}
              labelFormatter={(l) => `~${l}`}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isPlayer ? col.bar : '#1e293b'}
                  stroke={entry.isPlayer ? col.bar : '#334155'}
                  strokeWidth={0}
                />
              ))}
            </Bar>
            {refX !== null && (
              <ReferenceLine
                x={refX}
                stroke={col.bar}
                strokeWidth={2}
                strokeDasharray="4 3"
                label={{
                  value: def.fmt(player_value),
                  position: 'top',
                  fill: col.bar,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>

        <p className="text-center text-[10px] text-slate-600 mt-2">
          {totalPlayers} qualified NBA players (≥10 GP) · 2024-25 season
        </p>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function PlayerLeagueComparison({ data }) {
  const [activeTab, setActiveTab] = useState('normal')
  const [activeStat, setActiveStat] = useState(null)

  if (!data) return null

  const { stats, player_name, qualified_pool } = data

  const tabCls = (t) =>
    `px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ` +
    (activeTab === t
      ? 'bg-violet-600 text-white'
      : 'text-slate-400 hover:text-white hover:bg-slate-700/50')

  const sectionEntries = (tab, section) =>
    Object.entries(STAT_DEFS).filter(([, d]) => d.tab === tab && d.section === section)

  const activeStatDef  = activeStat ? STAT_DEFS[activeStat] : null
  const activeStatData = activeStat ? stats[activeStat] : null

  return (
    <div className="bg-slate-800 rounded-xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">League Comparison</h2>
        <span className="text-xs text-slate-500">{qualified_pool} players · 2024-25</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button className={tabCls('normal')}   onClick={() => setActiveTab('normal')}>Normal Stats</button>
        <button className={tabCls('advanced')} onClick={() => setActiveTab('advanced')}>Advanced Stats</button>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-slate-600">Click any stat to see full league distribution →</p>

      {/* Stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {/* Individual Success */}
        <div>
          <SectionHeader label="Individual Success" />
          <div className="space-y-0.5">
            {sectionEntries(activeTab, 'individual').map(([key, def]) => (
              <PercentileBar
                key={key}
                statKey={key}
                def={def}
                data={stats[key]}
                onClick={setActiveStat}
              />
            ))}
          </div>
        </div>

        {/* Team Impact */}
        <div>
          <SectionHeader label="Team Impact" />
          <div className="space-y-0.5">
            {sectionEntries(activeTab, 'team').map(([key, def]) => (
              <PercentileBar
                key={key}
                statKey={key}
                def={def}
                data={stats[key]}
                onClick={setActiveStat}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Distribution modal */}
      {activeStat && activeStatDef && (
        <DistributionModal
          statKey={activeStat}
          def={activeStatDef}
          data={activeStatData}
          playerName={player_name}
          onClose={() => setActiveStat(null)}
        />
      )}
    </div>
  )
}
