import { Edit2 } from 'lucide-react';

export function MetricsPanel() {
  return (
    <div className="flex items-start justify-between w-full font-sans">
      
      {/* Health Section */}
      <div className="flex flex-col flex-1 pl-2">
        <div className="flex items-center gap-12 mb-3">
          <span className="text-[13px] font-semibold text-gray-800 tracking-wide">Health</span>
          <div className="flex items-center gap-1 text-[10px] font-bold">
            <span className="text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">COUNT</span>
            <span className="text-gray-300 px-1">MRR</span>
            <span className="text-gray-300 px-1">ARR</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-[13px] text-gray-600 mb-0.5">
                <span className="w-2 h-2 rounded-sm bg-[#00a699]"></span> Good
              </div>
              <span className="text-2xl font-bold text-gray-900 leading-tight">64</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-[13px] text-gray-600 mb-0.5">
                <span className="w-2 h-2 rounded-sm bg-[#ffbb00]"></span> Average
              </div>
              <span className="text-2xl font-bold text-gray-900 leading-tight">2</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-[13px] text-gray-600 mb-0.5">
                <span className="w-2 h-2 rounded-sm bg-[#fa5c5c]"></span> Poor
              </div>
              <span className="text-2xl font-bold text-gray-900 leading-tight">2</span>
            </div>
          </div>
          <div className="relative w-11 h-11 ml-2">
            {/* SVG Donut Chart */}
            <svg viewBox="0 0 36 36" className="w-full h-full">
              <path className="text-gray-100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-[#00a699]" strokeWidth="4" strokeDasharray="94, 100" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
          </div>
        </div>
      </div>

      <div className="w-px h-16 bg-gray-200 mx-4 mt-2"></div>

      {/* NPS Section */}
      <div className="flex flex-col flex-1">
        <div className="mb-2 text-[13px] font-semibold text-gray-800 tracking-wide">NPS</div>
        <div className="flex items-center gap-6 mt-1">
          <span className="text-[40px] font-light text-gray-800 leading-none tracking-tight">+17</span>
          <div className="flex flex-col text-[12px] text-gray-600 font-medium">
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-[#00a699]"></span> Promoters</div> 
              <span className="font-semibold text-gray-800 ml-4">39</span>
            </div>
            <div className="flex items-center gap-2 justify-between mt-1">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-[#ffbb00]"></span> Passives</div> 
              <span className="font-semibold text-gray-800 ml-4">20</span>
            </div>
            <div className="flex items-center gap-2 justify-between mt-1">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-[#fa5c5c]"></span> Detractors</div> 
              <span className="font-semibold text-gray-800 ml-4">25</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-px h-16 bg-gray-200 mx-4 mt-2"></div>

      {/* Lifecycle Stages Section */}
      <div className="flex flex-col flex-1 pl-2">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-[13px] font-semibold text-gray-800 tracking-wide">Lifecycle Stages</span>
          <div className="flex items-center gap-1 text-[10px] font-bold">
            <span className="text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">COUNT</span>
            <span className="text-gray-300 px-1">MRR</span>
            <span className="text-gray-300 px-1">ARR</span>
          </div>
        </div>
        <div className="flex flex-col w-[180px]">
          <div className="flex items-end gap-[4px] h-8 w-full border-b border-gray-200 pb-0.5">
             <div className="flex-1 bg-indigo-500 hover:bg-indigo-600 transition-colors h-full rounded-t-[2px]"></div>
             <div className="flex-1 bg-gray-200 h-[15%] rounded-t-[2px]"></div>
             <div className="flex-1 bg-gray-200 h-[5%] rounded-t-[2px]"></div>
             <div className="flex-1 bg-gray-200 h-[8%] rounded-t-[2px]"></div>
             <div className="flex-1 bg-indigo-500 h-[10%] rounded-t-[2px]"></div>
             <div className="flex-1 bg-gray-200 h-[5%] rounded-t-[2px]"></div>
             <div className="flex-1 bg-gray-200 h-[5%] rounded-t-[2px]"></div>
             <div className="flex-1 bg-gray-200 h-[5%] rounded-t-[2px]"></div>
          </div>
          <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 mt-1 uppercase w-full">
            <span className="flex-1 text-center">ON</span><span className="flex-1 text-center">KI</span><span className="flex-1 text-center">AD</span><span className="flex-1 text-center">LI</span><span className="flex-1 text-center">ON</span><span className="flex-1 text-center">KI</span><span className="flex-1 text-center">AD</span><span className="flex-1 text-center">LI</span>
          </div>
        </div>
      </div>

      <div className="w-px h-16 bg-gray-200 mx-4 mt-2"></div>

      {/* Number of Organizations */}
      <div className="flex flex-col px-4">
        <div className="mb-3 text-[13px] font-semibold text-gray-800 tracking-wide">Number of Organizations</div>
        <div className="flex items-center gap-2 mt-2">
          {/* Triangular pyramid icon */}
          <div className="relative w-4 h-4 text-[#fb7185]">
             <svg viewBox="0 0 24 24" className="w-full h-full fill-current"><path d="M12 2L2 20h20L12 2zm0 3.8l6.1 11H5.9L12 5.8z"/></svg>
             <div className="absolute top-[8px] left-[6px] w-1 h-1 bg-current rounded-full"></div>
             <div className="absolute top-[13px] left-[9px] w-1.5 h-1.5 bg-current rounded-full"></div>
             <div className="absolute top-[13px] left-[3px] w-1 h-1 bg-current rounded-full"></div>
          </div>
          <span className="text-2xl font-bold text-gray-900 leading-tight">68</span>
        </div>
      </div>

      <div className="w-px h-16 bg-gray-200 mx-4 mt-2"></div>

      {/* Renewal */}
      <div className="flex flex-col pr-4">
        <div className="flex items-center gap-1.5 mb-2 text-[13px] font-semibold text-gray-800 tracking-wide cursor-pointer hover:text-indigo-600 transition-colors">
          Renewal <Edit2 className="w-3.5 h-3.5 text-gray-400" />
        </div>
        <div className="flex flex-col mt-1">
          <span className="text-xl font-bold text-gray-900 leading-tight">1</span>
          <span className="text-[11px] font-medium text-gray-400 mt-0.5 whitespace-nowrap">Next 1 mo</span>
        </div>
      </div>

    </div>
  );
}
