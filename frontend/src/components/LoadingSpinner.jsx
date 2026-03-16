export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
      <div className="w-8 h-8 border-4 border-slate-600 border-t-orange-400 rounded-full animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  )
}
