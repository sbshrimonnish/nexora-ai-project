import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface ToastCtx {
  toast: (msg: string, type?: ToastItem["type"]) => void;
}

const Ctx = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(Ctx);

const icons = {
  success: <CheckCircle2 size={15} color="#10b981" />,
  error:   <AlertCircle  size={15} color="#ef4444" />,
  warning: <AlertCircle  size={15} color="#f59e0b" />,
  info:    <Info         size={15} color="#3b82f6" />,
};

const colors = {
  success: "rgba(16,185,129,0.1)",
  error:   "rgba(239,68,68,0.1)",
  warning: "rgba(245,158,11,0.1)",
  info:    "rgba(59,130,246,0.1)",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastItem["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className="toast" style={{ borderLeft: `3px solid ${colors[t.type]}` }}>
            {icons[t.type]}
            <span style={{ flex: 1, fontSize: 13, color: "var(--foreground)" }}>{t.message}</span>
            <button onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 2, display: "flex" }}>
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
