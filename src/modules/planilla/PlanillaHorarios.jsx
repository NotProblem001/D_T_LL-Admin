import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Download, Search } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import {
    obtenerEmpresas,
    listarNomina,
    listarSemanasNomina,
    descargarPlanillaHorarios,
} from '../../services/api';

const TURNO_LABEL = { MANANA: 'Mañana (08-16)', TARDE: 'Tarde (16-00)', NOCHE: 'Noche (00-08)' };
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/** Lunes de una semana ISO (para asociar semana → mes). */
function lunesDeSemanaISO(anio, semana) {
    const ene4 = new Date(anio, 0, 4);
    const diaISO = (ene4.getDay() + 6) % 7; // 0 = lunes
    return new Date(anio, 0, 4 - diaISO + (semana - 1) * 7);
}

function normalizar(texto) {
    return (texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
}

const selectClass = 'mt-1 w-full border rounded-lg p-2 bg-white text-sm';

export default function PlanillaHorarios() {
    const [empresas, setEmpresas] = useState([]);
    const [empresaId, setEmpresaId] = useState('');
    const [semanas, setSemanas] = useState([]); // [{anio, semana, total, porTurno}]
    // clave "empresaId:anio" para saber si las filas cargadas corresponden a los filtros actuales
    const [datos, setDatos] = useState({ clave: '', filas: [] });
    const [error, setError] = useState('');

    const [anio, setAnio] = useState('');
    const [mes, setMes] = useState('');       // '' = todos, 0-11
    const [semana, setSemana] = useState('');  // '' = todas
    const [turno, setTurno] = useState('');
    const [comuna, setComuna] = useState('');
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        obtenerEmpresas()
            .then((data) => {
                setEmpresas(data);
                if (data.length === 1) setEmpresaId(data[0].id);
            })
            .catch(() => setError('No se pudieron cargar las empresas.'));
    }, []);

    // Al cambiar de empresa: cargar semanas disponibles y elegir la más reciente.
    useEffect(() => {
        if (!empresaId) return;
        listarSemanasNomina(empresaId)
            .then((data) => {
                setError('');
                setSemanas(data);
                setMes('');
                setAnio(data.length > 0 ? String(data[0].anio) : '');
                setSemana(data.length > 0 ? String(data[0].semana) : '');
            })
            .catch((e) => setError(e.response?.data?.error || 'No se pudo cargar el listado de semanas.'));
    }, [empresaId]);

    // Cargar todos los registros del año; el resto de filtros se aplica en el cliente.
    const claveDatos = empresaId && anio ? `${empresaId}:${anio}` : '';
    useEffect(() => {
        if (!claveDatos) return;
        const [emp, a] = claveDatos.split(':');
        listarNomina(emp, a)
            .then((filas) => {
                setError('');
                setDatos({ clave: claveDatos, filas });
            })
            .catch((e) => setError(e.response?.data?.error || 'No se pudo cargar la nómina.'));
    }, [claveDatos]);

    const cargando = Boolean(claveDatos) && datos.clave !== claveDatos;
    const registros = useMemo(
        () => (datos.clave === claveDatos ? datos.filas : []),
        [datos, claveDatos]
    );

    const anios = useMemo(
        () => [...new Set(semanas.map((s) => s.anio))].sort((a, b) => b - a),
        [semanas]
    );

    const semanasDelAnio = useMemo(
        () => semanas.filter((s) => String(s.anio) === anio),
        [semanas, anio]
    );

    const mesesDisponibles = useMemo(
        () => [...new Set(semanasDelAnio.map((s) => lunesDeSemanaISO(s.anio, s.semana).getMonth()))]
            .sort((a, b) => a - b),
        [semanasDelAnio]
    );

    const semanasFiltradas = useMemo(
        () => (mes === ''
            ? semanasDelAnio
            : semanasDelAnio.filter(
                (s) => lunesDeSemanaISO(s.anio, s.semana).getMonth() === Number(mes))),
        [semanasDelAnio, mes]
    );

    const comunas = useMemo(
        () => [...new Set(registros.map((r) => r.comuna).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b)),
        [registros]
    );

    const filtrados = useMemo(() => {
        const semanasVisibles = new Set(semanasFiltradas.map((s) => s.semana));
        const q = normalizar(busqueda);
        return registros.filter((r) => {
            if (semana !== '' ? r.semana !== Number(semana) : !semanasVisibles.has(r.semana)) return false;
            if (turno && r.turno !== turno) return false;
            if (comuna && normalizar(r.comuna) !== normalizar(comuna)) return false;
            if (q && !normalizar(`${r.nombre} ${r.direccion || ''} ${r.telefono || ''} ${r.centroCosto || ''} ${r.cargo || ''}`).includes(q)) return false;
            return true;
        });
    }, [registros, semanasFiltradas, semana, turno, comuna, busqueda]);

    const stats = useMemo(() => {
        const porTurno = {};
        let sinDatos = 0;
        for (const r of filtrados) {
            porTurno[r.turno] = (porTurno[r.turno] || 0) + 1;
            if (!r.datosCompletos) sinDatos++;
        }
        return { total: filtrados.length, porTurno, sinDatos };
    }, [filtrados]);

    const descargar = async () => {
        if (!semana) return;
        setError('');
        try {
            await descargarPlanillaHorarios(empresaId, anio, semana);
        } catch {
            setError('No se pudo descargar la planilla de esa semana.');
        }
    };

    const columns = [
        { header: 'Sem.', width: '60px', cell: (r) => r.semana },
        { header: 'Turno', width: '130px', cell: (r) => TURNO_LABEL[r.turno] || r.turno },
        { header: 'Nombre', accessor: 'nombre' },
        { header: 'Teléfono', width: '130px', cell: (r) => r.telefono || '—' },
        { header: 'Dirección', cell: (r) => r.direccion || '—' },
        { header: 'Comuna', width: '130px', cell: (r) => r.comuna || '—' },
        { header: 'Centro de costo', width: '160px', cell: (r) => r.centroCosto || '—' },
        { header: 'Cargo', width: '150px', cell: (r) => r.cargo || '—' },
        {
            header: 'Estado',
            width: '130px',
            cell: (r) => (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${r.datosCompletos
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'}`}>
                    {r.datosCompletos ? 'OK' : 'Completar datos'}
                </span>
            ),
        },
    ];

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                        <ClipboardList className="text-dtll-blue" /> Planilla de horarios
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Explora la nómina importada por empresa, semana o mes, turno, comuna y pasajero.
                    </p>
                </div>
                <button
                    onClick={descargar}
                    disabled={!semana}
                    title={semana ? '' : 'Selecciona una semana específica para descargar'}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                    <Download size={16} /> Descargar planilla
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-4">
                <label className="text-sm col-span-2 sm:col-span-1">
                    Empresa
                    <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} className={selectClass}>
                        <option value="">Seleccionar…</option>
                        {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                </label>
                <label className="text-sm">
                    Año
                    <select value={anio} onChange={(e) => { setAnio(e.target.value); setMes(''); setSemana(''); }} className={selectClass}>
                        {anios.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                </label>
                <label className="text-sm">
                    Mes
                    <select value={mes} onChange={(e) => { setMes(e.target.value); setSemana(''); }} className={selectClass}>
                        <option value="">Todos</option>
                        {mesesDisponibles.map((m) => <option key={m} value={m}>{MESES[m]}</option>)}
                    </select>
                </label>
                <label className="text-sm">
                    Semana
                    <select value={semana} onChange={(e) => setSemana(e.target.value)} className={selectClass}>
                        <option value="">Todas</option>
                        {semanasFiltradas.map((s) => (
                            <option key={`${s.anio}-${s.semana}`} value={s.semana}>
                                Semana {s.semana} ({s.total})
                            </option>
                        ))}
                    </select>
                </label>
                <label className="text-sm">
                    Turno
                    <select value={turno} onChange={(e) => setTurno(e.target.value)} className={selectClass}>
                        <option value="">Todos</option>
                        {Object.entries(TURNO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                </label>
                <label className="text-sm">
                    Comuna
                    <select value={comuna} onChange={(e) => setComuna(e.target.value)} className={selectClass}>
                        <option value="">Todas</option>
                        {comunas.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </label>
                <label className="text-sm">
                    Buscar
                    <div className="relative mt-1">
                        <Search size={15} className="absolute left-2.5 top-2.5 text-gray-400" />
                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Nombre, dirección…"
                            className="w-full border rounded-lg p-2 pl-8 text-sm"
                        />
                    </div>
                </label>
            </div>

            {empresaId && (
                <div className="flex flex-wrap gap-2 mb-4 text-sm">
                    <span className="bg-dtll-blueLight text-dtll-blueDark px-3 py-1 rounded-full font-medium">
                        {stats.total} pasajeros
                    </span>
                    {Object.entries(stats.porTurno).map(([t, n]) => (
                        <span key={t} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                            {TURNO_LABEL[t] || t}: {n}
                        </span>
                    ))}
                    {stats.sinDatos > 0 && (
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                            {stats.sinDatos} por completar datos
                        </span>
                    )}
                </div>
            )}

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {!empresaId ? (
                <div className="p-12 text-center text-gray-500 bg-white border rounded-lg text-sm">
                    Selecciona una empresa para ver su planilla.
                </div>
            ) : semanas.length === 0 && !cargando ? (
                <div className="p-12 text-center text-gray-500 bg-white border rounded-lg text-sm">
                    Esta empresa aún no tiene nómina importada. Súbela desde “Nómina semanal”.
                </div>
            ) : (
                <DataTable columns={columns} data={filtrados} isLoading={cargando} />
            )}
        </div>
    );
}
