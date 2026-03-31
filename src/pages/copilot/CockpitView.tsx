import { useState } from 'react';
import { ChevronDown, ClipboardList, Flag, CheckCircle2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { type RootState } from '../../store';

export function CockpitView() {
  const [taskTab, setTaskTab] = useState<'upcoming' | 'overdue'>('overdue');
  const allTasks = useSelector((state: RootState) => state.tasks.tasks);

  // Filter tasks based on simple mock logic
  // Just show all open tasks as 'upcoming' to demonstrate addition working
  const upcomingTasks = allTasks.filter(t => t.status === 'Open');
  const overdueTasks = allTasks.filter(t => t.status === 'Planned');
  const tasks = taskTab === 'upcoming' ? upcomingTasks : overdueTasks;

  return (
    <div className="w-full flex flex-col gap-5 h-full">
      
      {/* Top Split Sections */}
      <div className="grid grid-cols-3 gap-5 shrink-0">
        
        {/* Left: My Portfolio Summary */}
        <div className="col-span-2 bg-white rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6">
          <h2 className="text-[14.5px] font-bold text-[#5c4ce3] tracking-tight mb-7">My Portfolio Summary</h2>
          
          <div className="flex gap-16">
            {/* Organizations */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[13px] font-bold text-gray-700 tracking-tight">
                <div className="text-rose-500 flex items-center justify-center">
                   <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]"><path d="M12 2L2 22h20L12 2z"/></svg>
                </div>
                Organizations
              </div>
              <div className="flex gap-8 items-end">
                <div>
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Count</div>
                  <div className="text-[22px] font-bold text-gray-800 leading-none">10</div>
                </div>
                <div>
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Portfolio Value</div>
                  <div className="text-[22px] font-bold text-gray-800 leading-none">$63,500</div>
                </div>
                <div className="ml-2">
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Health Distribution</div>
                  <div className="w-7 h-7 rounded-full border-[4px] border-[#34d399] border-r-[#14b8a6] border-b-[#fbbf24] border-l-[#34d399] mt-2"></div>
                </div>
              </div>
            </div>

            {/* Accounts */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[13px] font-bold text-gray-700 tracking-tight">
                <div className="text-blue-500 flex items-center justify-center">
                   <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                </div>
                Accounts
              </div>
              <div className="flex gap-8 items-end">
                <div>
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Count</div>
                  <div className="text-[22px] font-bold text-gray-800 leading-none">6</div>
                </div>
                <div>
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Portfolio Value</div>
                  <div className="text-[22px] font-bold text-gray-800 leading-none">$30,000</div>
                </div>
                <div className="ml-2">
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Health Distribution</div>
                  <div className="w-7 h-7 rounded-full border-[4px] border-[#34d399] mt-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Renewals */}
        <div className="col-span-1 bg-white rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 relative">
          <h2 className="text-[14.5px] font-bold text-[#5c4ce3] tracking-tight mb-7">Renewals</h2>
          <div className="absolute top-5 right-5 border border-gray-200 rounded-md px-2 py-1 text-[11px] text-gray-400 font-bold flex items-center gap-1 cursor-pointer hover:bg-gray-50">
            Next 30 Days <ChevronDown className="w-3.5 h-3.5 stroke-[2.5px]" />
          </div>
          
          <div className="flex gap-10">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[13px] font-bold text-gray-700 tracking-tight">
                <div className="text-rose-500 flex items-center justify-center">
                   <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]"><path d="M12 2L2 22h20L12 2z"/></svg>
                </div>
                Organizations
              </div>
              <div className="flex gap-6 items-end">
                <div>
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Count</div>
                  <div className="text-[22px] font-bold text-gray-800 leading-none">0</div>
                </div>
                <div>
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Value</div>
                  <div className="text-[22px] font-bold text-gray-800 leading-none">$0</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[13px] font-bold text-gray-700 tracking-tight">
                <div className="text-blue-500 flex items-center justify-center">
                   <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                </div>
                Accounts
              </div>
              <div className="flex gap-6 items-end">
                <div>
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Count</div>
                  <div className="text-[22px] font-bold text-gray-800 leading-none">0</div>
                </div>
                <div>
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Value</div>
                  <div className="text-[22px] font-bold text-gray-800 leading-none">$0</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom section: My Tasks */}
      <div className="bg-white rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.02)] pt-5 pb-2 relative flex-1 min-h-0 flex flex-col">
        <div className="px-6 flex items-center gap-2 mb-6 shrink-0">
          <div className="bg-[#6b47ed] p-[2px] rounded-md text-white">
            <ClipboardList className="w-[14px] h-[14px]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[14.5px] font-bold text-[#5c4ce3] tracking-tight">My Tasks</h2>
          <div className="bg-[#5c4ce3] text-white rounded-full w-[13px] h-[13px] flex items-center justify-center text-[10px] font-bold cursor-pointer opacity-90 tracking-tighter ml-1 italic font-serif">i</div>
        </div>
        
        <div className="absolute top-5 right-6 border border-gray-200 rounded-md px-2 py-1 text-[11px] text-gray-400 font-bold flex items-center gap-1 cursor-pointer hover:bg-gray-50">
          Next 7 Days <ChevronDown className="w-3.5 h-3.5 stroke-[2.5px]" />
        </div>

        {/* Tabs */}
        <div className="px-6 flex items-center gap-6 border-b border-gray-100 mb-1 shrink-0">
          <div 
            onClick={() => setTaskTab('upcoming')}
            className={`pb-3.5 text-[12.5px] tracking-tight font-bold cursor-pointer border-b-2 transition-colors relative top-[1px] ${taskTab === 'upcoming' ? 'text-[#5c4ce3] border-[#5c4ce3]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
          >
            Upcoming ({upcomingTasks.length})
          </div>
          <div 
            onClick={() => setTaskTab('overdue')}
            className={`pb-3.5 text-[12.5px] tracking-tight font-bold cursor-pointer border-b-2 transition-colors relative top-[1px] ${taskTab === 'overdue' ? 'text-[#5c4ce3] border-[#5c4ce3]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
          >
            Overdue ({overdueTasks.length})
          </div>
        </div>

        {/* Tab Content */}
        {tasks.length === 0 ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center p-16 pb-20 pt-20">
            {/* SVG Illustration Placeholder matching the style */}
            <svg width="240" height="160" viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg">
               {/* Simplified hammock vector art */}
               <path d="M50 160 C 50 110, 80 50, 80 90" stroke="#8b5cf6" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9"/>
               <path d="M50 160 C 50 120, 40 100, 30 110" stroke="#8b5cf6" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9"/>
               <path d="M190 160 C 190 110, 160 50, 160 90" stroke="#8b5cf6" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9"/>
               <path d="M190 160 C 190 120, 200 100, 210 110" stroke="#8b5cf6" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9"/>
               
               <path d="M70 100 Q 120 160 170 100" stroke="#c4b5fd" strokeWidth="24" fill="none" strokeLinecap="round"/>
               <path d="M85 110 Q 120 140 160 105" stroke="#a78bfa" strokeWidth="8" fill="none" strokeLinecap="round"/>
               
               {/* Tree leaves */}
               <path d="M80 90 Q 60 70 40 80" stroke="#8b5cf6" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.8"/>
               <path d="M80 90 Q 70 50 85 40" stroke="#8b5cf6" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.8"/>
               <path d="M80 90 Q 100 70 110 85" stroke="#8b5cf6" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.8"/>
               
               <path d="M160 90 Q 180 70 200 80" stroke="#8b5cf6" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.8"/>
               <path d="M160 90 Q 170 50 155 40" stroke="#8b5cf6" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.8"/>
               <path d="M160 90 Q 140 70 130 85" stroke="#8b5cf6" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.8"/>
               
               <circle cx="120" cy="50" r="16" fill="#e2e8f0" opacity="0.8"/>
            </svg>
            <p className="text-gray-400 text-[13px] font-bold tracking-tight opacity-70 mt-6">Nothing here right now!</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col px-6">
            {tasks.map((task, i) => (
              <div key={i} className="flex items-center py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors -mx-4 px-4 rounded-lg shrink-0">
                <div className="w-10 flex-shrink-0 flex justify-center">
                  <CheckCircle2 className="w-[18px] h-[18px] text-gray-200" strokeWidth={2.5} />
                </div>
                
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="text-[13px] font-bold text-[#5c4ce3] truncate mb-[1px]">{task.title}</h4>
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">{task.id}</div>
                </div>

                <div className="w-[180px] flex items-center gap-3">
                  <ClipboardList className="w-[15px] h-[15px] text-[#4f7ee9]" strokeWidth={2.5} />
                  <div className="flex items-center gap-2 overflow-hidden">
                    {/* Apple Logo SVG */}
                    <svg viewBox="0 0 24 24" className="w-[13px] h-[13px] flex-shrink-0 fill-current text-gray-800"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.126 3.792 3.04 1.468-.087 2.026-.992 3.743-.992 1.717 0 2.227.992 3.743.953 1.562-.039 2.56-1.53 3.535-2.991 1.127-1.64 1.593-3.228 1.61-3.32-.032-.016-3.116-1.196-3.149-4.78-.027-2.992 2.453-4.463 2.568-4.524-1.391-2.035-3.555-2.316-4.326-2.39-1.921-.194-3.793 1.054-4.821 1.054-.047 0-.098 0-.142-.008zM14.73 4.22c.866-1.05 1.453-2.51 1.294-3.97-1.258.051-2.776.837-3.666 1.884-.794.942-1.458 2.434-1.272 3.864 1.405.109 2.822-.686 3.644-1.778z"/></svg>
                    <span className="text-[12.5px] font-bold text-gray-700 truncate">{task.org}</span>
                  </div>
                </div>

                <div className="w-[48px] flex justify-center border-l border-transparent">
                  {task.type === 'org' ? (
                     <div className="text-rose-500 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]"><path d="M12 2L2 22h20L12 2z"/></svg>
                     </div>
                  ) : (
                    <div className="text-blue-500 flex items-center justify-center">
                       <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                    </div>
                  )}
                </div>

                <div className="w-[110px] flex items-center gap-1.5">
                  <Flag className={`w-3.5 h-3.5 ${task.priority === 'High' ? 'text-[#eec853] fill-[#eec853]' : 'text-blue-400 fill-blue-400'}`} />
                  <span className={`text-[12px] font-bold ${task.priority === 'High' ? 'text-[#eec853]' : 'text-[#48baf4]'}`}>{task.priority}</span>
                </div>

                <div className="w-[110px]">
                  <span className={`px-[18px] py-[3px] rounded-sm tracking-tight text-[11px] font-bold uppercase ${
                    task.status === 'Planned' ? 'bg-[#f4ebfe] text-[#af8dfb]' : 'bg-[#fff5e9] text-[#ffd6ae]'
                  }`}>
                    {task.status}
                  </span>
                </div>

                <div className="w-[90px] text-right text-[12.5px] text-gray-500 font-bold tracking-tight">
                  {task.date}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
