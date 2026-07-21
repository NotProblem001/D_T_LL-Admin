import { useEffect, useState } from 'react';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Drawer from '../../components/common/Drawer';
import {
    listarEmpresasAdmin,
    crearEmpresa,
    actualizarEmpresa,
    eliminarEmpresa,
} from '../../services/api';

const FORM_VACIO = {
    rutFiscal: '',
    razonSocial: '',
    nombreFantasia: '',
    contactoNombre: '',
    contactoEmail: '',
    contactoTelefono: '',
    tarifaBaseViaje: '',
};

function Campo({ label, children }) {
    return (
        <label className="block text-sm mb-4">
            <span className="text-gray-700 font-medium">{label}</span>
            {children}
        </label>
    );
}

const inputClass = 'mt-1 w-full border rounded-lg p-2 text-sm';

export default function Clientes() {
    const [empresas, setEmpresas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [drawerAbierto, setDrawerAbierto] = useState(false);
    const [editando, setEditando] = useState(null); // empresa en edición o null (nueva)
    const [form, setForm] = useState(FORM_VACIO);
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState('');

    const cargar = async () => {
        setCargando(true);
        setError('');
        try {
            setEmpresas(await listarEmpresasAdmin());
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudieron cargar las empresas.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargar();
    }, []);

    const abrirNueva = () => {
        setEditando(null);
        setForm(FORM_VACIO);
        setErrorForm('');
        setDrawerAbierto(true);
    };

    const abrirEdicion = (empresa) => {
        setEditando(empresa);
        setForm({
            rutFiscal: empresa.rutFiscal || '',
            razonSocial: empresa.razonSocial || '',
            nombreFantasia: empresa.nombreFantasia || '',
            contactoNombre: empresa.contactoNombre || '',
            contactoEmail: empresa.contactoEmail || '',
            contactoTelefono: empresa.contactoTelefono || '',
            tarifaBaseViaje: empresa.tarifaBaseViaje ?? '',
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
            tarifaBaseViaje: form.tarifaBaseViaje === '' ? null : Number(form.tarifaBaseViaje),
        };
        try {
            if (editando) {
                await actualizarEmpresa(editando.id, payload);
            } else {
                await crearEmpresa(payload);
            }
            setDrawerAbierto(false);
            await cargar();
        } catch (err) {
            setErrorForm(err.response?.data?.error || 'No se pudo guardar la empresa.');
        } finally {
            setGuardando(false);
        }
    };

    const eliminar = async (empresa) => {
        const nombre = empresa.nombreFantasia || empresa.razonSocial || empresa.rutFiscal;
        if (!window.confirm(`¿Eliminar la empresa "${nombre}"? Esta acción no se puede deshacer.`)) return;
        setError('');
        try {
            await eliminarEmpresa(empresa.id);
            await cargar();
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo eliminar la empresa.');
        }
    };

    const columns = [
        { header: 'RUT', accessor: 'rutFiscal', width: '130px' },
        {
            header: 'Empresa',
            sortValue: (row) => row.nombreFantasia || row.razonSocial || '',
            cell: (row) => (
                <div>
                    <div className="font-medium">{row.nombreFantasia || row.razonSocial}</div>
                    {row.nombreFantasia && row.razonSocial && (
                        <div className="text-xs text-gray-500">{row.razonSocial}</div>
                    )}
                </div>
            ),
        },
        {
            header: 'Contacto',
            sortValue: (row) => row.contactoNombre || '',
            cell: (row) => (
                <div>
                    <div>{row.contactoNombre || '—'}</div>
                    <div className="text-xs text-gray-500">
                        {[row.contactoEmail, row.contactoTelefono].filter(Boolean).join(' · ')}
                    </div>
                </div>
            ),
        },
        {
            header: 'Tarifa base',
            width: '120px',
            sortKey: 'tarifaBaseViaje',
            cell: (row) =>
                row.tarifaBaseViaje != null
                    ? `$${Number(row.tarifaBaseViaje).toLocaleString('es-CL')}`
                    : '—',
        },
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
                        onClick={() => eliminar(row)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-500"
                        title="Eliminar"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                        <Building2 className="text-dtll-blue" /> Clientes y Empresas
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Registra y administra las empresas clientes con las que trabajas.
                    </p>
                </div>
                <button
                    onClick={abrirNueva}
                    className="flex items-center gap-2 bg-dtll-blue hover:bg-dtll-blueDark text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                    <Plus size={16} /> Nueva empresa
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                </div>
            )}

            <DataTable columns={columns} data={empresas} isLoading={cargando} onRowClick={abrirEdicion} />

            <Drawer
                isOpen={drawerAbierto}
                onClose={() => setDrawerAbierto(false)}
                title={editando ? 'Editar empresa' : 'Nueva empresa'}
            >
                <form onSubmit={guardar}>
                    <Campo label="RUT fiscal *">
                        <input
                            value={form.rutFiscal}
                            onChange={actualizarCampo('rutFiscal')}
                            placeholder="76.123.456-7"
                            required
                            className={inputClass}
                        />
                    </Campo>
                    <Campo label="Razón social">
                        <input
                            value={form.razonSocial}
                            onChange={actualizarCampo('razonSocial')}
                            placeholder="Empresa S.A."
                            className={inputClass}
                        />
                    </Campo>
                    <Campo label="Nombre de fantasía">
                        <input
                            value={form.nombreFantasia}
                            onChange={actualizarCampo('nombreFantasia')}
                            placeholder="Nombre comercial"
                            className={inputClass}
                        />
                    </Campo>
                    <Campo label="Nombre de contacto">
                        <input
                            value={form.contactoNombre}
                            onChange={actualizarCampo('contactoNombre')}
                            className={inputClass}
                        />
                    </Campo>
                    <Campo label="Email de contacto">
                        <input
                            type="email"
                            value={form.contactoEmail}
                            onChange={actualizarCampo('contactoEmail')}
                            className={inputClass}
                        />
                    </Campo>
                    <Campo label="Teléfono de contacto">
                        <input
                            value={form.contactoTelefono}
                            onChange={actualizarCampo('contactoTelefono')}
                            placeholder="+56 9 1234 5678"
                            className={inputClass}
                        />
                    </Campo>
                    <Campo label="Tarifa base por viaje (CLP)">
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.tarifaBaseViaje}
                            onChange={actualizarCampo('tarifaBaseViaje')}
                            className={inputClass}
                        />
                    </Campo>

                    {errorForm && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                            {errorForm}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={guardando}
                        className="w-full bg-dtll-blue hover:bg-dtll-blueDark disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                    >
                        {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear empresa'}
                    </button>
                </form>
            </Drawer>
        </div>
    );
}
