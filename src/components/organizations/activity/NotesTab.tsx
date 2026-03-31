import { FileText, MoreHorizontal, Sparkles } from 'lucide-react';
import { NOTES_DATA, type NoteItem } from '../activityData';

export function NotesTab({ entityId }: { entityId: number | string }) {
  const notes = NOTES_DATA.filter(n => n.orgId == entityId);

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
    <div className="flex-1 overflow-y-auto custom-scrollbar relative px-8 py-6 bg-[#FAFAFA]/40 font-sans">
      {/* Global Timeline Vertical Line */}
      <div className="absolute left-[44px] top-6 bottom-0 w-px bg-[#F3E2B3] z-0"></div>

      {sortedGroups.map(([group, items]) => (
        <div key={group} className="relative z-10 mb-8">
          {/* Group Date Pill */}
          <div className="mb-6 inline-block bg-[#F8F9FA] rounded-full px-4 py-1.5 text-[11.5px] font-bold text-gray-500 border border-gray-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)] relative z-10 transition-colors">
            {group}
          </div>
          
          <div className="flex flex-col gap-6">
            {items.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function NoteCard({ note }: { note: NoteItem }) {
  return (
    <div className="relative flex items-start gap-5 z-10 group">
      {/* Timeline Squircle Icon */}
      <div className="w-[24px] h-[24px] rounded-md bg-[#FFF9ED] border border-[#F3E2B3] text-[#DE9A26] flex items-center justify-center shrink-0 mt-5 relative z-10 shadow-sm">
        <FileText className="w-3.5 h-3.5" />
      </div>

      {/* Main card content */}
      <div className="flex-1 bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between mb-3.5">
          <h4 className="text-[14.5px] font-extrabold text-[#334155] pr-4 leading-snug group-hover:text-indigo-600 transition-colors">
            {note.title}
          </h4>
          <div className="flex items-center gap-2 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#6D72D6]" />
            <span className="text-[12px] font-bold text-[#64748B]">{note.date}</span>
            <button className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 ml-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-[12px] font-medium text-gray-400">Logged by</span>
          <img src={note.authorAvatar} alt={note.author} className="w-5 h-5 rounded-full object-cover border border-gray-100" />
          <span className="text-[12px] font-bold text-[#475569]">{note.author}</span>
        </div>

        <p className="text-[13px] text-[#64748B] leading-[1.65] mb-2 pr-2">
          {note.content}
        </p>

        <div className="flex justify-end mt-1.5">
           <span className="text-[11.5px] font-bold text-[#6D72D6] cursor-pointer hover:underline">
             1 Links
           </span>
        </div>
      </div>
    </div>
  );
}
