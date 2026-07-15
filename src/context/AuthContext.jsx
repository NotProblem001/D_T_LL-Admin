import { useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { loginAdmin } from '../services/api';
import { AuthContext } from './authContextInstance';

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
        if (decoded.rol !== 'ADMIN' || jwtDecode(token).exp * 1000 <= Date.now()) {
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
        if (decoded.rol !== 'ADMIN') {
            localStorage.removeItem('jwt_token');
            throw new Error('Esta cuenta no tiene permisos de administrador');
        }
        setUser(decoded);
        return decoded;
    };

    const logout = () => {
        localStorage.removeItem('jwt_token');
        setUser(null);
    };

    const value = { user, login, logout, loading: false };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
