import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Navbar from './components/Navbar'
import Aurora from './components/Aurora'
import Dashboard from './pages/Dashboard'
import PlayerDetail from './pages/PlayerDetail'
import Teams from './pages/Teams'
import TeamDetail from './pages/TeamDetail'
import PlayerStats from './pages/PlayerStats'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-900 text-slate-100 relative">
          <div className="fixed inset-0 pointer-events-none z-0">
            <Aurora
              colorStops={["#7cff67", "#B19EEF", "#5227FF"]}
              blend={0.5}
              amplitude={1.0}
              speed={1}
            />
          </div>
          <div className="relative z-10">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/players/:id" element={<PlayerDetail />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/teams/:id" element={<TeamDetail />} />
              <Route path="/stats" element={<PlayerStats />} />
            </Routes>
          </main>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
