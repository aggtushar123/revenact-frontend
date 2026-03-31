import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, RefreshCw, MoreHorizontal, Sparkles, Globe, Mail, Phone, MapPin, Pencil, ChevronUp, Search, Maximize2, ChevronLeft, ChevronRight, Plus, Filter, Layout, FileText, Zap, CheckCircle, ExternalLink, Download, X } from 'lucide-react';
import { TABLE_DATA } from '../../components/organizations/tableData';
import type { OrgRow } from '../../components/organizations/tableData';
import { ACCOUNTS_DATA } from '../../components/organizations/accountsData';
import type { AccountRow } from '../../components/organizations/accountsData';
import { CONTACTS_DATA } from '../../components/organizations/contactsData';

interface Activity {
  id: number;
  type: string;
  date: string;
  group: string;
  links: number;
  watchers: number;
}

// --- Main Component ---
export function Details() {
  const { id } = useParams<{ id: string }>();
  const orgId = parseInt(id || '1', 10);
  const organization = TABLE_DATA.find(o => o.id === orgId) || TABLE_DATA[0];

  const [activeTab, setActiveTab] = useState('General');
  const [isPinnedOpen, setIsPinnedOpen] = useState(true);
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);

  const tabs = [
    { name: 'General', count: null },
    { name: 'Accounts', count: ACCOUNTS_DATA.filter(a => a.orgId === orgId).length },
    { name: 'Contacts', count: CONTACTS_DATA.filter(c => c.orgId === orgId).length },
    { name: 'Pipelines', count: 1 },
    { name: 'Custom Objects', count: 2 },
    { name: 'Success Plans', count: null },
    { name: 'Canvas List', count: null },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#fcfdfe]">
      {/* Tabs Navigation */}
      <nav className="px-6 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8 h-12 overflow-x-auto no-scrollbar whitespace-nowrap">
          {tabs.map(tab => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`relative h-full text-[13.5px] font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === tab.name ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.name}
              {tab.count !== null && (
                <span className={`text-[11px] font-bold ${activeTab === tab.name ? 'text-indigo-400' : 'text-gray-400'}`}>
                  ({tab.count})
                </span>
              )}
              {activeTab === tab.name && (
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-full shadow-[0_-2px_6px_rgba(99,102,241,0.3)]"></div>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 py-2 shrink-0">
           <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-50/50 rounded-lg border border-gray-100">
             <span className="text-[12px] font-medium text-gray-500">Enable new 360 UI</span>
             <div className="w-8 h-4 bg-indigo-500 rounded-full relative cursor-pointer">
               <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"></div>
             </div>
           </div>
           
           <div className="flex items-center gap-1">
             <IconButton icon={<MessageSquare className="w-4 h-4" />} minimal />
             <IconButton icon={<RefreshCw className="w-4 h-4" />} minimal />
             <IconButton icon={<MoreHorizontal className="w-4 h-4" />} minimal />
           </div>
        </div>
      </nav>

      {/* Tab Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8f9fc]/50 p-6">
        {activeTab === 'General' && (
          <div className="flex flex-col w-full h-full gap-6 max-w-7xl mx-auto">
            <MetricsBanner organization={organization} />
            <div className="flex gap-6 w-full h-[calc(100vh-280px)] overflow-hidden">
               {/* Collapsed toggle */}
               {!isPinnedOpen && (
                 <div className="flex flex-col items-center pt-3 shrink-0">
                   <button
                     onClick={() => setIsPinnedOpen(true)}
                     className="p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                     title="Expand panel"
                   >
                     <ChevronRight className="w-4 h-4" />
                   </button>
                 </div>
               )}
               {/* Pinned Attributes Panel */}
               {isPinnedOpen && (
                 <div className="w-[320px] flex flex-col h-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden shrink-0 transition-all">
                   <PinnedAttributes organization={organization} onCollapse={() => setIsPinnedOpen(false)} onExpand={() => setIsAttrModalOpen(true)} />
                 </div>
               )}
               <div className="flex-1 h-full overflow-hidden bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
                  <ActivityFeed organization={organization} />
               </div>
            </div>

            {/* Full Attributes Modal */}
            {isAttrModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setIsAttrModalOpen(false)}>
                <div className="absolute inset-0 bg-black/30" style={{ backdropFilter: 'blur(4px)' }} />
                <div
                  className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal header */}
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <h2 className="text-[16px] font-bold text-gray-900">All Attributes — {organization.org}</h2>
                    <button onClick={() => setIsAttrModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {/* Modal content */}
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                      <AttrModalItem label="Velaris ID" value={organization.id.toString()} />
                      <AttrModalItem label="Organization Name" value={organization.org} />
                      <AttrModalItem label="Health Score" value={organization.health.val.toString()} dotColor={organization.health.clr} />
                      <AttrModalItem label="Lifecycle Stage" value={organization.stage} />
                      <AttrModalItem label="AI Pulse Score" value={organization.aiScore} />
                      <AttrModalItem label="AI Pulse Reason" value={organization.reason} />
                      <AttrModalItem label="NPS Value" value={organization.npsValue.toString()} />
                      <AttrModalItem label="CSAT" value={organization.csat} />
                      <AttrModalItem label="Domain" value={organization.domain} />
                      <AttrModalItem label="Location" value={organization.nameAddress} />
                      <AttrModalItem label="Owner" value={organization.owner} />
                      <AttrModalItem label="Next Renewal" value={organization.renewal} />
                      <AttrModalItem label="MRR" value={`$${organization.mrr.toLocaleString()}`} />
                      <AttrModalItem label="ARR" value={`$${organization.arr.toLocaleString()}`} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'Accounts' && <AccountsTab orgId={orgId} />}
        {activeTab === 'Contacts' && <ContactsTab orgId={orgId} />}
        {activeTab !== 'General' && activeTab !== 'Accounts' && activeTab !== 'Contacts' && (
          <div className="flex flex-col items-center justify-center h-full py-10 opacity-30">
            <Layout className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">{activeTab} Coming Soon</span>
          </div>
        )}
      </main>
    </div>
  );
}

// --- Sub-Components ---

function MetricsBanner({ organization }: { organization: OrgRow }) {
  const npsSign = organization.npsValue > 0 ? '+' : '';
  const csatNum = parseFloat(organization.csat);
  const csatPct = !isNaN(csatNum) ? csatNum : 0;

  // Health ring color
  const healthVal = organization.health.val;
  const healthColor = healthVal >= 7 ? '#00a699' : healthVal >= 4 ? '#ffbb00' : '#fa5c5c';
  const healthPct = (healthVal / 10) * 100;

  // CSM pulse text & color
  const csmPulseText = healthVal >= 7 ? 'Very Satisfied' : healthVal >= 4 ? 'Neutral' : 'High Risk';
  const csmPulseColor = healthVal >= 7 ? 'text-[#00a699]' : healthVal >= 4 ? 'text-[#ffbb00]' : 'text-[#fa5c5c]';

  // NPS breakdown
  const promoters = organization.npsValue > 0 ? 1 : 0;
  const passives = organization.npsValue === 0 ? 1 : 0;
  const detractors = organization.npsValue < 0 ? 1 : 0;

  // CSAT ring color
  const csatColor = csatPct >= 70 ? '#00a699' : csatPct >= 40 ? '#ffbb00' : '#fa5c5c';

  return (
    <div className="flex items-stretch w-full gap-4">
      {/* Card 1 — Health Score */}
      <div
        className="flex-1 rounded-xl border border-gray-200/80 bg-white/70 shadow-sm px-5 py-4 flex items-center gap-5"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        {/* Circular ring */}
        <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f3f4f6" strokeWidth="2.5" />
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke={healthColor} strokeWidth="2.5"
              strokeDasharray={`${healthPct} ${100 - healthPct}`} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.6s ease' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">Health</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">Score</span>
          </div>
        </div>
        {/* Text info */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-[28px] font-bold text-gray-900 leading-none tracking-tight">{healthVal}</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lifecycle Stage</span>
            <span className="text-[13px] font-bold text-gray-800 truncate">{organization.stage}</span>
          </div>
        </div>
      </div>

      {/* Card 2 — CSM Pulse + NPS + Renewal */}
      <div
        className="flex-[1.6] rounded-xl border border-gray-200/80 bg-white/70 shadow-sm px-5 py-4 flex items-center gap-6"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        {/* CSM Pulse */}
        <div className="flex flex-col gap-0.5 min-w-[100px]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CSM Pulse</span>
          <span className={`text-[14px] font-bold ${csmPulseColor}`}>{csmPulseText}</span>
        </div>

        <div className="w-px h-12 bg-gray-200/70 shrink-0" />

        {/* NPS */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">NPS</span>
            <span className="text-[28px] font-light text-gray-800 leading-none tracking-tight">{npsSign}{organization.npsValue}</span>
          </div>
          <div className="flex flex-col gap-0.5 text-[10px] font-bold">
            <div className="flex items-center gap-2 text-gray-500">
              <span className="w-1.5 h-1.5 rounded-sm bg-[#00a699]" />
              <span className="w-16">Promoters</span>
              <span className="text-gray-900 text-[11px]">{promoters}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span className="w-1.5 h-1.5 rounded-sm bg-[#ffbb00]" />
              <span className="w-16">Passives</span>
              <span className="text-gray-900 text-[11px]">{passives}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span className="w-1.5 h-1.5 rounded-sm bg-[#fa5c5c]" />
              <span className="w-16">Detractors</span>
              <span className="text-gray-900 text-[11px]">{detractors}</span>
            </div>
          </div>
        </div>

        <div className="w-px h-12 bg-gray-200/70 shrink-0" />

        {/* Next Renewal Date */}
        <div className="flex flex-col gap-0.5 min-w-[100px]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Next Renewal Date</span>
          <span className="text-[14px] font-bold text-gray-900 leading-tight">{organization.renewal}</span>
        </div>
      </div>

      {/* Card 3 — CSAT Score */}
      <div
        className="flex-1 rounded-xl border border-gray-200/80 bg-white/70 shadow-sm px-5 py-4 flex items-center gap-5"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        {/* Text */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CSAT Score</span>
          <span className="text-[28px] font-bold text-gray-900 leading-none tracking-tight">{organization.csat}</span>
        </div>
        {/* Large donut ring */}
        <div className="relative ml-auto shrink-0" style={{ width: 72, height: 72 }}>
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f3f4f6" strokeWidth="2.5" />
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke={csatColor} strokeWidth="2.5"
              strokeDasharray={`${csatPct} ${100 - csatPct}`} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.6s ease' }} />
          </svg>
        </div>
      </div>
    </div>
  );
}

function PinnedAttributes({ organization, onCollapse, onExpand }: { organization: OrgRow; onCollapse?: () => void; onExpand?: () => void }) {
  const [activeSubTab, setActiveSubTab] = useState('Pinned Attributes');
  
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 pt-2 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex gap-4">
          {['Pinned Attributes', 'Summary'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`pb-2.5 text-[13px] font-semibold transition-all relative ${activeSubTab === tab ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {tab}
              {activeSubTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 pb-2">
           <Maximize2 className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" onClick={onExpand} />
           <ChevronLeft className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" onClick={onCollapse} />
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
         {activeSubTab === 'Pinned Attributes' ? (
           <>
             <div className="flex items-center justify-between text-[12px]">
                <button className="text-indigo-600 font-semibold hover:underline">View All</button>
                <Pencil className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
             </div>
             
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search Attributes"
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all placeholder:text-gray-400"
                />
             </div>
             
             <div className="flex flex-col gap-4 py-2">
                <AttributeItem label="Velaris ID" value={organization.id.toString()} />
                <AttributeItem label="AI Pulse-Reason" value={organization.reason} isTruncated />
                <AttributeItem label="Lifecycle Stage *" value={organization.stage} />
                
                <div className="flex flex-col gap-1.5 pt-1">
                   <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pulse</span>
                   <div className="flex items-center gap-1.5">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#00a699] shadow-sm" />
                      ))}
                   </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                   <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Owners</span>
                   <div className="flex items-center gap-3 group/owner cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-500 uppercase overflow-hidden">
                         {organization.avatar}
                      </div>
                      <span className="text-[13px] font-semibold text-gray-700 group-hover/owner:text-indigo-600 transition-colors uppercase">{organization.owner}</span>
                      <div className="ml-auto w-5 h-5 flex items-center justify-center rounded-md text-red-400">
                         <Mail className="w-3.5 h-3.5" />
                      </div>
                   </div>
                </div>

                <AttributeItem label="Health" value={organization.health.val.toString()} showDot dotColor={organization.health.clr} />
             </div>
           </>
         ) : (
           <div className="py-10 text-center">
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No summary available</p>
           </div>
         )}
      </div>
    </div>
  );
}

function AttributeItem({ label, value, isTruncated = false, showDot = false, dotColor = '' }: { label: string, value: string, isTruncated?: boolean, showDot?: boolean, dotColor?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        {showDot && <div className={`w-2 h-2 rounded-full ${dotColor}`} />}
        <span className={`text-[13.5px] font-semibold text-gray-900 ${isTruncated ? 'line-clamp-2 leading-relaxed' : ''}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function ActivityFeed({ organization }: { organization: OrgRow }) {
  const [activeSubTab, setActiveSubTab] = useState('Activity Feed');
  const [filter, setFilter] = useState('All');

  const tabs = [
    { name: 'Activity Feed', icon: null },
    { name: 'Headlines', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { name: 'Overview', icon: <Layout className="w-3.5 h-3.5" /> },
    { name: 'Files', icon: <FileText className="w-3.5 h-3.5" /> },
    { name: 'CallSense', icon: <Zap className="w-3.5 h-3.5" /> },
  ];

  const activities: Activity[] = [
    { id: 1, type: 'Value Reinforcement', date: 'Mar 5th', group: '05 Mar 2026', links: 1, watchers: 1 },
    { id: 2, type: 'Enablement or Re-Training', date: 'Mar 5th', group: '05 Mar 2026', links: 1, watchers: 0 },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 flex items-center justify-between border-b border-gray-100 flex-wrap shrink-0">
        <div className="flex gap-5">
          {tabs.map(tab => (
            <button 
              key={tab.name}
              onClick={() => setActiveSubTab(tab.name)}
              className={`flex items-center gap-1.5 pb-2.5 text-[13px] font-semibold transition-all relative ${activeSubTab === tab.name ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {tab.icon && tab.icon}
              {tab.name}
              {activeSubTab === tab.name && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        {activeSubTab === 'Activity Feed' ? (
          <>
            <div className="p-4 flex flex-col gap-4 border-b border-gray-50 shrink-0">
               <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                     <input type="text" placeholder="Search activities..." className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-indigo-500/20 placeholder:text-gray-400" />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[13px] font-bold transition-all shadow-sm">
                     <Plus className="w-4 h-4" />
                     Add Action
                  </button>
                  <button className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50">
                     <Filter className="w-4 h-4" />
                  </button>
               </div>
               <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar whitespace-nowrap">
                  {['All', 'Activities', 'Emails', 'Tasks', 'Notes'].map(item => (
                    <button 
                      key={item}
                      onClick={() => setFilter(item)}
                      className={`px-3 py-1 rounded-full text-[12px] font-bold transition-all border ${filter === item ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-white border-transparent text-gray-500 hover:bg-gray-50'}`}
                    >
                      {item}
                    </button>
                  ))}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50/20">
               <div className="flex flex-col gap-8 relative">
                  <div className="absolute left-[13px] top-10 bottom-4 w-0.5 bg-indigo-100" />
                  <div className="flex flex-col gap-4">
                     <div className="flex items-center gap-3">
                        <div className="w-[28px] h-[28px] rounded-full bg-white border border-indigo-50 flex items-center justify-center shrink-0 z-10">
                           <div className="w-3 h-3 border-2 border-indigo-200 rounded-md" />
                        </div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{activities[0].group}</span>
                     </div>
                     <div className="flex flex-col gap-4 ml-[13px] pl-[15px]">
                        {activities.map(activity => (
                          <ActivityCard key={activity.id} activity={activity} organization={organization} />
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </>
        ) : activeSubTab === 'Overview' ? (
          <div className="p-8 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
               <InfoCard icon={<Globe className="w-4 h-4" />} label="Domain" value={organization.domain} />
               <InfoCard icon={<MapPin className="w-4 h-4" />} label="Location" value={organization.nameAddress} />
               <InfoCard icon={<Mail className="w-4 h-4" />} label="Email" value={`contact@${organization.domain}`} />
               <InfoCard icon={<Phone className="w-4 h-4" />} label="Phone" value="+1 (555) 000-0000" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 py-10 opacity-30">
            <Layout className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">{activeSubTab} coming soon</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityCard({ activity, organization }: { activity: Activity, organization: OrgRow }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-5 flex flex-col gap-4 relative group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900 text-[14px]">{activity.type}</h4>
            <ExternalLink className="w-3 h-3 text-gray-300" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11.5px] font-bold text-gray-400 pr-5">{activity.date}</span>
          <MoreHorizontal className="w-4 h-4 text-gray-400 cursor-pointer" />
        </div>
      </div>
      <div className="flex items-center gap-4 pl-9">
         <div className={`w-3 h-3 rounded-full ${organization.health.clr}`} />
         <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 px-2 py-0.5 bg-indigo-50/50 rounded-md border border-indigo-100">
            <Sparkles className="w-3 h-3" />
            Pulse
         </div>
      </div>
    </div>
  );
}

function AccountsTab({ orgId }: { orgId: number }) {
  const navigate = useNavigate();
  const accounts = ACCOUNTS_DATA.filter(a => a.orgId === orgId);

  return (
    <div className="flex flex-col w-full h-full gap-6 max-w-7xl mx-auto">
      {/* Accounts Dynamic Metrics Banner */}
      <AccountsMetricsBanner accounts={accounts} />

      {/* Sub-Accounts Table Section */}
      <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-white flex items-center justify-between gap-4">
           <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by name, Velaris ID or External ID" className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-medium shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder:text-gray-400 transition-all" />
           </div>
           
           <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[13px] font-bold shadow-sm transition-all transform active:scale-95">
                 <Plus className="w-4 h-4" />
                 Add Account
              </button>
              
              <div className="h-9 w-px bg-gray-100 mx-1" />
              
              <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-[13px] font-bold shadow-xs transition-colors relative">
                 <Filter className="w-4 h-4 text-gray-400" />
                 Filter
                 <span className="flex items-center justify-center w-5 h-5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md text-[10px] font-bold">(2)</span>
              </button>
              
              <IconButton icon={<Download className="w-4 h-4" />} />
              <IconButton icon={<Globe className="w-4 h-4" />} />
              <IconButton icon={<RefreshCw className="w-4 h-4" />} />
              <IconButton icon={<Maximize2 className="w-4 h-4" />} />
           </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
           <table className="w-full border-collapse">
              <thead>
                 <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="p-4 w-10"><input type="checkbox" className="rounded border-gray-300 text-indigo-600" /></th>
                    <HeaderCell label="Account" />
                    <HeaderCell label="Velaris ID" />
                    <HeaderCell label="Pulse" />
                    <HeaderCell label="AI Pulse-Reason" />
                    <HeaderCell label="AI Pulse-Score" />
                    <HeaderCell label="Owner" />
                    <th className="p-4 text-center w-12">
                       <Plus className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                    </th>
                 </tr>
              </thead>
              <tbody>
                 {accounts.map((acc) => (
                   <tr key={acc.id} className="hover:bg-indigo-50/20 border-b border-gray-50 transition-all cursor-pointer group" onClick={() => navigate(`/accounts/${acc.id}`)}>
                     <td className="p-4"><input type="checkbox" className="rounded border-gray-200" onClick={(e) => e.stopPropagation()} /></td>
                     <td className="p-4">
                        <div className="flex items-center gap-4">
                           <div className="w-9 h-9 flex items-center justify-center bg-white border border-gray-100 rounded-xl shadow-xs p-1.5 shrink-0">
                              <img src={acc.logo} alt={acc.name} className="w-7 h-7 object-contain" />
                           </div>
                           <div className="flex flex-col overflow-hidden pt-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[13.5px] font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate">{acc.name}</span>
                                <ExternalLink className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate">{acc.orgName}</span>
                           </div>
                        </div>
                     </td>
                     <td className="p-4 text-[13px] font-bold text-gray-600">{acc.velarisId}</td>
                     <td className="p-4">
                        <div className="flex items-center gap-1">
                           {acc.pulse.map((val: number, i: number) => (
                             <div key={i} className={`w-2 h-2 rounded-full border border-white shadow-sm ${val === 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                           ))}
                        </div>
                     </td>
                     <td className="p-4 max-w-[280px]">
                        <span className="text-[12px] font-medium text-gray-500 leading-relaxed line-clamp-2">
                           {acc.aiPulseReason}
                        </span>
                     </td>
                     <td className="p-4">
                        <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50/50 px-2 py-0.5 rounded-md border border-emerald-100/50 uppercase tracking-tight">
                           {acc.aiPulseScore}
                        </span>
                     </td>
                     <td className="p-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500 overflow-hidden shadow-sm">
                              {acc.avatar ? acc.avatar : <img src={`https://i.pravatar.cc/150?u=${acc.owner}`} alt={acc.owner} className="w-full h-full object-cover" />}
                           </div>
                           <span className="text-[13px] font-bold text-gray-700 whitespace-nowrap">{acc.owner}</span>
                        </div>
                     </td>
                     <td className="p-4">
                        <MoreHorizontal className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                     </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-white border-t border-gray-50 flex items-center justify-end gap-6 shrink-0">
           <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 text-white text-[12px] font-bold shadow-sm">1</button>
           </div>
           
           <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-gray-400 uppercase">100 / page</span>
              <ChevronUp className="w-4 h-4 text-gray-400 rotate-180 cursor-pointer" />
           </div>
        </div>

      </div>
    </div>
  );
}

function HeaderCell({ label }: { label: string }) {
  return (
    <th className="p-4 text-left group/header cursor-pointer">
       <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
          <div className="flex flex-col -gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
             <ChevronUp className="w-2.5 h-2.5 text-gray-400" />
             <ChevronUp className="w-2.5 h-2.5 text-gray-400 rotate-180" />
          </div>
       </div>
    </th>
  );
}

function ContactsTab({ orgId }: { orgId: number }) {
  const contacts = CONTACTS_DATA.filter(c => c.orgId === orgId);
  
  const stats = {
    total: contacts.length,
    decisionMakers: contacts.filter(c => c.role === 'Executive Sponsor' || c.role === 'Decision Maker' || c.role === 'Economic Buyer').length,
    active: contacts.filter(c => c.status === 'Active').length,
    positiveSentiment: contacts.filter(c => c.sentiment === 'Positive').length
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar p-6 pt-2">
      {/* Contacts Summary Banner */}
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm shrink-0">
        <ContactStatCard title="Total Contacts" value={stats.total.toString()} subtext="Across all departments" icon={<Layout className="w-4 h-4 text-indigo-500" />} />
        <ContactStatCard title="Decision Makers" value={stats.decisionMakers.toString()} subtext="High influence" icon={<Sparkles className="w-4 h-4 text-purple-500" />} />
        <ContactStatCard title="Active Users" value={stats.active.toString()} subtext="Logged in last 30d" icon={<CheckCircle className="w-4 h-4 text-teal-500" />} />
        <ContactStatCard title="Avg Sentiment" value={`${stats.total > 0 ? Math.round((stats.positiveSentiment / stats.total) * 100) : 0}%`} subtext="Positive feedback" icon={<MessageSquare className="w-4 h-4 text-amber-500" />} />
      </div>

      {/* Action Bar & Table */}
      <div className="max-w-7xl w-full mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-white flex items-center justify-between gap-4">
           <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search contacts by name, role or email..." className="w-full pl-10 pr-4 py-2 bg-gray-50/30 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-indigo-500/10 placeholder:text-gray-400" />
           </div>
           <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[13px] font-bold shadow-sm transition-all">
                 <Plus className="w-4 h-4" />
                 Add Contact
              </button>
              <button className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors">
                 <Filter className="w-4 h-4" />
              </button>
              <button className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors">
                 <Download className="w-4 h-4" />
              </button>
           </div>
        </div>

        {/* Contacts Table */}
        <div className="overflow-x-auto min-h-[400px]">
           <table className="w-full border-collapse">
              <thead>
                 <tr className="bg-white border-b border-gray-50">
                    <th className="p-4 w-10"><input type="checkbox" className="rounded border-gray-300 text-indigo-600" /></th>
                    <th className="p-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                    <th className="p-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="p-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sentiment</th>
                    <th className="p-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Last Contacted</th>
                    <th className="p-4 text-center w-10"></th>
                 </tr>
              </thead>
              <tbody>
                 {contacts.map((contact) => (
                   <tr key={contact.id} className="hover:bg-gray-50 border-b border-gray-50 transition-all cursor-pointer group">
                     <td className="p-4"><input type="checkbox" className="rounded" onClick={(e) => e.stopPropagation()} /></td>
                     <td className="p-4">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[12px] font-bold text-indigo-600 shadow-xs">
                              {contact.avatar}
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[13.5px] font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{contact.name}</span>
                              <span className="text-[11px] font-medium text-gray-400 lowercase">{contact.email}</span>
                           </div>
                        </div>
                     </td>
                     <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 text-[11.5px] font-bold text-gray-600 uppercase tracking-tight">
                           {contact.role}
                        </span>
                     </td>
                     <td className="p-4">
                        <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${contact.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                           <span className={`text-[13px] font-medium ${contact.status === 'Active' ? 'text-gray-700' : 'text-gray-400'}`}>{contact.status}</span>
                        </div>
                     </td>
                     <td className="p-4">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-bold ${
                          contact.sentiment === 'Positive' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                          contact.sentiment === 'Negative' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                          'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${
                             contact.sentiment === 'Positive' ? 'bg-emerald-500' :
                             contact.sentiment === 'Negative' ? 'bg-rose-500' :
                             'bg-amber-500'
                           }`} />
                           {contact.sentiment}
                        </div>
                     </td>
                     <td className="p-4">
                        <div className="flex flex-col">
                           <span className="text-[13px] font-bold text-gray-700">{contact.lastContacted}</span>
                           <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Mail className="w-3 h-3 text-indigo-400 hover:text-indigo-600 cursor-pointer" />
                              <Phone className="w-3 h-3 text-indigo-400 hover:text-indigo-600 cursor-pointer" />
                           </div>
                        </div>
                     </td>
                     <td className="p-4"><MoreHorizontal className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" /></td>
                   </tr>
                 ))}
                 {contacts.length === 0 && (
                   <tr>
                     <td colSpan={7} className="p-20 text-center text-gray-400 font-medium">No contacts found for this organization.</td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}

function ContactStatCard({ title, value, subtext, icon }: { title: string, value: string, subtext: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{title}</span>
        <span className="text-[20px] font-bold text-gray-900 leading-tight">{value}</span>
        <span className="text-[11px] font-medium text-gray-400 pt-0.5">{subtext}</span>
      </div>
    </div>
  );
}

function IconButton({ icon, minimal = false }: { icon: React.ReactNode, minimal?: boolean }) {
  return (
    <button className={`p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-600 ${minimal ? 'hover:bg-gray-100' : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'}`}>
      {icon}
    </button>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow">
      <div className="p-2 bg-indigo-50/50 rounded-lg text-indigo-600">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
function AccountsMetricsBanner({ accounts }: { accounts: AccountRow[] }) {
  const [healthTab, setHealthTab] = useState<'COUNT' | 'MRR' | 'ARR'>('COUNT');
  const [lifecycleTab, setLifecycleTab] = useState<'COUNT' | 'MRR' | 'ARR'>('COUNT');

  const health = useMemo(() => {
    let good = 0, average = 0, poor = 0;
    let goodMrr = 0, avgMrr = 0, poorMrr = 0;
    let goodArr = 0, avgArr = 0, poorArr = 0;
    for (const a of accounts) {
      if (a.healthCategory === 'good') { good++; goodMrr += a.mrr; goodArr += a.arr; }
      else if (a.healthCategory === 'average') { average++; avgMrr += a.mrr; avgArr += a.arr; }
      else { poor++; poorMrr += a.mrr; poorArr += a.arr; }
    }
    return { good, average, poor, goodMrr, avgMrr, poorMrr, goodArr, avgArr, poorArr };
  }, [accounts]);

  const nps = useMemo(() => {
    let promoters = 0, passives = 0, detractors = 0;
    for (const a of accounts) {
      if (a.npsValue > 0) promoters++;
      else if (a.npsValue === 0) passives++;
      else detractors++;
    }
    const total = accounts.length;
    const score = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;
    return { promoters, passives, detractors, score };
  }, [accounts]);

  const avgCsat = useMemo(() => {
    if (accounts.length === 0) return 0;
    return Math.round(accounts.reduce((s, a) => s + a.csatValue, 0) / accounts.length);
  }, [accounts]);

  // Lifecycle stages aggregation
  const lifecycle = useMemo(() => {
    const stages: Record<string, { count: number; mrr: number; arr: number }> = {};
    for (const a of accounts) {
      // Extract short stage name (e.g., "Live (Enterprise)" -> "LI")
      const fullStage = a.lifecycleStage || 'Unknown';
      const abbr = fullStage.substring(0, 2).toUpperCase();
      if (!stages[abbr]) stages[abbr] = { count: 0, mrr: 0, arr: 0 };
      stages[abbr].count++;
      stages[abbr].mrr += a.mrr;
      stages[abbr].arr += a.arr;
    }
    return stages;
  }, [accounts]);

  // CSM pulse aggregation
  const csmScore = useMemo(() => {
    if (accounts.length === 0) return 0;
    const totalPulse = accounts.reduce((s, a) => {
      const active = a.pulse.filter(v => v === 1).length;
      return s + (active / a.pulse.length) * 100;
    }, 0);
    return Math.round(totalPulse / accounts.length);
  }, [accounts]);

  // Health values based on selected tab
  const healthValues = useMemo(() => {
    if (healthTab === 'MRR') return { good: `$${(health.goodMrr / 1000).toFixed(1)}k`, avg: `$${(health.avgMrr / 1000).toFixed(1)}k`, poor: `$${(health.poorMrr / 1000).toFixed(1)}k` };
    if (healthTab === 'ARR') return { good: `$${(health.goodArr / 1000).toFixed(1)}k`, avg: `$${(health.avgArr / 1000).toFixed(1)}k`, poor: `$${(health.poorArr / 1000).toFixed(1)}k` };
    return { good: health.good.toString(), avg: health.average.toString(), poor: health.poor.toString() };
  }, [health, healthTab]);

  const healthTotal = health.good + health.average + health.poor;
  const donutSegments = [
    { pct: healthTotal > 0 ? (health.good / healthTotal) * 100 : 0, color: '#00a699' },
    { pct: healthTotal > 0 ? (health.average / healthTotal) * 100 : 0, color: '#ffbb00' },
    { pct: healthTotal > 0 ? (health.poor / healthTotal) * 100 : 0, color: '#fa5c5c' },
  ];

  let cumulativeOffset = 0;

  const csatColor = avgCsat >= 70 ? '#00a699' : avgCsat >= 40 ? '#ffbb00' : '#fa5c5c';
  const csmColor = csmScore >= 70 ? '#00a699' : csmScore >= 40 ? '#ffbb00' : '#fa5c5c';

  // Lifecycle bar chart max value
  const lifecycleEntries = Object.entries(lifecycle);
  const maxLifecycleVal = Math.max(...lifecycleEntries.map(([, v]) => 
    lifecycleTab === 'MRR' ? v.mrr : lifecycleTab === 'ARR' ? v.arr : v.count
  ), 1);

  const tabBtnClass = (active: boolean) =>
    `px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-600'}`;

  return (
    <div
      className="w-full flex items-stretch rounded-xl border border-gray-200/80 bg-white/70 shadow-sm shrink-0"
      style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      {/* Health */}
      <div className="px-4 py-3 flex flex-col gap-1 min-w-[180px]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-700">Health</span>
          <div className="flex gap-0.5">
            {(['COUNT', 'MRR', 'ARR'] as const).map(t => (
              <button key={t} onClick={() => setHealthTab(t)} className={tabBtnClass(healthTab === t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00a699]" /> Good
              <span className="text-gray-900 text-[11px] ml-auto pl-3">{healthValues.good}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffbb00]" /> Average
              <span className="text-gray-900 text-[11px] ml-auto pl-3">{healthValues.avg}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fa5c5c]" /> Poor
              <span className="text-gray-900 text-[11px] ml-auto pl-3">{healthValues.poor}</span>
            </div>
          </div>
          <svg viewBox="0 0 36 36" className="-rotate-90 shrink-0" style={{ width: 44, height: 44 }}>
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f3f4f6" strokeWidth="2.5" />
            {donutSegments.map((seg, i) => {
              const path = (
                <circle key={i} cx="18" cy="18" r="15.9155" fill="none" stroke={seg.color} strokeWidth="2.5"
                  strokeDasharray={`${seg.pct} ${100 - seg.pct}`} strokeDashoffset={-cumulativeOffset}
                  strokeLinecap="round" style={{ transition: 'all 0.5s ease' }} />
              );
              cumulativeOffset += seg.pct;
              return path;
            })}
          </svg>
        </div>
      </div>

      <div className="w-px bg-gray-200/60 my-3" />

      {/* NPS */}
      <div className="px-4 py-3 flex flex-col gap-1 min-w-[180px]">
        <span className="text-[11px] font-bold text-gray-700">NPS</span>
        <div className="flex items-center gap-4">
          <span className="text-[28px] font-light text-gray-800 leading-none tracking-tight">
            {nps.score > 0 ? '+' : ''}{nps.score}
          </span>
          <div className="flex flex-col gap-0.5 text-[10px] font-bold">
            <div className="flex items-center gap-1.5 text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00a699]" />
              <span className="w-16">Promoters</span>
              <span className="text-gray-900 text-[11px]">{nps.promoters}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffbb00]" />
              <span className="w-16">Passives</span>
              <span className="text-gray-900 text-[11px]">{nps.passives}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fa5c5c]" />
              <span className="w-16">Detractors</span>
              <span className="text-gray-900 text-[11px]">{nps.detractors}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-px bg-gray-200/60 my-3" />

      {/* CSAT Score */}
      <div className="px-4 py-3 flex flex-col gap-1 min-w-[120px]">
        <span className="text-[11px] font-bold text-gray-700">CSAT Score</span>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[22px] font-bold text-gray-900 leading-none">{avgCsat}%</span>
          <div className="relative shrink-0" style={{ width: 40, height: 40 }}>
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f3f4f6" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke={csatColor} strokeWidth="2.5"
                strokeDasharray={`${avgCsat} ${100 - avgCsat}`} strokeLinecap="round"
                style={{ transition: 'all 0.5s ease' }} />
            </svg>
          </div>
        </div>
      </div>

      <div className="w-px bg-gray-200/60 my-3" />

      {/* Lifecycle Stages */}
      <div className="px-4 py-3 flex flex-col gap-1 flex-1 min-w-[160px]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-700">Lifecycle Stages</span>
          <div className="flex gap-0.5">
            {(['COUNT', 'MRR', 'ARR'] as const).map(t => (
              <button key={t} onClick={() => setLifecycleTab(t)} className={tabBtnClass(lifecycleTab === t)}>{t}</button>
            ))}
          </div>
        </div>
        {/* Bar chart */}
        <div className="flex items-end gap-1.5 h-[40px] mt-0.5">
          {lifecycleEntries.map(([stage, data]) => {
            const val = lifecycleTab === 'MRR' ? data.mrr : lifecycleTab === 'ARR' ? data.arr : data.count;
            const heightPct = maxLifecycleVal > 0 ? (val / maxLifecycleVal) * 100 : 0;
            return (
              <div key={stage} className="flex flex-col items-center gap-0.5 flex-1">
                <div className="w-full max-w-[18px] rounded-t-sm bg-indigo-500 transition-all" style={{ height: `${Math.max(heightPct * 0.36, 2)}px` }} />
                <span className="text-[7px] font-bold text-gray-400 uppercase">{stage}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-px bg-gray-200/60 my-3" />

      {/* CSM */}
      <div className="px-4 py-3 flex flex-col gap-1 min-w-[70px] items-center">
        <span className="text-[11px] font-bold text-gray-700">CSM</span>
        <div className="relative shrink-0 mt-0.5" style={{ width: 40, height: 40 }}>
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f3f4f6" strokeWidth="2.5" />
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke={csmColor} strokeWidth="2.5"
              strokeDasharray={`${csmScore} ${100 - csmScore}`} strokeLinecap="round"
              style={{ transition: 'all 0.5s ease' }} />
          </svg>
        </div>
      </div>
    </div>
  );
}

function AttrModalItem({ label, value, dotColor }: { label: string; value: string; dotColor?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        {dotColor && <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />}
        <span className="text-[14px] font-semibold text-gray-800">{value}</span>
      </div>
    </div>
  );
}
