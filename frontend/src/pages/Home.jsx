import { useState } from 'react'
import Dashboard from './Dashboard'
import CollegeBasketball from './CollegeBasketball'

const SPORTS = [
  { key: 'nba',  label: 'NBA',                 sub: 'League leaders & stats'       },
  { key: 'cbb',  label: 'College Basketball',   sub: 'March Madness odds & bracket' },
]

export default function Home() {
  const [sport, setSport] = useState('nba')

  return (
    <div className="space-y-6">
      {/* Sport picker */}
      <div className="flex gap-3">
        {SPORTS.map(s => (
          <button
            key={s.key}
            onClick={() => setSport(s.key)}
            className={`flex flex-col items-start px-6 py-4 rounded-2xl border text-left transition-all duration-200 ${
              sport === s.key
                ? 'border-orange-500/50 scale-[1.02]'
                : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'
            }`}
            style={sport === s.key
              ? { backgroundColor: 'rgba(249,115,22,0.1)', boxShadow: '0 0 30px #f9731620' }
              : {}
            }
          >
            <span className={`font-black text-base ${sport === s.key ? 'text-orange-400' : 'text-slate-300'}`}>
              {s.label}
            </span>
            <span className="text-xs text-slate-500 mt-0.5">{s.sub}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {sport === 'nba'  && <Dashboard />}
      {sport === 'cbb'  && <CollegeBasketball />}
    </div>
  )
}
