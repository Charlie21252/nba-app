import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/teams', label: 'Teams' },
  { to: '/stats', label: 'Player Stats' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  return (
    <nav className="bg-slate-800 border-b border-slate-700 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center gap-8">
        <Link to="/" className="text-xl font-bold text-orange-400 tracking-tight">
          NBA Analytics
        </Link>
        <div className="flex gap-4">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm font-medium px-3 py-1.5 rounded transition-colors ${
                pathname === to
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
