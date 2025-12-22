import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
    return (
        <div className="app-layout">
            <Sidebar />

            <div className="main-content">
                <Topbar />

                <main className="page-container">
                    <Outlet />
                </main>
            </div>

            <style>{`
        .app-layout {
          display: flex;
          min-height: 100vh;
        }

        .main-content {
          margin-left: var(--sidebar-width);
          flex: 1;
          display: flex;
          flex-direction: column;
          width: calc(100% - var(--sidebar-width));
        }

        .page-container {
          padding: 2rem;
          flex: 1;
          background-color: var(--bg-body);
        }
      `}</style>
        </div>
    );
}
