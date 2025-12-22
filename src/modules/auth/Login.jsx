import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('admin@example.com');
    const [password, setPassword] = useState('admin');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Iniciar Sesión</h1>
                <p className="subtitle">Admin Panel</p>

                {error && <div className="error-alert">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Cargando...' : 'Ingresar'}
                    </button>
                </form>
            </div>

            <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-body);
        }

        .login-card {
          background-color: var(--bg-card);
          padding: 2.5rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          width: 100%;
          max-width: 400px;
        }

        h1 {
          font-size: 1.5rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          text-align: center;
          color: var(--text-muted);
          margin-bottom: 2rem;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          font-size: 1rem;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        button {
          width: 100%;
          padding: 0.75rem;
          background-color: var(--primary);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 1rem;
          transition: background-color 0.2s;
        }

        button:hover {
          background-color: var(--primary-hover);
        }

        button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .error-alert {
          background-color: #fee2e2;
          color: #dc2626;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
        }
      `}</style>
        </div>
    );
}
