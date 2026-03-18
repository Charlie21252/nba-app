const CONFIG = {
  Strong: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '#fbbf2440', glow: '0 0 12px #fbbf2440' },
  High:   { bg: 'rgba(249,115,22,0.15)', color: '#f97316', border: '#f9731640', glow: 'none' },
  Medium: { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '#818cf840', glow: 'none' },
  Low:    { bg: 'rgba(100,116,139,0.1)', color: '#64748b', border: '#33415550', glow: 'none' },
}

export default function ConfidenceBadge({ label, score }) {
  const c = CONFIG[label] ?? CONFIG.Low
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, boxShadow: c.glow }}
    >
      {label === 'Strong' && '★ '}
      {label} {score != null && `· ${score}`}
    </span>
  )
}
