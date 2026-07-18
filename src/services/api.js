import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // 401: token vencido o inválido → cerrar sesión y volver al login.
        if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth')) {
            localStorage.removeItem('jwt_token');
            if (window.location.pathname !== '/login') {
                window.location.assign('/login');
            }
        }
        return Promise.reject(error);
    }
);

export const loginAdmin = async (email, password) => {
    const response = await api.post('/auth/token', { name: email, password });
    localStorage.setItem('jwt_token', response.data);
    return response.data;
};

export const loginConductorApi = async (rutConductor, pin) => {
    const response = await api.post('/auth/conductor/login', { rutConductor, pin });
    localStorage.setItem('jwt_token', response.data);
    return response.data;
};

// --- Vista móvil del conductor (Etapa 4) ---

export const misViajesConductor = async (fecha) =>
    (await api.get('/api/v1/conductor/viajes', { params: fecha ? { fecha } : {} })).data;

export const detalleViajeConductor = async (viajeId) =>
    (await api.get(`/api/v1/conductor/viajes/${viajeId}`)).data;

export const confirmarViajeConductor = async (viajeId) =>
    (await api.post(`/api/v1/conductor/viajes/${viajeId}/confirmar`)).data;

export const iniciarViajeConductor = async (viajeId) =>
    (await api.post(`/api/v1/conductor/viajes/${viajeId}/iniciar`)).data;

export const finalizarViajeConductor = async (viajeId) =>
    (await api.post(`/api/v1/conductor/viajes/${viajeId}/finalizar`)).data;

export const estadosAsistenciaConductor = async () =>
    (await api.get('/api/v1/conductor/estados-asistencia')).data;

// --- Incidencias ---

export const crearIncidencia = async (payload) =>
    (await api.post('/api/v1/incidencias', payload)).data;

export const listarIncidencias = async (filtros = {}) =>
    (await api.get('/api/v1/incidencias', { params: filtros })).data;

export const actualizarIncidencia = async (id, payload) =>
    (await api.put(`/api/v1/incidencias/${id}`, payload)).data;

export const importarExcel = async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/v1/importacion/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
    });
};

export const obtenerChecklist = async (viajeId) => {
    const response = await api.get(`/api/v1/checklist/${viajeId}`);
    return response.data;
};

export const guardarChecklist = async (viajeId, marcaciones) => {
    const response = await api.put(`/api/v1/checklist/${viajeId}`, { marcaciones });
    return response.data;
};

export const optimizarRuta = async (viajeId, puntoInicio, destinoFinal) => {
    const response = await api.post(`/api/v1/rutas/${viajeId}/optimizar`, { puntoInicio, destinoFinal });
    return response.data;
};

// --- Nómina semanal ---

export const obtenerEmpresas = async () => {
    const response = await api.get('/api/v1/empresa/empresas');
    return response.data;
};

export const importarBddPasajeros = async (empresaId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/v1/importacion/bdd?empresaId=${empresaId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const importarNominaSemanal = async (empresaId, file, anio, semana) => {
    const formData = new FormData();
    formData.append('file', file);
    const params = new URLSearchParams({ empresaId });
    if (anio) params.append('anio', anio);
    if (semana) params.append('semana', semana);
    const response = await api.post(`/api/v1/importacion/nomina?${params}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const importarPlanillaInterna = async (empresaId, file, anio, semana) => {
    const formData = new FormData();
    formData.append('file', file);
    const params = new URLSearchParams({ empresaId });
    if (anio) params.append('anio', anio);
    if (semana) params.append('semana', semana);
    const response = await api.post(`/api/v1/importacion/planilla?${params}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const importarNominaTexto = async (empresaId, texto, anio, semana) => {
    const response = await api.post('/api/v1/importacion/nomina/texto', { empresaId, texto, anio, semana });
    return response.data;
};

export const descargarPlanillaHorarios = async (empresaId, anio, semana) => {
    const response = await api.get('/api/v1/importacion/nomina/planilla', {
        params: { empresaId, anio, semana },
        responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Planilla horarios semana ${semana} ${anio}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
};

// --- Vista de nómina / planilla con filtros ---

export const listarNomina = async (empresaId, anio, filtros = {}) => {
    const params = { empresaId, anio };
    if (filtros.semana) params.semana = filtros.semana;
    if (filtros.turno) params.turno = filtros.turno;
    if (filtros.comuna) params.comuna = filtros.comuna;
    if (filtros.busqueda) params.busqueda = filtros.busqueda;
    const response = await api.get('/api/v1/admin/nomina', { params });
    return response.data;
};

export const listarSemanasNomina = async (empresaId) => {
    const response = await api.get('/api/v1/admin/nomina/semanas', { params: { empresaId } });
    return response.data;
};

// --- Clientes (empresas) ---

export const listarEmpresasAdmin = async () => {
    const response = await api.get('/api/v1/admin/empresas');
    return response.data;
};

export const crearEmpresa = async (empresa) => {
    const response = await api.post('/api/v1/admin/empresas', empresa);
    return response.data;
};

export const actualizarEmpresa = async (id, empresa) => {
    const response = await api.put(`/api/v1/admin/empresas/${id}`, empresa);
    return response.data;
};

export const eliminarEmpresa = async (id) => {
    await api.delete(`/api/v1/admin/empresas/${id}`);
};

// --- Importación con revisión (staging → resolver → confirmar) ---

export const previewImportacion = async (empresaId, tipo, file, anio, semana) => {
    const formData = new FormData();
    formData.append('file', file);
    const params = new URLSearchParams({ empresaId, tipo });
    if (anio) params.append('anio', anio);
    if (semana) params.append('semana', semana);
    const response = await api.post(`/api/v1/importacion/revision/preview?${params}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const previewImportacionTexto = async (payload) =>
    (await api.post('/api/v1/importacion/revision/preview/texto', payload)).data;

export const listarImportaciones = async (empresaId) =>
    (await api.get('/api/v1/importacion/revision', { params: { empresaId } })).data;

export const obtenerImportacion = async (id) =>
    (await api.get(`/api/v1/importacion/revision/${id}`)).data;

export const resolverRegistroImportacion = async (importacionId, registroId, payload) =>
    (await api.put(`/api/v1/importacion/revision/${importacionId}/registros/${registroId}`, payload)).data;

export const confirmarImportacion = async (id) =>
    (await api.post(`/api/v1/importacion/revision/${id}/confirmar`)).data;

export const descartarImportacion = async (id) =>
    (await api.post(`/api/v1/importacion/revision/${id}/descartar`)).data;

export const listarPasajerosEmpresa = async (empresaId) =>
    (await api.get('/api/v1/empresa/pasajeros', { params: { empresaId } })).data;

// --- Planificación de recorridos (Etapa 3) ---

export const generarPropuestaViajes = async (payload) =>
    (await api.post('/api/v1/planificacion/generar', payload)).data;

export const listarViajesPlanificacion = async (empresaId, fecha) =>
    (await api.get('/api/v1/planificacion/viajes', { params: { empresaId, fecha } })).data;

export const asignarViaje = async (viajeId, payload) =>
    (await api.put(`/api/v1/planificacion/viajes/${viajeId}/asignacion`, payload)).data;

export const cambiarEstadoViaje = async (viajeId, estado) =>
    (await api.put(`/api/v1/planificacion/viajes/${viajeId}/estado`, { estado })).data;

export const eliminarViajeBorrador = async (viajeId) => {
    await api.delete(`/api/v1/planificacion/viajes/${viajeId}`);
};

// --- Maestros (lectura ADMIN/OPERADOR, escritura solo ADMIN) ---

const crudMaestro = (recurso) => ({
    listar: async (params) => (await api.get(`/api/v1/maestros/${recurso}`, { params })).data,
    crear: async (payload) => (await api.post(`/api/v1/maestros/${recurso}`, payload)).data,
    actualizar: async (id, payload) => (await api.put(`/api/v1/maestros/${recurso}/${id}`, payload)).data,
    cambiarActivo: async (id, activo) =>
        (await api.patch(`/api/v1/maestros/${recurso}/${id}/activo`, { activo })).data,
});

export const vehiculosApi = crudMaestro('vehiculos');
export const comunasApi = crudMaestro('comunas');
export const sectoresApi = crudMaestro('sectores');
export const rutasApi = crudMaestro('rutas');
export const turnosApi = crudMaestro('turnos');
export const estadosAsistenciaApi = crudMaestro('estados-asistencia');

export const conductoresApi = crudMaestro('conductores');

export const listarConductores = async () =>
    (await api.get('/api/v1/maestros/conductores')).data;

export const listarConfiguraciones = async () =>
    (await api.get('/api/v1/maestros/configuraciones')).data;

export const actualizarConfiguracion = async (clave, valor) =>
    (await api.put(`/api/v1/maestros/configuraciones/${clave}`, { valor })).data;

export default api;
