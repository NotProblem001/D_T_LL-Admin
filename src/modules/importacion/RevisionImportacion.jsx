import { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    FileSearch, Upload, Check, X, UserPlus, Building2, FileSpreadsheet,
    AlertTriangle, Info,
} from 'lucide-react';
import {
    obtenerEmpresas,
    previewImportacion,
    previewImportacionTexto,
    listarImportaciones,
    obtenerImportacion,
    resolverRegistroImportacion,
    confirmarImportacion,
    descartarImportacion,
    listarPasajerosEmpresa,
} from '../../services/api';
import { Campo, ErrorBox, inputClass } from '../maestros/shared';

const TIPOS = {
    NOMINA: 'Nómina del cliente (SEM)',
    PLANILLA: 'Planilla interna de horarios',
    TEXTO: 'Texto pegado desde correo',
};

// Qué estructura debe tener cada archivo, para que el usuario sepa de antemano
// si su Excel calza con lo que el sistema espera leer.
const FORMATO_ESPERADO = {
    NOMINA: {
        titulo: 'Formato esperado — Nómina del cliente',
        detalle: 'Una hoja con columnas MAÑANA / TARDE / NOCHE (por ejemplo «SEM 29.xlsx»). Los nombres de los pasajeros van listados bajo cada columna de turno.',
    },
    PLANILLA: {
        titulo: 'Formato esperado — Planilla interna',
        detalle: 'Hojas llamadas Mañana / Tarde / Noche. Cada hoja con columnas: Nombre · Teléfono · Dirección · Comuna.',
    },
    TEXTO: {
        titulo: 'Formato esperado — Texto del correo',
        detalle: 'Pega el texto tal cual llega en el correo. El turno se detecta por líneas como «Turno noche» y luego los nombres.',
    },
};

const MATCH_BADGES = {
    EXACTO: { texto: 'Encontrado', clase: 'bg-green-50 text-green-700' },
    TOKENS: { texto: 'Encontrado (orden distinto)', clase: 'bg-green-50 text-green-700' },
    SUGERENCIA: { texto: 'Sugerencia', clase: 'bg-amber-50 text-amber-700' },
    NUEVO: { texto: 'Nuevo', clase: 'bg-dtll-blueLight text-dtll-blueDark' },
    DUPLICADO: { texto: 'Duplicado', clase: 'bg-gray-100 text-gray-500' },
    ERROR: { texto: 'Error', clase: 'bg-red-50 text-red-700' },
};

const RESOLUCIONES = {
    PENDIENTE: { texto: 'Pendiente', clase: 'text-amber-600' },
    ACEPTADO: { texto: 'Vinculado', clase: 'text-green-600' },
    NUEVO: { texto: 'Se creará', clase: 'text-dtll-blue' },
    DESCARTADO: { texto: 'Descartado', clase: 'text-gray-400' },
};

function nombreEmpresa(e) {
    return e?.nombre || e?.nombreFantasia || e?.razonSocial || 'Empresa sin nombre';
}

// Banner persistente que deja claro a qué empresa se le importarán los datos.
function EmpresaBanner({ empresa }) {
    if (!empresa) {
        return (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                <AlertTriangle size={16} className="shrink-0" />
                Selecciona una empresa para saber a qué cliente se importarán los datos.
            </div>
        );
    }
    return (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-dtll-blueLight bg-dtll-blueLight/40 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dtll-blue text-white">
                <Building2 size={18} />
            </div>
            <div className="leading-tight">
                <div className="text-xs uppercase tracking-wide text-dtll-blueDark/70">Importando a la empresa</div>
                <div className="text-base font-bold text-dtll-blueDark">{nombreEmpresa(empresa)}</div>
            </div>
        </div>
    );
}

function formatoBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Zona de carga con validación de formato .xlsx y feedback visible de qué se cargó.
function Dropzone({ archivo, onArchivo, onRechazo, error }) {
    const onDrop = useCallback((aceptados, rechazados) => {
        if (rechazados.length > 0) {
            onRechazo('El archivo debe ser una hoja de Excel con extensión .xlsx');
            return;
        }
        if (aceptados[0]) onArchivo(aceptados[0]);
    }, [onArchivo, onRechazo]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        multiple: false,
        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    });

    return (
        <div className="mb-2">
            <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors ${
                    error || isDragReject
                        ? 'border-red-300 bg-red-50'
                        : archivo
                            ? 'border-green-300 bg-green-50'
                            : isDragActive
                                ? 'border-dtll-blue bg-dtll-blueLight/40'
                                : 'border-gray-300 hover:border-dtll-blue hover:bg-gray-50'
                }`}
            >
                <input {...getInputProps()} />
                {archivo ? (
                    <>
                        <FileSpreadsheet size={26} className="text-green-600" />
                        <div className="text-sm font-medium text-green-800">{archivo.name}</div>
                        <div className="text-xs text-green-700">
                            {formatoBytes(archivo.size)} · Listo para analizar
                        </div>
                        <div className="text-xs text-gray-500">Haz clic o arrastra otro archivo para reemplazarlo</div>
                    </>
                ) : (
                    <>
                        <Upload size={26} className={isDragReject ? 'text-red-500' : 'text-gray-400'} />
                        <div className="text-sm font-medium text-gray-700">
                            {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra el Excel o haz clic para elegirlo'}
                        </div>
                        <div className="text-xs text-gray-500">Solo archivos .xlsx</div>
                    </>
                )}
            </div>
            {error && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                    <X size={13} /> {error}
                </div>
            )}
        </div>
    );
}

function FormatoAyuda({ tipo }) {
    const f = FORMATO_ESPERADO[tipo];
    if (!f) return null;
    return (
        <div className="mb-3 flex gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <Info size={14} className="mt-0.5 shrink-0 text-dtll-blue" />
            <div>
                <span className="font-medium text-gray-700">{f.titulo}. </span>
                {f.detalle}
            </div>
        </div>
    );
}

function Chip({ etiqueta, valor, destaca }) {
    return (
        <div className={`px-3 py-2 rounded-lg border text-center ${destaca ? 'border-amber-300 bg-amber-50' : 'bg-white'}`}>
            <div className="text-lg font-bold">{valor}</div>
            <div className="text-xs text-gray-500">{etiqueta}</div>
        </div>
    );
}

export default function RevisionImportacion() {
    const [empresas, setEmpresas] = useState([]);
    const [empresaId, setEmpresaId] = useState('');
    const [tipo, setTipo] = useState('NOMINA');
    const [anio, setAnio] = useState('');
    const [semana, setSemana] = useState('');
    const [archivo, setArchivo] = useState(null);
    const [archivoError, setArchivoError] = useState('');
    const [texto, setTexto] = useState('');
    const [analizando, setAnalizando] = useState(false);

    const [detalle, setDetalle] = useState(null); // { resumen, registros }
    const [historial, setHistorial] = useState([]);
    const [pasajeros, setPasajeros] = useState([]);
    const [seleccionManual, setSeleccionManual] = useState({}); // registroId -> pasajeroId
    const [error, setError] = useState('');
    const [confirmando, setConfirmando] = useState(false);

    useEffect(() => {
        obtenerEmpresas().then((es) => {
            setEmpresas(es);
            if (es.length === 1) setEmpresaId(es[0].id);
        }).catch(() => setEmpresas([]));
    }, []);

    useEffect(() => {
        if (!empresaId) return;
        listarImportaciones(empresaId).then(setHistorial).catch(() => setHistorial([]));
        listarPasajerosEmpresa(empresaId).then(setPasajeros).catch(() => setPasajeros([]));
    }, [empresaId]);

    const analizar = async () => {
        setError('');
        if (!empresaId) {
            setError('Selecciona la empresa.');
            return;
        }
        if (tipo === 'TEXTO' ? !texto.trim() : !archivo) {
            setError(tipo === 'TEXTO' ? 'Pega el texto del correo.' : 'Selecciona el archivo.');
            return;
        }
        setAnalizando(true);
        try {
            const resultado = tipo === 'TEXTO'
                ? await previewImportacionTexto({
                      empresaId,
                      texto,
                      anio: anio ? Number(anio) : null,
                      semana: semana ? Number(semana) : null,
                  })
                : await previewImportacion(empresaId, tipo, archivo, anio, semana);
            setDetalle(resultado);
            setSeleccionManual({});
            listarImportaciones(empresaId).then(setHistorial).catch(() => {});
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo analizar el archivo.');
        } finally {
            setAnalizando(false);
        }
    };

    const abrirImportacion = async (id) => {
        setError('');
        try {
            setDetalle(await obtenerImportacion(id));
            setSeleccionManual({});
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo abrir la importación.');
        }
    };

    const recargarDetalle = async () => {
        if (detalle) {
            setDetalle(await obtenerImportacion(detalle.resumen.id));
        }
    };

    const resolver = async (registro, resolucion, pasajeroId = null) => {
        setError('');
        try {
            await resolverRegistroImportacion(detalle.resumen.id, registro.id, { resolucion, pasajeroId });
            await recargarDetalle();
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo resolver el registro.');
        }
    };

    const confirmar = async () => {
        const nombre = nombreEmpresa(empresaSel);
        if (!window.confirm(`¿Confirmar la importación para «${nombre}»? Se actualizarán pasajeros y la nómina de la semana.`)) return;
        setError('');
        setConfirmando(true);
        try {
            await confirmarImportacion(detalle.resumen.id);
            await recargarDetalle();
            listarImportaciones(empresaId).then(setHistorial).catch(() => {});
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo confirmar.');
        } finally {
            setConfirmando(false);
        }
    };

    const descartar = async () => {
        if (!window.confirm('¿Descartar toda la importación? No se guardará nada.')) return;
        setError('');
        try {
            await descartarImportacion(detalle.resumen.id);
            await recargarDetalle();
            listarImportaciones(empresaId).then(setHistorial).catch(() => {});
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo descartar.');
        }
    };

    const resumen = detalle?.resumen;
    const registros = detalle?.registros || [];
    const pendientes = registros.filter((r) => r.resolucion === 'PENDIENTE').length;
    const esBorrador = resumen?.estado === 'BORRADOR';
    const empresaSel = empresas.find((e) => String(e.id) === String(empresaId));
    // Feedback de lectura del formato tras analizar.
    const sinRegistros = resumen && resumen.totalRegistros === 0;
    const soloErrores = resumen && resumen.totalRegistros > 0 && resumen.totalErrores === resumen.totalRegistros;
    const formatoDudoso = sinRegistros || soloErrores;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                <FileSearch className="text-dtll-blue" /> Revisar importación
            </h1>
            <p className="text-gray-500 text-sm mb-6">
                Analiza el archivo, revisa las coincidencias con la BDD de pasajeros y confirma. Nada se
                guarda hasta que confirmes.
            </p>

            <ErrorBox mensaje={error} />

            <EmpresaBanner empresa={empresaSel} />

            {/* Paso 1: origen */}
            <div className="bg-white border rounded-lg p-4 mb-6">
                <div className="grid md:grid-cols-4 gap-3">
                    <Campo label="Empresa *">
                        <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} className={inputClass}>
                            <option value="">— Selecciona —</option>
                            {empresas.map((e) => (
                                <option key={e.id} value={e.id}>{nombreEmpresa(e)}</option>
                            ))}
                        </select>
                    </Campo>
                    <Campo label="Tipo de origen">
                        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputClass}>
                            {Object.entries(TIPOS).map(([v, t]) => (
                                <option key={v} value={v}>{t}</option>
                            ))}
                        </select>
                    </Campo>
                    <Campo label="Año (opcional)">
                        <input type="number" value={anio} onChange={(e) => setAnio(e.target.value)}
                               placeholder="auto" className={inputClass} />
                    </Campo>
                    <Campo label="Semana (opcional)">
                        <input type="number" min="1" max="53" value={semana} onChange={(e) => setSemana(e.target.value)}
                               placeholder="auto" className={inputClass} />
                    </Campo>
                </div>

                <FormatoAyuda tipo={tipo} />

                {tipo === 'TEXTO' ? (
                    <Campo label="Texto del correo">
                        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={6}
                                  placeholder={'Turno noche\nAlberto Bracho\n…'} className={inputClass} />
                    </Campo>
                ) : (
                    <Dropzone
                        archivo={archivo}
                        error={archivoError}
                        onArchivo={(f) => { setArchivo(f); setArchivoError(''); }}
                        onRechazo={(msg) => { setArchivo(null); setArchivoError(msg); }}
                    />
                )}

                <button
                    onClick={analizar}
                    disabled={analizando}
                    className="flex items-center gap-2 bg-dtll-blue hover:bg-dtll-blueDark disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                    <Upload size={16} /> {analizando ? 'Analizando…' : 'Analizar (sin guardar)'}
                </button>
            </div>

            {/* Historial breve */}
            {!detalle && historial.length > 0 && (
                <div className="bg-white border rounded-lg p-4 mb-6">
                    <h2 className="font-semibold text-gray-700 mb-2 text-sm">Importaciones recientes</h2>
                    <ul className="divide-y text-sm">
                        {historial.slice(0, 8).map((h) => (
                            <li key={h.id} className="py-2 flex items-center justify-between">
                                <button onClick={() => abrirImportacion(h.id)} className="text-dtll-blue hover:underline text-left">
                                    {TIPOS[h.tipo]} · semana {h.semana}/{h.anio} · {h.totalRegistros} registros
                                </button>
                                <span className="text-xs text-gray-500">{h.estado}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Paso 2: revisión */}
            {detalle && (
                <>
                    {/* Feedback de si el formato de la hoja se leyó bien */}
                    {formatoDudoso ? (
                        <div className="mb-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                            <div>
                                <div className="font-semibold">
                                    {sinRegistros
                                        ? 'No se leyó ninguna fila del archivo.'
                                        : 'Todas las filas dieron error.'}
                                </div>
                                <div className="text-xs">
                                    Revisa que el archivo tenga el formato esperado: {FORMATO_ESPERADO[resumen.tipo]?.detalle}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800">
                            <Check size={16} className="shrink-0" />
                            Archivo leído correctamente: {resumen.totalRegistros} fila{resumen.totalRegistros === 1 ? '' : 's'} detectada{resumen.totalRegistros === 1 ? '' : 's'}
                            {resumen.totalErrores > 0 && ` · ${resumen.totalErrores} con error`}.
                        </div>
                    )}

                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
                        <Chip etiqueta="Registros" valor={resumen.totalRegistros} />
                        <Chip etiqueta="Encontrados" valor={resumen.totalEncontrados} />
                        <Chip etiqueta="Sugerencias" valor={resumen.totalSugerencias} destaca={pendientes > 0} />
                        <Chip etiqueta="Nuevos" valor={resumen.totalNuevos} />
                        <Chip etiqueta="Duplicados" valor={resumen.totalDuplicados} />
                        <Chip etiqueta="Errores" valor={resumen.totalErrores} />
                    </div>

                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-gray-600">
                            <span className="inline-flex items-center gap-1 font-medium text-dtll-blueDark">
                                <Building2 size={14} /> {nombreEmpresa(empresaSel)}
                            </span>{' · '}
                            {resumen.nombreArchivo} · semana {resumen.semana}/{resumen.anio} ·{' '}
                            <span className="font-medium">{resumen.estado}</span>
                        </div>
                        {esBorrador && (
                            <div className="flex gap-2">
                                <button
                                    onClick={descartar}
                                    className="flex items-center gap-1.5 border text-gray-600 hover:bg-gray-50 text-sm font-medium px-3 py-2 rounded-lg"
                                >
                                    <X size={15} /> Descartar todo
                                </button>
                                <button
                                    onClick={confirmar}
                                    disabled={confirmando || pendientes > 0}
                                    title={pendientes > 0 ? `${pendientes} sugerencias sin resolver` : ''}
                                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
                                >
                                    <Check size={15} />
                                    {confirmando ? 'Confirmando…'
                                        : pendientes > 0 ? `Resuelve ${pendientes} pendientes` : 'Confirmar importación'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-white border rounded-lg overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase text-gray-500 border-b bg-gray-50">
                                    <th className="p-3">Origen</th>
                                    <th className="p-3">Nombre importado</th>
                                    <th className="p-3">Turno</th>
                                    <th className="p-3">Datos</th>
                                    <th className="p-3">Match</th>
                                    <th className="p-3">Resolución</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registros.map((r) => {
                                    const badge = MATCH_BADGES[r.tipoMatch] || MATCH_BADGES.ERROR;
                                    const res = RESOLUCIONES[r.resolucion];
                                    return (
                                        <tr key={r.id} className="border-b last:border-0 align-top">
                                            <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                                                {r.hojaOrigen || '—'}{r.filaOrigen ? ` · f${r.filaOrigen}` : ''}
                                            </td>
                                            <td className="p-3">
                                                <div className="font-medium">{r.nombreOriginal}</div>
                                                {r.mensajeError && (
                                                    <div className="text-xs text-red-600">{r.mensajeError}</div>
                                                )}
                                                {r.usoTransporteDetectado && (
                                                    <div className="text-xs text-amber-700">
                                                        Detectado: {r.usoTransporteDetectado === 'NO'
                                                            ? 'no utiliza transporte' : 'uso ocasional'}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3 whitespace-nowrap">{r.turno || '—'}</td>
                                            <td className="p-3 text-xs text-gray-500">
                                                {[r.telefono, r.comuna].filter(Boolean).join(' · ') || '—'}
                                            </td>
                                            <td className="p-3">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.clase}`}>
                                                    {badge.texto}
                                                </span>
                                                {r.pasajeroNombre && (
                                                    <div className="text-xs text-gray-500 mt-1">→ {r.pasajeroNombre}</div>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <div className={`text-xs font-medium mb-1 ${res.clase}`}>{res.texto}</div>
                                                {esBorrador && (
                                                    <div className="flex flex-col gap-1.5">
                                                        {r.tipoMatch === 'SUGERENCIA' && r.resolucion === 'PENDIENTE' && (
                                                            <>
                                                                {(r.candidatos || []).map((c) => (
                                                                    <button
                                                                        key={c.pasajeroId}
                                                                        onClick={() => resolver(r, 'ACEPTADO', c.pasajeroId)}
                                                                        className="text-left text-xs px-2 py-1 rounded border border-green-200 hover:bg-green-50 text-green-700"
                                                                    >
                                                                        ✓ {c.nombre} ({Math.round(c.score * 100)}%)
                                                                    </button>
                                                                ))}
                                                                <button
                                                                    onClick={() => resolver(r, 'NUEVO')}
                                                                    className="text-left text-xs px-2 py-1 rounded border border-dtll-blueLight hover:bg-dtll-blueLight text-dtll-blueDark"
                                                                >
                                                                    <UserPlus size={11} className="inline mr-1" />Crear pasajero nuevo
                                                                </button>
                                                            </>
                                                        )}
                                                        {(r.tipoMatch === 'NUEVO' || r.resolucion !== 'PENDIENTE') && r.tipoMatch !== 'ERROR' && r.tipoMatch !== 'DUPLICADO' && (
                                                            <div className="flex items-center gap-1">
                                                                <select
                                                                    value={seleccionManual[r.id] || ''}
                                                                    onChange={(e) =>
                                                                        setSeleccionManual((p) => ({ ...p, [r.id]: e.target.value }))
                                                                    }
                                                                    className="text-xs border rounded p-1 max-w-[180px]"
                                                                >
                                                                    <option value="">Vincular a existente…</option>
                                                                    {pasajeros.map((p) => (
                                                                        <option key={p.id} value={p.id}>{p.nombreCompleto}</option>
                                                                    ))}
                                                                </select>
                                                                {seleccionManual[r.id] && (
                                                                    <button
                                                                        onClick={() => resolver(r, 'ACEPTADO', seleccionManual[r.id])}
                                                                        className="text-xs px-2 py-1 rounded bg-green-600 text-white"
                                                                    >
                                                                        OK
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                        {r.resolucion !== 'DESCARTADO' && (
                                                            <button
                                                                onClick={() => resolver(r, 'DESCARTADO')}
                                                                className="text-left text-xs text-gray-400 hover:text-gray-600"
                                                            >
                                                                Descartar fila
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
