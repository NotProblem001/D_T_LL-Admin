export default function Dashboard() {
    return (
        <div>
            <h1 className="page-title">Dashboard Operativo</h1>
            <div className="grid-placeholder">
                <div className="card">KPIs Widget</div>
                <div className="card">Alertas Widget</div>
                <div className="card">Accesos Rápidos</div>
            </div>
            <style>{`
        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }
        .grid-placeholder {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        .card {
          padding: 1.5rem;
          background: white;
          border-radius: 0.75rem;
          border: 1px solid var(--border);
        }
      `}</style>
        </div>
    );
}
