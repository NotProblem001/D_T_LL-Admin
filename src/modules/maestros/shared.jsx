// Piezas compartidas por las páginas de maestros (mismo estilo que Clientes.jsx).

export const inputClass = 'mt-1 w-full border rounded-lg p-2 text-sm';

export function Campo({ label, children }) {
    return (
        <label className="block text-sm mb-4">
            <span className="text-gray-700 font-medium">{label}</span>
            {children}
        </label>
    );
}

export function ErrorBox({ mensaje }) {
    if (!mensaje) return null;
    return (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {mensaje}
        </div>
    );
}

export function BadgeActivo({ activo }) {
    return activo ? (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
            Activo
        </span>
    ) : (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            Inactivo
        </span>
    );
}

/** Checkboxes para elegir varios elementos {id, nombre} (comunas de un sector, sectores de una ruta). */
export function MultiCheck({ opciones, seleccionados, onChange }) {
    const toggle = (id) =>
        onChange(
            seleccionados.includes(id)
                ? seleccionados.filter((x) => x !== id)
                : [...seleccionados, id]
        );
    if (!opciones.length) {
        return <p className="mt-1 text-xs text-gray-400">No hay elementos creados todavía.</p>;
    }
    return (
        <div className="mt-1 border rounded-lg p-2 max-h-48 overflow-y-auto grid grid-cols-2 gap-1">
            {opciones.map((op) => (
                <label key={op.id} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={seleccionados.includes(op.id)}
                        onChange={() => toggle(op.id)}
                    />
                    <span className={op.activo === false ? 'text-gray-400' : ''}>{op.nombre}</span>
                </label>
            ))}
        </div>
    );
}
