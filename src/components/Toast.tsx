/** Toast notification system */
import { createContext, useContext, useState, useCallback, useRef } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  emoji?: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast['type'], emoji?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<Toast['type'], string> = {
  success: '✅',
  error:   '❌',
  info:    'ℹ️',
  warning: '⚠️',
};

const COLORS: Record<Toast['type'], string> = {
  success: 'var(--success)',
  error:   'var(--error)',
  info:    'var(--info)',
  warning: 'var(--warning)',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const showToast = useCallback((
    message: string,
    type: Toast['type'] = 'info',
    emoji?: string
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev.slice(-3), { id, message, type, emoji }]);

    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timers.current.delete(id);
    }, 4000);
    timers.current.set(id, timer);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="toast-container"
        role="log"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="toast"
            role="alert"
            style={{ borderLeft: `3px solid ${COLORS[toast.type]}` }}
          >
            <span style={{ fontSize: '1.25rem' }} aria-hidden="true">
              {toast.emoji ?? ICONS[toast.type]}
            </span>
            <span style={{ fontSize: '0.9375rem', flex: 1 }}>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
