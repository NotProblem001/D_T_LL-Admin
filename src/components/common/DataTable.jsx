import clsx from 'clsx';

export default function DataTable({ columns, data, isLoading, onRowClick }) {
    if (isLoading) {
        return <div className="loading-state">Cargando datos...</div>;
    }

    if (!data || data.length === 0) {
        return <div className="empty-state">No hay datos para mostrar.</div>;
    }

    return (
        <div className="table-container">
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} style={{ width: col.width }}>{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            onClick={() => onRowClick && onRowClick(row)}
                            className={clsx(onRowClick && 'clickable')}
                        >
                            {columns.map((col, colIndex) => (
                                <td key={colIndex}>
                                    {col.cell ? col.cell(row) : row[col.accessor]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            <style>{`
        .table-container {
          width: 100%;
          overflow-x: auto;
          background: white;
          border-radius: 0.5rem;
          border: 1px solid var(--border);
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .data-table th {
          background-color: #f9fafb;
          padding: 0.75rem 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border);
        }

        .data-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          font-size: 0.875rem;
          color: var(--text-main);
        }

        .data-table tr:last-child td {
          border-bottom: none;
        }

        .data-table tr.clickable:hover {
          background-color: #f9fafb;
          cursor: pointer;
        }

        .loading-state, .empty-state {
          padding: 3rem;
          text-align: center;
          color: var(--text-muted);
          background: white;
          border-radius: 0.5rem;
          border: 1px solid var(--border);
        }
      `}</style>
        </div>
    );
}
