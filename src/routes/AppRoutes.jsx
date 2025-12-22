import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import Login from '../modules/auth/Login';
import Dashboard from '../modules/dashboard/Dashboard';
import PlaceholderPage from '../components/common/PlaceholderPage';

// Protected Route Wrapper
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <div>Cargando...</div>;
    if (!user) return <Navigate to="/login" replace />;

    return children;
}

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
                <ProtectedRoute>
                    <AppLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="bookings" element={<PlaceholderPage title="Gestión de Reservas" />} />
                <Route path="trips" element={<PlaceholderPage title="Monitor de Viajes" />} />
                <Route path="drivers" element={<PlaceholderPage title="Conductores" />} />
                <Route path="fleet" element={<PlaceholderPage title="Flota de Vehículos" />} />
                <Route path="clients" element={<PlaceholderPage title="Clientes y Empresas" />} />
                <Route path="users" element={<PlaceholderPage title="Usuarios y Roles" />} />
                <Route path="settings" element={<PlaceholderPage title="Configuración" />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
