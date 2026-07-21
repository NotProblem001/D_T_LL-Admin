import { useEffect, useState } from 'react';
import { Plus, Pencil, Power } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Drawer from '../../components/common/Drawer';
import { comunasApi, sectoresApi } from '../../services/api';
import { Campo, ErrorBox, BadgeActivo, MultiCheck, inputClass } from './shared';

const FORM_SECTOR_VACIO = { nombre: '', descripcion: '', comunaIds: [] };

export default function GeografiaTab() {
    const [comunas, setComunas] = useState([]);
    const [sectores, setSectores] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    // Drawer de sector
    const [drawerSector, setDrawerSector] = useState(false);
    const [editandoSector, setEditandoSector] = useState(null);
    const [formSector, setFormSector] = useState(FORM_SECTOR_VACIO);

    // Drawer de comuna
    const [drawerComuna, setDrawerComuna] = useState(false);
    const [editandoComuna, setEditandoComuna] = useState(null);
    const [nombreComuna, setNombreComuna] = useState('');

    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState('');

    const cargar = async () => {
        setCargando(true);
        setError('');
        try {
            const [coms, secs] = await Promise.all([comunasApi.listar(), sectoresApi.listar()]);
            setComunas(coms);
            setSectores(secs);
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudieron cargar comunas y sectores.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
    }, []);

    // ------------------------------------------------------------- sectores

    const abrirNuevoSector = () => {
        setEditandoSector(null);
        setFormSector(FORM_SECTOR_VACIO);
        setErrorForm('');
        setDrawerSector(true);
    };

    const abrirEdicionSector = (s) => {
        setEditandoSector(s);
        setFormSector({
            nombre: s.nombre || '',
            descripcion: s.descripcion || '',
            comunaIds: (s.comunas || []).map((c) => c.id),
        });
        setErrorForm('');
        setDrawerSector(true);
    };

    const guardarSector = async (e) => {
        e.preventDefault();
        setErrorForm('');
        setGuardando(true);
        try {
            if (editandoSector) {
                await sectoresApi.actualizar(editandoSector.id, formSector);
            } else {
                await sectoresApi.crear(formSector);
            }
            setDrawerSector(false);
            await cargar();
        } catch (err) {
            setErrorForm(err.response?.data?.error || 'No se pudo guardar el sector.');
        } finally {
            setGuardando(false);
        }
    };

    const cambiarActivoSector = async (s) => {
        const accion = s.activo ? 'desactivar' : 'activar';
        if (!window.confirm(`¿Seguro que quieres ${accion} el sector "${s.nombre}"?`)) return;
        try {
            await sectoresApi.cambiarActivo(s.id, !s.activo);
            await cargar();
        } catch (e) {
            setError(e.response?.data?.error || `No se pudo ${accion} el sector.`);
        }
    };

    // ------------------------------------------------------------- comunas

    const abrirNuevaComuna = () => {
        setEditandoComuna(null);
        setNombreComuna('');
        setErrorForm('');
        setDrawerComuna(true);
    };

    const abrirEdicionComuna = (c) => {
        setEditandoComuna(c);
        setNombreComuna(c.nombre || '');
        setErrorForm('');
        setDrawerComuna(true);
    };

    const guardarComuna = async (e) => {
        e.preventDefault();
        setErrorForm('');
        setGuardando(true);
        try {
            if (editandoComuna) {
                await comunasApi.actualizar(editandoComuna.id, { nombre: nombreComuna });
            } else {
                await comunasApi.crear({ nombre: nombreComuna });
            }
            setDrawerComuna(false);
            await cargar();
        } catch (err) {
            setErrorForm(err.response?.data?.error || 'No se pudo guardar la comuna.');
        } finally {
            setGuardando(false);
        }
    };

    const cambiarActivoComuna = async (c) => {
        const accion = c.activo ? 'desactivar' : 'activar';
        if (!window.confirm(`¿Seguro que quieres ${accion} la comuna "${c.nombre}"?`)) return;
        try {
            await comunasApi.cambiarActivo(c.id, !c.activo);
            await cargar();
        } catch (e) {
            setError(e.response?.data?.error || `No se pudo ${accion} la comuna.`);
        }
    };

    const columnasSectores = [
        { header: 'Sector', sortKey: 'nombre', cell: (row) => <span className="font-medium">{row.nombre}</span> },
        {
            header: 'Comunas',
            sortValue: (row) => (row.comunas || []).length,
            cell: (row) =>
                (row.comunas || []).length
                    ? (row.comunas || []).map((c) => c.nombre).join(', ')
                    : '—',
        },
        { header: 'Activo', width: '90px', sortKey: 'activo', cell: (row) => <BadgeActivo activo={row.activo} /> },
        {
            header: '',
            width: '90px',
            cell: (row) => (
                <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => abrirEdicionSector(row)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Editar">
                        <Pencil size={16} />
                    </button>
                    <button onClick={() => cambiarActivoSector(row)} className="p-1.5 rounded hover:bg-amber-50 text-amber-600" title={row.activo ? 'Desactivar' : 'Activar'}>
                        <Power size={16} />
                    </button>
                </div>
            ),
        },
    ];

    const columnasComunas = [
        { header: 'Comuna', sortKey: 'nombre', cell: (row) => <span className="font-medium">{row.nombre}</span> },
        { header: 'Activo', width: '90px', sortKey: 'activo', cell: (row) => <BadgeActivo activo={row.activo} /> },
        {
            header: '',
            width: '90px',
            cell: (row) => (
                <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => abrirEdicionComuna(row)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Editar">
                        <Pencil size={16} />
                    </button>
                    <button onClick={() => cambiarActivoComuna(row)} className="p-1.5 rounded hover:bg-amber-50 text-amber-600" title={row.activo ? 'Desactivar' : 'Activar'}>
                        <Power size={16} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <ErrorBox mensaje={error} />

            <div className="grid lg:grid-cols-2 gap-6">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold text-gray-700">Sectores</h2>
                        <button
                            onClick={abrirNuevoSector}
                            className="flex items-center gap-2 bg-dtll-blue hover:bg-dtll-blueDark text-white text-sm font-medium px-3 py-1.5 rounded-lg"
                        >
                            <Plus size={14} /> Nuevo sector
                        </button>
                    </div>
                    <DataTable columns={columnasSectores} data={sectores} isLoading={cargando} onRowClick={abrirEdicionSector} />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold text-gray-700">Comunas</h2>
                        <button
                            onClick={abrirNuevaComuna}
                            className="flex items-center gap-2 bg-dtll-blue hover:bg-dtll-blueDark text-white text-sm font-medium px-3 py-1.5 rounded-lg"
                        >
                            <Plus size={14} /> Nueva comuna
                        </button>
                    </div>
                    <DataTable columns={columnasComunas} data={comunas} isLoading={cargando} onRowClick={abrirEdicionComuna} />
                </div>
            </div>

            <Drawer
                isOpen={drawerSector}
                onClose={() => setDrawerSector(false)}
                title={editandoSector ? 'Editar sector' : 'Nuevo sector'}
            >
                <form onSubmit={guardarSector}>
                    <Campo label="Nombre *">
                        <input
                            value={formSector.nombre}
                            onChange={(e) => setFormSector((p) => ({ ...p, nombre: e.target.value }))}
                            placeholder="Colina-Batuco, Santiago Norte…"
                            required
                            className={inputClass}
                        />
                    </Campo>
                    <Campo label="Descripción">
                        <textarea
                            value={formSector.descripcion}
                            onChange={(e) => setFormSector((p) => ({ ...p, descripcion: e.target.value }))}
                            rows={2}
                            className={inputClass}
                        />
                    </Campo>
                    <Campo label="Comunas del sector">
                        <MultiCheck
                            opciones={comunas}
                            seleccionados={formSector.comunaIds}
                            onChange={(ids) => setFormSector((p) => ({ ...p, comunaIds: ids }))}
                        />
                    </Campo>

                    <ErrorBox mensaje={errorForm} />

                    <button
                        type="submit"
                        disabled={guardando}
                        className="w-full bg-dtll-blue hover:bg-dtll-blueDark disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                    >
                        {guardando ? 'Guardando…' : editandoSector ? 'Guardar cambios' : 'Crear sector'}
                    </button>
                </form>
            </Drawer>

            <Drawer
                isOpen={drawerComuna}
                onClose={() => setDrawerComuna(false)}
                title={editandoComuna ? 'Editar comuna' : 'Nueva comuna'}
            >
                <form onSubmit={guardarComuna}>
                    <Campo label="Nombre *">
                        <input
                            value={nombreComuna}
                            onChange={(e) => setNombreComuna(e.target.value)}
                            placeholder="Lampa, Colina, Quilicura…"
                            required
                            className={inputClass}
                        />
                    </Campo>

                    <ErrorBox mensaje={errorForm} />

                    <button
                        type="submit"
                        disabled={guardando}
                        className="w-full bg-dtll-blue hover:bg-dtll-blueDark disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                    >
                        {guardando ? 'Guardando…' : editandoComuna ? 'Guardar cambios' : 'Crear comuna'}
                    </button>
                </form>
            </Drawer>
        </div>
    );
}
