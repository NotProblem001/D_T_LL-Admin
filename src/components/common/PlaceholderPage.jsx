export default function PlaceholderModule({ title }) {
    return (
        <div>
            <h1 className="page-title">{title}</h1>
            <div className="content-area">
                <p>Módulo en construcción...</p>
            </div>
            <style>{`
        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }
        .content-area {
          padding: 2rem;
          background: white;
          border-radius: 0.75rem;
          border: 1px solid var(--border);
          text-align: center;
          color: var(--text-muted);
        }
      `}</style>
        </div>
    );
}
