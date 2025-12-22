import { Search, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar() {
    const { logout } = useAuth();

    return (
        <header className="topbar">
            <div className="search-bar">
                <Search size={20} className="search-icon" />
                <input type="text" placeholder="Buscar..." />
            </div>

            <div className="actions">
                <button className="icon-btn">
                    <Bell size={20} />
                </button>
                <div className="divider"></div>
                <button onClick={logout} className="logout-btn">
                    <LogOut size={18} />
                    <span>Salir</span>
                </button>
            </div>

            <style>{`
        .topbar {
          height: var(--topbar-height);
          background-color: var(--bg-card);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background-color: #f9fafb;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          width: 300px;
          border: 1px solid transparent;
          transition: border-color 0.2s;
        }

        .search-bar:focus-within {
          border-color: var(--primary);
          background-color: #fff;
        }

        .search-icon {
          color: var(--text-muted);
        }

        .search-bar input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 0.875rem;
          color: var(--text-main);
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .icon-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          padding: 0.5rem;
          border-radius: 50%;
          transition: all 0.2s;
          display: flex;
        }

        .icon-btn:hover {
          background-color: #f3f4f6;
          color: var(--text-main);
        }

        .divider {
          width: 1px;
          height: 24px;
          background-color: var(--border);
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: var(--text-muted);
          font-weight: 500;
          font-size: 0.875rem;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background-color: #fee2e2;
          color: #dc2626;
        }
      `}</style>
        </header>
    );
}
