import { useState } from 'react';
import { Search, Filter, Info, X, Archive, Phone, Sparkles, MoreHorizontal, Maximize2, Minimize2, Star, ChevronDown, Calendar, Info as InfoIcon, PlayCircle, MoreVertical, ChevronRight, Link2, Globe } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addTask } from '../../../features/tasks/tasksSlice';

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

const AI_ACTIONS = [
  {
    id: 1,
    title: 'Advanced workflow optimization',
    description: 'Explore and potentially implement fine-tuning of advanced workflows to help the EMEA Retail team get even more value out of the platform, building on their current strong adoption and usage patterns.',
    owner: 'Sarah Lee (velaris.com)',
    timeframe: 'Not specified',
    timestamp: '1:33:21',
    note: "This was offered as the platform has become part of their standard operating rhythm and they're looking for ways to extract additional value. Current utilization is over 80% with 290 out of 360 users active regularly."
  },
  {
    id: 2,
    title: 'Renewal timeline and optimization ideas',
    description: 'Follow up with a detailed renewal timeline to support the smooth renewal process for the EMEA Retail team and ensure continued platform satisfaction.',
    owner: 'Sarah Lee (velaris.com)',
    timeframe: 'Not specified',
    timestamp: '1:45:00',
    note: ''
  }
];

export function CallSenseTab({ entityId }: { entityId: number | string }) {
  const [selectedCall, setSelectedCall] = useState<CallSenseItem | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
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
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col bg-white overflow-hidden font-sans relative z-0">
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
                    <CallSenseCard 
                      key={item.id} 
                      item={item} 
                      isSelected={selectedCall?.id === item.id && !isPanelExpanded}
                      onClick={() => { setSelectedCall(item); setIsPanelExpanded(false); }} 
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
    
    {/* Slide-in Panel Area */}
    {selectedCall && !isPanelExpanded && (
      <div 
        className="w-[420px] shrink-0 bg-white h-full shadow-[-4px_0_24px_rgba(0,0,0,0.06)] z-20 border-l border-gray-100 flex flex-col relative"
        style={{ animation: 'slideInRight 0.3s cubic-bezier(0.4,0,0.2,1)' }}
      >
        <CallSensePanel 
          item={selectedCall} 
          onClose={() => setSelectedCall(null)} 
          isExpanded={false}
          onToggleExpand={() => setIsPanelExpanded(true)}
        />
      </div>
    )}

    {/* Expanded Modal Overlay */}
    {selectedCall && isPanelExpanded && (
      <div 
        className="fixed inset-0 z-[100] bg-gray-900/60 flex items-center justify-center p-6 sm:p-12 backdrop-blur-sm transition-all"
        onClick={() => setIsPanelExpanded(false)}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      >
        <div 
          className="bg-white rounded-xl shadow-2xl w-full max-w-[900px] h-[85vh] max-h-[800px] flex flex-col overflow-hidden" 
          onClick={e => e.stopPropagation()}
          style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          <CallSensePanel 
            item={selectedCall} 
            onClose={() => { setSelectedCall(null); setIsPanelExpanded(false); }} 
            isExpanded={true}
            onToggleExpand={() => setIsPanelExpanded(false)}
          />
        </div>
      </div>
    )}
    
    <style>{`
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to   { transform: translateX(0);   opacity: 1; }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(20px) scale(0.98); opacity: 0; }
        to   { transform: translateY(0) scale(1); opacity: 1; }
      }
    `}</style>
  </div>
  );
}

function CallSenseCard({ item, isSelected, onClick }: { item: CallSenseItem; isSelected: boolean; onClick: () => void }) {
  return (
    <div className="relative flex items-start gap-5 z-10 group cursor-pointer" onClick={onClick}>
      {/* Timeline Squircle Icon */}
      <div className="w-[24px] h-[24px] rounded-[7px] bg-[#F4F5FB] border border-[#C3C6EF] text-[#6D72D6] flex items-center justify-center shrink-0 mt-5 relative z-10 shadow-sm">
        <Archive className="w-3.5 h-3.5" />
      </div>

      {/* Main card content */}
      <div className={`flex-1 border rounded-xl p-5 shadow-sm transition-all duration-200 ${isSelected ? 'border-indigo-400 bg-indigo-50/10 ring-2 ring-indigo-500/10' : 'bg-white border-gray-200/80 hover:shadow-md hover:border-indigo-200'}`}>
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

function CallSensePanel({ 
  item, 
  onClose,
  isExpanded,
  onToggleExpand
}: { 
  item: CallSenseItem; 
  onClose: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'ai'>('details');
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    summary: true,
    actions: false,
    followup: false,
    signals: false,
    topics: false
  });
  
  const [selectedActions, setSelectedActions] = useState<number[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const toggleAcc = (key: string) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAction = (id: number) => {
    setSelectedActions(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAllActions = () => {
    if (selectedActions.length === AI_ACTIONS.length) {
      setSelectedActions([]);
    } else {
      setSelectedActions(AI_ACTIONS.map(a => a.id));
    }
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans overflow-hidden">
      {/* Header Tabs Navigation */}
      <div className="px-5 pt-3 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-10">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 pb-2.5 text-[13px] font-semibold transition-all relative ${
              activeTab === 'details' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Activity Details
            {activeTab === 'details' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 pb-2.5 text-[13px] font-semibold transition-all relative ${
              activeTab === 'ai' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI items
            {activeTab === 'ai' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-1 pb-1 text-gray-400">
           {onToggleExpand && (
             <button onClick={onToggleExpand} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
               {isExpanded ? <Minimize2 className="w-[15px] h-[15px]" /> : <Maximize2 className="w-[15px] h-[15px]" />}
             </button>
           )}
           <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Star className="w-[15px] h-[15px]" /></button>
           <button onClick={onClose} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'details' ? (
          <div className="p-5 flex flex-col gap-6">
            
            {/* Title & Actions */}
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-[14px] font-extrabold text-gray-800 leading-snug">
                {item.title}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0 text-gray-400">
                <button className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors"><MoreVertical className="w-4 h-4" /></button>
                <div className="flex -space-x-[1px]">
                  <button className="p-1 border border-gray-200 rounded-l hover:bg-gray-50 bg-white transition-colors"><Phone className="w-[13px] h-[13px] text-gray-600" /></button>
                  <button className="p-1 border border-gray-200 rounded-r hover:bg-gray-50 bg-white transition-colors"><InfoIcon className="w-[13px] h-[13px] text-gray-600" /></button>
                </div>
              </div>
            </div>

            {/* Grid Form Fields */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-gray-500 flex items-center">
                  Activity Type <span className="text-red-400 ml-0.5">*</span>
                </label>
                <div className="flex items-center justify-between border border-white hover:border-gray-200 rounded p-1 group cursor-pointer transition-colors -ml-1">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[13px] font-semibold text-gray-800">Call</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-gray-500 flex items-center">
                  Date & Time <span className="text-red-400 ml-0.5">*</span>
                </label>
                <div className="flex items-center justify-between p-1 -ml-1 group">
                  <span className="text-[13px] font-semibold text-gray-800 tracking-tight">2026-01-21 05:12 PM</span>
                  <Calendar className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors cursor-pointer" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-gray-500 flex items-center">
                  Links <span className="text-red-400 ml-0.5">*</span>
                </label>
                <div className="flex items-center justify-between border border-transparent hover:border-indigo-100 rounded px-1.5 py-1 group cursor-pointer transition-colors -ml-1.5">
                  <span className="text-[13px] font-bold text-[#6D72D6]">{item.links} Links</span>
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-300 opacity-0 group-hover:opacity-100" />
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100 my-1 w-full -mx-5 px-5" style={{ width: 'calc(100% + 40px)' }}></div>

            {/* Full Width Fields */}
            <div className="flex flex-col gap-6 mt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-bold text-gray-500">Description</label>
                <span className="text-[13px] font-medium text-gray-800 pl-0.5">-</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-bold text-gray-500 flex items-center gap-1.5">
                  URL
                  <PlayCircle className="w-3 h-3 text-indigo-400" />
                </label>
                <a href="#" className="text-[13px] font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 break-all pl-0.5 leading-relaxed">
                  https://tl;dv.io/app/meetings/68d3c3525891510013500079
                </a>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12.5px] font-bold text-gray-500">Brief</label>
                <div className="pl-0.5 flex flex-col gap-3 text-[13px] text-gray-700 leading-[1.7]">

                  <div>
                    <p className="font-bold text-gray-800 mb-1">Onboarding Email Strategy</p>
                    <ul className="list-disc pl-5 space-y-1 text-[12.5px] text-gray-600 font-medium">
                      <li>Discuss sending onboarding emails for customers at their one-year anniversary, focusing on contracts with account creation.</li>
                      <li>Confirm onboarding emails will only be sent for new account contracts, not existing long-term customers.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-bold text-gray-800 mb-1">Bridge Integration Technical Details</p>
                    <ul className="list-disc pl-5 space-y-1 text-[12.5px] text-gray-600 font-medium">
                      <li>Recommended using ChatGPT and developer documentation for Bridge integration questions.</li>
                      <li>Web hooks can be triggered based on specific object updates and selected attributes.</li>
                      <li>In Velaris bridge, flows must be tested before publication.</li>
                      <li>Contract creation in Velaris triggered when sales moves deal to recorded stage in HubSpot.</li>
                      <li>Update API requests require authorization headers and JSON body with object properties.</li>
                      <li>Single option attributes can be updated using picklist value name or ID.</li>
                      <li>Aswin recommends adding validations when building flows, such as checking if an object is not archived before updating.</li>
                      <li>Simple steps in Bridge can be done without using code, but complex logic may require JavaScript.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-bold text-gray-800 mb-1">Action Items and Assignments</p>
                    <ul className="list-disc pl-5 space-y-1 text-[12.5px] text-gray-600 font-medium">
                      <li>Aswin to check and potentially share Bridge API documentation link.</li>
                      <li>Aswin to investigate creating a technical account with administrator rights for API activities.</li>
                      <li>Create separate folder for Doctena and Velaris workflows to prevent accidental modifications.</li>
                      <li>Create separate web hook for each flow, providing descriptive name and optional description.</li>
                      <li>Philippe suggests Maria review team feedback to identify fields that could benefit from default values.</li>
                      <li>Aswin offers ongoing support via Slack for any questions during workflow development.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-bold text-gray-800 mb-1">Contract and Lifecycle Management</p>
                    <ul className="list-disc pl-5 space-y-1 text-[12.5px] text-gray-600 font-medium">
                      <li>Contracts in Velaris linked to Accounts and Organizations, mapping to Deals in HubSpot.</li>
                      <li>Velaris team to explore possible HubSpot contract sync enhancements based on team feedback.</li>
                    </ul>
                  </div>

                </div>
              </div>
            </div>
              {/* View Comments */}
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleAcc('comments')}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                >
                  {openAccordions.comments
                    ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" strokeWidth={2.5} />
                    : <ChevronRight className="w-3.5 h-3.5 text-gray-500" strokeWidth={2.5} />}
                  <span className="text-[12.5px] font-bold text-gray-600">View Comments</span>
                </button>
                {openAccordions.comments && (
                  <div className="px-4 py-3 text-[12.5px] text-gray-500 font-medium border-t border-gray-100">
                    No comments yet.
                  </div>
                )}
              </div>

          </div>
        ) : (
          <div className="p-4 flex flex-col gap-3">
            {/* Summary Accordion */}
            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all">
              <div onClick={() => toggleAcc('summary')} className={`px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50/50 transition-colors ${openAccordions.summary ? 'bg-[#F8F9FA]/50 border-b border-[#E5E7EB]' : ''}`}>
                {openAccordions.summary ? <ChevronDown className="w-3.5 h-3.5 text-[#6D72D6]" strokeWidth={3} /> : <ChevronRight className="w-3.5 h-3.5 text-[#6D72D6]" strokeWidth={3} />}
                <span className="text-[13px] font-bold text-[#6D72D6] select-none">Summary</span>
              </div>
              {openAccordions.summary && (
                <div className="p-4 bg-white flex flex-col gap-3">
                  <a href="#" className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#6D72D6] hover:underline w-fit">
                    <Link2 className="w-3.5 h-3.5" />
                    Meeting URL
                  </a>
                  <p className="text-[12.5px] leading-[1.6] text-[#475569] font-medium pr-2">
                    EMEA Retail renewal readiness check-in shows strong 
                    account health with 80% utilization (290/360 licenses), 
                    consistent weekly logins above 55%, and platform integration 
                    into standard operations. Customer expressed confidence in 
                    renewal with no major concerns raised. Follow-up planned 
                    with renewal timeline and optimization opportunities.
                  </p>
                </div>
              )}
            </div>

            {/* Actions Accordion */}
            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all">
              <div onClick={() => toggleAcc('actions')} className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors ${openAccordions.actions ? 'bg-[#F8F9FA]/50 border-b border-[#E5E7EB]' : ''}`}>
                <div className="flex items-center gap-2">
                  {openAccordions.actions ? <ChevronDown className="w-3.5 h-3.5 text-[#6D72D6]" strokeWidth={3} /> : <ChevronRight className="w-3.5 h-3.5 text-[#6D72D6]" strokeWidth={3} />}
                  <span className="text-[13px] font-bold text-[#6D72D6] select-none">Actions</span>
                </div>
                <div className="flex items-center gap-4">
                  {openAccordions.actions && (
                    <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleAllActions(); }}>
                      <input 
                        type="checkbox" 
                        checked={selectedActions.length === AI_ACTIONS.length && AI_ACTIONS.length > 0}
                        readOnly
                        className="w-3 h-3 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                      />
                      <span className="text-[11.5px] font-bold text-[#475569]">Select All</span>
                    </label>
                  )}
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (selectedActions.length > 0) {
                        setShowCreateModal(true);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-extrabold tracking-wide uppercase transition-all border ${
                      selectedActions.length > 0 
                        ? 'bg-[#6D72D6] text-white border-[#6D72D6] shadow-sm hover:brightness-110' 
                        : 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                    }`}
                  >
                    Create Tasks ({selectedActions.length})
                  </button>
                </div>
              </div>
              {openAccordions.actions && (
                <div className="p-4 bg-white flex flex-col gap-3">
                  {AI_ACTIONS.map(action => {
                    const isSelected = selectedActions.includes(action.id);
                    return (
                      <div key={action.id} className="border border-gray-100 rounded-lg p-4 flex gap-3 hover:border-indigo-100 transition-colors shadow-sm bg">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleAction(action.id)}
                          className="w-[15px] h-[15px] rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5 cursor-pointer flex-shrink-0"
                        />
                        <div className="flex flex-col gap-3 pt-0.5">
                           <h5 className={`text-[13px] font-extrabold cursor-pointer ${isSelected ? 'text-indigo-600' : 'text-gray-800'}`} onClick={() => toggleAction(action.id)}>
                             {action.title}
                           </h5>
                           <p className="text-[12.5px] leading-[1.6] text-gray-500 font-medium">
                             {action.description}
                           </p>
                           <div className="flex flex-col gap-1.5 text-[12.5px]">
                             <div className="flex gap-1.5 font-medium text-gray-500">
                               <span className="font-extrabold text-gray-700">Owner:</span> {action.owner}
                             </div>
                             <div className="flex gap-1.5 font-medium text-gray-500">
                               <span className="font-extrabold text-gray-700">Timeframe:</span> {action.timeframe}
                             </div>
                             <div className="flex gap-1.5 font-medium text-gray-500">
                               <span className="font-extrabold text-gray-700">Timestamp:</span> {action.timestamp}
                             </div>
                           </div>
                           {action.note && (
                             <p className="text-[12.5px] italic text-gray-500 mt-2">
                               {action.note}
                             </p>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Follow Up Message Accordion */}
            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all">
              <div onClick={() => toggleAcc('followup')} className={`px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50/50 transition-colors ${openAccordions.followup ? 'bg-[#F8F9FA]/50 border-b border-[#E5E7EB]' : ''}`}>
                {openAccordions.followup ? <ChevronDown className="w-3.5 h-3.5 text-[#6D72D6]" strokeWidth={3} /> : <ChevronRight className="w-3.5 h-3.5 text-[#6D72D6]" strokeWidth={3} />}
                <span className="text-[13px] font-bold text-[#6D72D6] select-none">Follow Up Message</span>
              </div>
              {openAccordions.followup && (
                <div className="p-5 bg-white flex flex-col items-center justify-center opacity-50 py-10">
                  <span className="text-[12px] font-semibold text-gray-500">No follow up message available.</span>
                </div>
              )}
            </div>

            {/* Signals Accordion */}
            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all">
              <div onClick={() => toggleAcc('signals')} className={`px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50/50 transition-colors ${openAccordions.signals ? 'bg-[#F8F9FA]/50 border-b border-[#E5E7EB]' : ''}`}>
                {openAccordions.signals ? <ChevronDown className="w-3.5 h-3.5 text-[#6D72D6]" strokeWidth={3} /> : <ChevronRight className="w-3.5 h-3.5 text-[#6D72D6]" strokeWidth={3} />}
                <span className="text-[13px] font-bold text-[#6D72D6] select-none">Signals</span>
              </div>
              {openAccordions.signals && (
                <div className="bg-white divide-y divide-gray-100">
                  <div className="px-5 py-4 flex flex-col gap-2">
                    <p className="text-[13px] font-bold text-gray-800">High User Adoption and Platform Integration</p>
                    <span className="self-start px-2.5 py-0.5 rounded border border-emerald-300 text-emerald-600 text-[11.5px] font-semibold bg-emerald-50">Opportunity</span>
                    <p className="text-[12.5px] leading-[1.75] text-gray-600 font-medium">EMEA Retail account shows strong adoption metrics with 290 out of 360 licenses actively used (80%+ utilization). The platform has become part of their standard operating rhythm rather than an extra tool, with weekly logins consistently above 55% and managers directly reviewing dashboards instead of exporting data. This indicates deep integration into their workflows and high user engagement.</p>
                  </div>
                  <div className="px-5 py-4 flex flex-col gap-2">
                    <p className="text-[13px] font-bold text-gray-800">Positive Sentiment Shift and Reduced Complaints</p>
                    <span className="self-start px-2.5 py-0.5 rounded border border-emerald-300 text-emerald-600 text-[11.5px] font-semibold bg-emerald-50">Opportunity</span>
                    <p className="text-[12.5px] leading-[1.75] text-gray-600 font-medium">Customer reports a clear positive shift in sentiment with fewer complaints and more feedback focused on extracting additional value from the platform. Teams are comfortable with workflows, particularly for weekly performance tracking and regional reporting. This represents strong customer satisfaction and potential for advocacy.</p>
                  </div>
                  <div className="px-5 py-4 flex flex-col gap-2">
                    <p className="text-[13px] font-bold text-gray-800">Renewal Risk – Upcoming Contract Expiry</p>
                    <span className="self-start px-2.5 py-0.5 rounded border border-red-200 text-red-500 text-[11.5px] font-semibold bg-red-50">Risk</span>
                    <p className="text-[12.5px] leading-[1.75] text-gray-600 font-medium">The current contract is approaching its renewal window. While account health is strong, no formal renewal discussions have been initiated. Delay in outreach could allow competing vendors to engage the customer first. Proactive renewal timeline communication is recommended.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Topics Accordion */}
            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all">
              <div onClick={() => toggleAcc('topics')} className={`px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50/50 transition-colors ${openAccordions.topics ? 'bg-[#F8F9FA]/50 border-b border-[#E5E7EB]' : ''}`}>
                {openAccordions.topics ? <ChevronDown className="w-3.5 h-3.5 text-[#6D72D6]" strokeWidth={3} /> : <ChevronRight className="w-3.5 h-3.5 text-[#6D72D6]" strokeWidth={3} />}
                <span className="text-[13px] font-bold text-[#6D72D6] select-none">Topics</span>
              </div>
              {openAccordions.topics && (
                <div className="p-5 bg-white flex flex-col items-center justify-center opacity-50 py-10">
                  <span className="text-[12px] font-semibold text-gray-500">No topics analyzed yet.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Accordion */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/50 mt-auto shrink-0 cursor-pointer hover:bg-gray-100/50 transition-colors flex items-center gap-2">
         <ChevronRight className="w-4 h-4 text-gray-500" />
         <span className="text-[13px] font-bold text-gray-700">View Comments</span>
      </div>

      <CreateTasksModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        actions={AI_ACTIONS.filter(a => selectedActions.includes(a.id))}
        onSuccess={() => {
          setShowCreateModal(false);
          setSelectedActions([]);
          setOpenAccordions(prev => ({ ...prev, actions: false }));
        }}
      />
    </div>
  );
}

function CreateTasksModal({ 
  isOpen, 
  onClose, 
  actions,
  onSuccess
}: { 
  isOpen: boolean; 
  onClose: () => void;
  actions: typeof AI_ACTIONS;
  onSuccess: () => void;
}) {
  const dispatch = useDispatch();
  if (!isOpen) return null;

  const handleCreate = () => {
    actions.forEach(action => {
      dispatch(addTask({
        title: action.title,
        org: 'Apple EMEA', // Mocked matching the current context visually
        type: 'account',
        priority: 'Normal',
        status: 'Open',
        date: '7 Mar 2026'
      }));
    });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-gray-900/40 flex items-center justify-center p-4 backdrop-blur-sm shadow-2xl transition-all" style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[900px] flex flex-col overflow-hidden" style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-gray-800 tracking-tight">Create Tasks from Actions</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        
        <div className="p-6 bg-gray-50/50 flex flex-col gap-4">
          <div className="flex w-full text-[12.5px] font-bold text-gray-700 mb-1 px-1 tracking-tight">
             <div className="flex-[2.5]">Task Name</div>
             <div className="flex-[1.5]">Assignee</div>
             <div className="flex-[1.2]">Due Date</div>
             <div className="flex-[1.2]">Activity Type</div>
          </div>
          
          {actions.map(action => (
            <div key={action.id} className="flex w-full gap-3 h-[42px]">
               <div className="flex-[2.5] bg-white border border-gray-200 rounded-md text-[13px] px-3 flex items-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                 <span className="truncate text-gray-700 font-medium">{action.title}</span>
               </div>
               
               <div className="flex-[1.5] bg-white border border-gray-200 rounded-md text-[13px] px-3 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer hover:border-indigo-300 transition-colors">
                 <div className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                     <span className="font-bold -ml-[0.5px]">DT</span>
                   </div>
                   <span className="text-gray-700 font-medium tracking-tight mt-0.5">Daniel Trial Test</span>
                 </div>
                 <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
               </div>

               <div className="flex-[1.2] bg-white border border-gray-200 rounded-md text-[13px] px-3 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer hover:border-indigo-300 transition-colors">
                 <span className="text-gray-700 font-medium">7 Mar 2026</span>
                 <Calendar className="w-4 h-4 text-gray-400" />
               </div>

               <div className="flex-[1.2] bg-white border border-gray-200 rounded-md text-[13px] px-3 flex items-center shadow-[0_1px_2px_rgba(0,0,0,0.02)] gap-2 cursor-pointer hover:border-indigo-300 transition-colors">
                 <Globe className="w-4 h-4 text-gray-400 stroke-[2px]" />
                 <span className="text-gray-700 font-medium mt-[1px]">General</span>
               </div>
            </div>
          ))}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-white">
          <button onClick={onClose} className="px-5 py-2 border border-gray-200 rounded-md text-[13px] font-bold text-gray-500 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleCreate} className="px-5 py-2 bg-indigo-500 rounded-md text-[13px] font-bold text-white hover:bg-indigo-600 transition-colors shadow-[0px_2px_4px_rgba(99,102,241,0.2)]">
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
