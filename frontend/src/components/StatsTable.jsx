export default function StatsTable({ columns, rows, keyField = 'id' }) {
  if (!rows?.length) return <p className="text-slate-400 text-sm">No data available.</p>

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row[keyField] ?? i}
              className="border-t border-slate-700 hover:bg-slate-800 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2 whitespace-nowrap text-slate-200">
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
