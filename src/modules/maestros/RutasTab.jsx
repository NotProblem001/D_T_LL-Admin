import { useEffect, useState } from 'react';
import { Plus, Pencil, Power } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Drawer from '../../components/common/Drawer';
import {
    rutasApi,
    sectoresApi,
    vehiculosApi,
    listarConductores,
    listarEmpresasAdmin,
} from '../../services/api';
import { Campo, ErrorBox, BadgeActivo, MultiCheck, inputClass } from './shared';

const FORM_VACIO = {
    empresaId: '',
    nombre: '',
    descripcion: '',
    sectorIds: [],
    conductorHabitualId: '',
    vehiculoHabitualId: '',
    grupoWhatsapp: '',
};

const nombreEmpresa = (e) => e.nombreFantasia || e.razonSocial || e.rutFiscal;

export default function RutasTab() {
    const [rutas, setRutas] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [sectores, setSectores] = useState([]);
    const [conductores, setConductores] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
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
            setRutas(await rutasApi.listar());
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudieron cargar las rutas.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
        listarEmpresasAdmin().then(setEmpresas).catch(() => setEmpresas([]));
        sectoresApi.listar().then(setSectores).catch(() => setSectores([]));
        listarConductores().then(setConductores).catch(() => setConductores([]));
        vehiculosApi.listar().then(setVehiculos).catch(() => setVehiculos([]));
    }, []);

    const abrirNueva = () => {
        setEditando(null);
        setForm({ ...FORM_VACIO, empresaId: empresas[0]?.id || '' });
        setErrorForm('');
        setDrawerAbierto(true);
    };

    const abrirEdicion = (r) => {
        setEditando(r);
        setForm({
            empresaId: r.empresaId || '',
            nombre: r.nombre || '',
            descripcion: r.descripcion || '',
            sectorIds: (r.sectores || []).map((s) => s.id),
            conductorHabitualId: r.conductorHabitualId || '',
            vehiculoHabitualId: r.vehiculoHabitualId || '',
            grupoWhatsapp: r.grupoWhatsapp || '',
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
            conductorHabitualId: form.conductorHabitualId || null,
            vehiculoHabitualId: form.vehiculoHabitualId || null,
        };
        try {
            if (editando) {
                await rutasApi.actualizar(editando.id, payload);
            } else {
                await rutasApi.crear(payload);
            }
            setDrawerAbierto(false);
            await cargar();
        } catch (err) {
            setErrorForm(err.response?.data?.error || 'No se pudo guardar la ruta.');
        } finally {
            setGuardando(false);
        }
    };

    const cambiarActivo = async (r) => {
        const accion = r.activo ? 'desactivar' : 'activar';
        if (!window.confirm(`¿Seguro que quieres ${accion} la ruta "${r.nombre}"?`)) return;
        try {
            await rutasApi.cambiarActivo(r.id, !r.activo);
            await cargar();
        } catch (e) {
            setError(e.response?.data?.error || `No se pudo ${accion} la ruta.`);
        }
    };

    const columns = [
        { header: 'Ruta', sortKey: 'nombre', cell: (row) => <span className="font-medium">{row.nombre}</span> },
        {
            header: 'Sectores',
            sortValue: (row) => (row.sectores || []).length,
            cell: (row) =>
                (row.sectores || []).length
                    ? (row.sectores || []).map((s) => s.nombre).join(', ')
                    : '—',
        },
        { header: 'Conductor habitual', sortKey: 'conductorHabitualNombre', cell: (row) => row.conductorHabitualNombre || '—' },
        { header: 'Vehículo habitual', width: '130px', sortKey: 'vehiculoHabitualPatente', cell: (row) => row.vehiculoHabitualPatente || '—' },
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
            <div className="flex justify-end mb-4">
                <button
                    onClick={abrirNueva}
                    className="flex items-center gap-2 bg-dtll-blue hover:bg-dtll-blueDark text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                    <Plus size={16} /> Nueva ruta
                </button>
            </div>

            <ErrorBox mensaje={error} />
            <DataTable columns={columns} data={rutas} isLoading={cargando} onRowClick={abrirEdicion} />

            <Drawer
                isOpen={drawerAbierto}
                onClose={() => setDrawerAbierto(false)}
                title={editando ? 'Editar ruta' : 'Nueva ruta'}
            >
                <form onSubmit={guardar}>
                    <Campo label="Empresa cliente *">
                        <select
                            value={form.empresaId}
                            onChange={actualizarCampo('empresaId')}
                            required
                            className={inputClass}
                        >
                            <option value="">— Selecciona —</option>
                            {empresas.map((e) => (
                                <option key={e.id} value={e.id}>{nombreEmpresa(e)}</option>
                            ))}
                        </select>
                    </Campo>
                    <Campo label="Nombre *">
                        <input
                            value={form.nombre}
                            onChange={actualizarCampo('nombre')}
                            placeholder="Santiago, Lampa, Colina-Batuco-Lampa…"
                            required
                            className={inputClass}
                        />
                    </Campo>
                    <Campo label="Descripción">
                        <textarea
                            value={form.descripcion}
                            onChange={actualizarCampo('descripcion')}
                            rows={2}
                            className={inputClass}
                        />
                    </Campo>
                    <Campo label="Sectores que agrupa">
                        <MultiCheck
                            opciones={sectores}
                            seleccionados={form.sectorIds}
                            onChange={(ids) => setForm((p) => ({ ...p, sectorIds: ids }))}
                        />
                    </Campo>
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
                    <Campo label="Vehículo habitual">
                        <select
                            value={form.vehiculoHabitualId}
                            onChange={actualizarCampo('vehiculoHabitualId')}
                            className={inputClass}
                        >
                            <option value="">— Sin asignar —</option>
                            {vehiculos.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.patente} ({v.capacidadPasajeros} pax)
                                </option>
                            ))}
                        </select>
                    </Campo>
                    <Campo label="Grupo de WhatsApp (nombre o enlace)">
                        <input
                            value={form.grupoWhatsapp}
                            onChange={actualizarCampo('grupoWhatsapp')}
                            placeholder="Entrada mañana Santiago / https://chat.whatsapp.com/…"
                            className={inputClass}
                        />
                    </Campo>

                    <ErrorBox mensaje={errorForm} />

                    <button
                        type="submit"
                        disabled={guardando}
                        className="w-full bg-dtll-blue hover:bg-dtll-blueDark disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                    >
                        {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear ruta'}
                    </button>
                </form>
            </Drawer>
        </div>
    );
}
