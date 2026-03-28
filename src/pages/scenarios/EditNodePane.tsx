import { X, Info, ChevronDown, Filter, Settings, Trash2 } from 'lucide-react';

interface EditNodePaneProps {
  node: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function EditNodePane({ node, isOpen, onClose, onSave }: EditNodePaneProps) {
  if (!isOpen || !node) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[550px] bg-white shadow-2xl z-[100] flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
        <h2 className="text-[16px] font-bold text-indigo-600">Edit {node.data?.action || 'Node'} Node</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div>
           <p className="text-[14px] text-gray-600 mb-4">Add conditions below to filter out the flow</p>
           
           <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[12px] font-medium text-gray-500 mb-1">
                 Select Currency and Timezone <Info className="w-3 h-3" />
              </div>
              
              <div className="flex gap-3">
                 <div className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg flex items-center justify-between cursor-pointer hover:border-gray-300">
                    <span className="text-[13px] text-gray-700 font-medium">USD</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                 </div>
                 <div className="flex-[2] px-3 py-2 bg-white border border-gray-200 rounded-lg flex items-center justify-between cursor-pointer hover:border-gray-300">
                    <span className="text-[13px] text-gray-700 font-medium">(UTC+00:00) Europe/London</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                 </div>
              </div>
           </div>
        </div>

        <div className="flex flex-col gap-3">
           <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg flex items-center justify-between cursor-pointer hover:border-gray-300">
                 <span className="text-[13px] text-gray-700">Organization</span>
                 <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div className="flex gap-1.5">
                 <button className="w-9 h-9 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100"><Filter className="w-4 h-4" /></button>
                 <button className="w-9 h-9 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100"><Settings className="w-4 h-4" /></button>
              </div>
           </div>

           {/* Condition Logic Builder Mockup */}
           <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-200/50" />
              
              {/* Row 1 */}
              <div className="flex items-center gap-3">
                 <div className="flex-1 bg-white border border-gray-100 rounded-lg p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                       <span className="text-[13px] text-indigo-600 font-medium">Lifecycle Stage</span>
                       <span className="text-[13px] text-gray-500 italic">includes</span>
                       <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[12px] font-semibold border border-indigo-100 flex items-center gap-1.5">
                          Live (Enterprise)
                          <X className="w-3 h-3 cursor-pointer hover:text-indigo-900" />
                       </span>
                    </div>
                    <X className="w-4 h-4 text-gray-300 cursor-pointer hover:text-gray-500" />
                 </div>
              </div>

              {/* Connector */}
              <div className="flex items-center gap-3">
                 <div className="w-[100px] px-3 py-1.5 bg-white border border-gray-100 rounded-lg flex items-center justify-between cursor-pointer shadow-sm">
                    <span className="text-[12px] font-bold text-gray-700 uppercase tracking-wide">And</span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                 </div>
                 
                 <div className="flex-1 bg-white border border-gray-100 rounded-lg p-3 flex items-center justify-between shadow-sm relative group">
                    <div className="flex items-center gap-2">
                       <span className="text-[13px] text-indigo-600 font-medium font-inter">Product Utilization %</span>
                       <span className="text-[13px] text-gray-500 italic">is less than</span>
                       <span className="px-2 py-0.5 bg-white text-gray-700 rounded text-[13px] font-bold border border-gray-100 flex items-center gap-1.5">
                          60
                          <X className="w-3 h-3 cursor-pointer hover:text-gray-900" />
                       </span>
                    </div>
                    <X className="w-4 h-4 text-gray-300 cursor-pointer hover:text-gray-500" />
                 </div>

                 <button className="p-2 text-gray-400 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                 </button>
              </div>

              <div className="flex gap-2 mt-2">
                 <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm text-indigo-600 hover:bg-gray-50"><Filter className="w-3.5 h-3.5" /></button>
                 <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm text-indigo-600 hover:bg-gray-50 font-bold text-xs">{"{ }"}</button>
              </div>
           </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-gray-100 flex items-center justify-end gap-3 bg-white">
        <button 
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition-colors h-[42px] min-w-[100px]"
        >
          Cancel
        </button>
        <button 
          onClick={onSave}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-700 transition-all h-[42px] min-w-[120px] shadow-sm"
        >
          Save & Close
        </button>
      </div>
    </div>
  );
}
