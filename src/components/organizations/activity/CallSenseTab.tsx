import { Search, Filter, Info, X, Archive, Phone, Sparkles, MoreHorizontal } from 'lucide-react';

export interface CallSenseItem {
  id: number;
  orgId: number;
  title: string;
  source: string;
  author: string;
  authorAvatar: string;
  date: string;
  group: string;
  aiItems: string;
  links: number;
}

const CALLSENSE_DATA: CallSenseItem[] = [
  {
    id: 1,
    orgId: 1,
    title: 'EMEA Retail - Renewal Readiness Check-in',
    source: 'tl;dv',
    author: 'Chamath Gamage',
    authorAvatar: 'https://i.pravatar.cc/150?u=chamath',
    date: 'Jan 21st 5:12 PM',
    group: '21 Jan 2026',
    aiItems: 'Open AI Items',
    links: 2,
  },
  {
    id: 2,
    orgId: 1,
    title: 'Renewal & Expansion Review - Apple EMEA Retail Operations',
    source: 'tl;dv',
    author: 'Chamath Gamage',
    authorAvatar: 'https://i.pravatar.cc/150?u=chamath',
    date: 'Dec 5th 5:12 PM',
    group: '05 Dec 2025',
    aiItems: 'Open AI Items',
    links: 1,
  }
];

export function CallSenseTab({ entityId }: { entityId: number | string }) {
  const items = CALLSENSE_DATA.filter(t => t.orgId == entityId);

  const grouped = items.reduce<Record<string, CallSenseItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
  );

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden font-sans">
      {/* Search Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-10">
        <div className="relative flex-1 max-w-3xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search Table"
            className="w-full pl-9 pr-4 py-2 text-[13px] border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-shadow" 
          />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors ml-4 border border-transparent hover:border-gray-200">
          <Filter className="w-4 h-4" />
          <span className="text-[12px] font-bold text-gray-700">(0)</span>
        </button>
      </div>

      {/* Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-8 py-5">
        
        {/* Banner Alert */}
        <div className="flex items-center justify-between bg-[#F4F5FB] border border-[#DEE0F3] rounded-xl px-4 py-3 mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2.5">
            <div className="w-[18px] h-[18px] rounded-full bg-[#6D72D6] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Info className="w-3 h-3" strokeWidth={3} />
            </div>
            <p className="text-[12.5px] font-semibold text-[#6D72D6]/90">
              To receive updates, turn on AI Notifications in Settings within the Notifications section
            </p>
          </div>
          <button className="p-1 hover:bg-white rounded-md text-[#6D72D6]/70 hover:text-[#6D72D6] transition-colors shadow-sm border border-transparent hover:border-[#DEE0F3]">
             <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Timeline Area */}
        <div className="relative">
          {/* Global Timeline Vertical Line */}
          {items.length > 0 && <div className="absolute left-[12px] top-6 bottom-0 w-px bg-[#C3C6EF] z-0"></div>}

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <Archive className="w-10 h-10 text-gray-300 mb-2" />
              <span className="text-sm font-semibold text-gray-400">No calls found</span>
            </div>
          ) : (
            sortedGroups.map(([group, groupItems]) => (
              <div key={group} className="relative z-10 mb-8 pl-0">
                {/* Group Date Pill */}
                <div className="mb-6 inline-block bg-[#F8F9FA] rounded-full px-4 py-1.5 text-[11.5px] font-bold text-gray-500 border border-gray-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)] relative z-10 transition-colors ml-[4px]">
                  {group}
                </div>
                
                <div className="flex flex-col gap-6">
                  {groupItems.map((item) => (
                    <CallSenseCard key={item.id} item={item} />
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

function CallSenseCard({ item }: { item: CallSenseItem }) {
  return (
    <div className="relative flex items-start gap-5 z-10 group">
      {/* Timeline Squircle Icon */}
      <div className="w-[24px] h-[24px] rounded-[7px] bg-[#F4F5FB] border border-[#C3C6EF] text-[#6D72D6] flex items-center justify-center shrink-0 mt-5 relative z-10 shadow-sm">
        <Archive className="w-3.5 h-3.5" />
      </div>

      {/* Main card content */}
      <div className="flex-1 bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-gray-400" />
            <h4 className="text-[14.5px] font-extrabold text-[#334155] leading-snug group-hover:text-indigo-600 transition-colors">
              {item.title}
            </h4>
            <span className="text-[#6D72D6] font-bold text-[13px] ml-1 opacity-90">{item.source}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#6D72D6]" />
            <span className="text-[12px] font-bold text-[#64748B]">{item.date}</span>
            <button className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 ml-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-[12px] font-medium text-gray-400">Logged By:</span>
          <img src={item.authorAvatar} alt={item.author} className="w-5 h-5 rounded-full object-cover border border-gray-100 shadow-sm" />
          <span className="text-[12px] font-bold text-[#475569]">{item.author}</span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5 text-[#6D72D6] font-bold text-[12.5px] hover:text-indigo-700 cursor-pointer transition-colors px-2 py-1 -ml-2 rounded-lg hover:bg-indigo-50/50">
             <Sparkles className="w-4 h-4" />
             {item.aiItems}
          </div>

          <div className="flex justify-end">
             <span className="text-[11.5px] font-bold text-[#6D72D6] cursor-pointer hover:underline">
               {item.links} Links
             </span>
          </div>
        </div>
      </div>
    </div>
  );
}
