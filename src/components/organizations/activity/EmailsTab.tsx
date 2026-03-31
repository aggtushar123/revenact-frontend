import { MoreHorizontal, Sparkles, Link2, Eye, MessageCircle } from 'lucide-react';
import { EMAILS_DATA, type EmailItem } from '../activityData';

export function EmailsTab({ orgId }: { orgId: number }) {
  const emails = EMAILS_DATA.filter(e => e.orgId === orgId);

  // Group by date
  const grouped = emails.reduce<Record<string, EmailItem[]>>((acc, email) => {
    if (!acc[email.group]) acc[email.group] = [];
    acc[email.group].push(email);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
  );

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
        <MessageCircle className="w-10 h-10 text-gray-300 mb-2" />
        <span className="text-sm font-semibold text-gray-400">No emails found</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {sortedGroups.map(([group, items]) => (
        <div key={group} className="flex flex-col">
          <div className="px-6 py-2 bg-gray-50/80 border-b border-gray-100 sticky top-0 z-10">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{group}</span>
          </div>
          {items.map(email => (
            <EmailCard key={email.id} email={email} />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmailCard({ email }: { email: EmailItem }) {
  return (
    <div className="px-6 py-4 border-b border-gray-50 hover:bg-indigo-50/20 transition-colors cursor-pointer group">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-[14px] font-semibold text-gray-900 leading-snug flex-1 pr-4 group-hover:text-indigo-700 transition-colors">
          {email.subject}
        </h4>
        <div className="flex items-center gap-2 shrink-0">
          {email.isStarred && (
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="text-[11.5px] font-medium text-gray-400 whitespace-nowrap">{email.date}</span>
          <button className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <img src={email.senderAvatar} alt={email.senderName} className="w-6 h-6 rounded-full border border-gray-100 object-cover" />
        <div className="flex items-center gap-1.5">
          <span className="text-[12.5px] font-semibold text-gray-700">{email.senderName}</span>
          <span className="text-[11px] text-gray-400">▸</span>
          <span className="text-[12px] text-gray-400 italic">{email.recipientName}</span>
        </div>
      </div>
      <p className="text-[12.5px] text-gray-500 leading-relaxed mb-3 pl-8 line-clamp-2">{email.body}</p>
      <div className="flex items-center gap-4 pl-8">
        {email.watchers > 0 && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
            <Eye className="w-3 h-3" />
            <span>{email.watchers}</span>
          </div>
        )}
        {email.links > 0 && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-400">
            <Link2 className="w-3 h-3" />
            <span>{email.links} Links</span>
          </div>
        )}
      </div>
    </div>
  );
}
