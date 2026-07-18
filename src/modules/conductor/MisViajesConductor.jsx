import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bus, LogOut, ChevronRight } from 'lucide-react';
import { misViajesConductor } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { ESTADOS_VIAJE, JORNADAS, TIPOS, hora } from './shared';

export default function MisViajesConductor() {
    const hoy = new Date().toISOString().slice(0, 10);
    const [fecha, setFecha] = useState(hoy);
    const [viajes, setViajes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const { user, logout } = useAuth();

    const cargar = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            setViajes(await misViajesConductor(fecha));
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudieron cargar tus recorridos.');
        } finally {
            setCargando(false);
        }
    }, [fecha]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-blue-600 text-white px-4 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <Bus size={22} />
                    <div>
                        <div className="font-semibold leading-tight">Mis recorridos</div>
                        <div className="text-xs text-blue-100">{user?.nombre}</div>
                    </div>
                </div>
                <button onClick={logout} className="p-2 rounded-lg hover:bg-blue-700" title="Salir">
                    <LogOut size={20} />
                </button>
            </header>

            <div className="p-4 max-w-lg mx-auto">
                <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full border rounded-xl p-3 text-base mb-4 bg-white"
                />

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {cargando ? (
                    <div className="text-center py-16 text-gray-400">Cargando…</div>
                ) : viajes.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        No tienes recorridos asignados para esta fecha.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {viajes.map((v) => {
                            const est = ESTADOS_VIAJE[v.estado] || ESTADOS_VIAJE.PROGRAMADO;
                            return (
                                <Link
                                    key={v.id}
                                    to={`/conductor/viajes/${v.id}`}
                                    className="block bg-white border rounded-2xl p-4 active:bg-gray-50"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-lg">
                                                {TIPOS[v.tipoTrayecto] || v.tipoTrayecto}{' '}
                                                {JORNADAS[v.jornadaTurno] || v.jornadaTurno}
                                                {v.rutaNombre ? ` · ${v.rutaNombre}` : ''}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-0.5">
                                                Inicio {hora(v.horaProgramadaInicio)} · {v.totalPasajeros} pasajero(s)
                                                {v.vehiculoPatente ? ` · ${v.vehiculoPatente}` : ''}
                                            </div>
                                            <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-medium ${est.clase}`}>
                                                {est.texto}
                                            </span>
                                        </div>
                                        <ChevronRight className="text-gray-300" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
