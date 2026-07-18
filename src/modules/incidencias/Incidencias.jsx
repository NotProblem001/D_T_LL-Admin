import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Drawer from '../../components/common/Drawer';
import { listarIncidencias, actualizarIncidencia } from '../../services/api';
import { Campo, ErrorBox, inputClass } from '../maestros/shared';

const ESTADOS = {
    ABIERTA: { texto: 'Abierta', clase: 'bg-red-50 text-red-700' },
    EN_GESTION: { texto: 'En gestión', clase: 'bg-amber-50 text-amber-700' },
    CERRADA: { texto: 'Cerrada', clase: 'bg-green-50 text-green-700' },
};

export default function Incidencias() {
    const [incidencias, setIncidencias] = useState([]);
    const [filtroEstado, setFiltroEstado] = useState('ABIERTA');
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [gestionando, setGestionando] = useState(null);
    const [nuevoEstado, setNuevoEstado] = useState('EN_GESTION');
    const [accion, setAccion] = useState('');
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            setIncidencias(await listarIncidencias(filtroEstado ? { estado: filtroEstado } : {}));
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudieron cargar las incidencias.');
        } finally {
            setCargando(false);
        }
    }, [filtroEstado]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const abrirGestion = (inc) => {
        setGestionando(inc);
        setNuevoEstado(inc.estado === 'ABIERTA' ? 'EN_GESTION' : 'CERRADA');
        setAccion(inc.accionRealizada || '');
    };

    const guardar = async (e) => {
        e.preventDefault();
        setGuardando(true);
        setError('');
        try {
            await actualizarIncidencia(gestionando.id, { estado: nuevoEstado, accionRealizada: accion });
            setGestionando(null);
            await cargar();
        } catch (err) {
            setError(err.response?.data?.error || 'No se pudo actualizar la incidencia.');
        } finally {
            setGuardando(false);
        }
    };

    const columns = [
        {
            header: 'Fecha',
            width: '140px',
            cell: (row) => new Date(row.createdAt).toLocaleString('es-CL', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
            }),
        },
        { header: 'Tipo', width: '170px', cell: (row) => <span className="font-medium">{row.tipo}</span> },
        {
            header: 'Detalle',
            cell: (row) => (
                <div>
                    <div>{row.descripcion}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                        {[row.viajeDescripcion, row.pasajeroNombre && `Pasajero: ${row.pasajeroNombre}`,
                          row.conductorNombre && `Conductor: ${row.conductorNombre}`,
                          row.vehiculoPatente && `Vehículo: ${row.vehiculoPatente}`]
                            .filter(Boolean).join(' · ')}
                    </div>
                    {row.accionRealizada && (
                        <div className="text-xs text-green-700 mt-0.5">Acción: {row.accionRealizada}</div>
                    )}
                </div>
            ),
        },
        { header: 'Reportó', width: '100px', cell: (row) => row.reportadoRol || '—' },
        {
            header: 'Estado',
            width: '110px',
            cell: (row) => {
                const e = ESTADOS[row.estado] || ESTADOS.ABIERTA;
                return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${e.clase}`}>{e.texto}</span>;
            },
        },
        {
            header: '',
            width: '90px',
            cell: (row) => row.estado !== 'CERRADA' && (
                <button
                    onClick={(e) => { e.stopPropagation(); abrirGestion(row); }}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Check size={13} /> Gestionar
                </button>
            ),
        },
    ];

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                        <AlertTriangle className="text-blue-600" /> Incidencias
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Reportes de conductores y operación asociados a recorridos, pasajeros y vehículos.
                    </p>
                </div>
                <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="border rounded-lg p-2 text-sm"
                >
                    <option value="ABIERTA">Abiertas</option>
                    <option value="EN_GESTION">En gestión</option>
                    <option value="CERRADA">Cerradas</option>
                    <option value="">Todas</option>
                </select>
            </div>

            <ErrorBox mensaje={error} />
            <DataTable columns={columns} data={incidencias} isLoading={cargando} onRowClick={abrirGestion} />

            <Drawer
                isOpen={Boolean(gestionando)}
                onClose={() => setGestionando(null)}
                title="Gestionar incidencia"
            >
                {gestionando && (
                    <form onSubmit={guardar}>
                        <p className="text-sm text-gray-600 mb-4">
                            <span className="font-medium">{gestionando.tipo}</span> — {gestionando.descripcion}
                        </p>
                        <Campo label="Estado">
                            <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)} className={inputClass}>
                                <option value="EN_GESTION">En gestión</option>
                                <option value="CERRADA">Cerrada</option>
                            </select>
                        </Campo>
                        <Campo label="Acción realizada">
                            <textarea
                                value={accion}
                                onChange={(e) => setAccion(e.target.value)}
                                rows={3}
                                className={inputClass}
                            />
                        </Campo>
                        <button
                            type="submit"
                            disabled={guardando}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                        >
                            {guardando ? 'Guardando…' : 'Guardar'}
                        </button>
                    </form>
                )}
            </Drawer>
        </div>
    );
}
