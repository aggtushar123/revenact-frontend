import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Plus, Trash2, Share2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchCanvases, fetchCustomers, deleteCanvas } from '../../features/customers/customersSlice';
import type { Canvas } from '../../features/customers/customersSlice';
import { NewCanvasModal } from './NewCanvasModal';
import { ConfirmDialog } from '../../components/organizations/ConfirmDialog';
import { EntityAvatar } from '../../components/shared';
import { companyLabel, formatRelativeTime } from '../../features/customers/formatters';

// Structurally lighter than Surveys/Pipelines — no rollup metric to
// summarize, so no cards-above-a-table shape; just a gallery grid,
// same "compute nothing, just list what's already fetched" simplicity.
export function CanvasPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { canvases, canvasesLoading, canvasesError, customers } = useAppSelector((state) => state.customers);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingCanvas, setDeletingCanvas] = useState<Canvas | null>(null);

  useEffect(() => {
    dispatch(fetchCanvases());
    // Company picker for "New Canvas" — same source as Survey's/
    // Opportunity's own standalone Add flow.
    dispatch(fetchCustomers());
  }, [dispatch]);

  const companies = customers.map((c) => ({ id: c.id, name: c.name }));

  function handleOpen(canvas: Canvas) {
    navigate(`/canvas/${canvas.id}`);
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-ink tracking-tight">Canvas</h1>
          <p className="text-[13px] text-ink-faint font-medium mt-0.5">
            Every stakeholder relationship map across every Organization and Account.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[13px] font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Canvas
        </button>
      </div>

      {canvasesError && <p className="text-[12.5px] text-danger">{canvasesError}</p>}

      {canvasesLoading ? (
        <div className="flex items-center justify-center py-16 text-[13px] text-ink-faint">Loading…</div>
      ) : canvases.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center">
          <LayoutGrid className="w-8 h-8 text-ink-faint mb-1" />
          <p className="text-[14px] font-semibold text-ink-muted">No canvases yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {canvases.map((canvas) => (
            <div
              key={canvas.id}
              onClick={() => handleOpen(canvas)}
              className="text-left p-4 rounded-xl border border-line-subtle bg-surface shadow-sm hover:border-accent/40 hover:shadow-md transition-all cursor-pointer flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <EntityAvatar name={companyLabel(canvas.companies)} className="w-7 h-7 rounded-full text-[11px] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-bold text-ink truncate">{canvas.name}</p>
                    <p className="text-[11.5px] text-ink-faint font-medium truncate">
                      {companyLabel(canvas.companies)}
                      {canvas.account_name ? ` • ${canvas.account_name}` : ''}
                    </p>
                  </div>
                </div>
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

      {isCreating && <NewCanvasModal companies={companies} onClose={() => setIsCreating(false)} />}

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
