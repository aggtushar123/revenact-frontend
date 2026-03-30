import { Users, UserCheck, Smile, Frown } from 'lucide-react';

export function MetricsPanel() {
  return (
    <div className="flex items-start justify-between w-full font-sans">
      
      {/* Total Contacts Section */}
      <div className="flex flex-col flex-1 pl-2">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[13px] font-semibold text-gray-800 tracking-wide">Total Contacts</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
             <Users className="w-5 h-5" />
          </div>
          <span className="text-3xl font-bold text-gray-900 leading-tight">1,248</span>
        </div>
      </div>

      <div className="w-px h-16 bg-gray-200 mx-4 mt-2"></div>

      {/* Active Contacts Section */}
      <div className="flex flex-col flex-1">
        <div className="mb-2 text-[13px] font-semibold text-gray-800 tracking-wide">Active Contacts</div>
        <div className="flex items-center gap-4 mt-1">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
               <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-3xl font-light text-gray-800 leading-none tracking-tight">892</span>
          </div>
        </div>
      </div>

      <div className="w-px h-16 bg-gray-200 mx-4 mt-2"></div>

      {/* Sentiment Overview Section */}
      <div className="flex flex-col flex-1 pl-2">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-[13px] font-semibold text-gray-800 tracking-wide">Sentiment Overview</span>
        </div>
        <div className="flex items-center justify-between w-[80%] pr-4 mt-1">
           <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-[12px] text-gray-600 mb-0.5">
                <Smile className="w-3.5 h-3.5 text-emerald-500" /> Positive
              </div>
              <span className="text-xl font-bold text-gray-900 leading-tight">64%</span>
           </div>
           
           <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-[12px] text-gray-600 mb-0.5">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400"></span> Neutral
              </div>
              <span className="text-xl font-bold text-gray-900 leading-tight">28%</span>
           </div>
           
           <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-[12px] text-gray-600 mb-0.5">
                <Frown className="w-3.5 h-3.5 text-rose-500" /> Negative
              </div>
              <span className="text-xl font-bold text-gray-900 leading-tight">8%</span>
           </div>
        </div>
      </div>

      <div className="w-px h-16 bg-gray-200 mx-4 mt-2"></div>

      {/* Growth */}
      <div className="flex flex-col pr-4">
        <div className="flex items-center gap-1.5 mb-2 text-[13px] font-semibold text-gray-800 tracking-wide">
          Growth (30d)
        </div>
        <div className="flex flex-col mt-2">
          <span className="text-xl font-bold text-emerald-500 leading-tight">+12.4%</span>
          <span className="text-[11px] font-medium text-gray-400 mt-0.5 whitespace-nowrap">vs last month</span>
        </div>
      </div>

    </div>
  );
}
