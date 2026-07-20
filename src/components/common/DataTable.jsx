import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

/**
 * Tabla con ordenamiento por columna. Una columna es ordenable si define
 * `accessor`, `sortKey` (campo del row) o `sortValue` (fn(row) => valor).
 * Clic en el encabezado alterna ascendente → descendente.
 */
export default function DataTable({ columns, data, isLoading, onRowClick }) {
    const [sort, setSort] = useState(null); // { index, dir: 'asc' | 'desc' }

    const esOrdenable = (col) => Boolean(col.accessor || col.sortKey || col.sortValue);

    const valorDe = (row, col) => {
        if (col.sortValue) return col.sortValue(row);
        return row[col.sortKey || col.accessor];
    };

    const ordenados = useMemo(() => {
        if (!sort || !data) return data;
        const col = columns[sort.index];
        if (!col || !esOrdenable(col)) return data;
        const factor = sort.dir === 'asc' ? 1 : -1;
        return [...data].sort((a, b) => {
            const va = valorDe(a, col);
            const vb = valorDe(b, col);
            if (va == null && vb == null) return 0;
            if (va == null) return 1;  // vacíos siempre al final
            if (vb == null) return -1;
            if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor;
            if (typeof va === 'boolean' && typeof vb === 'boolean') return ((va ? 1 : 0) - (vb ? 1 : 0)) * factor;
            return String(va).localeCompare(String(vb), 'es', { numeric: true, sensitivity: 'base' }) * factor;
        });
    }, [data, sort, columns]);

    const alternarOrden = (index) => {
        setSort((prev) => {
            if (!prev || prev.index !== index) return { index, dir: 'asc' };
            if (prev.dir === 'asc') return { index, dir: 'desc' };
            return null; // tercer clic: vuelve al orden original
        });
    };

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
                        {columns.map((col, index) => {
                            const ordenable = esOrdenable(col) && col.header;
                            const activo = sort?.index === index;
                            return (
                                <th
                                    key={index}
                                    style={{ width: col.width }}
                                    onClick={ordenable ? () => alternarOrden(index) : undefined}
                                    className={clsx(ordenable && 'sortable', activo && 'sorted')}
                                    title={ordenable ? 'Ordenar' : undefined}
                                >
                                    <span className="th-content">
                                        {col.header}
                                        {ordenable && (
                                            activo
                                                ? (sort.dir === 'asc'
                                                    ? <ChevronUp size={13} />
                                                    : <ChevronDown size={13} />)
                                                : <ChevronsUpDown size={13} className="sort-hint" />
                                        )}
                                    </span>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {ordenados.map((row, rowIndex) => (
                        <tr
                            key={row.id ?? rowIndex}
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
          user-select: none;
        }

        .data-table th.sortable {
          cursor: pointer;
        }

        .data-table th.sortable:hover {
          color: var(--primary);
        }

        .data-table th.sorted {
          color: var(--primary);
        }

        .th-content {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .sort-hint {
          opacity: 0.35;
        }

        .data-table th.sortable:hover .sort-hint {
          opacity: 0.8;
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
