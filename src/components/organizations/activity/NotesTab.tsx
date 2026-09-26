import { useState, type FormEvent } from 'react';
import { FileText, MoreHorizontal, Sparkles } from 'lucide-react';
import type { Note } from '../../../features/customers/customersSlice';
import { formatDateUS } from '../../../features/customers/formatters';
import { ApiError } from '../../../lib/apiClient';


export interface NotesTabProps {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  /** Saves a new note on this record; absent when the record cannot take one (mock data). */
  onCreate?: (note: { title: string; body: string }) => Promise<boolean>;
}

/** The new-note form on its own, so the organization page's "+ Add" can show
 *  it in a sheet. It clears itself and calls `onDone` once the note is saved. */
export function NoteForm({
  onCreate,
  onDone,
}: {
  onCreate: (note: { title: string; body: string }) => Promise<boolean>;
  onDone?: () => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setError(null);
    setSaving(true);
    try {
      const ok = await onCreate({ title: title.trim(), body: body.trim() });
      setSaving(false);
      if (ok) {
        setTitle('');
        setBody('');
        onDone?.();
      } else {
        setError('Could not save that note.');
      }
    } catch (err) {
      setSaving(false);
      setError(err instanceof ApiError ? err.message : 'Could not save that note.');
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <input aria-label="Note title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="px-3 py-1.5 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent" />
      <textarea aria-label="Note body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="What do you want the team above you to know?" rows={4} className="px-3 py-1.5 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent resize-y" />
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="px-3 py-1.5 bg-accent text-on-accent rounded-lg text-[12px] font-bold disabled:opacity-50">
          {saving ? 'Saving…' : 'Save note'}
        </button>
      </div>
      {error && <div className="text-[12px] text-danger font-semibold" role="alert">{error}</div>}
    </form>
  );
}

function NewNoteForm({ onCreate }: { onCreate: (note: { title: string; body: string }) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-6 py-2 border-b border-line-subtle flex flex-col gap-2 bg-surface">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11.5px] text-ink-faint">Notes you write here are seen by you and your management chain only.</span>
        <button type="button" onClick={() => setOpen((v) => !v)} className="px-3 py-1.5 bg-accent text-on-accent rounded-lg text-[12px] font-bold">
          {open ? 'Cancel' : 'New note'}
        </button>
      </div>
      {open && <NoteForm onCreate={onCreate} onDone={() => setOpen(false)} />}
    </div>
  );
}

export function NotesTab({ notes, isLoading, error, onCreate }: NotesTabProps) {
  const grouped = notes.reduce<Record<string, Note[]>>((acc, note) => {
    if (!acc[note.logged_at]) acc[note.logged_at] = [];
    acc[note.logged_at].push(note);
    return acc;
  }, {});

  // logged_at is already "YYYY-MM-DD" — sorts correctly as a plain
  // string, no need to go through Date.
  const sortedGroups = Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
        <span className="text-sm font-semibold text-ink-faint">Loading notes…</span>
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

  if (notes.length === 0) {
    return (
      <div className="flex flex-col flex-1">
        {onCreate && <NewNoteForm onCreate={onCreate} />}
        <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
          <FileText className="w-10 h-10 text-ink-faint mb-2" />
          <span className="text-sm font-semibold text-ink-faint">No notes found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {onCreate && <NewNoteForm onCreate={onCreate} />}
    <div className="flex-1 overflow-y-auto custom-scrollbar relative px-8 py-6 bg-subtle/40 font-sans">
      {/* Global Timeline Vertical Line */}
      <div className="absolute left-[44px] top-6 bottom-0 w-px bg-warning-dim z-0"></div>

      {sortedGroups.map(([day, items]) => (
        <div key={day} className="relative z-10 mb-8">
          {/* Group Date Pill */}
          <div className="mb-6 inline-block bg-subtle rounded-full px-4 py-1.5 text-[11.5px] font-bold text-ink-muted border border-line/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)] relative z-10 transition-colors">
            {formatDateUS(day)}
          </div>

          <div className="flex flex-col gap-6">
            {items.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}

function NoteCard({ note }: { note: Note }) {
  return (
    <div className="relative flex items-start gap-5 z-10 group">
      {/* Timeline Squircle Icon */}
      <div className="w-[24px] h-[24px] rounded-md bg-warning-dim border border-warning/30 text-warning flex items-center justify-center shrink-0 mt-5 relative z-10 shadow-sm">
        <FileText className="w-3.5 h-3.5" />
      </div>

      {/* Main card content */}
      <div className="flex-1 bg-surface border border-line/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between mb-3.5">
          <h4 className="text-[14.5px] font-extrabold text-ink pr-4 leading-snug group-hover:text-accent transition-colors">
            {note.title}
          </h4>
          <div className="flex items-center gap-2 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-[12px] font-bold text-ink-muted">{formatDateUS(note.logged_at)}</span>
            <button className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-ink-faint hover:text-ink-muted ml-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-[12px] font-medium text-ink-faint">Logged by</span>
          <img
            src={`https://i.pravatar.cc/150?u=${encodeURIComponent(note.author_name)}`}
            alt={note.author_name}
            className="w-5 h-5 rounded-full object-cover border border-line-subtle"
          />
          <span className="text-[12px] font-bold text-ink-muted">{note.author_name}</span>
        </div>

        <p className="text-[13px] text-ink-muted leading-[1.65] mb-2 pr-2">
          {note.body}
        </p>

        {note.links > 0 && (
          <div className="flex justify-end mt-1.5">
            <span className="text-[11.5px] font-bold text-accent cursor-pointer hover:underline">
              {note.links} Links
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
