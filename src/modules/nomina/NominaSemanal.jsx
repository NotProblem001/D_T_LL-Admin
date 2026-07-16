import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CalendarDays, CheckCircle, AlertTriangle, Download, UploadCloud, Users, ClipboardPaste, ClipboardList } from 'lucide-react';
import {
    obtenerEmpresas,
    importarBddPasajeros,
    importarNominaSemanal,
    importarNominaTexto,
    importarPlanillaInterna,
    descargarPlanillaHorarios,
} from '../../services/api';

const TURNO_LABEL = { MANANA: 'Mañana', TARDE: 'Tarde', NOCHE: 'Noche' };

function Dropzone({ onFile, label, disabled }) {
    const onDrop = useCallback((files) => files[0] && onFile(files[0]), [onFile]);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
        multiple: false,
        disabled,
    });
    return (
        <div
            {...getRootProps()}
            className={`border-dashed border-2 rounded-xl p-6 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-300'}
                ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto text-gray-400 mb-2" size={28} />
            <p className="text-sm text-gray-600">{label}</p>
        </div>
    );
}

export default function NominaSemanal() {
    const [empresas, setEmpresas] = useState([]);
    const [empresaId, setEmpresaId] = useState('');
    const [anio, setAnio] = useState(new Date().getFullYear());
    const [semana, setSemana] = useState('');
    const [texto, setTexto] = useState('');
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        obtenerEmpresas().then(setEmpresas).catch(() => setError('No se pudieron cargar las empresas.'));
    }, []);

    const ejecutar = async (fn) => {
        if (!empresaId) {
            setError('Selecciona primero la empresa cliente.');
            return;
        }
        setError('');
        setResultado(null);
        setCargando(true);
        try {
            const res = await fn();
            setResultado(res);
            if (res.semana) setSemana(res.semana);
            if (res.anio) setAnio(res.anio);
        } catch (e) {
            setError(e.response?.data?.error || 'Error al procesar. Revisa el formato del archivo.');
        } finally {
            setCargando(false);
        }
    };

    const subirNomina = (file) =>
        ejecutar(() => importarNominaSemanal(empresaId, file, anio || null, semana || null));
    const subirBdd = (file) => ejecutar(() => importarBddPasajeros(empresaId, file));
    const subirPlanilla = (file) =>
        ejecutar(() => importarPlanillaInterna(empresaId, file, anio || null, semana || null));
    const procesarTexto = () =>
        ejecutar(() => importarNominaTexto(empresaId, texto, anio || null, semana || null));

    const descargar = async () => {
        if (!empresaId || !anio || !semana) {
            setError('Indica empresa, año y semana para descargar la planilla.');
            return;
        }
        setError('');
        try {
            await descargarPlanillaHorarios(empresaId, anio, semana);
        } catch {
            setError('No hay planilla para esa semana o falló la descarga.');
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                <CalendarDays className="text-blue-600" /> Nómina semanal
            </h1>
            <p className="text-gray-500 mb-6 text-sm">
                Importa los turnos que envía la empresa cliente (Excel &quot;SEM XX&quot; o texto del correo),
                crúzalos con la BDD de pasajeros y descarga la Planilla de Horarios lista.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <label className="text-sm">
                    Empresa cliente
                    <select
                        value={empresaId}
                        onChange={(e) => setEmpresaId(e.target.value)}
                        className="mt-1 w-full border rounded-lg p-2 bg-white"
                    >
                        <option value="">Seleccionar…</option>
                        {empresas.map((e) => (
                            <option key={e.id} value={e.id}>{e.nombre}</option>
                        ))}
                    </select>
                </label>
                <label className="text-sm">
                    Año
                    <input type="number" value={anio} onChange={(e) => setAnio(e.target.value)}
                        className="mt-1 w-full border rounded-lg p-2" />
                </label>
                <label className="text-sm">
                    Semana (vacío = detectar del archivo)
                    <input type="number" min="1" max="53" value={semana}
                        onChange={(e) => setSemana(e.target.value)}
                        className="mt-1 w-full border rounded-lg p-2" placeholder="ej: 29" />
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <h2 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                        <CalendarDays size={16} /> 1. Nómina de turnos (SEM XX.xlsx)
                    </h2>
                    <Dropzone onFile={subirNomina} disabled={cargando}
                        label="Arrastra aquí el Excel semanal que envía la empresa" />
                </div>
                <div>
                    <h2 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                        <Users size={16} /> BDD de pasajeros (Nombre|Teléfono|Dirección|Comuna)
                    </h2>
                    <Dropzone onFile={subirBdd} disabled={cargando}
                        label="Arrastra aquí tu planilla histórica para poblar/actualizar la BDD" />
                </div>
                <div>
                    <h2 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                        <ClipboardList size={16} /> Planilla de horarios (hojas Mañana/Tarde/Noche)
                    </h2>
                    <Dropzone onFile={subirPlanilla} disabled={cargando}
                        label="Arrastra aquí una Planilla de horarios ya armada para cargarla como nómina" />
                </div>
            </div>

            <div className="mb-6">
                <h2 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                    <ClipboardPaste size={16} /> …o pega el texto del correo con los turnos
                </h2>
                <textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    rows={5}
                    placeholder={'Mantención\nAlberto Bracho turno noche.\nCalidad\nTurno día\nAndrea Gallardo…'}
                    className="w-full border rounded-lg p-3 text-sm"
                />
                <button
                    onClick={procesarTexto}
                    disabled={cargando || !texto.trim()}
                    className="mt-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
                >
                    Procesar texto
                </button>
            </div>

            {cargando && <p className="text-gray-500 text-sm mb-4">Procesando…</p>}
            {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm mb-4">
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            {resultado && (
                <div className="bg-white border rounded-xl p-4 mb-6 text-sm">
                    <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                        <CheckCircle size={16} />
                        {resultado.tipo === 'BDD'
                            ? 'BDD de pasajeros importada'
                            : `Nómina importada — semana ${resultado.semana} / ${resultado.anio}`}
                    </div>
                    {resultado.tipo === 'BDD' ? (
                        <p>
                            {resultado.pasajerosCreados} pasajeros nuevos, {resultado.pasajerosActualizados} actualizados,{' '}
                            {resultado.sinCambios} sin cambios.
                        </p>
                    ) : (
                        <>
                            <p className="mb-2">
                                {Object.entries(resultado.porTurno || {})
                                    .map(([t, n]) => `${TURNO_LABEL[t] || t}: ${n}`)
                                    .join(' · ')}
                                {' — '}{resultado.conDatos} con datos, {resultado.sinDatos} por completar.
                            </p>
                            {resultado.pendientes?.length > 0 && (
                                <details>
                                    <summary className="cursor-pointer text-amber-700">
                                        {resultado.pendientes.length} personas sin teléfono/dirección (clic para ver)
                                    </summary>
                                    <ul className="list-disc ml-5 mt-1 text-gray-600">
                                        {resultado.pendientes.map((n) => <li key={n}>{n}</li>)}
                                    </ul>
                                </details>
                            )}
                        </>
                    )}
                </div>
            )}

            <button
                onClick={descargar}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
            >
                <Download size={16} /> Descargar Planilla de Horarios (semana {semana || '—'})
            </button>
        </div>
    );
}
