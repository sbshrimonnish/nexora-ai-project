import { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  width?: number;
}

export function Modal({ title, children, onClose, footer, width = 500 }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 14px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>{title}</span>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={15} /></button>
        </div>
        <div style={{ padding: "18px 22px" }}>{children}</div>
        {footer && <div style={{ padding: "12px 22px 18px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 8 }}>{footer}</div>}
      </div>
    </div>
  );
}

interface DrawerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
}

export function Drawer({ title, subtitle, children, onClose }: DrawerProps) {
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel">
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 22px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 1 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={15} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>{children}</div>
      </div>
    </>
  );
}
