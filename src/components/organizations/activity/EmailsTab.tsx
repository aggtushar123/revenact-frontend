import { useState } from 'react';
import { MoreHorizontal, Sparkles, Link2, Eye, MessageCircle, X, ChevronDown, Reply, Forward, Star, Paperclip, ExternalLink, Smile } from 'lucide-react';
import { EMAILS_DATA, type EmailItem } from '../activityData';

// ── Email Thread Panel ────────────────────────────────────────────────────────

interface ThreadMessage {
  id: number;
  sender: string;
  senderAvatar: string;
  recipient: string;
  date: string;
  body: string;
  isExpanded: boolean;
}

function buildThread(email: EmailItem): ThreadMessage[] {
  // Build a realistic back-and-forth thread from a single EmailItem
  return [
    {
      id: 1,
      sender: email.recipientName,
      senderAvatar: `https://i.pravatar.cc/150?u=${email.recipientName}`,
      recipient: email.senderName,
      date: email.group.replace(/(\d+) (\w+) (\d+)/, '$1 $2 $3').replace('2026', '10:43 AM').replace('2025', '10:43 AM'),
      body: `Hi ${email.senderName.split(' ')[0]},\n\nHope you're doing well. I'm excited to help you get started. To begin onboarding, I'd like to walk you through the core setup steps and ensure everything is aligned with your team's goals.\n\nCould we schedule a short call this week to kick things off?\n\nBest regards,\n${email.recipientName}`,
      isExpanded: true,
    },
    {
      id: 2,
      sender: email.senderName,
      senderAvatar: email.senderAvatar,
      recipient: email.recipientName,
      date: email.date,
      body: email.body,
      isExpanded: true,
    },
  ];
}

export function EmailThreadPanel({ email, onClose }: { email: EmailItem; onClose: () => void }) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set([1, 2]));
  const thread = buildThread(email);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <>

      {/* Panel */}
      <div
        className="h-full flex flex-col bg-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Panel Header */}
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-extrabold text-[#6D72D6]">Email Thread</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subject line + link count */}
          <div className="flex items-center justify-between">
            <h3 className="text-[13.5px] font-semibold text-gray-800 truncate flex-1 pr-3" title={email.subject}>
              {email.subject}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              {email.links > 0 && (
                <span className="flex items-center gap-1 text-[11.5px] font-bold text-indigo-400 bg-transparent px-1 cursor-pointer">
                  {email.links} Links
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Thread messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {thread.map((msg, idx) => {
            const isExpanded = expandedIds.has(msg.id);
            const isLast = idx === thread.length - 1;

            return (
              <div key={msg.id} className={`border-b border-gray-50 ${isLast ? 'border-b-0' : ''}`}>
                {/* Message header — always visible */}
                <div
                  className="px-5 pt-4 pb-1 flex items-start justify-between cursor-pointer transition-colors"
                  onClick={() => toggleExpand(msg.id)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={msg.senderAvatar}
                      alt={msg.sender}
                      className="w-8 h-8 rounded-full border border-gray-100 object-cover shrink-0"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-gray-900">{msg.sender}</span>
                        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                      </div>
                      <span className="text-[11.5px] text-gray-400">{msg.recipient}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11.5px] font-medium text-gray-400 whitespace-nowrap">{msg.date}</span>
                    <button
                      onClick={e => e.stopPropagation()}
                      className="p-0.5 rounded opacity-60 hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Message body — collapsible */}
                {isExpanded && (
                  <div className="px-5 pb-5">
                    {/* Emoji reaction row */}
                    <div className="flex justify-end mb-2">
                       <div className="w-6 h-6 rounded-full border border-teal-200 bg-teal-50 flex items-center justify-center text-teal-500 cursor-pointer">
                         <Smile className="w-3.5 h-3.5" />
                       </div>
                    </div>

                    {/* Body text */}
                    <div className="text-[12.5px] text-gray-600 leading-[1.6] whitespace-pre-line pl-11">
                      {msg.body}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-5 pl-11">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-lg text-[12px] font-semibold text-gray-600 hover:text-indigo-600 transition-all">
                        <Reply className="w-3.5 h-3.5" />
                        Reply
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-600 transition-all">
                        <Forward className="w-3.5 h-3.5" />
                        Forward
                      </button>
                    </div>
                  </div>
                )}

                {/* Collapsed preview */}
                {!isExpanded && (
                  <div className="px-5 pb-3 pl-16">
                    <p className="text-[12px] text-gray-400 truncate">{msg.body.split('\n')[0]}</p>
                  </div>
                )}

                {/* If there's another message in the thread, render the connecting line and circle */}
                {idx < thread.length - 1 && (
                  <div className="relative flex items-center py-4">
                     {/* Horizontal line extending through the circle */}
                     <div className="absolute left-6 right-6 h-px bg-gray-100"></div>
                     <div className="relative left-[22px] w-8 h-8 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center text-[12px] font-bold text-gray-500 z-10">
                        1
                     </div>
                  </div>
                )}
              </div>
            );
          })}


        </div>

        {/* Quick Reply Composer */}
        <div className="border-t border-gray-100 p-3 shrink-0 bg-gray-50/30">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-3 py-1.5 border-b border-gray-100 flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Reply to</span>
              <span className="text-[12px] font-semibold text-gray-700">{email.senderName}</span>
            </div>
            <textarea
              placeholder="Write a reply..."
              rows={1}
              className="w-full px-3 py-2 text-[13px] text-gray-700 placeholder:text-gray-400 resize-none focus:outline-none bg-transparent min-h-[36px]"
            />
            <div className="px-3 py-1.5 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                  <Star className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
              <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm active:scale-95">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── EmailsTab ─────────────────────────────────────────────────────────────────

export function EmailsTab({ 
  entityId, 
  selectedEmail, 
  onSelectEmail 
}: { 
  entityId: number | string;
  selectedEmail?: EmailItem | null;
  onSelectEmail?: (email: EmailItem | null) => void;
}) {
  const [localSelected, setLocalSelected] = useState<EmailItem | null>(null);
  const currentSelectedEmail = selectedEmail !== undefined ? selectedEmail : localSelected;
  const handleSelectEmail = onSelectEmail || setLocalSelected;
  const emails = EMAILS_DATA.filter(e => e.orgId == entityId);

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
    <div className="flex-1 overflow-y-auto custom-scrollbar relative">
      {sortedGroups.map(([group, items]) => (
        <div key={group} className="flex flex-col">
          <div className="px-6 py-2 bg-gray-50/80 border-b border-gray-100 sticky top-0 z-10">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{group}</span>
          </div>
          {items.map(email => (
            <EmailCard
              key={email.id}
              email={email}
              isSelected={currentSelectedEmail?.id === email.id}
              onClick={() => handleSelectEmail(currentSelectedEmail?.id === email.id ? null : email)}
            />
          ))}
        </div>
      ))}

    </div>
  );
}

// ── EmailCard ─────────────────────────────────────────────────────────────────

function EmailCard({
  email,
  isSelected,
  onClick,
}: {
  email: EmailItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`px-6 py-4 border-b border-gray-50 cursor-pointer group transition-all ${
        isSelected
          ? 'bg-indigo-50/60 border-l-2 border-l-indigo-400'
          : 'hover:bg-indigo-50/20 border-l-2 border-l-transparent'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className={`text-[14px] font-semibold leading-snug flex-1 pr-4 transition-colors ${
          isSelected ? 'text-indigo-700' : 'text-gray-900 group-hover:text-indigo-700'
        }`}>
          {email.subject}
        </h4>
        <div className="flex items-center gap-2 shrink-0">
          {email.isStarred && (
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="text-[11.5px] font-medium text-gray-400 whitespace-nowrap">{email.date}</span>
          <button
            onClick={e => e.stopPropagation()}
            className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
          >
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
