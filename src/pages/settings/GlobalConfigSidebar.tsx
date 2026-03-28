import { ChevronDown, Info, HelpCircle } from 'lucide-react';

export function GlobalConfigSidebar() {
  return (
    <div className="w-[320px] lg:w-[380px] border-l border-gray-100 bg-white flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
         <h2 className="text-[15px] font-bold text-gray-800 flex items-center gap-2">
            Global Configuration
            <HelpCircle className="w-3.5 h-3.5 text-gray-300 cursor-help" />
         </h2>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-none">
        <ConfigField 
          label="Organization Name" 
          value="Name" 
          placeholder="Enter organization name" 
          required 
          isInput 
        />
        
        <ConfigField 
          label="Organization ARR" 
          value="Total Contract Value" 
          required 
        />

        <ConfigField 
          label="Organization MRR" 
          value="Total Organization MRR" 
          required 
        />

        <ConfigField 
          label="Renewal Date" 
          value="Renewal Date" 
          required 
        />

        <ConfigField 
          label="Joined Date" 
          value="Joined Date" 
          required 
        />

        {/* Info Card */}
        <div className="mt-4 p-4 bg-indigo-50/40 rounded-xl border border-indigo-100/50 flex gap-3">
           <Info className="w-5 h-5 text-indigo-500 shrink-0" />
           <p className="text-[12px] text-indigo-700/80 leading-relaxed font-medium">
             These settings will be applied across all organizations by default. You can override them at the individual organization level.
           </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-gray-100 bg-gray-50/10 flex flex-col gap-3">
         <button className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-[13px] font-bold hover:bg-indigo-700 transition-all shadow-sm">
           Set Global Attributes
         </button>
         <button className="w-full bg-white text-gray-600 border border-gray-300 rounded-lg py-2.5 text-[13px] font-bold hover:bg-gray-50 transition-all">
           Reset
         </button>
      </div>
    </div>
  );
}

interface ConfigFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  isInput?: boolean;
}

function ConfigField({ label, value, required, isInput, placeholder }: ConfigFieldProps) {
  return (
    <div className="flex flex-col gap-1.5 group">
      <label className="text-[12px] font-bold text-gray-400 group-hover:text-indigo-500 transition-colors uppercase tracking-wide">
        {label} {required && <span className="text-rose-500 font-bold ml-0.5">*</span>}
      </label>
      
      {isInput ? (
        <input 
          type="text" 
          defaultValue={value === 'Name' ? '' : value}
          placeholder={placeholder}
          className="w-full px-4 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-gray-300"
        />
      ) : (
        <div className="relative cursor-pointer">
          <div className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg flex items-center justify-between hover:border-indigo-400/50 transition-all shadow-sm group-hover:shadow-indigo-50/50">
            <span className="text-[13px] font-semibold text-gray-700">{value}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      )}
    </div>
  );
}
