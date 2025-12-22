import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock check for existing session
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (email, password) => {
        // Mock login logic
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email === 'admin@example.com' && password === 'admin') {
                    const mockUser = { id: 1, name: 'Admin User', email, role: 'ADMIN' };
                    setUser(mockUser);
                    localStorage.setItem('user', JSON.stringify(mockUser));
                    resolve(mockUser);
                } else {
                    reject('Invalid credentials');
                }
            }, 1000);
        });
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const value = {
        user,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
