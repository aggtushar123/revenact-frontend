import { useState } from 'react';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export function ScenarioHeader() {
  const [applyTo, setApplyTo] = useState<'Organizations' | 'Accounts' | 'Contacts'>('Organizations');

  return (
    <header className="h-[64px] border-b border-gray-100 bg-white flex items-center justify-between px-6 z-20 shrink-0">
      <div className="flex items-center gap-6">
        <NavLink to="/scenarios" className="flex items-center gap-2 text-gray-800 hover:text-gray-600 font-bold transition-colors mb-0.5">
          <ChevronLeft className="w-5 h-5 -ml-1 stroke-[2.5px]" />
          <span className="text-[17px] tracking-tight">Create Scenario</span>
        </NavLink>

        <div className="h-4 w-px bg-gray-200 mt-1" />

        <div className="flex items-center gap-6 mt-0.5">
          <span className="text-[13px] text-gray-400 font-medium">Apply scenario to:</span>
          
          <div className="flex items-center gap-4">
            {['Organizations', 'Accounts', 'Contacts'].map((option) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="radio" 
                  name="applyTo" 
                  className="hidden" 
                  checked={applyTo === option}
                  onChange={() => setApplyTo(option as 'Organizations' | 'Accounts' | 'Contacts')}
                />
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                  applyTo === option ? 'border-blue-500' : 'border-gray-200 group-hover:border-gray-300'
                }`}>
                  {applyTo === option && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <span className={`text-[13px] font-semibold transition-colors ${
                  applyTo === option ? 'text-gray-800' : 'text-gray-400 group-hover:text-gray-500'
                }`}>
                  {option}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Save button with dropdown */}
        <div className="flex items-center">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-4 py-1.5 rounded-l-[6px] text-[13px] font-bold transition-all shadow-sm">
            Save
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-1.5 py-1.5 rounded-r-[6px] border-l border-white/20 transition-all shadow-sm">
            <ChevronDown className="w-4 h-4 stroke-[2.5px]" />
          </button>
        </div>

        <button className="bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-4 py-1.5 rounded-[6px] text-[13px] font-bold transition-all shadow-sm">
          Back to List
        </button>
      </div>
    </header>
  );
}
