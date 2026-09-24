import type { Toast } from "../store";

export default function Toasts({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`} onClick={() => onDismiss(t.id)}>
          <span className="toast-icon">
            {t.kind === "error" ? "⚠️" : t.kind == "success" ? "✅" : "ℹ️"}
          </span>
          <p>{t.text}</p>
        </div>
      ))}
    </div>
  );
}
