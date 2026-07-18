import { useCallback, useEffect, useState } from 'react';
import { Copy, Share2, Send, Download, ExternalLink, MessageCircle, Check } from 'lucide-react';
import Drawer from '../../components/common/Drawer';
import {
    obtenerMensajeriaViaje,
    guardarMensajeViaje,
    marcarMensajeEnviado,
} from '../../services/api';
import { Campo, ErrorBox, inputClass } from '../maestros/shared';

/** Panel de comunicación WhatsApp de un recorrido: plantilla, wa.me, teléfonos y registro de envío. */
export default function MensajeViaje({ viaje, onClose }) {
    const [texto, setTexto] = useState('');
    const [grupo, setGrupo] = useState('');
    const [telefonos, setTelefonos] = useState([]);
    const [sinTelefono, setSinTelefono] = useState([]);
    const [mensajes, setMensajes] = useState([]);
    const [error, setError] = useState('');
    const [aviso, setAviso] = useState('');
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async () => {
        setError('');
        try {
            const data = await obtenerMensajeriaViaje(viaje.id);
            setTexto((prev) => prev || data.textoSugerido);
            setGrupo((prev) => prev || data.grupoWhatsapp || '');
            setTelefonos(data.telefonos);
            setSinTelefono(data.pasajerosSinTelefono);
            setMensajes(data.mensajes);
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo cargar la mensajería del viaje.');
        }
    }, [viaje.id]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(texto);
            setAviso('Mensaje copiado al portapapeles.');
        } catch {
            setAviso('');
            setError('No se pudo copiar; selecciona y copia manualmente.');
        }
    };

    const compartir = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ text: texto });
            } catch { /* usuario canceló */ }
        } else {
            copiar();
        }
    };

    const registrar = async (enviado) => {
        setError('');
        setGuardando(true);
        try {
            await guardarMensajeViaje(viaje.id, { texto, grupoWhatsapp: grupo || null, enviado });
            setAviso(enviado ? 'Mensaje registrado como enviado.' : 'Mensaje registrado.');
            await cargar();
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo registrar el mensaje.');
        } finally {
            setGuardando(false);
        }
    };

    const marcarEnviado = async (mensajeId) => {
        setError('');
        try {
            await marcarMensajeEnviado(mensajeId);
            await cargar();
        } catch (e) {
            setError(e.response?.data?.error || 'No se pudo marcar como enviado.');
        }
    };

    const descargarTelefonos = () => {
        const lineas = ['Nombre;Telefono', ...telefonos.map((t) => `${t.nombre};+${t.telefono}`)];
        const blob = new Blob(['﻿' + lineas.join('\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `telefonos ${viaje.rutaNombre || viaje.codigoRutaLogin} ${viaje.fechaOperacion}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const esLinkGrupo = grupo.startsWith('http');
    const waLink = (telefono) => `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`;

    return (
        <Drawer isOpen onClose={onClose} title="Mensaje del recorrido">
            <ErrorBox mensaje={error} />
            {aviso && (
                <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                    {aviso}
                </div>
            )}

            <Campo label="Mensaje para el grupo">
                <textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    rows={8}
                    className={inputClass}
                />
            </Campo>

            <Campo label="Grupo de WhatsApp (nombre o enlace)">
                <input
                    value={grupo}
                    onChange={(e) => setGrupo(e.target.value)}
                    placeholder="Entrada mañana Santiago / https://chat.whatsapp.com/…"
                    className={inputClass}
                />
            </Campo>

            <div className="grid grid-cols-2 gap-2 mb-4">
                <button onClick={copiar} className="flex items-center justify-center gap-1.5 border rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <Copy size={15} /> Copiar
                </button>
                <button onClick={compartir} className="flex items-center justify-center gap-1.5 border rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <Share2 size={15} /> Compartir
                </button>
                {esLinkGrupo && (
                    <a
                        href={grupo}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 border border-green-300 bg-green-50 rounded-lg py-2.5 text-sm font-medium text-green-700 hover:bg-green-100"
                    >
                        <ExternalLink size={15} /> Abrir grupo
                    </a>
                )}
                <button
                    onClick={descargarTelefonos}
                    disabled={telefonos.length === 0}
                    className="flex items-center justify-center gap-1.5 border rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                    <Download size={15} /> Teléfonos (CSV)
                </button>
            </div>

            <button
                onClick={() => registrar(true)}
                disabled={guardando || !texto.trim()}
                className="w-full mb-2 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg"
            >
                <Send size={15} /> {guardando ? 'Guardando…' : 'Registrar como enviado'}
            </button>
            <button
                onClick={() => registrar(false)}
                disabled={guardando || !texto.trim()}
                className="w-full mb-5 border rounded-lg py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
                Guardar sin marcar envío
            </button>

            {/* Enlaces individuales wa.me */}
            <h3 className="font-semibold text-sm text-gray-700 mb-2">
                Enviar individual ({telefonos.length})
            </h3>
            <div className="space-y-1.5 mb-4">
                {telefonos.map((t) => (
                    <a
                        key={t.pasajeroId}
                        href={waLink(t.telefono)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm hover:bg-green-50"
                    >
                        <span>{t.nombre}</span>
                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                            <MessageCircle size={14} /> wa.me
                        </span>
                    </a>
                ))}
                {telefonos.length === 0 && (
                    <p className="text-xs text-gray-400">Ningún pasajero del viaje tiene teléfono.</p>
                )}
            </div>
            {sinTelefono.length > 0 && (
                <p className="text-xs text-amber-700 mb-4">
                    Sin teléfono: {sinTelefono.join(', ')}
                </p>
            )}

            {/* Historial */}
            {mensajes.length > 0 && (
                <>
                    <h3 className="font-semibold text-sm text-gray-700 mb-2">Mensajes registrados</h3>
                    <ul className="space-y-2">
                        {mensajes.map((m) => (
                            <li key={m.id} className="border rounded-lg p-3 text-xs text-gray-600">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium">
                                        {new Date(m.createdAt).toLocaleString('es-CL', {
                                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                                        })}
                                    </span>
                                    {m.enviado ? (
                                        <span className="flex items-center gap-1 text-green-600 font-medium">
                                            <Check size={12} /> Enviado{' '}
                                            {m.enviadoAt && new Date(m.enviadoAt).toLocaleTimeString('es-CL', {
                                                hour: '2-digit', minute: '2-digit',
                                            })}
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => marcarEnviado(m.id)}
                                            className="text-blue-600 hover:underline"
                                        >
                                            Marcar enviado
                                        </button>
                                    )}
                                </div>
                                <p className="whitespace-pre-line line-clamp-3">{m.texto}</p>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </Drawer>
    );
}
