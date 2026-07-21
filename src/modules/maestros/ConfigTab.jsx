import { useEffect, useState } from 'react';
import { Plus, Pencil, Power, Check } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Drawer from '../../components/common/Drawer';
import {
    estadosAsistenciaApi,
    listarConfiguraciones,
    actualizarConfiguracion,
} from '../../services/api';
import { Campo, ErrorBox, BadgeActivo, inputClass } from './shared';

const FORM_VACIO = { codigo: '', nombre: '', requiereObservacion: false, orden: '' };

export default function ConfigTab() {
    const [estados, setEstados] = useState([]);
    const [configs, setConfigs] = useState([]);
    const [valoresConfig, setValoresConfig] = useState({});
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [drawerAbierto, setDrawerAbierto] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState(FORM_VACIO);
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState('');
    const [guardandoConfig, setGuardandoConfig] = useState('');

    const cargar = async () => {
        setCargando(true);
        setError('');
        try {
            const [ests, confs] = await Promise.all([
                estadosAsistenciaApi.listar(),
                listarConfiguraciones(),
            ]);
            setEstados(ests);
            setConfigs(confs);
            setValoresConfig(Object.fromEntries(confs.map((c) => [c.clave, c.valor])));
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo cargar la configuración.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
    }, []);

    // -------------------------------------------------- estados de asistencia

    const abrirNuevo = () => {
        setEditando(null);
        setForm({ ...FORM_VACIO, orden: estados.length + 1 });
        setErrorForm('');
        setDrawerAbierto(true);
    };

    const abrirEdicion = (est) => {
        setEditando(est);
        setForm({
            codigo: est.codigo || '',
            nombre: est.nombre || '',
            requiereObservacion: Boolean(est.requiereObservacion),
            orden: est.orden ?? '',
        });
        setErrorForm('');
        setDrawerAbierto(true);
    };

    const guardar = async (e) => {
        e.preventDefault();
        setErrorForm('');
        setGuardando(true);
        const payload = {
            ...form,
            orden: form.orden === '' ? null : Number(form.orden),
        };
        try {
            if (editando) {
                await estadosAsistenciaApi.actualizar(editando.id, payload);
            } else {
                await estadosAsistenciaApi.crear(payload);
            }
            setDrawerAbierto(false);
            await cargar();
        } catch (err) {
            setErrorForm(err.response?.data?.error || 'No se pudo guardar el estado.');
        } finally {
            setGuardando(false);
        }
    };

    const cambiarActivo = async (est) => {
        const accion = est.activo ? 'desactivar' : 'activar';
        if (!window.confirm(`¿Seguro que quieres ${accion} el estado "${est.nombre}"?`)) return;
        try {
            await estadosAsistenciaApi.cambiarActivo(est.id, !est.activo);
            await cargar();
        } catch (e) {
            setError(e.response?.data?.error || `No se pudo ${accion} el estado.`);
        }
    };

    const guardarConfig = async (clave) => {
        setGuardandoConfig(clave);
        setError('');
        try {
            await actualizarConfiguracion(clave, valoresConfig[clave]);
            await cargar();
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo guardar el parámetro.');
        } finally {
            setGuardandoConfig('');
        }
    };

    const columnasEstados = [
        { header: 'Orden', width: '70px', accessor: 'orden' },
        { header: 'Código', width: '210px', sortKey: 'codigo', cell: (row) => <code className="text-xs">{row.codigo}</code> },
        { header: 'Nombre', sortKey: 'nombre', cell: (row) => <span className="font-medium">{row.nombre}</span> },
        {
            header: 'Observación',
            width: '120px',
            sortKey: 'requiereObservacion',
            cell: (row) => (row.requiereObservacion ? 'Obligatoria' : 'Opcional'),
        },
        { header: 'Activo', width: '90px', sortKey: 'activo', cell: (row) => <BadgeActivo activo={row.activo} /> },
        {
            header: '',
            width: '90px',
            cell: (row) => (
                <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => abrirEdicion(row)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Editar">
                        <Pencil size={16} />
                    </button>
                    <button onClick={() => cambiarActivo(row)} className="p-1.5 rounded hover:bg-amber-50 text-amber-600" title={row.activo ? 'Desactivar' : 'Activar'}>
                        <Power size={16} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <ErrorBox mensaje={error} />

            <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-700">Estados de asistencia</h2>
                <button
                    onClick={abrirNuevo}
                    className="flex items-center gap-2 bg-dtll-blue hover:bg-dtll-blueDark text-white text-sm font-medium px-3 py-1.5 rounded-lg"
                >
                    <Plus size={14} /> Nuevo estado
                </button>
            </div>
            <DataTable columns={columnasEstados} data={estados} isLoading={cargando} onRowClick={abrirEdicion} />

            <h2 className="font-semibold text-gray-700 mt-8 mb-3">Parámetros de operación</h2>
            <div className="bg-white border rounded-lg divide-y">
                {configs.map((c) => (
                    <div key={c.clave} className="p-4 flex items-center gap-4">
                        <div className="flex-1">
                            <div className="text-sm font-medium">{c.clave}</div>
                            {c.descripcion && (
                                <div className="text-xs text-gray-500 mt-0.5">{c.descripcion}</div>
                            )}
                        </div>
                        <input
                            value={valoresConfig[c.clave] ?? ''}
                            onChange={(e) =>
                                setValoresConfig((prev) => ({ ...prev, [c.clave]: e.target.value }))
                            }
                            className="w-28 border rounded-lg p-2 text-sm text-right"
                        />
                        <button
                            onClick={() => guardarConfig(c.clave)}
                            disabled={guardandoConfig === c.clave || valoresConfig[c.clave] === c.valor}
                            className="p-2 rounded-lg bg-dtll-blue hover:bg-dtll-blueDark disabled:opacity-40 text-white"
                            title="Guardar"
                        >
                            <Check size={16} />
                        </button>
                    </div>
                ))}
                {!cargando && configs.length === 0 && (
                    <div className="p-4 text-sm text-gray-500">No hay parámetros configurados.</div>
                )}
            </div>

            <Drawer
                isOpen={drawerAbierto}
                onClose={() => setDrawerAbierto(false)}
                title={editando ? 'Editar estado de asistencia' : 'Nuevo estado de asistencia'}
            >
                <form onSubmit={guardar}>
                    <Campo label="Nombre *">
                        <input
                            value={form.nombre}
                            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                            placeholder="No fue encontrado…"
                            required
                            className={inputClass}
                        />
                    </Campo>
                    <Campo label="Código *">
                        <input
                            value={form.codigo}
                            onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
                            placeholder="NO_FUE_ENCONTRADO"
                            required
                            className={inputClass}
                        />
                    </Campo>
                    <Campo label="Orden">
                        <input
                            type="number"
                            min="0"
                            value={form.orden}
                            onChange={(e) => setForm((p) => ({ ...p, orden: e.target.value }))}
                            className={inputClass}
                        />
                    </Campo>
                    <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.requiereObservacion}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, requiereObservacion: e.target.checked }))
                            }
                        />
                        <span className="text-gray-700">
                            Observación obligatoria al marcar este estado
                        </span>
                    </label>

                    <ErrorBox mensaje={errorForm} />

                    <button
                        type="submit"
                        disabled={guardando}
                        className="w-full bg-dtll-blue hover:bg-dtll-blueDark disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                    >
                        {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear estado'}
                    </button>
                </form>
            </Drawer>
        </div>
    );
}
