import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import AppLayout from '../components/layout/AppLayout';
import Login from '../modules/auth/Login';
import Dashboard from '../modules/dashboard/Dashboard';
import ChecklistViaje from '../modules/checklist/ChecklistViaje';
import NominaSemanal from '../modules/nomina/NominaSemanal';
import Clientes from '../modules/clientes/Clientes';
import PlanillaHorarios from '../modules/planilla/PlanillaHorarios';
import Vehiculos from '../modules/flota/Vehiculos';
import Conductores from '../modules/conductores/Conductores';
import RevisionImportacion from '../modules/importacion/RevisionImportacion';
import Planificacion from '../modules/planificacion/Planificacion';
import Incidencias from '../modules/incidencias/Incidencias';
import MisViajesConductor from '../modules/conductor/MisViajesConductor';
import ViajeConductor from '../modules/conductor/ViajeConductor';
import Maestros from '../modules/maestros/Maestros';
import Historial from '../modules/historial/Historial';
import Informes from '../modules/informes/Informes';

// Protected Route Wrapper. El rol CONDUCTOR solo usa la vista móvil /conductor.
function ProtectedRoute({ children, soloConductor = false }) {
    const { user, loading } = useAuth();

    if (loading) return <div>Cargando...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (soloConductor && user.rol !== 'CONDUCTOR') return <Navigate to="/" replace />;
    if (!soloConductor && user.rol === 'CONDUCTOR') return <Navigate to="/conductor" replace />;

    return children;
}

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            {/* Vista móvil del conductor (sin sidebar de administración) */}
            <Route path="/conductor" element={
                <ProtectedRoute soloConductor>
                    <MisViajesConductor />
                </ProtectedRoute>
            } />
            <Route path="/conductor/viajes/:viajeId" element={
                <ProtectedRoute soloConductor>
                    <ViajeConductor />
                </ProtectedRoute>
            } />

            <Route path="/" element={
                <ProtectedRoute>
                    <AppLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                {/* Importación directa por empresa (BDD / nómina / planilla / texto) */}
                <Route path="importacion" element={<NominaSemanal />} />
                <Route path="nomina" element={<NominaSemanal />} />
                <Route path="revision" element={<RevisionImportacion />} />
                <Route path="planilla" element={<PlanillaHorarios />} />
                <Route path="viajes/:viajeId/checklist" element={<ChecklistViaje />} />
                <Route path="trips" element={<Planificacion />} />
                <Route path="incidencias" element={<Incidencias />} />
                <Route path="historial" element={<Historial />} />
                <Route path="informes" element={<Informes />} />
                <Route path="drivers" element={<Conductores />} />
                <Route path="fleet" element={<Vehiculos />} />
                <Route path="maestros" element={<Maestros />} />
                <Route path="clients" element={<Clientes />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
