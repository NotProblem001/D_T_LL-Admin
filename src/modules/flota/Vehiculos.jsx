import { useEffect, useState } from 'react';
import { Truck, Plus, Pencil, Power } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Drawer from '../../components/common/Drawer';
import { vehiculosApi, listarConductores } from '../../services/api';
import { Campo, ErrorBox, BadgeActivo, inputClass } from '../maestros/shared';

const ESTADOS = {
    DISPONIBLE: 'Disponible',
    EN_MANTENCION: 'En mantención',
    FUERA_DE_SERVICIO: 'Fuera de servicio',
};

const FORM_VACIO = {
    patente: '',
    marca: '',
    modelo: '',
    anio: '',
    capacidadPasajeros: '',
    tipoVehiculo: '',
    estado: 'DISPONIBLE',
    conductorHabitualId: '',
    kilometraje: '',
    fechaRevisionTecnica: '',
    fechaPermisoCirculacion: '',
    fechaVencimientoSeguro: '',
    observaciones: '',
};

export default function Vehiculos() {
    const [vehiculos, setVehiculos] = useState([]);
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
            setVehiculos(await vehiculosApi.listar());
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudieron cargar los vehículos.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
        listarConductores().then(setConductores).catch(() => setConductores([]));
    }, []);

    const abrirNuevo = () => {
        setEditando(null);
        setForm(FORM_VACIO);
        setErrorForm('');
        setDrawerAbierto(true);
    };

    const abrirEdicion = (v) => {
        setEditando(v);
        setForm({
            patente: v.patente || '',
            marca: v.marca || '',
            modelo: v.modelo || '',
            anio: v.anio ?? '',
            capacidadPasajeros: v.capacidadPasajeros ?? '',
            tipoVehiculo: v.tipoVehiculo || '',
            estado: v.estado || 'DISPONIBLE',
            conductorHabitualId: v.conductorHabitualId || '',
            kilometraje: v.kilometraje ?? '',
            fechaRevisionTecnica: v.fechaRevisionTecnica || '',
            fechaPermisoCirculacion: v.fechaPermisoCirculacion || '',
            fechaVencimientoSeguro: v.fechaVencimientoSeguro || '',
            observaciones: v.observaciones || '',
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
            anio: form.anio === '' ? null : Number(form.anio),
            capacidadPasajeros: form.capacidadPasajeros === '' ? null : Number(form.capacidadPasajeros),
            kilometraje: form.kilometraje === '' ? null : Number(form.kilometraje),
            conductorHabitualId: form.conductorHabitualId || null,
            fechaRevisionTecnica: form.fechaRevisionTecnica || null,
            fechaPermisoCirculacion: form.fechaPermisoCirculacion || null,
            fechaVencimientoSeguro: form.fechaVencimientoSeguro || null,
        };
        try {
            if (editando) {
                await vehiculosApi.actualizar(editando.id, payload);
            } else {
                await vehiculosApi.crear(payload);
            }
            setDrawerAbierto(false);
            await cargar();
        } catch (err) {
            setErrorForm(err.response?.data?.error || 'No se pudo guardar el vehículo.');
        } finally {
            setGuardando(false);
        }
    };

    const cambiarActivo = async (v) => {
        const accion = v.activo ? 'desactivar' : 'activar';
        if (!window.confirm(`¿Seguro que quieres ${accion} el vehículo ${v.patente}?`)) return;
        setError('');
        try {
            await vehiculosApi.cambiarActivo(v.id, !v.activo);
            await cargar();
        } catch (e) {
            setError(e.response?.data?.error || `No se pudo ${accion} el vehículo.`);
        }
    };

    const columns = [
        { header: 'Patente', accessor: 'patente', width: '110px' },
        {
            header: 'Vehículo',
            sortValue: (row) => [row.marca, row.modelo].filter(Boolean).join(' '),
            cell: (row) => (
                <div>
                    <div className="font-medium">
                        {[row.marca, row.modelo].filter(Boolean).join(' ') || '—'}
                    </div>
                    <div className="text-xs text-gray-500">
                        {[row.tipoVehiculo, row.anio].filter(Boolean).join(' · ')}
                    </div>
                </div>
            ),
        },
        { header: 'Capacidad', width: '90px', sortKey: 'capacidadPasajeros', cell: (row) => `${row.capacidadPasajeros} pax` },
        { header: 'Estado', width: '130px', sortKey: 'estado', cell: (row) => ESTADOS[row.estado] || row.estado },
        {
            header: 'Documentos',
            width: '120px',
            sortKey: 'documentosVencidos',
            cell: (row) =>
                row.documentosVencidos ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                        Vencidos
                    </span>
                ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        Al día
                    </span>
                ),
        },
        { header: 'Conductor habitual', sortKey: 'conductorHabitualNombre', cell: (row) => row.conductorHabitualNombre || '—' },
        { header: 'Activo', width: '90px', sortKey: 'activo', cell: (row) => <BadgeActivo activo={row.activo} /> },
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
                        <Truck className="text-dtll-blue" /> Flota de Vehículos
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Ficha de cada vehículo: capacidad, estado y vencimientos de documentos.
                    </p>
                </div>
                <button
                    onClick={abrirNuevo}
                    className="flex items-center gap-2 bg-dtll-blue hover:bg-dtll-blueDark text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                    <Plus size={16} /> Nuevo vehículo
                </button>
            </div>

            <ErrorBox mensaje={error} />

            <DataTable columns={columns} data={vehiculos} isLoading={cargando} onRowClick={abrirEdicion} />

            <Drawer
                isOpen={drawerAbierto}
                onClose={() => setDrawerAbierto(false)}
                title={editando ? `Editar ${editando.patente}` : 'Nuevo vehículo'}
            >
                <form onSubmit={guardar}>
                    <Campo label="Patente *">
                        <input
                            value={form.patente}
                            onChange={actualizarCampo('patente')}
                            placeholder="JKLM12"
                            required
                            className={inputClass}
                        />
                    </Campo>
                    <div className="grid grid-cols-2 gap-3">
                        <Campo label="Marca">
                            <input value={form.marca} onChange={actualizarCampo('marca')} className={inputClass} />
                        </Campo>
                        <Campo label="Modelo">
                            <input value={form.modelo} onChange={actualizarCampo('modelo')} className={inputClass} />
                        </Campo>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Campo label="Año">
                            <input
                                type="number"
                                min="1990"
                                max="2100"
                                value={form.anio}
                                onChange={actualizarCampo('anio')}
                                className={inputClass}
                            />
                        </Campo>
                        <Campo label="Capacidad (pasajeros) *">
                            <input
                                type="number"
                                min="1"
                                value={form.capacidadPasajeros}
                                onChange={actualizarCampo('capacidadPasajeros')}
                                required
                                className={inputClass}
                            />
                        </Campo>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Campo label="Tipo de vehículo">
                            <input
                                value={form.tipoVehiculo}
                                onChange={actualizarCampo('tipoVehiculo')}
                                placeholder="Van, Minibús…"
                                className={inputClass}
                            />
                        </Campo>
                        <Campo label="Estado">
                            <select value={form.estado} onChange={actualizarCampo('estado')} className={inputClass}>
                                {Object.entries(ESTADOS).map(([valor, etiqueta]) => (
                                    <option key={valor} value={valor}>{etiqueta}</option>
                                ))}
                            </select>
                        </Campo>
                    </div>
                    <Campo label="Conductor habitual">
                        <select
                            value={form.conductorHabitualId}
                            onChange={actualizarCampo('conductorHabitualId')}
                            className={inputClass}
                        >
                            <option value="">— Sin asignar —</option>
                            {conductores.map((c) => (
                                <option key={c.id} value={c.id}>{c.nombreCompleto}</option>
                            ))}
                        </select>
                    </Campo>
                    <Campo label="Kilometraje">
                        <input
                            type="number"
                            min="0"
                            value={form.kilometraje}
                            onChange={actualizarCampo('kilometraje')}
                            className={inputClass}
                        />
                    </Campo>
                    <Campo label="Revisión técnica (vencimiento)">
                        <input
                            type="date"
                            value={form.fechaRevisionTecnica}
                            onChange={actualizarCampo('fechaRevisionTecnica')}
                            className={inputClass}
                        />
                    </Campo>
                    <Campo label="Permiso de circulación (vencimiento)">
                        <input
                            type="date"
                            value={form.fechaPermisoCirculacion}
                            onChange={actualizarCampo('fechaPermisoCirculacion')}
                            className={inputClass}
                        />
                    </Campo>
                    <Campo label="Seguro (vencimiento)">
                        <input
                            type="date"
                            value={form.fechaVencimientoSeguro}
                            onChange={actualizarCampo('fechaVencimientoSeguro')}
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
                        className="w-full bg-dtll-blue hover:bg-dtll-blueDark disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                    >
                        {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear vehículo'}
                    </button>
                </form>
            </Drawer>
        </div>
    );
}
