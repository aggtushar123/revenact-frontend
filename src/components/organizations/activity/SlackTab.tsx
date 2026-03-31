import { ChevronDown, Plus, MoreHorizontal, CornerDownRight, Hash, Smile, Frown, Meh } from 'lucide-react';

export interface SlackMessage {
  id: number;
  orgId: number;
  title: string;
  summary: string;
  dateStr: string;
  timeStr: string;
  group: string;
  replies: number;
  tags: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

const SLACK_DATA: SlackMessage[] = [
  {
    id: 1,
    orgId: 1,
    group: '21 Jan 2026',
    title: 'SFTP data feed implementation facing technical and timeline challenges',
    summary: 'The team is working on setting up an SFTP data feed with key-based authentication, encountering connection errors and tight leadership expectations. Technical details include support for ED25519 keys, potential PGP encryption, and IP allowlisting.',
    dateStr: 'Jan 21st',
    timeStr: '9:23 AM',
    replies: 3,
    tags: ['Product', 'Integrations', 'Webhooks & APIs'],
    sentiment: 'negative'
  },
  {
    id: 2,
    orgId: 1,
    group: '21 Jan 2026',
    title: 'Developing secure SSO framework and authentication flows',
    summary: 'Engineering has successfully mapped out the preliminary SAML/SSO architecture. Need further clarification on user provisioning and default role assignments before pushing the final spec for review.',
    dateStr: 'Jan 21st',
    timeStr: '9:21 AM',
    replies: 0,
    tags: ['Security', 'Identity'],
    sentiment: 'positive'
  }
];

export function SlackTab({ entityId }: { entityId: number | string }) {
  const items = SLACK_DATA.filter(t => t.orgId == entityId);

  const grouped = items.reduce<Record<string, SlackMessage[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped);

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden font-sans">
      
      {/* Search Header / Filter Pill */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 shrink-0 bg-white z-10 w-full">
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/80 text-indigo-600 hover:bg-indigo-100/80 rounded-[8px] transition-colors border border-indigo-100/50">
          <span className="text-[13px] font-bold">All-Trialenvonboarding</span>
          <ChevronDown className="w-3.5 h-3.5 ml-1" />
        </button>
        <button className="w-6 h-6 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-8 py-6 relative">
        
        {/* Timeline Area */}
        <div className="relative">
          {/* Global Timeline Vertical Line */}
          {items.length > 0 && <div className="absolute left-[11px] top-8 bottom-0 w-[2px] bg-[#E0E2F6] z-0 rounded-full"></div>}

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <Hash className="w-10 h-10 text-gray-300 mb-2" />
              <span className="text-sm font-semibold text-gray-400">No Slack threads found</span>
            </div>
          ) : (
            sortedGroups.map(([group, groupItems]) => (
              <div key={group} className="relative z-10 mb-8 pl-0">
                {/* Group Date Pill */}
                <div className="mb-6 inline-block bg-[#F4F5FB] rounded-full px-3.5 py-1 text-[11px] font-extrabold text-gray-500 shadow-[0_1px_2px_rgba(0,0,0,0.02)] relative z-10 ml-[2px]">
                  {group}
                </div>
                
                <div className="flex flex-col gap-6">
                  {groupItems.map((item) => (
                    <SlackCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

function SlackCard({ item }: { item: SlackMessage }) {
  const getSentimentIcon = () => {
    switch(item.sentiment) {
      case 'negative': return <Frown className="w-4 h-4 text-red-400" strokeWidth={2.5} />;
      case 'positive': return <Smile className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />;
      case 'neutral': return <Meh className="w-4 h-4 text-amber-500" strokeWidth={2.5} />;
      default: return null;
    }
  };

  return (
    <div className="relative flex items-start gap-4 z-10 group">
      {/* Timeline Icon */}
      <div className="w-[24px] h-[24px] rounded-full bg-white border-2 border-indigo-400/60 text-[#6D72D6] flex items-center justify-center shrink-0 mt-3 relative z-10 shadow-sm">
        <Hash className="w-3.5 h-3.5 opacity-90" strokeWidth={2.5} />
      </div>

      {/* Main card content */}
      <div className="flex-1 bg-white border border-gray-200/80 rounded-xl p-[18px] shadow-sm hover:shadow-md transition-shadow duration-200 group-hover:border-indigo-100 flex flex-col gap-2.5">
        
        {/* Card Header */}
        <div className="flex items-start justify-between gap-4">
          <h4 className="text-[14px] font-bold text-[#334155] leading-snug flex-1">
            {item.title}
          </h4>
          <div className="flex items-center gap-2.5 shrink-0 pt-0.5">
            {getSentimentIcon()}
            <span className="text-[12px] font-semibold text-[#64748B]">{item.dateStr} {item.timeStr}</span>
            <button className="p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card Body */}
        <p className="text-[13px] text-gray-600/90 leading-relaxed font-medium">
          {item.summary}
        </p>

        {/* Card Footer */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {/* Replies */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-gray-200 bg-gray-50/50 text-gray-600">
            <CornerDownRight className="w-3.5 h-3.5 opacity-70" />
            <span className="text-[12px] font-bold">{item.replies}</span>
          </div>

          {/* Tags */}
          {item.tags.map(tag => (
            <div key={tag} className="px-2 py-1 rounded bg-indigo-50/60 text-indigo-600 text-[11px] font-bold tracking-tight">
              {tag}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
