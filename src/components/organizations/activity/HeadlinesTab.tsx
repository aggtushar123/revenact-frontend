import { LayoutTemplate, FileText, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export interface HeadlineItem {
  id: number;
  orgId: number;
  title: string;
  status?: 'Open' | 'Closed' | 'In Progress';
  content: string;
  startDate?: string;
  endDate?: string;
  group: string;
  dataSources?: string;
  timePeriod?: string;
  isSummary?: boolean;
}

const HEADLINES_DATA: HeadlineItem[] = [
  {
    id: 1,
    orgId: 1,
    title: 'TL;DR (Last 3 months)',
    content: "Apple EMEA Retail Operations account shows exceptional health with strong renewal momentum throughout December 2025 and January 2026. The account maintains 96% utilization (1,150/1,200 users), £135K ARR, and 91 health score with consistent positive sentiment. December focused heavily on renewal preparation and expansion planning, with multiple stakeholders coordinating on Product B expansion and Integrations Module evaluation. January shifted to renewal execution and advanced optimization discussions. No risks identified - account positioned for successful renewal with significant growth opportunities.",
    group: 'Summary',
    dataSources: 'Notes, Emails, Call Transcripts and Tickets',
    timePeriod: 'Last 3 months',
    isSummary: true
  },
  {
    id: 2,
    orgId: 1,
    title: 'Apple EMEA Retail Operations Renewal and Expansion',
    status: 'Open',
    content: "Comprehensive renewal process for Apple's EMEA Retail Operations showing exceptional account health with 96% utilization and strong expansion interest. Daniel from Revenact coordinated renewal documentation and expansion modeling for Product B and Integrations Module, while Priya and Leo from Apple consolidated usage trends and conducted internal reviews. The account demonstrates consistent positive metrics with £135K ARR, 91 health score, and teams actively advocating for broader rollouts. Renewal positioned for success with meaningful growth opportunities identified.",
    startDate: '20 Nov 2025',
    endDate: '21 Jan 2026',
    group: 'January'
  }
];

export function HeadlinesTab({ entityId }: { entityId: number | string }) {
  const allItems = HEADLINES_DATA.filter(h => h.orgId == entityId);
  const items = allItems.length > 0 ? allItems : HEADLINES_DATA; // Fallback for testing

  const summaryItems = items.filter(item => item.isSummary);
  const feedItems = items.filter(item => !item.isSummary);

  const grouped = feedItems.reduce<Record<string, HeadlineItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white font-sans p-6 md:p-8">
      {/* Title Header */}
      <div className="flex items-center gap-2 mb-8">
        <LayoutTemplate className="w-5 h-5 text-indigo-600" />
        <h2 className="text-[14.5px] font-extrabold text-indigo-600 tracking-wide">Account Headlines</h2>
      </div>

      <div className="pl-[2px]">
        {/* Render Summary Cards (TL;DR) at the top without a pill */}
        {summaryItems.length > 0 && (
          <div className="mb-8 flex flex-col gap-5">
            {summaryItems.map(item => (
              <HeadlineCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Card Items Section */}
        {sortedGroups.map(([group, groupItems]) => (
          <div key={group} className="mb-8">
            <div className="mb-5 inline-block bg-[#F1F5F9] rounded-full px-3.5 py-1 text-[11.5px] font-bold text-[#64748B]">
              {group}
            </div>
            
            <div className="flex flex-col gap-5">
              {groupItems.map(item => (
                <HeadlineCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeadlineCard({ item }: { item: HeadlineItem }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-[14.5px] font-extrabold text-[#334155] leading-snug group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => setExpanded(!expanded)}>
          {item.title}
        </h4>
        {item.status && (
          <div className="flex items-center gap-1.5 text-[12px] font-bold shrink-0 ml-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            <span className="text-[#475569]">{item.status}</span>
          </div>
        )}
      </div>

      {expanded && (
        <p className={`text-[13px] text-[#475569] leading-[1.65] pr-2 ${item.dataSources ? 'mb-4' : 'mb-0'}`}>
          {item.content}
        </p>
      )}

      {/* Footer for TL;DR type cards */}
      {expanded && item.dataSources && (
        <div className="flex items-center gap-6 text-[12.5px] font-medium text-gray-500 pt-2 border-t border-transparent">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="w-4 h-4 text-gray-400" />
            <span>Data sources: <span className="text-gray-700 font-semibold">{item.dataSources}</span></span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>Time period: <span className="text-gray-700 font-semibold">{item.timePeriod}</span></span>
          </div>
        </div>
      )}

      {/* Footer for Standard Headline item cards */}
      {(!item.dataSources && item.startDate) && (
        <div className="flex items-center justify-between mt-4 border-t border-transparent pt-1">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[12.5px] font-bold text-[#6D72D6] hover:text-indigo-800 transition-colors"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            {expanded ? 'Hide details' : 'Show details'}
          </button>
          <div className="text-[12.5px] font-bold text-[#64748B] flex items-center gap-1.5">
            {item.startDate} <span className="text-gray-400 font-normal">→</span> {item.endDate}
          </div>
        </div>
      )}
    </div>
  );
}
