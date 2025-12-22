import { X } from 'lucide-react';
import { useEffect } from 'react';
import clsx from 'clsx';

export default function Drawer({ isOpen, onClose, title, children }) {
    // Prevent scrolling when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <>
            <div
                className={clsx('drawer-overlay', isOpen && 'open')}
                onClick={onClose}
            />
            <div className={clsx('drawer-panel', isOpen && 'open')}>
                <div className="drawer-header">
                    <h3>{title}</h3>
                    <button onClick={onClose} className="close-btn">
                        <X size={20} />
                    </button>
                </div>
                <div className="drawer-content">
                    {children}
                </div>
            </div>

            <style>{`
        .drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 60;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .drawer-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }

        .drawer-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 400px;
          max-width: 90vw;
          height: 100vh;
          background-color: white;
          z-index: 70;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
        }

        .drawer-panel.open {
          transform: translateX(0);
        }

        .drawer-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .drawer-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          padding: 0.5rem;
          cursor: pointer;
          border-radius: 50%;
          display: flex;
        }

        .close-btn:hover {
          background-color: #f3f4f6;
        }

        .drawer-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }
      `}</style>
        </>
    );
}
