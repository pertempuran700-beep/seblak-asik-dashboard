export default function Table({ columns, rows, emptyMessage = 'Belum ada data' }) {
  if (!rows || rows.length === 0) {
    return <p className="text-textmuted text-sm text-center py-8">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.08]">
            {columns.map((col) => (
              <th key={col.key} className="text-left text-xs text-textmuted font-normal py-2.5 px-3 whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-smooth">
              {columns.map((col) => (
                <td key={col.key} className="py-3 px-3 text-text whitespace-nowrap">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
