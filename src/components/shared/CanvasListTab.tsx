import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutGrid, Plus, Trash2 } from 'lucide-react';
import { useAppDispatch } from '../../hooks';
import { deleteCanvas, type Canvas } from '../../features/customers/customersSlice';
import { formatRelativeTime } from '../../features/customers/formatters';
import { ConfirmDialog } from '../organizations/ConfirmDialog';
import { ListSkeleton, SummaryLine } from '../organizations/detail/ListParts';
import { LIST, META, ROW_ACTION, ROW_ICON, TITLE_BUTTON } from '../organizations/detail/listStyles';
import { EmptyState, ErrorBlock } from '../organizations/portfolio/PortfolioSections';
import { BUTTON } from '../organizations/portfolio/styles';

export interface CanvasListTabProps {
  canvases: Canvas[];
  isLoading: boolean;
  error: string | null;
  /** The organization a new canvas goes on, if the page has one. */
  customerId?: number;
  /** The account a new canvas goes on (the account page passes only this). */
  accountId?: number;
  /** Reads the list again after a failed read (the error's Try again). */
  onRetry: () => void;
}

/** "Updated 2 days ago": the leading number in DM Mono (house rule: numbers
 *  in font-mono-brand tabular-nums), the rest of the phrase as plain text. */
function UpdatedAt({ iso }: { iso: string | null }) {
  const text = formatRelativeTime(iso);
  const match = /^(\d+)(\D.*)$/.exec(text);
  if (!match) return <span>Updated {text}</span>;
  return (
    <span>
      Updated <span className="font-mono-brand tabular-nums">{match[1]}</span>
      {match[2]}
    </span>
  );
}

/** Canvases (account spec 2026-09-29 §2.9b): a page's canvases as list items
 *  (the name opens the editor; how many contacts it maps; when it changed;
 *  delete), and New canvas straight into the editor for this parent. */
export function CanvasListTab({ canvases, isLoading, error, customerId, accountId, onRetry }: CanvasListTabProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [deletingCanvas, setDeletingCanvas] = useState<Canvas | null>(null);
  const canCreate = customerId !== undefined || accountId !== undefined;

  function handleNewCanvas() {
    const params = new URLSearchParams();
    if (customerId !== undefined) params.set('customerId', String(customerId));
    if (accountId !== undefined) params.set('accountId', String(accountId));
    navigate(`/canvas/create?${params.toString()}`);
  }

  let body: ReactNode;
  if (error) {
    body = <ErrorBlock message={error} onRetry={onRetry} />;
  } else if (isLoading) {
    body = <ListSkeleton label="Loading canvases" />;
  } else if (canvases.length === 0) {
    body = <EmptyState title="No canvases yet" detail="A canvas maps the people on this account and how they connect." action={null} />;
  } else {
    body = (
      <ul aria-label="Canvases" className={LIST}>
        {canvases.map((canvas) => (
          <li key={canvas.id} data-canvas={canvas.id} className="flex gap-3 px-3 py-2.5">
            <span aria-hidden="true" className={ROW_ICON}>
              <LayoutGrid className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="min-w-0 truncate text-[13px] font-semibold text-ink">
                <Link to={`/canvas/${canvas.id}`} className={TITLE_BUTTON}>
                  {canvas.name}
                </Link>
              </h3>
              <p className={META}>
                <span>
                  <span className="font-mono-brand tabular-nums">{canvas.nodes.length}</span>{' '}
                  {canvas.nodes.length === 1 ? 'contact' : 'contacts'}
                </span>
                <UpdatedAt iso={canvas.updated_at} />
              </p>
            </div>
            <button type="button" onClick={() => setDeletingCanvas(canvas)} aria-label={`Delete ${canvas.name}`} className={ROW_ACTION}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {!isLoading && !error && canvases.length > 0 ? (
          <SummaryLine parts={[{ value: String(canvases.length), label: canvases.length === 1 ? 'canvas' : 'canvases' }]} />
        ) : (
          <span />
        )}
        {canCreate ? (
          <button type="button" onClick={handleNewCanvas} className={BUTTON}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New canvas
          </button>
        ) : null}
      </div>
      {body}
      {deletingCanvas ? (
        <ConfirmDialog
          title={`Delete ${deletingCanvas.name}?`}
          message="This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await dispatch(deleteCanvas(deletingCanvas.id)).unwrap();
          }}
          onClose={() => setDeletingCanvas(null)}
        />
      ) : null}
    </div>
  );
}
