import { useId, useLayoutEffect, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { UploadCloud } from 'lucide-react';
import { useAppDispatch, useAppSelector, useCapability } from '../../../hooks';
import type { Account } from '../../../features/customers/customersSlice';
import { canDeleteFile, FILE_ACCEPT } from '../../../features/files/fileFormat';
import { deleteFile, downloadAttachment, fetchFiles, uploadFile, type Attachment, type FileParent } from '../../../features/files/filesSlice';
import { byAccount, chosenAccount, scopeLabel } from '../../../features/organizations/accountScope';
import { ConfirmDialog } from '../ConfirmDialog';
import { ErrorBlock } from '../portfolio/PortfolioSections';
import { BUTTON, FOCUS } from '../portfolio/styles';
import { FileItem } from './FileItem';
import { ListSkeleton, ScopedEmpty } from './ListParts';
import { LIST, SECTION_HEADING } from './listStyles';

/** Files (spec 2026-09-27 §4): the organization's own files and every
 *  visible account's, each tagged, narrowed by the account chip. Uploading
 *  (the button or a drop) while an account is chosen attaches to that
 *  account. Downloads go through the session: the API never exposes a URL a
 *  plain link could open. */
export function FilesSection({
  customerId,
  account,
  accounts,
  isSm,
  onShowAll,
}: {
  customerId: number;
  /** The chip: '' All, 'none' the organization itself, or an account id. */
  account: string;
  accounts: Account[];
  isSm: boolean;
  onShowAll: () => void;
}) {
  const dispatch = useAppDispatch();
  const { items, isLoading, error, uploading, uploadError } = useAppSelector((state) => state.files);
  const me = useAppSelector((state) => state.auth.user);
  const isAdmin = useCapability('manage_org_settings');
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [description, setDescription] = useState('');
  const [dragging, setDragging] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Attachment | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const headingId = useId();
  const descriptionId = useId();

  // Before paint, as People does.
  useLayoutEffect(() => {
    void dispatch(fetchFiles({ entityType: 'organization', customerId })).then(() => setLoaded(true));
  }, [dispatch, customerId, attempt]);

  const target = chosenAccount(accounts, account);
  const parent: FileParent = target ? { entityType: 'account', customerId, accountId: target.id } : { entityType: 'organization', customerId };
  const shown = byAccount(items, account);
  const failed = error !== null && !isLoading;

  async function send(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      await dispatch(uploadFile({ ...parent, file, description: description.trim() || undefined }));
    }
    setDescription('');
    if (input.current) input.current.value = '';
  }

  function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length) void send(event.dataTransfer.files);
  }

  async function download(file: Attachment) {
    setDownloadError(null);
    try {
      await downloadAttachment(file);
    } catch {
      setDownloadError(`Could not download ${file.name}.`);
    }
  }

  let body: ReactNode;
  if (failed) body = <ErrorBlock message={error} onRetry={() => setAttempt((n) => n + 1)} />;
  else if (!loaded) body = <ListSkeleton label="Loading files" />;
  else if (shown.length === 0) {
    body = (
      <ScopedEmpty
        what="files"
        scope={scopeLabel(accounts, account)}
        detail="Contracts, decks and transcripts the team keeps here. Drop files on this section or use Upload file."
        onShowAll={onShowAll}
      />
    );
  } else {
    body = (
      <ul aria-label="Files" className={LIST}>
        {shown.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            canDelete={canDeleteFile(file, me?.id ?? null, isAdmin)}
            onDownload={() => void download(file)}
            onDelete={() => setDeleting(file)}
          />
        ))}
      </ul>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      className={`flex flex-col gap-2 rounded-xl ${dragging ? 'bg-subtle' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <div className={isSm ? 'flex items-end justify-between gap-3' : 'flex flex-col gap-2'}>
        <div className="min-w-0">
          <h2 id={headingId} className={SECTION_HEADING}>
            Files
          </h2>
          <p className="text-[13px] text-ink-muted">Up to 25 MB each. New files go on {target?.name ?? 'the organization'}.</p>
        </div>
        <div className={isSm ? 'flex items-end gap-2' : 'flex flex-col gap-2'}>
          <div className="flex flex-col gap-1">
            <label htmlFor={descriptionId} className="text-[11px] font-semibold text-ink-muted">
              Description (optional)
            </label>
            <input
              id={descriptionId}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={`min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink sm:min-h-9 sm:w-56 sm:text-[13px] ${FOCUS}`}
            />
          </div>
          <input
            ref={input}
            type="file"
            multiple
            accept={FILE_ACCEPT}
            tabIndex={-1}
            aria-label="Choose files"
            className="sr-only"
            onChange={(event) => {
              if (event.target.files) void send(event.target.files);
            }}
          />
          <button type="button" onClick={() => input.current?.click()} disabled={uploading} className={`${BUTTON} justify-center`}>
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
            {uploading ? 'Uploading…' : 'Upload file'}
          </button>
        </div>
      </div>
      {uploadError || downloadError ? (
        <p role="alert" className="text-[13px] text-danger">
          {downloadError ?? uploadError}
        </p>
      ) : null}
      {body}
      {deleting ? (
        <ConfirmDialog
          title={`Delete ${deleting.name}?`}
          message="This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await dispatch(deleteFile(deleting.id)).unwrap();
          }}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </section>
  );
}
