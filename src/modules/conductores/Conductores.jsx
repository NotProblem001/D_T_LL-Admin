import { useEffect, useState } from 'react';
import { UserCog, Plus, Pencil, Power } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Drawer from '../../components/common/Drawer';
import { conductoresApi } from '../../services/api';
import { Campo, ErrorBox, BadgeActivo, inputClass } from '../maestros/shared';

const CONTRATOS = { FIJO: 'Fijo', VARIABLE: 'Variable', APOYO: 'Apoyo' };

const FORM_VACIO = {
    rutConductor: '',
    nombreCompleto: '',
    telefono: '',
    email: '',
    tipoContrato: 'FIJO',
    tarifaPorViaje: '',
    tipoLicencia: '',
    fechaVencimientoLicencia: '',
    observaciones: '',
    pin: '',
};

export default function Conductores() {
    const [conductores, setConductores] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [drawerAbierto, setDrawerAbierto] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState(FORM_VACIO);
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState('');

    const cargar = async () => {
        setCargando(true);
        setError('');
        try {
            setConductores(await conductoresApi.listar());
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudieron cargar los conductores.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
    }, []);

    const abrirNuevo = () => {
        setEditando(null);
        setForm(FORM_VACIO);
        setErrorForm('');
        setDrawerAbierto(true);
    };

    const abrirEdicion = (c) => {
        setEditando(c);
        setForm({
            rutConductor: c.rutConductor || '',
            nombreCompleto: c.nombreCompleto || '',
            telefono: c.telefono || '',
            email: c.email || '',
            tipoContrato: c.tipoContrato || 'FIJO',
            tarifaPorViaje: c.tarifaPorViaje ?? '',
            tipoLicencia: c.tipoLicencia || '',
            fechaVencimientoLicencia: c.fechaVencimientoLicencia || '',
            observaciones: c.observaciones || '',
            pin: '',
        });
        setErrorForm('');
        setDrawerAbierto(true);
    };

    const actualizarCampo = (campo) => (e) =>
        setForm((prev) => ({ ...prev, [campo]: e.target.value }));

    const guardar = async (e) => {
        e.preventDefault();
        setErrorForm('');
        setGuardando(true);
        const payload = {
            ...form,
            tarifaPorViaje: form.tarifaPorViaje === '' ? null : Number(form.tarifaPorViaje),
            fechaVencimientoLicencia: form.fechaVencimientoLicencia || null,
            pin: form.pin || null,
        };
        try {
            if (editando) {
                await conductoresApi.actualizar(editando.id, payload);
            } else {
                await conductoresApi.crear(payload);
            }
            setDrawerAbierto(false);
            await cargar();
        } catch (err) {
            setErrorForm(err.response?.data?.error || 'No se pudo guardar el conductor.');
        } finally {
            setGuardando(false);
        }
    };

    const cambiarActivo = async (c) => {
        const accion = c.activo ? 'desactivar' : 'activar';
        if (!window.confirm(`¿Seguro que quieres ${accion} a ${c.nombreCompleto}?`)) return;
        setError('');
        try {
            await conductoresApi.cambiarActivo(c.id, !c.activo);
            await cargar();
        } catch (e) {
            setError(e.response?.data?.error || `No se pudo ${accion} el conductor.`);
        }
    };

    const columns = [
        {
            header: 'Conductor',
            cell: (row) => (
                <div>
                    <div className="font-medium">{row.nombreCompleto}</div>
                    <div className="text-xs text-gray-500">{row.rutConductor}</div>
                </div>
            ),
        },
        {
            header: 'Contacto',
            cell: (row) => (
                <div>
                    <div>{row.telefono || '—'}</div>
                    <div className="text-xs text-gray-500">{row.email || ''}</div>
                </div>
            ),
        },
        {
            header: 'Licencia',
            width: '150px',
            cell: (row) => (
                <div>
                    <div>{row.tipoLicencia || '—'}</div>
                    {row.fechaVencimientoLicencia && (
                        <div className={row.licenciaVencida ? 'text-xs text-red-600 font-medium' : 'text-xs text-gray-500'}>
                            {row.licenciaVencida ? 'Vencida ' : 'Vence '}
                            {row.fechaVencimientoLicencia}
                        </div>
                    )}
                </div>
            ),
        },
        { header: 'Contrato', width: '100px', cell: (row) => CONTRATOS[row.tipoContrato] || '—' },
        {
            header: 'PIN app',
            width: '100px',
            cell: (row) =>
                row.tienePin ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        Configurado
                    </span>
                ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                        Sin PIN
                    </span>
                ),
        },
        { header: 'Activo', width: '90px', cell: (row) => <BadgeActivo activo={row.activo} /> },
        {
            header: '',
            width: '90px',
            cell: (row) => (
                <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => abrirEdicion(row)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                        title="Editar"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={() => cambiarActivo(row)}
                        className="p-1.5 rounded hover:bg-amber-50 text-amber-600"
                        title={row.activo ? 'Desactivar' : 'Activar'}
                    >
                        <Power size={16} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                        <UserCog className="text-blue-600" /> Conductores
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Ficha de cada conductor: contacto, licencia, contrato y PIN de acceso a la app.
                    </p>
                </div>
                <button
                    onClick={abrirNuevo}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                    <Plus size={16} /> Nuevo conductor
                </button>
            </div>

            <ErrorBox mensaje={error} />

            <DataTable columns={columns} data={conductores} isLoading={cargando} onRowClick={abrirEdicion} />

            <Drawer
                isOpen={drawerAbierto}
                onClose={() => setDrawerAbierto(false)}
                title={editando ? `Editar ${editando.nombreCompleto}` : 'Nuevo conductor'}
            >
                <form onSubmit={guardar}>
                    <Campo label="Nombre completo *">
                        <input
                            value={form.nombreCompleto}
                            onChange={actualizarCampo('nombreCompleto')}
                            required
                            className={inputClass}
                        />
                    </Campo>
                    <Campo label="RUT *">
                        <input
                            value={form.rutConductor}
                            onChange={actualizarCampo('rutConductor')}
                            placeholder="12.345.678-9"
                            required
                            className={inputClass}
                        />
                    </Campo>
                    <div className="grid grid-cols-2 gap-3">
                        <Campo label="Teléfono">
                            <input
                                value={form.telefono}
                                onChange={actualizarCampo('telefono')}
                                placeholder="+56 9 1234 5678"
                                className={inputClass}
                            />
                        </Campo>
                        <Campo label="Email">
                            <input
                                type="email"
                                value={form.email}
                                onChange={actualizarCampo('email')}
                                className={inputClass}
                            />
                        </Campo>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Campo label="Tipo de contrato">
                            <select
                                value={form.tipoContrato}
                                onChange={actualizarCampo('tipoContrato')}
                                className={inputClass}
                            >
                                {Object.entries(CONTRATOS).map(([valor, etiqueta]) => (
                                    <option key={valor} value={valor}>{etiqueta}</option>
                                ))}
                            </select>
                        </Campo>
                        <Campo label="Tarifa por viaje (CLP)">
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.tarifaPorViaje}
                                onChange={actualizarCampo('tarifaPorViaje')}
                                className={inputClass}
                            />
                        </Campo>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Campo label="Tipo de licencia">
                            <input
                                value={form.tipoLicencia}
                                onChange={actualizarCampo('tipoLicencia')}
                                placeholder="A2, A3…"
                                className={inputClass}
                            />
                        </Campo>
                        <Campo label="Vencimiento licencia">
                            <input
                                type="date"
                                value={form.fechaVencimientoLicencia}
                                onChange={actualizarCampo('fechaVencimientoLicencia')}
                                className={inputClass}
                            />
                        </Campo>
                    </div>
                    <Campo label={editando ? 'PIN de acceso (vacío = mantener actual)' : 'PIN de acceso (4-6 dígitos)'}>
                        <input
                            type="password"
                            inputMode="numeric"
                            pattern="\d{4,6}"
                            value={form.pin}
                            onChange={actualizarCampo('pin')}
                            placeholder={editando ? '••••' : '1234'}
                            className={inputClass}
                        />
                    </Campo>
                    <Campo label="Observaciones">
                        <textarea
                            value={form.observaciones}
                            onChange={actualizarCampo('observaciones')}
                            rows={3}
                            className={inputClass}
                        />
                    </Campo>

                    <ErrorBox mensaje={errorForm} />

                    <button
                        type="submit"
                        disabled={guardando}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                    >
                        {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear conductor'}
                    </button>
                </form>
            </Drawer>
        </div>
    );
}
