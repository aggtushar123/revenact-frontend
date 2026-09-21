import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Plus, Trash2, Share2 } from 'lucide-react';
import { useAppDispatch } from '../../hooks';
import { deleteCanvas } from '../../features/customers/customersSlice';
import type { Canvas } from '../../features/customers/customersSlice';
import { formatRelativeTime } from '../../features/customers/formatters';
import { ConfirmDialog } from '../organizations/ConfirmDialog';

export interface CanvasListTabProps {
  canvases: Canvas[];
  isLoading: boolean;
  error: string | null;
  /** The parent Customer id — used to build "+ New Canvas"'s own
   * `/canvas/create?customerId=...` link. Same convention as
   * PipelinesTab's own `customerId` prop — undefined disables "New
   * Canvas" rather than linking against a made-up id. */
  customerId?: number;
  /** Set only when mounted on the standalone Account page — "New
   * Canvas" then creates an account-level Canvas scoped to this
   * specific account instead of an organization-level one. */
  accountId?: number;
}

// Same card-grid shape as the standalone gallery (CanvasPage.tsx),
// scoped to just this one company — same "one shared component, not
// two page-local copies" reasoning as ContactsTab/PipelinesTab. Unlike
// the gallery's own "+ New Canvas" (which opens a company picker
// first), the parent here is already fixed, so it navigates straight
// to `/canvas/create?customerId=...` — same duality as
// OpportunityFormModal's own embedded-vs-standalone Add modes.
export function CanvasListTab({ canvases, isLoading, error, customerId, accountId }: CanvasListTabProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [deletingCanvas, setDeletingCanvas] = useState<Canvas | null>(null);

  const canCreate = customerId !== undefined;

  function handleNewCanvas() {
    if (!canCreate) return;
    const params = new URLSearchParams({ customerId: String(customerId) });
    if (accountId !== undefined) params.set('accountId', String(accountId));
    navigate(`/canvas/create?${params.toString()}`);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
        <span className="text-sm font-semibold text-ink-faint">Loading canvases…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16">
        <span className="text-sm font-semibold text-danger">{error}</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 bg-subtle/40 font-sans flex flex-col gap-4">
      {canCreate && (
        <div className="flex items-center justify-end">
          <button
            onClick={handleNewCanvas}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-on-accent rounded-lg text-[12px] font-bold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Canvas
          </button>
        </div>
      )}

      {canvases.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
          <LayoutGrid className="w-10 h-10 text-ink-faint mb-2" />
          <span className="text-sm font-semibold text-ink-faint">No canvases yet</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {canvases.map((canvas) => (
            <div
              key={canvas.id}
              onClick={() => navigate(`/canvas/${canvas.id}`)}
              className="p-4 rounded-xl border border-line/80 bg-surface shadow-sm hover:border-accent/40 hover:shadow-md transition-all cursor-pointer flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13.5px] font-bold text-ink truncate">{canvas.name}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingCanvas(canvas);
                  }}
                  className="p-1.5 text-ink-faint hover:text-danger hover:bg-danger-dim rounded-md transition-colors shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between text-[12px] text-ink-muted font-medium">
                <span className="flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-ink-faint" />
                  {canvas.nodes.length} {canvas.nodes.length === 1 ? 'contact' : 'contacts'}
                </span>
                <span className="text-ink-faint">Updated {formatRelativeTime(canvas.updated_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {deletingCanvas && (
        <ConfirmDialog
          title={`Delete "${deletingCanvas.name}"?`}
          message="This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await dispatch(deleteCanvas(deletingCanvas.id)).unwrap();
          }}
          onClose={() => setDeletingCanvas(null)}
        />
      )}
    </div>
  );
}
