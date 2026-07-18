// Constantes compartidas por las vistas móviles del conductor.

export const ESTADOS_VIAJE = {
    BORRADOR: { texto: 'Borrador', clase: 'bg-gray-100 text-gray-600' },
    PROGRAMADO: { texto: 'Programado', clase: 'bg-blue-50 text-blue-700' },
    ASIGNADO: { texto: 'Por confirmar', clase: 'bg-amber-50 text-amber-700' },
    CONFIRMADO: { texto: 'Confirmado', clase: 'bg-green-50 text-green-700' },
    EN_CURSO: { texto: 'En curso', clase: 'bg-indigo-50 text-indigo-700' },
    FINALIZADO: { texto: 'Finalizado', clase: 'bg-green-100 text-green-800' },
    REPROGRAMADO: { texto: 'Reprogramado', clase: 'bg-purple-50 text-purple-700' },
};

export const JORNADAS = { MANANA: 'Mañana', TARDE: 'Tarde', NOCHE: 'Noche' };
export const TIPOS = { ENTRADA: 'Entrada', SALIDA: 'Salida' };
export const hora = (v) => (v ? v.slice(0, 5) : '—');
