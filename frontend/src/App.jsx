import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MdSportsBasketball } from 'react-icons/md'
import { BsLock, BsUnlock } from 'react-icons/bs'
import Aurora from './components/Aurora'
import Dock from './components/Dock'
import PlayerStats from './pages/PlayerStats'
import PlayerDetail from './pages/PlayerDetail'
import Betting from './pages/Betting'

const BETTING_PASSWORD = 'SorryBruh123'
const SESSION_KEY = 'betting_unlocked'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
})

// ── Password modal ─────────────────────────────────────────────────────────

function LockModal({ onSuccess, onClose }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  function attempt() {
    if (value === BETTING_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onSuccess()
    } else {
      setError(true)
      setShake(true)
      setValue('')
      setTimeout(() => setShake(false), 500)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') attempt()
    if (e.key === 'Escape') onClose()
    if (error) setError(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-8 z-10 shadow-2xl space-y-5 transition-transform ${shake ? 'animate-shake' : ''}`}
      >
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <BsLock size={26} className="text-slate-300" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-white">Betting Locked</h2>
          <p className="text-sm text-slate-400">Enter the password to access betting odds & tracker</p>
        </div>
        <div className="space-y-2">
          <input
            autoFocus
            type="password"
            value={value}
            onChange={e => { setValue(e.target.value); setError(false) }}
            onKeyDown={handleKey}
            placeholder="Password"
            className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors placeholder:text-slate-600 ${
              error ? 'border-red-500/70 focus:border-red-500' : 'border-slate-700 focus:border-violet-500'
            }`}
          />
          {error && <p className="text-xs text-red-400 text-center">Incorrect password — try again</p>}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={attempt}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors text-sm font-bold"
          >
            Unlock
          </button>
        </div>
      </div>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0) }
          20%      { transform: translateX(-8px) }
          40%      { transform: translateX(8px) }
          60%      { transform: translateX(-6px) }
          80%      { transform: translateX(6px) }
        }
        .animate-shake { animation: shake 0.4s ease; }
      `}</style>
    </div>
  )
}

// ── Route guard ────────────────────────────────────────────────────────────

function BettingGuard() {
  if (sessionStorage.getItem(SESSION_KEY) === '1') return <Betting />
  return <Navigate to="/" replace />
}

// ── App layout ────────────────────────────────────────────────────────────

function AppLayout() {
  const navigate = useNavigate()
  const [showLock, setShowLock] = useState(false)
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1')

  useEffect(() => {
    const sync = () => setUnlocked(sessionStorage.getItem(SESSION_KEY) === '1')
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  function handleBettingClick() {
    if (unlocked) navigate('/betting')
    else setShowLock(true)
  }

  function onUnlocked() {
    setUnlocked(true)
    setShowLock(false)
    navigate('/betting')
  }

  const dockItems = [
    { icon: <MdSportsBasketball size={24} />, label: 'Stats',   onClick: () => navigate('/') },
    {
      icon: unlocked ? <BsUnlock size={22} /> : <BsLock size={22} />,
      label: 'Betting',
      onClick: handleBettingClick,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <Aurora colorStops={["#7cff67", "#B19EEF", "#5227FF"]} blend={0.5} amplitude={1.0} speed={1} />
      </div>
      <div className="relative z-10">
        <main className="max-w-7xl mx-auto px-4 py-6 pl-28">
          <Routes>
            <Route path="/" element={<PlayerStats />} />
            <Route path="/players/:id" element={<PlayerDetail />} />
            <Route path="/betting" element={<BettingGuard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <Dock items={dockItems} panelWidth={88} baseItemSize={68} magnification={95} />
      {showLock && <LockModal onSuccess={onUnlocked} onClose={() => setShowLock(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
