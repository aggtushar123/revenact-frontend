import { FileText, Mic, Trash2 } from 'lucide-react';
import { formatDate } from '../../../features/customers/formatters';
import { formatSize } from '../../../features/files/fileFormat';
import type { Attachment } from '../../../features/files/filesSlice';
import { AccountTag } from './ListParts';
import { META, ROW_ACTION, ROW_ICON, TITLE_BUTTON } from './listStyles';

/** One file (spec 2026-09-27 §4): the name downloads it; size, description,
 *  the account tag, who uploaded it, its source and date; delete where the
 *  viewer may. */
export function FileItem({
  file,
  canDelete,
  onDownload,
  onDelete,
}: {
  file: Attachment;
  canDelete: boolean;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const source = file.source === 'transcript' ? 'Call transcript' : 'Upload';
  const Icon = file.source === 'transcript' ? Mic : FileText;
  return (
    <li data-file={file.id} className="flex gap-3 px-3 py-2.5">
      <span aria-hidden="true" className={ROW_ICON}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
            <button type="button" onClick={onDownload} className={TITLE_BUTTON}>
              {file.name}
            </button>
          </h3>
          <span className="shrink-0 font-mono-brand text-[11px] tabular-nums text-ink-muted">{formatSize(file.size)}</span>
        </div>
        {file.description ? <p className="truncate text-[13px] text-ink-muted">{file.description}</p> : null}
        <p className={META}>
          <AccountTag record={file} />
          <span className="min-w-0 truncate">{[file.uploaded_by?.name, source].filter(Boolean).join(' · ')}</span>
          <time dateTime={file.created_at} className="font-mono-brand tabular-nums">
            {formatDate(file.created_at.slice(0, 10))}
          </time>
        </p>
      </div>
      {canDelete ? (
        <button type="button" onClick={onDelete} aria-label={`Delete ${file.name}`} className={`${ROW_ACTION} hover:text-danger`}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </li>
  );
}
