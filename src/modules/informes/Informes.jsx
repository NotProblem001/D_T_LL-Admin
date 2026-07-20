import { useCallback, useEffect, useState } from 'react';
import { FileBarChart, Download, Search } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import {
    obtenerEmpresas,
    descargarInformeSemanal,
    obtenerResumenInterno,
} from '../../services/api';
import { Campo, ErrorBox, inputClass } from '../maestros/shared';

// Lunes y domingo de la semana ISO de una fecha.
function rangoSemana(fechaStr) {
    const d = new Date(`${fechaStr}T12:00:00`);
    const lunes = new Date(d);
    lunes.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    const iso = (x) => x.toISOString().slice(0, 10);
    return { desde: iso(lunes), hasta: iso(domingo) };
}

export default function Informes() {
    const hoy = new Date().toISOString().slice(0, 10);
    const inicial = rangoSemana(hoy);

    const [empresas, setEmpresas] = useState([]);
    const [empresaId, setEmpresaId] = useState('');
    const [desde, setDesde] = useState(inicial.desde);
    const [hasta, setHasta] = useState(inicial.hasta);
    const [resumen, setResumen] = useState(null);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const [descargando, setDescargando] = useState(false);

    useEffect(() => {
        obtenerEmpresas().then((es) => {
            setEmpresas(es);
            if (es.length >= 1) setEmpresaId(es[0].id);
        }).catch(() => setEmpresas([]));
    }, []);

    const consultar = useCallback(async () => {
        if (!empresaId) return;
        setCargando(true);
        setError('');
        try {
            setResumen(await obtenerResumenInterno(empresaId, desde, hasta));
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo consultar el resumen.');
        } finally {
            setCargando(false);
        }
    }, [empresaId, desde, hasta]);

    useEffect(() => {
        consultar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [empresaId]);

    const descargar = async () => {
        setError('');
        setDescargando(true);
        try {
            await descargarInformeSemanal(empresaId, desde, hasta);
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo generar el informe. ¿Hay recorridos en el rango?');
        } finally {
            setDescargando(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                <FileBarChart className="text-blue-600" /> Informes
            </h1>
            <p className="text-gray-500 text-sm mb-6">
                Informe semanal para el cliente (Excel) e informes internos por conductor, vehículo y pasajero.
            </p>

            <ErrorBox mensaje={error} />

            <div className="bg-white border rounded-lg p-4 mb-6 grid md:grid-cols-5 gap-3 items-end">
                <Campo label="Empresa *">
                    <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} className={inputClass}>
                        <option value="">— Selecciona —</option>
                        {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                </Campo>
                <Campo label="Desde">
                    <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={inputClass} />
                </Campo>
                <Campo label="Hasta">
                    <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={inputClass} />
                </Campo>
                <button
                    onClick={consultar}
                    disabled={!empresaId || cargando}
                    className="mb-4 flex items-center justify-center gap-2 border rounded-lg text-sm font-medium px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    <Search size={15} /> Consultar
                </button>
                <button
                    onClick={descargar}
                    disabled={!empresaId || descargando}
                    className="mb-4 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                    <Download size={15} /> {descargando ? 'Generando…' : 'Informe cliente (Excel)'}
                </button>
            </div>

            {resumen && (
                <div className="space-y-8">
                    <div>
                        <h2 className="font-semibold text-gray-700 mb-3">Por conductor</h2>
                        <DataTable
                            isLoading={cargando}
                            data={resumen.porConductor}
                            columns={[
                                { header: 'Conductor', sortKey: 'nombre', cell: (r) => <span className="font-medium">{r.nombre}</span> },
                                { header: 'Recorridos', width: '110px', accessor: 'recorridos' },
                                { header: 'Finalizados', width: '110px', accessor: 'recorridosFinalizados' },
                                { header: 'Pasajeros transportados', width: '180px', accessor: 'pasajerosTransportados' },
                                { header: 'Incidencias', width: '110px', accessor: 'incidencias' },
                            ]}
                        />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-700 mb-3">Por vehículo</h2>
                        <DataTable
                            isLoading={cargando}
                            data={resumen.porVehiculo}
                            columns={[
                                { header: 'Patente', width: '140px', sortKey: 'patente', cell: (r) => <span className="font-medium">{r.patente}</span> },
                                { header: 'Recorridos', width: '120px', accessor: 'recorridos' },
                                { header: 'Pasajeros transportados', accessor: 'pasajerosTransportados' },
                            ]}
                        />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-700 mb-3">Por pasajero</h2>
                        <DataTable
                            isLoading={cargando}
                            data={resumen.porPasajero}
                            columns={[
                                { header: 'Pasajero', sortKey: 'nombre', cell: (r) => <span className="font-medium">{r.nombre}</span> },
                                { header: 'Asistencias', width: '110px', accessor: 'asistencias' },
                                { header: 'Ausencias', width: '110px', accessor: 'ausencias' },
                                { header: 'Cancelaciones', width: '130px', accessor: 'cancelaciones' },
                            ]}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
