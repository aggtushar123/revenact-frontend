import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Download, Pencil, Trash2 } from 'lucide-react';
import type { SentencePart } from '../../features/segments/ruleSentence';
import { deleteSegment, duplicateSegment, exportMembers } from '../../features/segments/segmentApi';
import type { PersonRef, Segment } from '../../features/segments/segmentTypes';
import { ConfirmDialog } from '../organizations/ConfirmDialog';
import { BUTTON } from '../organizations/portfolio/styles';
import { errorMessage } from '../organizations/portfolio/usePagedRead';
import { RuleSentence } from './RuleSentence';

function names(people: PersonRef[]): string {
  if (people.length <= 2) return people.map((person) => person.name).join(' and ');
  return `${people[0].name}, ${people[1].name} and ${people.length - 2} more`;
}

function sharingText(segment: Segment): string {
  if (segment.sharing === 'private') return 'Private';
  if (segment.sharing === 'workspace') return 'Shared with the workspace';
  return `Shared with ${names(segment.shared_with)}`;
}

/** The segment's header (spec §3): name, the rules as one sentence, owner
 *  and sharing, then Edit, Duplicate, Export CSV and Delete. Edit and Delete
 *  are the owner's only; Duplicate and Export are for anyone who can read it.
 *  Delete reuses the shared ConfirmDialog (Ruling G19). */
export function SegmentHeader({
  segment,
  parts,
  exportQuery,
  onNotice,
}: {
  segment: Segment;
  parts: SentencePart[];
  /** The Members tab's own search and sort, so the file matches the list. */
  exportQuery: string;
  onNotice: (message: string | null) => void;
}) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<'duplicate' | 'export' | null>(null);
  const [deleting, setDeleting] = useState(false);

  const run = async (what: 'duplicate' | 'export') => {
    setBusy(what);
    onNotice(null);
    try {
      if (what === 'duplicate') {
        const copy = await duplicateSegment(segment.id);
        navigate(`/segments/${copy.id}`);
      } else {
        await exportMembers(segment.id, exportQuery);
      }
    } catch (err) {
      onNotice(errorMessage(err, what === 'duplicate' ? 'Could not duplicate this segment.' : 'Could not export the members.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <header className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-[22px] font-semibold text-ink">{segment.name}</h1>
          {segment.description ? <p className="text-[13px] text-ink-muted">{segment.description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {segment.is_owner ? (
            <Link to={`/segments/${segment.id}/edit`} className={BUTTON}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
          ) : null}
          <button type="button" onClick={() => void run('duplicate')} disabled={busy !== null} className={BUTTON}>
            <Copy className="h-4 w-4" aria-hidden="true" />
            {busy === 'duplicate' ? 'Duplicating…' : 'Duplicate'}
          </button>
          <button type="button" onClick={() => void run('export')} disabled={busy !== null} className={BUTTON}>
            <Download className="h-4 w-4" aria-hidden="true" />
            {busy === 'export' ? 'Exporting…' : 'Export CSV'}
          </button>
          {segment.is_owner ? (
            <button type="button" onClick={() => setDeleting(true)} className={`${BUTTON} text-danger`}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </button>
          ) : null}
        </div>
      </div>
      <RuleSentence parts={parts} />
      <p className="text-[11px] text-ink-muted">
        {segment.is_owner ? 'Yours' : `Owned by ${segment.owner.name}`} · {sharingText(segment)}
        {segment.paused ? ' · Paused' : ''}
      </p>
      {deleting ? (
        <ConfirmDialog
          title={`Delete ${segment.name}?`}
          message="Its rules, pins and history are deleted. The records in it are not touched."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            try {
              await deleteSegment(segment.id);
            } catch (err) {
              // ConfirmDialog shows a thrown string as its error.
              throw errorMessage(err, 'Could not delete this segment.');
            }
            navigate('/segments');
          }}
          onClose={() => setDeleting(false)}
        />
      ) : null}
    </header>
  );
}
