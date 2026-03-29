import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, RefreshCw, MoreHorizontal, Sparkles, Globe, Mail, Phone, MapPin, Pencil, ChevronUp, Search, Maximize2, ChevronLeft, Plus, Filter, Layout, FileText, Zap, CheckCircle, ExternalLink } from 'lucide-react';
import { TABLE_DATA } from '../../components/organizations/tableData';

export function Details() {
  const { id } = useParams<{ id: string }>();
  const orgId = parseInt(id || '1', 10);
  const organization = TABLE_DATA.find(o => o.id === orgId) || TABLE_DATA[0];

  const [activeTab, setActiveTab] = useState('General');

  const tabs = [
    { name: 'General', count: null },
    { name: 'Accounts', count: 3 },
    { name: 'Contacts', count: 16 },
    { name: 'Pipelines', count: 1 },
    { name: 'Custom Objects', count: 2 },
    { name: 'Success Plans', count: null },
    { name: 'Canvas List', count: null },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'General':
        return (
          <div className="flex flex-col w-full h-full">
            {/* Metrics Banner */}
            <MetricsBanner organization={organization} />

            <div className="p-6 flex gap-6 w-full h-[calc(100vh-210px)] overflow-hidden">
               {/* Left Sidebar - Pinned Attributes (Fixed width) */}
               <div className="w-[320px] flex flex-col h-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden shrink-0">
                  <PinnedAttributes organization={organization} />
               </div>

               {/* Right/Main Content - Activity Feed (Expanding) */}
               <div className="flex-1 h-full overflow-hidden bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
                  <ActivityFeed organization={organization} />
               </div>
            </div>
          </div>
        );
      case 'Accounts':
        return (
          <div className="p-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Accounts (3)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">Sub-account {i}</h4>
                  <p className="text-sm text-gray-500 mb-4">Implementation phase • Live</p>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-gray-400">Total ARR</span>
                    <span className="font-bold text-gray-900">$24,500.00</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return <div className="p-8 text-gray-400">{activeTab} content for {organization.org}</div>;
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#fcfdfe]">
      {/* Tabs Navigation */}
      <nav className="px-6 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8 h-12">
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

        <div className="flex items-center gap-4 py-2">
           <div className="flex items-center gap-2 px-3 py-1 bg-gray-50/50 rounded-lg border border-gray-100">
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
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8f9fc]/50">
        {renderTabContent()}
      </main>
    </div>
  );
}

function ActivityFeed({ organization }: { organization: typeof TABLE_DATA[0] }) {
  const [activeTab, setActiveTab] = useState('Activity Feed');
  const [filter, setFilter] = useState('All');

  const tabs = [
    { name: 'Activity Feed', icon: null },
    { name: 'Headlines', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { name: 'Overview', icon: <Layout className="w-3.5 h-3.5" /> },
    { name: 'Files', icon: <FileText className="w-3.5 h-3.5" /> },
    { name: 'CallSense', icon: <Zap className="w-3.5 h-3.5" /> },
  ];

  const filters = [
    'All', 'Activities', 'Emails', 'Tasks', 'Notes', 'Tickets', 'Calendar Events', 'Pulse', 'Conversations', 'Velaris Support', 'Surveys', 'Slack'
  ];

  const activities = [
    { id: 1, type: 'Value Reinforcement', date: 'Mar 5th', group: '05 Mar 2026', links: 1, watchers: 1 },
    { id: 2, type: 'Enablement or Re-Training', date: 'Mar 5th', group: '05 Mar 2026', links: 1, watchers: 0 },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Feed Top Tabs */}
      <div className="px-4 pt-3 flex items-center justify-between border-b border-gray-100 flex-wrap shrink-0">
        <div className="flex gap-5">
          {tabs.map(tab => (
            <button 
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`flex items-center gap-1.5 pb-2.5 text-[13px] font-semibold transition-all relative ${activeTab === tab.name ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {tab.icon && tab.icon}
              {tab.name}
              {activeTab === tab.name && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        {activeTab === 'Activity Feed' ? (
          <>
            {/* Header Content - Search & Filters */}
            <div className="p-4 flex flex-col gap-4 border-b border-gray-50 shrink-0">
               <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                     <input 
                       type="text" 
                       placeholder="Search all" 
                       className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-indigo-500/20 placeholder:text-gray-400"
                     />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[13px] font-bold transition-all shadow-sm">
                     <Plus className="w-4 h-4" />
                     Add Action
                  </button>
                  <button className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50">
                     <Filter className="w-4 h-4" />
                  </button>
               </div>

               {/* Horizontal Category Filters */}
               <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth whitespace-nowrap">
                  {filters.map(item => (
                    <button 
                      key={item}
                      onClick={() => setFilter(item)}
                      className={`px-3 py-1 rounded-full text-[12px] font-bold transition-all border ${
                        filter === item ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-white border-transparent text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
               </div>
            </div>

            {/* Timeline View */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50/20">
               <div className="flex flex-col gap-8 relative">
                  {/* Vertical Timeline line placeholder */}
                  <div className="absolute left-[13px] top-10 bottom-4 w-0.5 bg-indigo-100" />
                  
                  {/* Grouped by Date */}
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
        ) : activeTab === 'Overview' ? (
          <div className="p-6 h-full overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-2">
            <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">About {organization.org}</h3>
              <p className="text-gray-600 leading-relaxed">
                {organization.org} is a leading organization in its sector, currently in the <strong>{organization.stage}</strong> stage. 
                They joined on {organization.joined} and have a health score of <strong>{organization.health.val}</strong>.
              </p>
            </section>
            
            <div className="grid grid-cols-2 gap-4">
              <InfoCard icon={<Globe className="w-4 h-4" />} label="Domain" value={organization.domain} />
              <InfoCard icon={<MapPin className="w-4 h-4" />} label="Location" value={organization.nameAddress} />
              <InfoCard icon={<Mail className="w-4 h-4" />} label="Primary Contact" value="contact@apple.com" />
              <InfoCard icon={<Phone className="w-4 h-4" />} label="Phone" value="+1 (408) 996-1010" />
            </div>

            <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <StatRow label="ARR" value={`$${organization.arrAccount}`} />
                <StatRow label="Seats" value={organization.totalContractedSeats} />
                <StatRow label="Utilization" value={organization.totalSeatUtilization} />
              </div>
            </section>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 py-10 opacity-30">
            <Layout className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-sm font-bold text-gray-500">{activeTab} coming soon</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface Activity {
  id: number;
  type: string;
  date: string;
  group: string;
  links: number;
  watchers: number;
}

function ActivityCard({ activity, organization }: { activity: Activity, organization: typeof TABLE_DATA[0] }) {
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

      <div className="flex flex-col gap-3 pl-9">
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-bold text-gray-400">Assignee</span>
          <div className="flex items-center gap-2 px-2 py-0.5 bg-gray-50/50 rounded-full border border-gray-100">
            <div className="w-5 h-5 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[9px] font-bold text-blue-600">
               {organization.avatar}
            </div>
            <span className="text-[12px] font-bold text-gray-700">{organization.owner}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2">
           <div className={`w-3 h-3 rounded-full ${organization.health.clr} ring-4 ring-green-50/50`} />
           <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 px-2 py-0.5 bg-indigo-50/50 rounded-md border border-indigo-100 shadow-sm">
              <Sparkles className="w-3 h-3" />
              Pulse
           </div>
        </div>
      </div>

      <div className="absolute right-5 bottom-4 flex items-center gap-4 text-[11.5px] font-bold text-indigo-400">
         <span className="cursor-pointer hover:underline">{activity.links} Links</span>
         <span className="cursor-pointer hover:underline">{activity.watchers} Watchers</span>
      </div>
    </div>
  );
}

function PinnedAttributes({ organization }: { organization: typeof TABLE_DATA[0] }) {
  const [activeSubTab, setActiveSubTab] = useState('Pinned Attributes');
  
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Component Header / Tabs */}
      <div className="px-4 pt-2 border-b border-gray-100 flex items-center justify-between">
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveSubTab('Pinned Attributes')}
            className={`pb-2.5 text-[13px] font-semibold transition-all relative ${activeSubTab === 'Pinned Attributes' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Pinned Attributes
            {activeSubTab === 'Pinned Attributes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveSubTab('Summary')}
            className={`pb-2.5 text-[13px] font-semibold transition-all relative ${activeSubTab === 'Summary' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Summary
            {activeSubTab === 'Summary' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
          </button>
        </div>
        
        <div className="flex items-center gap-2 pb-2">
           <Maximize2 className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
           <ChevronLeft className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
         {activeSubTab === 'Pinned Attributes' ? (
           <>
             {/* Header Actions */}
             <div className="flex items-center justify-between text-[12px]">
                <button className="text-indigo-600 font-semibold hover:underline">View All</button>
                <Pencil className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
             </div>
             
             {/* Search Input */}
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search Attributes"
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all placeholder:text-gray-400"
                />
             </div>
             
             {/* Attributes List */}
             <div className="flex flex-col gap-4 py-2">
                <AttributeItem label="Velaris ID" value={organization.id.toString()} />
                <AttributeItem 
                  label="AI Pulse-Reason" 
                  value={organization.reason} 
                  isTruncated 
                />
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
                      <span className="text-[13px] font-semibold text-gray-700 group-hover/owner:text-indigo-600 transition-colors">{organization.owner}</span>
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
              <p className="text-sm text-gray-400">No summary available for {organization.org}</p>
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

function IconButton({ icon, minimal = false }: { icon: React.ReactNode, minimal?: boolean }) {
  return (
    <button className={`p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-600 ${minimal ? 'hover:bg-gray-100' : 'hover:bg-gray-50 border border-transparent hover:border-gray-200 shadow-transparent hover:shadow-sm'}`}>
      {icon}
    </button>
  );
}

function MetricsBanner({ organization }: { organization: typeof TABLE_DATA[0] }) {
  return (
    <div className="mx-6 mt-4 bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex overflow-hidden divide-x divide-gray-50 relative group">
      {/* Health Score */}
      <div className="px-6 py-4 flex flex-col gap-1 min-w-[140px]">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Health Score</span>
        <div className="flex items-center gap-2">
           <span className={`w-2.5 h-2.5 rounded-full ${organization.health.clr} shadow-sm shadow-green-200`}></span>
           <span className="text-[18px] font-bold text-gray-900">{organization.health.val}</span>
        </div>
      </div>

      {/* Lifecycle Stage */}
      <div className="px-6 py-4 flex flex-col gap-1 min-w-[170px]">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Lifecycle Stage</span>
        <span className="text-[15px] font-bold text-gray-900">{organization.stage}</span>
      </div>

      {/* CSM Pulse */}
      <div className="px-6 py-4 flex flex-col gap-1 min-w-[160px]">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">CSM Pulse</span>
        <div className="flex items-center gap-2">
           <span className="w-2.5 h-2.5 bg-[#00a699] rounded-[2px] shadow-sm"></span>
           <span className="text-[15px] font-bold text-[#00a699]">Very Satisfied</span>
        </div>
      </div>

      {/* Next Renewal Date */}
      <div className="px-6 py-4 flex flex-col min-w-[180px]">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Next Renewal Date</span>
        <div className="flex flex-col -gap-0.5">
          <span className="text-[15px] font-bold text-[#fa5c5c] leading-tight">02 Mar 2026</span>
          <span className="text-[11px] font-medium text-gray-400">2 days ago</span>
        </div>
      </div>

      {/* NPS */}
      <div className="px-6 py-4 flex flex-col gap-1 flex-1 min-w-[240px]">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">NPS</span>
        <div className="flex items-end gap-6 h-full">
           <span className="text-[32px] font-bold text-gray-900 leading-none">{organization.nps}</span>
           <div className="flex flex-col gap-1 text-[11px] font-bold pb-0.5">
             <div className="flex items-center gap-2 text-gray-500">
               <span className="w-2 h-2 rounded-full bg-[#00a699]"></span>
               <span className="w-20">Promoters</span>
               <span className="ml-auto text-gray-900">10</span>
             </div>
             <div className="flex items-center gap-2 text-gray-500">
               <span className="w-2 h-2 rounded-full bg-[#ffbb00]"></span>
               <span className="w-20">Passives</span>
               <span className="ml-auto text-gray-900">0</span>
             </div>
             <div className="flex items-center gap-2 text-gray-500">
               <span className="w-2 h-2 rounded-full bg-[#fa5c5c]"></span>
               <span className="w-20">Detractors</span>
               <span className="ml-auto text-gray-900">0</span>
             </div>
           </div>
        </div>
      </div>

      {/* CSAT Score */}
      <div className="px-6 py-4 flex flex-col gap-1 min-w-[160px] relative">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">CSAT Score</span>
        <div className="flex items-center gap-4 mt-1">
           <span className="text-[20px] font-bold text-gray-900 leading-none">100%</span>
           <div className="w-8 h-8 rounded-full border-[3px] border-[#087383] border-t-transparent animate-spin-slow"></div>
        </div>
        
        {/* Absolute icons on right of banner */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
           <div className="p-1.5 bg-gray-50 rounded-full hover:bg-gray-100 cursor-pointer shadow-sm border border-gray-100 transition-colors">
              <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
           </div>
           <div className="p-1.5 bg-white rounded-full hover:bg-gray-100 cursor-pointer shadow-sm border border-gray-100 transition-colors">
              <Pencil className="w-3.5 h-3.5 text-gray-400" />
           </div>
        </div>
      </div>
      
      {/* Partial Column on far right (Total ARR mock) */}
      <div className="px-6 py-4 flex flex-col gap-1 min-w-[140px] bg-gray-50/10">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total ARR</span>
        <span className="text-[18px] font-bold text-gray-900 leading-none mt-1.5">$27k</span>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-start gap-3">
      <div className="p-2 bg-gray-50 rounded-lg text-indigo-500">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-sm text-gray-900 font-bold">{value}</span>
    </div>
  );
}
