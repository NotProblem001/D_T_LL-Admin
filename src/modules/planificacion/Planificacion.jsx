import { useEffect, useState, useCallback } from 'react';
import { CalendarRange, Wand2, Trash2, AlertTriangle, Save, MessageCircle } from 'lucide-react';
import MensajeViaje from './MensajeViaje';
import {
    obtenerEmpresas,
    generarPropuestaViajes,
    listarViajesPlanificacion,
    asignarViaje,
    cambiarEstadoViaje,
    eliminarViajeBorrador,
    listarConductores,
    vehiculosApi,
} from '../../services/api';
import { Campo, ErrorBox, inputClass } from '../maestros/shared';

const JORNADAS = { MANANA: 'Mañana', TARDE: 'Tarde', NOCHE: 'Noche' };
const TIPOS = { ENTRADA: 'Entrada', SALIDA: 'Salida' };

const ESTADOS = {
    BORRADOR: { texto: 'Borrador', clase: 'bg-gray-100 text-gray-600' },
    PROGRAMADO: { texto: 'Programado', clase: 'bg-blue-50 text-blue-700' },
    ASIGNADO: { texto: 'Asignado', clase: 'bg-indigo-50 text-indigo-700' },
    CONFIRMADO: { texto: 'Confirmado', clase: 'bg-green-50 text-green-700' },
    EN_CURSO: { texto: 'En curso', clase: 'bg-amber-50 text-amber-700' },
    FINALIZADO: { texto: 'Finalizado', clase: 'bg-green-100 text-green-800' },
    CANCELADO: { texto: 'Cancelado', clase: 'bg-red-50 text-red-600' },
    REPROGRAMADO: { texto: 'Reprogramado', clase: 'bg-purple-50 text-purple-700' },
};

// Semana ISO-8601 de una fecha yyyy-mm-dd (para precargar año/semana de la nómina).
function semanaIso(fechaStr) {
    const d = new Date(`${fechaStr}T12:00:00`);
    const jueves = new Date(d);
    jueves.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const inicioAnio = new Date(jueves.getFullYear(), 0, 4);
    const semana = 1 + Math.round(((jueves - inicioAnio) / 86400000 - 3 + ((inicioAnio.getDay() + 6) % 7)) / 7);
    return { anio: jueves.getFullYear(), semana };
}

const hora = (v) => (v ? v.slice(0, 5) : '—');

export default function Planificacion() {
    const hoy = new Date().toISOString().slice(0, 10);
    const [empresas, setEmpresas] = useState([]);
    const [empresaId, setEmpresaId] = useState('');
    const [fecha, setFecha] = useState(hoy);
    const [anio, setAnio] = useState(String(semanaIso(hoy).anio));
    const [semana, setSemana] = useState(String(semanaIso(hoy).semana));

    const [conductores, setConductores] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [viajes, setViajes] = useState([]);
    const [sinRuta, setSinRuta] = useState([]);
    const [avisos, setAvisos] = useState([]);
    const [seleccion, setSeleccion] = useState({}); // viajeId -> {conductorId, vehiculoId}
    const [cargando, setCargando] = useState(false);
    const [generando, setGenerando] = useState(false);
    const [error, setError] = useState('');
    const [viajeMensaje, setViajeMensaje] = useState(null);

    useEffect(() => {
        obtenerEmpresas().then((es) => {
            setEmpresas(es);
            if (es.length === 1) setEmpresaId(es[0].id);
        }).catch(() => setEmpresas([]));
        listarConductores().then(setConductores).catch(() => setConductores([]));
        vehiculosApi.listar().then(setVehiculos).catch(() => setVehiculos([]));
    }, []);

    const cargarViajes = useCallback(async () => {
        if (!empresaId || !fecha) return;
        setCargando(true);
        setError('');
        try {
            const data = await listarViajesPlanificacion(empresaId, fecha);
            setViajes(data);
            setSeleccion(Object.fromEntries(data.map((v) => [
                v.id, { conductorId: v.conductorId || '', vehiculoId: v.vehiculoId || '' },
            ])));
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudieron cargar los viajes.');
        } finally {
            setCargando(false);
        }
    }, [empresaId, fecha]);

    useEffect(() => {
        cargarViajes();
    }, [cargarViajes]);

    const cambiarFecha = (valor) => {
        setFecha(valor);
        if (valor) {
            const iso = semanaIso(valor);
            setAnio(String(iso.anio));
            setSemana(String(iso.semana));
        }
    };

    const generar = async () => {
        setError('');
        setGenerando(true);
        setAvisos([]);
        setSinRuta([]);
        try {
            const resultado = await generarPropuestaViajes({
                empresaId,
                anio: Number(anio),
                semana: Number(semana),
                fecha,
            });
            setSinRuta(resultado.sinRuta || []);
            setAvisos(resultado.avisos || []);
            await cargarViajes();
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo generar la propuesta.');
        } finally {
            setGenerando(false);
        }
    };

    const guardarAsignacion = async (viaje) => {
        setError('');
        const sel = seleccion[viaje.id] || {};
        try {
            await asignarViaje(viaje.id, {
                conductorId: sel.conductorId || null,
                vehiculoId: sel.vehiculoId || null,
            });
            await cargarViajes();
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo asignar.');
        }
    };

    const cambiarEstado = async (viaje, estado) => {
        setError('');
        if (estado === 'CANCELADO' && !window.confirm('¿Cancelar este recorrido?')) return;
        try {
            await cambiarEstadoViaje(viaje.id, estado);
            await cargarViajes();
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo cambiar el estado.');
        }
    };

    const eliminar = async (viaje) => {
        if (!window.confirm(`¿Eliminar el borrador ${viaje.rutaNombre || viaje.codigoRutaLogin}?`)) return;
        setError('');
        try {
            await eliminarViajeBorrador(viaje.id);
            await cargarViajes();
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo eliminar.');
        }
    };

    const actualizarSeleccion = (viajeId, campo, valor) =>
        setSeleccion((prev) => ({ ...prev, [viajeId]: { ...prev[viajeId], [campo]: valor } }));

    const editable = (v) => !['EN_CURSO', 'FINALIZADO', 'CANCELADO'].includes(v.estado);

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                <CalendarRange className="text-blue-600" /> Planificación de recorridos
            </h1>
            <p className="text-gray-500 text-sm mb-6">
                Genera la propuesta del día desde la nómina confirmada y asigna conductor y vehículo.
                El sistema valida capacidad, disponibilidad, documentos y superposiciones.
            </p>

            <ErrorBox mensaje={error} />

            <div className="bg-white border rounded-lg p-4 mb-6">
                <div className="grid md:grid-cols-5 gap-3 items-end">
                    <Campo label="Empresa *">
                        <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} className={inputClass}>
                            <option value="">— Selecciona —</option>
                            {empresas.map((e) => (
                                <option key={e.id} value={e.id}>{e.nombre}</option>
                            ))}
                        </select>
                    </Campo>
                    <Campo label="Fecha de operación *">
                        <input type="date" value={fecha} onChange={(e) => cambiarFecha(e.target.value)} className={inputClass} />
                    </Campo>
                    <Campo label="Año nómina">
                        <input type="number" value={anio} onChange={(e) => setAnio(e.target.value)} className={inputClass} />
                    </Campo>
                    <Campo label="Semana nómina">
                        <input type="number" min="1" max="53" value={semana} onChange={(e) => setSemana(e.target.value)} className={inputClass} />
                    </Campo>
                    <button
                        onClick={generar}
                        disabled={generando || !empresaId || !fecha}
                        className="mb-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
                    >
                        <Wand2 size={16} /> {generando ? 'Generando…' : 'Generar propuesta'}
                    </button>
                </div>
            </div>

            {avisos.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                    {avisos.map((a, i) => <div key={i}>{a}</div>)}
                </div>
            )}

            {sinRuta.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
                    <div className="font-medium text-amber-800 mb-1 flex items-center gap-1.5">
                        <AlertTriangle size={15} /> {sinRuta.length} pasajero(s) quedaron fuera de la propuesta
                    </div>
                    <ul className="text-amber-700 space-y-0.5">
                        {sinRuta.map((p, i) => (
                            <li key={i}>
                                {p.nombre} ({JORNADAS[p.turno] || p.turno}
                                {p.comuna ? ` · ${p.comuna}` : ''}) — {p.motivo}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {cargando ? (
                <div className="p-8 text-center text-gray-500 bg-white border rounded-lg">Cargando…</div>
            ) : viajes.length === 0 ? (
                <div className="p-8 text-center text-gray-500 bg-white border rounded-lg">
                    No hay recorridos para esta fecha. Genera la propuesta desde la nómina.
                </div>
            ) : (
                <div className="space-y-3">
                    {viajes.map((v) => {
                        const est = ESTADOS[v.estado] || ESTADOS.BORRADOR;
                        const sel = seleccion[v.id] || { conductorId: '', vehiculoId: '' };
                        const cambio = (sel.conductorId || '') !== (v.conductorId || '')
                            || (sel.vehiculoId || '') !== (v.vehiculoId || '');
                        return (
                            <div key={v.id} className="bg-white border rounded-lg p-4">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <span className="font-semibold">
                                        {TIPOS[v.tipoTrayecto] || v.tipoTrayecto} {JORNADAS[v.jornadaTurno] || v.jornadaTurno}
                                        {v.rutaNombre ? ` · ${v.rutaNombre}` : ''}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${est.clase}`}>
                                        {est.texto}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {hora(v.horaProgramadaInicio)}–{hora(v.horaProgramadaTermino)} ·{' '}
                                        {v.totalPasajeros} pasajero(s)
                                        {v.vehiculoCapacidad ? ` / cap. ${v.vehiculoCapacidad}` : ''} · código{' '}
                                        <code>{v.codigoRutaLogin}</code>
                                    </span>
                                    <div className="ml-auto flex items-center gap-2">
                                        <button
                                            onClick={() => setViajeMensaje(v)}
                                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                                            title="Mensaje WhatsApp del recorrido"
                                        >
                                            <MessageCircle size={14} /> Mensaje
                                        </button>
                                        {editable(v) && (
                                            <select
                                                value={v.estado}
                                                onChange={(e) => cambiarEstado(v, e.target.value)}
                                                className="text-xs border rounded-lg p-1.5"
                                            >
                                                {['BORRADOR', 'PROGRAMADO', 'ASIGNADO', 'REPROGRAMADO', 'CANCELADO'].map((s) => (
                                                    <option key={s} value={s}>{ESTADOS[s].texto}</option>
                                                ))}
                                            </select>
                                        )}
                                        {v.estado === 'BORRADOR' && (
                                            <button
                                                onClick={() => eliminar(v)}
                                                className="p-1.5 rounded hover:bg-red-50 text-red-500"
                                                title="Eliminar borrador"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {editable(v) && (
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <select
                                            value={sel.conductorId}
                                            onChange={(e) => actualizarSeleccion(v.id, 'conductorId', e.target.value)}
                                            className="text-sm border rounded-lg p-2 min-w-[200px]"
                                        >
                                            <option value="">— Sin conductor —</option>
                                            {conductores.filter((c) => c.activo).map((c) => (
                                                <option key={c.id} value={c.id}>{c.nombreCompleto}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={sel.vehiculoId}
                                            onChange={(e) => actualizarSeleccion(v.id, 'vehiculoId', e.target.value)}
                                            className="text-sm border rounded-lg p-2 min-w-[180px]"
                                        >
                                            <option value="">— Sin vehículo —</option>
                                            {vehiculos.filter((x) => x.activo).map((x) => (
                                                <option key={x.id} value={x.id}>
                                                    {x.patente} ({x.capacidadPasajeros} pax)
                                                </option>
                                            ))}
                                        </select>
                                        {cambio && (
                                            <button
                                                onClick={() => guardarAsignacion(v)}
                                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg"
                                            >
                                                <Save size={14} /> Guardar asignación
                                            </button>
                                        )}
                                    </div>
                                )}

                                {v.alertas?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {v.alertas.map((a, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-200">
                                                <AlertTriangle size={11} /> {a}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {viajeMensaje && (
                <MensajeViaje viaje={viajeMensaje} onClose={() => setViajeMensaje(null)} />
            )}
        </div>
    );
}
