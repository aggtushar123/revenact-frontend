import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  /** Red confirm button for a destructive-ish action (e.g. Archive); the
   * default (accent) reads as a neutral/positive confirmation. */
  danger?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

/** Generic yes/no confirmation modal — used for Archive (a reversible
 * soft-hide, so this lighter one-click confirm is enough; Churn gets its
 * own dedicated form instead, since it needs to capture a reason too). */
export function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onClose }: ConfirmDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    setIsSaving(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Something went wrong.');
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div
        className="bg-surface border border-line rounded-xl shadow-xl w-full max-w-sm p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[13px] text-ink-muted">{message}</p>

        {error && (
          <div className="flex items-center gap-2 text-[12px] text-danger">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-[12px] font-semibold text-ink-muted hover:bg-subtle rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving}
            className={`px-3.5 py-2 rounded-lg text-[12px] font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              danger ? 'bg-danger text-white hover:opacity-90' : 'bg-accent text-[#0D0F0E] hover:bg-accent-hover'
            }`}
          >
            {isSaving ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
