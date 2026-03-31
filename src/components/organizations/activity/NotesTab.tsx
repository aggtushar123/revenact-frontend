import { FileText, MoreHorizontal, Tag } from 'lucide-react';
import { NOTES_DATA, type NoteItem } from '../activityData';

export function NotesTab({ orgId }: { orgId: number }) {
  const notes = NOTES_DATA.filter(n => n.orgId === orgId);

  const grouped = notes.reduce<Record<string, NoteItem[]>>((acc, note) => {
    if (!acc[note.group]) acc[note.group] = [];
    acc[note.group].push(note);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
  );

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
        <FileText className="w-10 h-10 text-gray-300 mb-2" />
        <span className="text-sm font-semibold text-gray-400">No notes found</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {sortedGroups.map(([group, items]) => (
        <div key={group}>
          <div className="px-6 py-2 bg-gray-50/80 border-b border-gray-100 sticky top-0 z-10">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{group}</span>
          </div>
          {items.map(note => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      ))}
    </div>
  );
}

function NoteCard({ note }: { note: NoteItem }) {
  return (
    <div className="px-6 py-4 border-b border-gray-50 hover:bg-indigo-50/20 transition-colors cursor-pointer group">
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100 shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-[14px] font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{note.title}</h4>
        </div>
        <button className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[12.5px] text-gray-500 leading-relaxed mb-2.5 pl-[38px] line-clamp-2">{note.content}</p>
      <div className="flex items-center gap-4 pl-[38px]">
        <div className="flex items-center gap-1.5">
          <img src={note.authorAvatar} alt={note.author} className="w-5 h-5 rounded-full border border-gray-100 object-cover" />
          <span className="text-[12px] font-medium text-gray-500">{note.author}</span>
        </div>
        <span className="text-[11px] text-gray-400">{note.date}</span>
        {note.tags.length > 0 && (
          <div className="flex items-center gap-1.5">
            {note.tags.map(tag => (
              <span key={tag} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100">
                <Tag className="w-2.5 h-2.5" />{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
