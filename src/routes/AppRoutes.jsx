import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import AppLayout from '../components/layout/AppLayout';
import Login from '../modules/auth/Login';
import Dashboard from '../modules/dashboard/Dashboard';
import PlaceholderPage from '../components/common/PlaceholderPage';
import ExcelDropzone from '../components/ExcelDropzone';
import ChecklistViaje from '../modules/checklist/ChecklistViaje';
import NominaSemanal from '../modules/nomina/NominaSemanal';
import Clientes from '../modules/clientes/Clientes';
import PlanillaHorarios from '../modules/planilla/PlanillaHorarios';
import Vehiculos from '../modules/flota/Vehiculos';
import Conductores from '../modules/conductores/Conductores';
import Maestros from '../modules/maestros/Maestros';

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
                <Route path="importacion" element={<ExcelDropzone />} />
                <Route path="nomina" element={<NominaSemanal />} />
                <Route path="planilla" element={<PlanillaHorarios />} />
                <Route path="viajes/:viajeId/checklist" element={<ChecklistViaje />} />
                <Route path="bookings" element={<PlaceholderPage title="Gestión de Reservas" />} />
                <Route path="trips" element={<PlaceholderPage title="Monitor de Viajes" />} />
                <Route path="drivers" element={<Conductores />} />
                <Route path="fleet" element={<Vehiculos />} />
                <Route path="maestros" element={<Maestros />} />
                <Route path="clients" element={<Clientes />} />
                <Route path="users" element={<PlaceholderPage title="Usuarios y Roles" />} />
                <Route path="settings" element={<PlaceholderPage title="Configuración" />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
