import { useEffect, useState } from 'react';
import { Plus, Pencil, Power } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Drawer from '../../components/common/Drawer';
import { turnosApi } from '../../services/api';
import { Campo, ErrorBox, BadgeActivo, inputClass } from './shared';

const DIAS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];
const TIPOS = { ENTRADA: 'Entrada', SALIDA: 'Salida' };

const FORM_VACIO = {
    nombre: '',
    tipoServicio: 'ENTRADA',
    horaInicio: '',
    horaLlegadaEstimada: '',
    dias: ['LU', 'MA', 'MI', 'JU', 'VI'],
};

// LocalTime llega como "08:00:00"; el input time usa "08:00".
const hora = (valor) => (valor ? valor.slice(0, 5) : '');

export default function TurnosTab() {
    const [turnos, setTurnos] = useState([]);
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
            setTurnos(await turnosApi.listar());
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudieron cargar los turnos.');
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

    const abrirEdicion = (t) => {
        setEditando(t);
        setForm({
            nombre: t.nombre || '',
            tipoServicio: t.tipoServicio || 'ENTRADA',
            horaInicio: hora(t.horaInicio),
            horaLlegadaEstimada: hora(t.horaLlegadaEstimada),
            dias: t.diasSemana ? t.diasSemana.split(',') : [],
        });
        setErrorForm('');
        setDrawerAbierto(true);
    };

    const actualizarCampo = (campo) => (e) =>
        setForm((prev) => ({ ...prev, [campo]: e.target.value }));

    const toggleDia = (dia) =>
        setForm((prev) => ({
            ...prev,
            dias: prev.dias.includes(dia) ? prev.dias.filter((d) => d !== dia) : [...prev.dias, dia],
        }));

    const guardar = async (e) => {
        e.preventDefault();
        setErrorForm('');
        setGuardando(true);
        const payload = {
            nombre: form.nombre,
            tipoServicio: form.tipoServicio,
            horaInicio: form.horaInicio,
            horaLlegadaEstimada: form.horaLlegadaEstimada || null,
            diasSemana: DIAS.filter((d) => form.dias.includes(d)).join(',') || null,
        };
        try {
            if (editando) {
                await turnosApi.actualizar(editando.id, payload);
            } else {
                await turnosApi.crear(payload);
            }
            setDrawerAbierto(false);
            await cargar();
        } catch (err) {
            setErrorForm(err.response?.data?.error || 'No se pudo guardar el turno.');
        } finally {
            setGuardando(false);
        }
    };

    const cambiarActivo = async (t) => {
        const accion = t.activo ? 'desactivar' : 'activar';
        if (!window.confirm(`¿Seguro que quieres ${accion} el turno "${TIPOS[t.tipoServicio]} ${t.nombre}"?`)) return;
        try {
            await turnosApi.cambiarActivo(t.id, !t.activo);
            await cargar();
        } catch (e) {
            setError(e.response?.data?.error || `No se pudo ${accion} el turno.`);
        }
    };

    const columns = [
        {
            header: 'Turno',
            sortValue: (row) => `${TIPOS[row.tipoServicio]} ${row.nombre}`,
            cell: (row) => (
                <span className="font-medium">{TIPOS[row.tipoServicio]} turno {row.nombre}</span>
            ),
        },
        { header: 'Inicio', width: '90px', sortKey: 'horaInicio', cell: (row) => hora(row.horaInicio) },
        { header: 'Llegada est.', width: '110px', sortKey: 'horaLlegadaEstimada', cell: (row) => hora(row.horaLlegadaEstimada) || '—' },
        { header: 'Días', sortKey: 'diasSemana', cell: (row) => row.diasSemana || '—' },
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
                    onClick={abrirNuevo}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                    <Plus size={16} /> Nuevo turno
                </button>
            </div>

            <ErrorBox mensaje={error} />
            <DataTable columns={columns} data={turnos} isLoading={cargando} onRowClick={abrirEdicion} />

            <Drawer
                isOpen={drawerAbierto}
                onClose={() => setDrawerAbierto(false)}
                title={editando ? 'Editar turno' : 'Nuevo turno'}
            >
                <form onSubmit={guardar}>
                    <Campo label="Nombre *">
                        <input
                            value={form.nombre}
                            onChange={actualizarCampo('nombre')}
                            placeholder="Mañana, Tarde, Noche…"
                            required
                            className={inputClass}
                        />
                    </Campo>
                    <Campo label="Tipo de servicio *">
                        <select value={form.tipoServicio} onChange={actualizarCampo('tipoServicio')} className={inputClass}>
                            <option value="ENTRADA">Entrada al trabajo</option>
                            <option value="SALIDA">Salida del trabajo</option>
                        </select>
                    </Campo>
                    <div className="grid grid-cols-2 gap-3">
                        <Campo label="Hora de inicio *">
                            <input
                                type="time"
                                value={form.horaInicio}
                                onChange={actualizarCampo('horaInicio')}
                                required
                                className={inputClass}
                            />
                        </Campo>
                        <Campo label="Hora estimada de llegada">
                            <input
                                type="time"
                                value={form.horaLlegadaEstimada}
                                onChange={actualizarCampo('horaLlegadaEstimada')}
                                className={inputClass}
                            />
                        </Campo>
                    </div>
                    <Campo label="Días de funcionamiento">
                        <div className="mt-1 flex flex-wrap gap-2">
                            {DIAS.map((dia) => (
                                <button
                                    key={dia}
                                    type="button"
                                    onClick={() => toggleDia(dia)}
                                    className={
                                        form.dias.includes(dia)
                                            ? 'px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white'
                                            : 'px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }
                                >
                                    {dia}
                                </button>
                            ))}
                        </div>
                    </Campo>

                    <ErrorBox mensaje={errorForm} />

                    <button
                        type="submit"
                        disabled={guardando}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                    >
                        {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear turno'}
                    </button>
                </form>
            </Drawer>
        </div>
    );
}
