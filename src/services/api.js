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
        if (error.response?.status === 401) {
            localStorage.removeItem('jwt_token');
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

export default api;
