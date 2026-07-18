import { useState } from 'react';
import { Map } from 'lucide-react';
import clsx from 'clsx';
import TurnosTab from './TurnosTab';
import GeografiaTab from './GeografiaTab';
import RutasTab from './RutasTab';
import ConfigTab from './ConfigTab';

const TABS = [
    { id: 'turnos', label: 'Turnos', componente: TurnosTab },
    { id: 'geografia', label: 'Sectores y comunas', componente: GeografiaTab },
    { id: 'rutas', label: 'Rutas', componente: RutasTab },
    { id: 'config', label: 'Asistencia y parámetros', componente: ConfigTab },
];

/** Maestros de operación: solo el ADMIN edita; el OPERADOR consulta (la API lo garantiza). */
export default function Maestros() {
    const [tab, setTab] = useState('turnos');
    const TabActiva = TABS.find((t) => t.id === tab).componente;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                <Map className="text-blue-600" /> Maestros de operación
            </h1>
            <p className="text-gray-500 text-sm mb-6">
                Turnos, sectores, comunas, rutas, estados de asistencia y parámetros del sistema.
            </p>

            <div className="flex gap-1 border-b mb-6 overflow-x-auto">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={clsx(
                            'px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px',
                            tab === t.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <TabActiva />
        </div>
    );
}
