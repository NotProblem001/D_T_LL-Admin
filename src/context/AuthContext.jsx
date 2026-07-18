import { useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { loginAdmin, loginConductorApi } from '../services/api';
import { AuthContext } from './authContextInstance';

// Roles con acceso a esta app: ADMIN/OPERADOR usan el panel completo,
// CONDUCTOR solo la vista móvil (/conductor) — el enrutado lo controla AppRoutes.
const ROLES_PERMITIDOS = ['ADMIN', 'OPERADOR', 'CONDUCTOR'];

function usuarioDesdeToken(token) {
    const claims = jwtDecode(token);
    return {
        id: claims.sub,
        nombre: claims.nombre,
        rol: claims.rol,
    };
}

function usuarioInicial() {
    const token = localStorage.getItem('jwt_token');
    if (!token) return null;

    try {
        const decoded = usuarioDesdeToken(token);
        if (!ROLES_PERMITIDOS.includes(decoded.rol) || jwtDecode(token).exp * 1000 <= Date.now()) {
            localStorage.removeItem('jwt_token');
            return null;
        }
        return decoded;
    } catch {
        localStorage.removeItem('jwt_token');
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(usuarioInicial);

    const login = async (email, password) => {
        const token = await loginAdmin(email, password);
        const decoded = usuarioDesdeToken(token);
        if (decoded.rol !== 'ADMIN' && decoded.rol !== 'OPERADOR') {
            localStorage.removeItem('jwt_token');
            throw new Error('Esta cuenta no tiene permisos de administración');
        }
        setUser(decoded);
        return decoded;
    };

    const loginConductor = async (rut, pin) => {
        const token = await loginConductorApi(rut, pin);
        const decoded = usuarioDesdeToken(token);
        if (decoded.rol !== 'CONDUCTOR') {
            localStorage.removeItem('jwt_token');
            throw new Error('Credenciales de conductor inválidas');
        }
        setUser(decoded);
        return decoded;
    };

    const logout = () => {
        localStorage.removeItem('jwt_token');
        setUser(null);
    };

    const value = { user, login, loginConductor, logout, loading: false };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
