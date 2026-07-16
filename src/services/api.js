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

export default api;
