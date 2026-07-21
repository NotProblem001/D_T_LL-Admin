import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import clsx from 'clsx';
import { Loader2, ArrowLeft } from 'lucide-react';
import { obtenerChecklist, guardarChecklist, estadosAsistenciaApi } from '../../services/api';

// Colores por código conocido; los estados nuevos usan el color por defecto.
const COLORES = {
    ASISTIO: 'bg-green-600 text-white border-green-600',
    NO_ASISTIO: 'bg-red-600 text-white border-red-600',
    AVISO_PREVIO: 'bg-amber-500 text-white border-amber-500',
    NO_UTILIZA_TRANSPORTE: 'bg-gray-500 text-white border-gray-500',
    MEDIOS_PROPIOS: 'bg-dtll-blue text-white border-dtll-blue',
};

export default function ChecklistViaje() {
    const { viajeId } = useParams();
    const [items, setItems] = useState([]);
    const [originales, setOriginales] = useState({}); // asistenciaId -> estado guardado en servidor
    const [estados, setEstados] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [savedAt, setSavedAt] = useState(null);

    const cargar = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await obtenerChecklist(viajeId);
            setItems(data);
            setOriginales(Object.fromEntries(data.map((i) => [i.asistenciaId, i.estado])));
        } catch (err) {
            setError(err.response?.data?.error || 'No se pudo cargar el checklist del viaje.');
        } finally {
            setIsLoading(false);
        }
    }, [viajeId]);

    useEffect(() => {
        cargar();
        estadosAsistenciaApi.listar()
            .then((es) => setEstados(es.filter((e) => e.activo)))
            .catch(() => setEstados([]));
    }, [cargar]);

    const marcar = (asistenciaId, estado) => {
        setItems((prev) => prev.map((item) =>
            item.asistenciaId === asistenciaId ? { ...item, estado } : item
        ));
        setSavedAt(null);
    };

    const guardarTodo = async () => {
        setIsSaving(true);
        setError('');
        try {
            const marcaciones = [];
            for (const item of items) {
                const original = originales[item.asistenciaId];
                if (item.estado === original) continue;

                const config = estados.find((e) => e.codigo === item.estado);
                let observaciones = item.observaciones || null;
                if (config?.requiereObservacion && !observaciones) {
                    observaciones = window.prompt(
                        `"${config.nombre}" exige observación para ${item.nombreCompleto}:`) || '';
                    if (!observaciones.trim()) {
                        throw new Error(`Falta la observación de ${item.nombreCompleto}`);
                    }
                }
                let motivo = null;
                if (original !== 'PENDIENTE') {
                    motivo = window.prompt(
                        `Motivo de la corrección para ${item.nombreCompleto} (queda en historial):`) || '';
                    if (!motivo.trim()) {
                        throw new Error(`Falta el motivo de corrección de ${item.nombreCompleto}`);
                    }
                }
                marcaciones.push({ asistenciaId: item.asistenciaId, estado: item.estado, observaciones, motivo });
            }
            if (marcaciones.length > 0) {
                const actualizado = await guardarChecklist(viajeId, marcaciones);
                setItems(actualizado);
                setOriginales(Object.fromEntries(actualizado.map((i) => [i.asistenciaId, i.estado])));
            }
            setSavedAt(new Date());
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'No se pudo guardar el checklist.');
        } finally {
            setIsSaving(false);
        }
    };

    const totalMarcados = items.filter((i) => i.estado !== 'PENDIENTE').length;

    return (
        <div className="max-w-2xl mx-auto pb-28">
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
                <ArrowLeft size={16} /> Volver
            </Link>

            <h1 className="text-xl font-bold text-gray-900 mb-1">Checklist de Asistencia</h1>
            <p className="text-sm text-gray-500 mb-6">
                Viaje {viajeId} · {totalMarcados}/{items.length} marcados
            </p>

            {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                    <Loader2 className="animate-spin" size={28} />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-16 text-gray-400">No hay pasajeros asociados a este viaje.</div>
            ) : (
                <ul className="space-y-3">
                    {items.map((item) => (
                        <li
                            key={item.asistenciaId}
                            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                        >
                            <div className="mb-3">
                                <p className="font-semibold text-gray-900">{item.nombreCompleto}</p>
                                {(item.direccion || item.puntoParadaAsignado) && (
                                    <p className="text-xs text-gray-500">
                                        {item.direccion || item.puntoParadaAsignado}
                                        {item.comuna ? `, ${item.comuna}` : ''}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {estados.map((opcion) => (
                                    <button
                                        key={opcion.codigo}
                                        type="button"
                                        onClick={() => marcar(item.asistenciaId, opcion.codigo)}
                                        className={clsx(
                                            'flex items-center justify-center rounded-lg border py-3 px-1 text-xs font-medium transition-colors min-h-[56px] text-center',
                                            item.estado === opcion.codigo
                                                ? (COLORES[opcion.codigo] || 'bg-dtll-blue text-white border-dtll-blue')
                                                : 'bg-gray-50 text-gray-500 border-gray-200 active:bg-gray-100'
                                        )}
                                    >
                                        {opcion.nombre}
                                    </button>
                                ))}
                            </div>
                            {item.observaciones && (
                                <p className="mt-2 text-xs text-gray-500">Obs: {item.observaciones}</p>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {items.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between gap-4 sm:absolute sm:rounded-b-xl">
                    <span className="text-xs text-gray-500">
                        {savedAt ? `Guardado ${savedAt.toLocaleTimeString()}` : 'Cambios sin guardar'}
                    </span>
                    <button
                        type="button"
                        onClick={guardarTodo}
                        disabled={isSaving}
                        className="bg-dtll-blue hover:bg-dtll-blueDark disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-lg text-sm"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar checklist'}
                    </button>
                </div>
            )}
        </div>
    );
}
