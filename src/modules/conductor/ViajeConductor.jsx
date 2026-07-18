import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowLeft, Phone, MapPin, Play, Flag, Check, AlertTriangle } from 'lucide-react';
import {
    detalleViajeConductor,
    confirmarViajeConductor,
    iniciarViajeConductor,
    finalizarViajeConductor,
    estadosAsistenciaConductor,
    obtenerChecklist,
    guardarChecklist,
    crearIncidencia,
} from '../../services/api';
import { ESTADOS_VIAJE, JORNADAS, TIPOS, hora } from './shared';

const TIPOS_INCIDENCIA = [
    'Retraso', 'Pasajero ausente', 'Pasajero avisó que no viaja', 'Problema con el vehículo',
    'Desvío de ruta', 'Cambio de ubicación del pasajero', 'Otro',
];

const COLORES_ESTADO = {
    ASISTIO: 'bg-green-600 text-white border-green-600',
    NO_ASISTIO: 'bg-red-600 text-white border-red-600',
    AVISO_PREVIO: 'bg-amber-500 text-white border-amber-500',
    NO_UTILIZA_TRANSPORTE: 'bg-gray-500 text-white border-gray-500',
    MEDIOS_PROPIOS: 'bg-blue-500 text-white border-blue-500',
};

export default function ViajeConductor() {
    const { viajeId } = useParams();
    const [viaje, setViaje] = useState(null);
    const [items, setItems] = useState([]);
    const [estados, setEstados] = useState([]);
    const [error, setError] = useState('');
    const [ocupado, setOcupado] = useState(false);

    // Modal de marcación: { item, estado (config) } → pide observación/motivo si corresponde.
    const [modal, setModal] = useState(null);
    const [observacion, setObservacion] = useState('');
    const [motivo, setMotivo] = useState('');

    // Modal de incidencia
    const [modalIncidencia, setModalIncidencia] = useState(false);
    const [tipoIncidencia, setTipoIncidencia] = useState(TIPOS_INCIDENCIA[0]);
    const [descIncidencia, setDescIncidencia] = useState('');

    const cargar = useCallback(async () => {
        setError('');
        try {
            const [v, checklist] = await Promise.all([
                detalleViajeConductor(viajeId),
                obtenerChecklist(viajeId),
            ]);
            setViaje(v);
            setItems(checklist);
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo cargar el recorrido.');
        }
    }, [viajeId]);

    useEffect(() => {
        cargar();
        estadosAsistenciaConductor().then(setEstados).catch(() => setEstados([]));
    }, [cargar]);

    const accionViaje = async (fn, confirmarMsg) => {
        if (confirmarMsg && !window.confirm(confirmarMsg)) return;
        setError('');
        setOcupado(true);
        try {
            await fn(viajeId);
            await cargar();
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo completar la acción.');
        } finally {
            setOcupado(false);
        }
    };

    const abrirMarcacion = (item, estadoConfig) => {
        if (item.estado === estadoConfig.codigo) return;
        const esCorreccion = item.estado !== 'PENDIENTE';
        if (estadoConfig.requiereObservacion || esCorreccion) {
            setModal({ item, estado: estadoConfig, esCorreccion });
            setObservacion(item.observaciones || '');
            setMotivo('');
        } else {
            marcar(item, estadoConfig.codigo, null, null);
        }
    };

    const marcar = async (item, codigo, obs, mot) => {
        setError('');
        try {
            const actualizado = await guardarChecklist(viajeId, [{
                asistenciaId: item.asistenciaId,
                estado: codigo,
                observaciones: obs,
                motivo: mot,
            }]);
            setItems(actualizado);
            setModal(null);
            const v = await detalleViajeConductor(viajeId);
            setViaje(v);
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo marcar la asistencia.');
            setModal(null);
        }
    };

    const enviarIncidencia = async () => {
        setError('');
        try {
            await crearIncidencia({
                viajeId,
                tipo: tipoIncidencia,
                descripcion: descIncidencia,
            });
            setModalIncidencia(false);
            setDescIncidencia('');
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo registrar la incidencia.');
            setModalIncidencia(false);
        }
    };

    if (!viaje) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                {error ? (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
                ) : (
                    <div className="text-center py-16 text-gray-400">Cargando…</div>
                )}
            </div>
        );
    }

    const est = ESTADOS_VIAJE[viaje.estado] || ESTADOS_VIAJE.PROGRAMADO;
    const marcados = items.filter((i) => i.estado !== 'PENDIENTE').length;

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            <header className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-10">
                <Link to="/conductor" className="inline-flex items-center gap-1 text-sm text-blue-100 mb-1">
                    <ArrowLeft size={15} /> Mis recorridos
                </Link>
                <div className="font-semibold text-lg leading-tight">
                    {TIPOS[viaje.tipoTrayecto] || viaje.tipoTrayecto} {JORNADAS[viaje.jornadaTurno] || viaje.jornadaTurno}
                    {viaje.rutaNombre ? ` · ${viaje.rutaNombre}` : ''}
                </div>
                <div className="text-sm text-blue-100">
                    {viaje.fechaOperacion} · inicio {hora(viaje.horaProgramadaInicio)}
                    {viaje.vehiculoPatente ? ` · ${viaje.vehiculoPatente}` : ''}
                </div>
            </header>

            <div className="p-4 max-w-lg mx-auto">
                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${est.clase}`}>{est.texto}</span>
                    <span className="text-sm text-gray-500">{marcados}/{items.length} marcados</span>
                </div>

                {/* Acción principal según el estado del recorrido */}
                {['ASIGNADO', 'PROGRAMADO', 'REPROGRAMADO'].includes(viaje.estado) && (
                    <button
                        onClick={() => accionViaje(confirmarViajeConductor)}
                        disabled={ocupado}
                        className="w-full mb-3 flex items-center justify-center gap-2 bg-green-600 active:bg-green-700 disabled:opacity-60 text-white font-semibold py-4 rounded-2xl text-base"
                    >
                        <Check size={20} /> Confirmar que recibí la asignación
                    </button>
                )}
                {['CONFIRMADO', 'ASIGNADO', 'PROGRAMADO', 'REPROGRAMADO'].includes(viaje.estado) && (
                    <button
                        onClick={() => accionViaje(iniciarViajeConductor, '¿Iniciar el recorrido ahora?')}
                        disabled={ocupado}
                        className="w-full mb-3 flex items-center justify-center gap-2 bg-blue-600 active:bg-blue-700 disabled:opacity-60 text-white font-semibold py-4 rounded-2xl text-base"
                    >
                        <Play size={20} /> Iniciar recorrido
                    </button>
                )}
                {viaje.estado === 'EN_CURSO' && (
                    <button
                        onClick={() => accionViaje(finalizarViajeConductor, '¿Finalizar el recorrido?')}
                        disabled={ocupado}
                        className="w-full mb-3 flex items-center justify-center gap-2 bg-gray-800 active:bg-black disabled:opacity-60 text-white font-semibold py-4 rounded-2xl text-base"
                    >
                        <Flag size={20} /> Finalizar recorrido
                    </button>
                )}
                {viaje.horaRealInicio && (
                    <p className="text-xs text-gray-500 mb-3">
                        Inicio real: {new Date(viaje.horaRealInicio).toLocaleTimeString()}
                        {viaje.horaRealTermino
                            ? ` · Término real: ${new Date(viaje.horaRealTermino).toLocaleTimeString()}`
                            : ''}
                    </p>
                )}

                <button
                    onClick={() => setModalIncidencia(true)}
                    className="w-full mb-5 flex items-center justify-center gap-2 border border-amber-300 bg-amber-50 active:bg-amber-100 text-amber-800 font-medium py-3 rounded-2xl text-sm"
                >
                    <AlertTriangle size={17} /> Reportar incidencia
                </button>

                {/* Checklist de pasajeros */}
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.asistenciaId} className="bg-white border rounded-2xl p-4">
                            <div className="mb-1 font-semibold text-base">{item.nombreCompleto}</div>
                            <div className="text-sm text-gray-500 space-y-0.5 mb-3">
                                {item.direccion && (
                                    <div className="flex items-start gap-1.5">
                                        <MapPin size={14} className="mt-0.5 shrink-0" />
                                        <span>{item.direccion}{item.comuna ? `, ${item.comuna}` : ''}</span>
                                    </div>
                                )}
                                {item.telefono && (
                                    <a href={`tel:+${item.telefono}`} className="flex items-center gap-1.5 text-blue-600">
                                        <Phone size={14} /> +{item.telefono}
                                    </a>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {estados.map((e) => (
                                    <button
                                        key={e.codigo}
                                        onClick={() => abrirMarcacion(item, e)}
                                        className={clsx(
                                            'rounded-xl border py-3 px-2 text-xs font-medium min-h-[52px]',
                                            item.estado === e.codigo
                                                ? (COLORES_ESTADO[e.codigo] || 'bg-blue-600 text-white border-blue-600')
                                                : 'bg-gray-50 text-gray-600 border-gray-200 active:bg-gray-100'
                                        )}
                                    >
                                        {e.nombre}
                                    </button>
                                ))}
                            </div>
                            {item.observaciones && (
                                <p className="mt-2 text-xs text-gray-500">Obs: {item.observaciones}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal observación/motivo */}
            {modal && (
                <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-20 p-4">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-md">
                        <h3 className="font-semibold mb-1">
                            {modal.estado.nombre} — {modal.item.nombreCompleto}
                        </h3>
                        {modal.esCorreccion && (
                            <p className="text-xs text-amber-700 mb-2">
                                Estás corrigiendo una asistencia ya marcada: el cambio queda registrado.
                            </p>
                        )}
                        <label className="block text-sm mb-3">
                            <span className="text-gray-700">
                                Observación{modal.estado.requiereObservacion ? ' (obligatoria)' : ''}
                            </span>
                            <textarea
                                value={observacion}
                                onChange={(e) => setObservacion(e.target.value)}
                                rows={2}
                                className="mt-1 w-full border rounded-lg p-2 text-sm"
                            />
                        </label>
                        {modal.esCorreccion && (
                            <label className="block text-sm mb-3">
                                <span className="text-gray-700">Motivo del cambio (obligatorio)</span>
                                <textarea
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                    rows={2}
                                    className="mt-1 w-full border rounded-lg p-2 text-sm"
                                />
                            </label>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setModal(null)}
                                className="flex-1 border rounded-xl py-3 text-sm font-medium text-gray-600"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => marcar(modal.item, modal.estado.codigo,
                                    observacion || null, motivo || null)}
                                className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal incidencia */}
            {modalIncidencia && (
                <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-20 p-4">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-md">
                        <h3 className="font-semibold mb-3">Reportar incidencia</h3>
                        <label className="block text-sm mb-3">
                            <span className="text-gray-700">Tipo</span>
                            <select
                                value={tipoIncidencia}
                                onChange={(e) => setTipoIncidencia(e.target.value)}
                                className="mt-1 w-full border rounded-lg p-2 text-sm"
                            >
                                {TIPOS_INCIDENCIA.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </label>
                        <label className="block text-sm mb-3">
                            <span className="text-gray-700">Descripción</span>
                            <textarea
                                value={descIncidencia}
                                onChange={(e) => setDescIncidencia(e.target.value)}
                                rows={3}
                                className="mt-1 w-full border rounded-lg p-2 text-sm"
                            />
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setModalIncidencia(false)}
                                className="flex-1 border rounded-xl py-3 text-sm font-medium text-gray-600"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={enviarIncidencia}
                                disabled={!descIncidencia.trim()}
                                className="flex-1 bg-amber-600 disabled:opacity-50 text-white rounded-xl py-3 text-sm font-semibold"
                            >
                                Enviar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
