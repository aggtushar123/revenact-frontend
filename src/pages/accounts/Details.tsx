import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  RefreshCw,
  MoreHorizontal,
  Pencil,
  Globe,
  MapPin,
  Mail,
  Phone,
  Layout,
  ChevronUp,
  MessageCircle,
  Clock
} from 'lucide-react';
import { ACCOUNTS_DATA } from '../../components/organizations/accountsData';

export function AccountDetails() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('General');
  const [is360Enabled, setIs360Enabled] = useState(true);

  const account = ACCOUNTS_DATA.find(a => a.id === id) || ACCOUNTS_DATA[0];

  const tabs = [
    { name: 'General', count: null },
    { name: 'Organizations', count: 1 },
    { name: 'Contacts', count: 6 },
    { name: 'Pipelines', count: 3 },
    { name: 'Custom Objects', count: 0 },
    { name: 'Success Plans', count: null },
    { name: 'Canvas List', count: null },
  ];

  return (
    <div className="flex flex-col h-full bg-[#fcfdfe] overflow-hidden">
      {/* High-Fidelity Refined Tab Navigation */}
      <div className="bg-white border-b border-gray-100 px-6 flex items-center justify-between shrink-0 z-10 transition-all">
         <nav className="flex items-center gap-8 h-12 overflow-x-auto no-scrollbar whitespace-nowrap">
            {tabs.map((tab) => (
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
         </nav>

         <div className="flex items-center gap-5 pt-0.5">
            <div className="flex items-center gap-2.5">
               <span className="text-[11.5px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Enable new 360 UI</span>
               <button 
                  onClick={() => setIs360Enabled(!is360Enabled)}
                  className={`w-9 h-[21px] rounded-full relative transition-all duration-300 ${is360Enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
               >
                  <div className={`absolute top-[2.5px] w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${is360Enabled ? 'right-[2.5px]' : 'left-[2.5px]'}`} />
               </button>
            </div>
            
            <div className="h-6 w-px bg-gray-100" />
            
            <HeaderAction icon={<MessageCircle className="w-[18px] h-[18px]" />} />
            <HeaderAction icon={<RefreshCw className="w-[18px] h-[18px]" />} />
            <HeaderAction icon={<MoreHorizontal className="w-[18px] h-[18px]" />} />
         </div>
      </div>

      {/* Account Context Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8f9fc]/50">
         {activeTab === 'General' ? (
           <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full px-4 pt-5 pb-6">
              {/* High-Fidelity Stakeholder Metrics Banner */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex overflow-hidden lg:divide-x divide-gray-50 relative group">
                {/* Health Module */}
                <div className="px-4 py-4 flex flex-col gap-1.5 min-w-[130px]">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Health Score</span>
                  <div className="flex items-center gap-2.5 mt-0.5">
                     <div className="w-[7px] h-[7px] bg-[#00a699] rounded-full shadow-[0_0_8px_rgba(0,166,153,0.4)]" />
                     <span className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">9.3</span>
                  </div>
                </div>

                {/* Lifecycle Module */}
                <div className="px-4 py-4 flex flex-col gap-1.5 min-w-[170px]">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Lifecycle Stage</span>
                  <span className="text-[15px] font-bold text-gray-900 mt-1">Live (Enterprise)</span>
                </div>

                {/* Renewal Module (Red Alert) */}
                <div className="px-4 py-4 flex flex-col gap-1 min-w-[160px]">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Next Renewal Date</span>
                  <div className="flex flex-col mt-0.5">
                    <span className="text-[15px] font-bold text-[#fa5c5c]">23 Jan 2026</span>
                    <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">a month ago</span>
                  </div>
                </div>

                {/* CSM Pulse Module */}
                <div className="px-4 py-4 flex flex-col gap-1.5 min-w-[140px]">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">CSM Pulse</span>
                  <div className="flex items-center gap-2.5 mt-1">
                     <div className="w-[7px] h-[7px] bg-[#00a699] rounded-sm" />
                     <span className="text-[15px] font-bold text-gray-700">Very Satisfied</span>
                  </div>
                </div>

                {/* NPS Module */}
                <div className="px-4 py-4 flex flex-col gap-1 flex-1 min-w-[220px]">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">NPS</span>
                  <div className="flex items-end gap-6 h-full mt-0.5">
                     <span className="text-[32px] font-bold text-gray-900 leading-nonetracking-tighter">+100</span>
                     <div className="flex flex-col gap-1 text-[10.5px] font-bold pb-0.5">
                       <div className="flex items-center gap-2.5 text-gray-500">
                         <span className="w-1.5 h-1.5 rounded-sm bg-[#00a699]"></span>
                         <span className="w-16 whitespace-nowrap">Promoters</span>
                         <span className="ml-auto text-gray-900">10</span>
                       </div>
                       <div className="flex items-center gap-2.5 text-gray-500">
                         <span className="w-1.5 h-1.5 rounded-sm bg-[#ffbb00]"></span>
                         <span className="w-16 whitespace-nowrap">Passives</span>
                         <span className="ml-auto text-gray-900">0</span>
                       </div>
                       <div className="flex items-center gap-2.5 text-gray-500">
                         <span className="w-1.5 h-1.5 rounded-sm bg-[#fa5c5c]"></span>
                         <span className="w-16 whitespace-nowrap">Detractors</span>
                         <span className="ml-auto text-gray-900">0</span>
                       </div>
                     </div>
                  </div>
                </div>

                {/* CSAT Module (Circular Chart) */}
                <div className="px-4 py-4 flex flex-col gap-1 min-w-[150px] relative">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">CSAT Score</span>
                  <div className="flex items-center gap-4 mt-1">
                     <span className="text-[18px] font-bold text-gray-900 leading-none">100%</span>
                     <div className="relative w-10 h-10 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                           <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-50" />
                           <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" strokeDasharray="100" strokeDashoffset="0" className="text-[#087383]" />
                        </svg>
                     </div>
                  </div>
                </div>

                {/* Total ARR (far right edge) */}
                <div className="px-4 py-4 flex flex-col gap-1 min-w-[120px] border-l border-gray-50">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total ARR</span>
                    <span className="text-[18px] font-bold text-gray-900 mt-1">$1.2M</span>
                </div>

                {/* Secondary Operational Actions */}
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col gap-1.5 lg:flex">
                   <div className="p-1 hover:bg-gray-50 rounded-full transition-colors cursor-pointer text-gray-300 hover:text-indigo-500">
                      <ChevronUp className="w-4 h-4" />
                   </div>
                   <div className="p-1 hover:bg-gray-50 rounded-full transition-colors cursor-pointer text-gray-300 hover:text-indigo-500">
                      <Pencil className="w-[14px] h-[14px]" />
                   </div>
                </div>
              </div>

              {/* Horizontal rule separator */}
              <div className="h-px w-full bg-gray-100 -mt-2" />

              {/* Profile Grid (Remains consolidated) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 flex flex-col gap-6">
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                       <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/5 flex items-center justify-between">
                          <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider">Account Overview</h2>
                          <button className="px-3 py-1.5 hover:bg-indigo-50 text-indigo-500 border border-transparent hover:border-indigo-100 rounded-lg transition-all text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
                             Update
                             <Pencil className="w-3 h-3" />
                          </button>
                       </div>
                       <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                          <DetailItem label="Velaris ID" value={account.velarisId.toString()} />
                          <DetailItem label="Segment" value="Enterprise" />
                          <DetailItem label="Industry" value="Technology" />
                          <DetailItem label="Region" value="EMEA" />
                          <DetailItem label="Account Owner" value={account.owner} isOwner avatar={account.avatar} />
                          <DetailItem label="ARR" value="$1,250,000" />
                       </div>
                    </section>
                    
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-xs p-10 flex flex-col items-center justify-center py-24 bg-gradient-to-br from-white to-gray-50/20">
                       <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-5 shadow-inner border border-gray-100">
                          <Clock className="w-8 h-8 text-indigo-400" />
                       </div>
                       <h3 className="text-[15px] font-bold text-gray-900 uppercase tracking-widest mb-2">Activity Timeline</h3>
                       <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed text-center max-w-[280px]">Real-time synchronization with Salesforce active...</p>
                    </section>
                 </div>

                 <div className="flex flex-col gap-6">
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                       <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/5">
                          <h2 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider">Stakeholder Intelligence</h2>
                       </div>
                       <div className="p-6 space-y-7">
                          <ContactLink icon={<Globe className="w-[18px] h-[18px]" />} label="Primary Domain" value="apple.com" color="text-indigo-600" bg="bg-indigo-50/30" />
                          <ContactLink icon={<Mail className="w-[18px] h-[18px]" />} label="Main Contact" value="tim@apple.com" color="text-indigo-600" bg="bg-indigo-50/30" />
                          <ContactLink icon={<Phone className="w-[18px] h-[18px]" />} label="Direct Support" value="+1 (800) 275-2273" color="text-indigo-600" bg="bg-indigo-50/30" />
                          <ContactLink icon={<MapPin className="w-[18px] h-[18px]" />} label="Corporate HQ" value="London, UK" color="text-indigo-600" bg="bg-indigo-50/30" />
                       </div>
                    </section>
                 </div>
              </div>
           </div>
         ) : (
           <div className="flex flex-col items-center justify-center h-full text-gray-400 py-24 bg-white m-6 rounded-3xl border-2 border-dashed border-gray-100 shadow-inner">
             <div className="w-20 h-20 bg-gray-50 rounded-[28px] flex items-center justify-center mb-6 shadow-xs border border-gray-100">
                <Layout className="w-10 h-10 opacity-20" />
             </div>
             <p className="text-[15px] font-bold uppercase tracking-[0.2em] opacity-40">{activeTab} coming soon</p>
             <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mt-2">Integrating Salesforce Data...</p>
           </div>
         )}
      </main>
    </div>
  );
}


function DetailItem({ label, value, isOwner, avatar }: { label: string, value: string, isOwner?: boolean, avatar?: string }) {
  return (
    <div className="flex flex-col gap-2">
       <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none">{label}</span>
       <div className="flex items-center gap-3 mt-1">
          {isOwner && (
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-700 shadow-xs border border-white shrink-0">
               {avatar || value.charAt(0)}
            </div>
          )}
          <span className="text-[14px] font-bold text-gray-700 tracking-tight">{value}</span>
       </div>
    </div>
  );
}

function ContactLink({ icon, label, value, color, bg }: { icon: React.ReactNode, label: string, value: string, color: string, bg: string }) {
  return (
    <div className="flex items-center gap-4 group cursor-pointer">
       <div className={`w-11 h-11 rounded-2xl ${bg} ${color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xs border border-indigo-50`}>
          {icon}
       </div>
       <div className="flex flex-col">
          <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">{label}</span>
          <span className="text-[14px] font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{value}</span>
       </div>
    </div>
  );
}

function HeaderAction({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 transition-all border border-transparent hover:border-gray-100 hover:text-indigo-600">
      {icon}
    </button>
  );
}
