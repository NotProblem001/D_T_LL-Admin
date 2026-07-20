import { useCallback, useEffect, useState } from 'react';
import { LayoutDashboard, Users, Bus, AlertTriangle, UserCog, Truck, Percent } from 'lucide-react';
import { obtenerEmpresas, obtenerDashboard } from '../../services/api';
import { ErrorBox } from '../maestros/shared';

function Kpi({ etiqueta, valor, icono: Icono, clase = 'text-blue-600' }) {
    return (
        <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">{etiqueta}</span>
                {Icono && <Icono size={16} className={clase} />}
            </div>
            <div className="text-2xl font-bold">{valor}</div>
        </div>
    );
}

export default function Dashboard() {
    const hoy = new Date().toISOString().slice(0, 10);
    const [empresas, setEmpresas] = useState([]);
    const [empresaId, setEmpresaId] = useState('');
    const [fecha, setFecha] = useState(hoy);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        obtenerEmpresas().then((es) => {
            setEmpresas(es);
            if (es.length >= 1) setEmpresaId(es[0].id);
        }).catch(() => setEmpresas([]));
    }, []);

    const cargar = useCallback(async () => {
        if (!empresaId) return;
        setCargando(true);
        setError('');
        try {
            setData(await obtenerDashboard(empresaId, fecha));
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo cargar el panel.');
        } finally {
            setCargando(false);
        }
    }, [empresaId, fecha]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                        <LayoutDashboard className="text-blue-600" /> Panel operativo
                    </h1>
                    <p className="text-gray-500 text-sm">Indicadores del día y de la semana.</p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={empresaId}
                        onChange={(e) => setEmpresaId(e.target.value)}
                        className="w-52 border rounded-lg p-2 text-sm bg-white"
                    >
                        <option value="">— Empresa —</option>
                        {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                    <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        className="w-40 border rounded-lg p-2 text-sm bg-white"
                    />
                </div>
            </div>

            <ErrorBox mensaje={error} />

            {!data && !cargando && (
                <div className="p-10 text-center text-gray-400 bg-white border rounded-xl">
                    Selecciona una empresa para ver los indicadores.
                </div>
            )}
            {cargando && (
                <div className="p-10 text-center text-gray-400 bg-white border rounded-xl">Cargando…</div>
            )}

            {data && !cargando && (
                <>
                    <h2 className="font-semibold text-gray-700 mb-3">Hoy ({fecha})</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <Kpi etiqueta="Pasajeros programados" valor={data.hoy.pasajerosProgramados} icono={Users} />
                        <Kpi etiqueta="Transportados" valor={data.hoy.pasajerosTransportados} icono={Users} clase="text-green-600" />
                        <Kpi etiqueta="Ausentes" valor={data.hoy.pasajerosAusentes} icono={Users} clase="text-red-500" />
                        <Kpi etiqueta="Incidencias abiertas" valor={data.incidenciasAbiertas} icono={AlertTriangle} clase="text-amber-500" />
                        <Kpi etiqueta="Recorridos programados" valor={data.hoy.recorridosProgramados} icono={Bus} />
                        <Kpi etiqueta="En curso" valor={data.hoy.recorridosEnCurso} icono={Bus} clase="text-indigo-600" />
                        <Kpi etiqueta="Finalizados" valor={data.hoy.recorridosFinalizados} icono={Bus} clase="text-green-600" />
                        <Kpi etiqueta="Cancelados" valor={data.hoy.recorridosCancelados} icono={Bus} clase="text-red-500" />
                    </div>

                    <h2 className="font-semibold text-gray-700 mb-3">Semana</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <Kpi etiqueta="Recorridos de la semana" valor={data.semana.recorridos} icono={Bus} />
                        <Kpi etiqueta="Finalizados" valor={data.semana.recorridosFinalizados} icono={Bus} clase="text-green-600" />
                        <Kpi etiqueta="Pasajeros transportados" valor={data.semana.pasajerosTransportados} icono={Users} clase="text-green-600" />
                        <Kpi etiqueta="% asistencia" valor={`${data.semana.porcentajeAsistencia}%`} icono={Percent} clase="text-blue-600" />
                    </div>

                    <h2 className="font-semibold text-gray-700 mb-3">Recursos</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Kpi etiqueta="Conductores activos" valor={data.conductoresActivos} icono={UserCog} />
                        <Kpi etiqueta="Vehículos disponibles" valor={data.vehiculosDisponibles} icono={Truck} />
                    </div>
                </>
            )}
        </div>
    );
}
