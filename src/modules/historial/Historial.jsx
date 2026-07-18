import { useCallback, useEffect, useState } from 'react';
import { History, Search, ScrollText } from 'lucide-react';
import clsx from 'clsx';
import DataTable from '../../components/common/DataTable';
import Drawer from '../../components/common/Drawer';
import {
    obtenerEmpresas,
    buscarHistorialViajes,
    detalleHistorialViaje,
    listarAuditoria,
    listarConductores,
    vehiculosApi,
    rutasApi,
} from '../../services/api';
import { Campo, ErrorBox, inputClass } from '../maestros/shared';
import { useAuth } from '../../context/useAuth';

const JORNADAS = { MANANA: 'Mañana', TARDE: 'Tarde', NOCHE: 'Noche' };
const TIPOS = { ENTRADA: 'Entrada', SALIDA: 'Salida' };
const ESTADOS = {
    BORRADOR: 'Borrador', PROGRAMADO: 'Programado', ASIGNADO: 'Asignado',
    CONFIRMADO: 'Confirmado', EN_CURSO: 'En curso', FINALIZADO: 'Finalizado',
    CANCELADO: 'Cancelado', REPROGRAMADO: 'Reprogramado',
};

const hora = (v) => (v ? v.slice(0, 5) : '—');
const fechaHora = (v) => (v ? new Date(v).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
}) : '—');

export default function Historial() {
    const { user } = useAuth();
    const hoy = new Date().toISOString().slice(0, 10);
    const haceUnMes = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    const [tab, setTab] = useState('recorridos');
    const [empresas, setEmpresas] = useState([]);
    const [conductores, setConductores] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [rutas, setRutas] = useState([]);

    const [filtros, setFiltros] = useState({
        empresaId: '', desde: haceUnMes, hasta: hoy, conductorId: '',
        vehiculoId: '', rutaId: '', jornada: '', tipoTrayecto: '', estado: '',
    });
    const [viajes, setViajes] = useState([]);
    const [detalle, setDetalle] = useState(null);
    const [auditoria, setAuditoria] = useState([]);
    const [moduloAudit, setModuloAudit] = useState('');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        obtenerEmpresas().then((es) => {
            setEmpresas(es);
            if (es.length === 1) setFiltros((f) => ({ ...f, empresaId: es[0].id }));
        }).catch(() => setEmpresas([]));
        listarConductores().then(setConductores).catch(() => setConductores([]));
        vehiculosApi.listar().then(setVehiculos).catch(() => setVehiculos([]));
        rutasApi.listar().then(setRutas).catch(() => setRutas([]));
    }, []);

    const buscar = useCallback(async () => {
        if (!filtros.empresaId) return;
        setCargando(true);
        setError('');
        try {
            const params = Object.fromEntries(
                Object.entries(filtros).filter(([, v]) => v !== '' && v != null));
            setViajes(await buscarHistorialViajes(params));
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo consultar el historial.');
        } finally {
            setCargando(false);
        }
    }, [filtros]);

    useEffect(() => {
        buscar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtros.empresaId]);

    const cargarAuditoria = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            setAuditoria(await listarAuditoria(moduloAudit || null));
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo cargar la auditoría.');
        } finally {
            setCargando(false);
        }
    }, [moduloAudit]);

    useEffect(() => {
        if (tab === 'auditoria') cargarAuditoria();
    }, [tab, cargarAuditoria]);

    const abrirDetalle = async (viaje) => {
        setError('');
        try {
            setDetalle(await detalleHistorialViaje(viaje.id));
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo abrir el detalle.');
        }
    };

    const setF = (campo) => (e) => setFiltros((f) => ({ ...f, [campo]: e.target.value }));

    const columns = [
        { header: 'Fecha', width: '100px', accessor: 'fechaOperacion' },
        {
            header: 'Recorrido',
            cell: (row) => (
                <div>
                    <div className="font-medium">
                        {TIPOS[row.tipoTrayecto] || row.tipoTrayecto} {JORNADAS[row.jornadaTurno] || row.jornadaTurno}
                        {row.rutaNombre ? ` · ${row.rutaNombre}` : ''}
                    </div>
                    <div className="text-xs text-gray-500">
                        Prog. {hora(row.horaProgramadaInicio)}
                        {row.horaRealInicio ? ` · real ${fechaHora(row.horaRealInicio)}` : ''}
                        {row.horaRealTermino ? ` → ${fechaHora(row.horaRealTermino)}` : ''}
                    </div>
                </div>
            ),
        },
        { header: 'Conductor', cell: (row) => row.conductorNombre || '—' },
        { header: 'Vehículo', width: '100px', cell: (row) => row.vehiculoPatente || '—' },
        {
            header: 'Pasajeros',
            width: '130px',
            cell: (row) => (
                <div className="text-xs">
                    <div>{row.totalPasajeros ?? '—'} programados</div>
                    {row.totalTransportados != null && (
                        <div className="text-gray-500">
                            {row.totalTransportados} transp. · {row.totalAusentes} aus.
                        </div>
                    )}
                </div>
            ),
        },
        { header: 'Estado', width: '110px', cell: (row) => ESTADOS[row.estado] || row.estado },
        {
            header: 'Registros',
            width: '110px',
            cell: (row) => (
                <div className="text-xs text-gray-500">
                    {row.cambios > 0 && <div>{row.cambios} cambio(s)</div>}
                    {row.incidencias > 0 && <div>{row.incidencias} incidencia(s)</div>}
                </div>
            ),
        },
    ];

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                <History className="text-blue-600" /> Historial de recorridos
            </h1>
            <p className="text-gray-500 text-sm mb-6">
                Consulta inmutable de los servicios realizados: los recorridos cerrados conservan el
                conductor, vehículo y pasajeros del momento del servicio.
            </p>

            {user?.rol === 'ADMIN' && (
                <div className="flex gap-1 border-b mb-6">
                    {[['recorridos', 'Recorridos'], ['auditoria', 'Auditoría']].map(([id, label]) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={clsx(
                                'px-4 py-2 text-sm font-medium border-b-2 -mb-px',
                                tab === id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            )}
                        >
                            {id === 'auditoria' ? <ScrollText size={14} className="inline mr-1" /> : null}
                            {label}
                        </button>
                    ))}
                </div>
            )}

            <ErrorBox mensaje={error} />

            {tab === 'recorridos' ? (
                <>
                    <div className="bg-white border rounded-lg p-4 mb-4 grid md:grid-cols-5 gap-3 items-end">
                        <Campo label="Empresa *">
                            <select value={filtros.empresaId} onChange={setF('empresaId')} className={inputClass}>
                                <option value="">— Selecciona —</option>
                                {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                            </select>
                        </Campo>
                        <Campo label="Desde">
                            <input type="date" value={filtros.desde} onChange={setF('desde')} className={inputClass} />
                        </Campo>
                        <Campo label="Hasta">
                            <input type="date" value={filtros.hasta} onChange={setF('hasta')} className={inputClass} />
                        </Campo>
                        <Campo label="Conductor">
                            <select value={filtros.conductorId} onChange={setF('conductorId')} className={inputClass}>
                                <option value="">Todos</option>
                                {conductores.map((c) => <option key={c.id} value={c.id}>{c.nombreCompleto}</option>)}
                            </select>
                        </Campo>
                        <Campo label="Vehículo">
                            <select value={filtros.vehiculoId} onChange={setF('vehiculoId')} className={inputClass}>
                                <option value="">Todos</option>
                                {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.patente}</option>)}
                            </select>
                        </Campo>
                        <Campo label="Ruta">
                            <select value={filtros.rutaId} onChange={setF('rutaId')} className={inputClass}>
                                <option value="">Todas</option>
                                {rutas.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                            </select>
                        </Campo>
                        <Campo label="Turno">
                            <select value={filtros.jornada} onChange={setF('jornada')} className={inputClass}>
                                <option value="">Todos</option>
                                {Object.entries(JORNADAS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </Campo>
                        <Campo label="Tipo">
                            <select value={filtros.tipoTrayecto} onChange={setF('tipoTrayecto')} className={inputClass}>
                                <option value="">Todos</option>
                                {Object.entries(TIPOS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </Campo>
                        <Campo label="Estado">
                            <select value={filtros.estado} onChange={setF('estado')} className={inputClass}>
                                <option value="">Todos</option>
                                {Object.entries(ESTADOS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </Campo>
                        <button
                            onClick={buscar}
                            disabled={!filtros.empresaId || cargando}
                            className="mb-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
                        >
                            <Search size={15} /> Buscar
                        </button>
                    </div>

                    <DataTable columns={columns} data={viajes} isLoading={cargando} onRowClick={abrirDetalle} />
                </>
            ) : (
                <>
                    <div className="flex justify-end mb-3">
                        <select
                            value={moduloAudit}
                            onChange={(e) => setModuloAudit(e.target.value)}
                            className="border rounded-lg p-2 text-sm"
                        >
                            <option value="">Todos los módulos</option>
                            <option value="VIAJES">Viajes</option>
                            <option value="PLANIFICACION">Planificación</option>
                            <option value="IMPORTACIONES">Importaciones</option>
                        </select>
                    </div>
                    <DataTable
                        isLoading={cargando}
                        data={auditoria}
                        columns={[
                            { header: 'Fecha', width: '130px', cell: (r) => fechaHora(r.createdAt) },
                            { header: 'Rol', width: '100px', accessor: 'usuarioRol' },
                            { header: 'Acción', width: '150px', cell: (r) => <span className="font-medium text-xs">{r.accion}</span> },
                            { header: 'Módulo', width: '130px', accessor: 'modulo' },
                            {
                                header: 'Descripción',
                                cell: (r) => (
                                    <div className="text-sm">
                                        {r.descripcion}
                                        {(r.datosAnterior || r.datosNuevo) && (
                                            <div className="text-xs text-gray-500">
                                                {r.datosAnterior || '—'} → {r.datosNuevo || '—'}
                                            </div>
                                        )}
                                    </div>
                                ),
                            },
                        ]}
                    />
                </>
            )}

            <Drawer
                isOpen={Boolean(detalle)}
                onClose={() => setDetalle(null)}
                title="Detalle del recorrido"
            >
                {detalle && (
                    <div className="text-sm">
                        <div className="mb-4">
                            <div className="font-semibold text-base mb-1">
                                {TIPOS[detalle.viaje.tipoTrayecto]} {JORNADAS[detalle.viaje.jornadaTurno]}
                                {detalle.viaje.rutaNombre ? ` · ${detalle.viaje.rutaNombre}` : ''}
                            </div>
                            <div className="text-gray-500 space-y-0.5 text-xs">
                                <div>Fecha: {detalle.viaje.fechaOperacion} · Estado: {ESTADOS[detalle.viaje.estado]}</div>
                                <div>Conductor: {detalle.viaje.conductorNombre || '—'} · Vehículo: {detalle.viaje.vehiculoPatente || '—'}</div>
                                <div>
                                    Programado {hora(detalle.viaje.horaProgramadaInicio)}
                                    {detalle.viaje.horaRealInicio && ` · Inicio real ${fechaHora(detalle.viaje.horaRealInicio)}`}
                                    {detalle.viaje.horaRealTermino && ` · Término real ${fechaHora(detalle.viaje.horaRealTermino)}`}
                                </div>
                                {detalle.viaje.totalTransportados != null && (
                                    <div>
                                        {detalle.viaje.totalPasajeros} programados · {detalle.viaje.totalTransportados} transportados ·{' '}
                                        {detalle.viaje.totalAusentes} ausentes · {detalle.viaje.totalCancelaciones} cancelaciones
                                    </div>
                                )}
                            </div>
                        </div>

                        <h3 className="font-semibold mb-2">Pasajeros ({detalle.pasajeros.length})</h3>
                        <ul className="space-y-2 mb-4">
                            {detalle.pasajeros.map((p) => (
                                <li key={p.pasajeroId} className="border rounded-lg p-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{p.nombre}</span>
                                        <span className="text-xs text-gray-500">{p.estadoAsistencia}</span>
                                    </div>
                                    {p.observaciones && (
                                        <div className="text-xs text-gray-500 mt-0.5">Obs: {p.observaciones}</div>
                                    )}
                                    {p.correcciones.length > 0 && (
                                        <div className="mt-1 text-xs text-amber-700">
                                            {p.correcciones.map((c, i) => (
                                                <div key={i}>
                                                    {c.valorAnterior} → {c.valorNuevo} ({c.motivo}) · {fechaHora(c.createdAt)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {detalle.cambios.length > 0 && (
                            <>
                                <h3 className="font-semibold mb-2">Cambios de asignación</h3>
                                <ul className="space-y-1.5 mb-4 text-xs">
                                    {detalle.cambios.map((c) => (
                                        <li key={c.id} className="border rounded-lg p-2.5">
                                            <span className="font-medium">{c.campo === 'CONDUCTOR' ? 'Conductor' : 'Vehículo'}:</span>{' '}
                                            {c.valorAnterior || '—'} → {c.valorNuevo || '—'}
                                            <div className="text-gray-500">
                                                Motivo: {c.motivo} · {c.usuarioRol} · {fechaHora(c.createdAt)}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}

                        {detalle.incidencias.length > 0 && (
                            <>
                                <h3 className="font-semibold mb-2">Incidencias</h3>
                                <ul className="space-y-1.5 text-xs">
                                    {detalle.incidencias.map((i) => (
                                        <li key={i.id} className="border rounded-lg p-2.5">
                                            <span className="font-medium">{i.tipo}</span> — {i.descripcion}
                                            <div className="text-gray-500">
                                                {i.estado} · {fechaHora(i.createdAt)}
                                                {i.accionRealizada && ` · Acción: ${i.accionRealizada}`}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                )}
            </Drawer>
        </div>
    );
}
