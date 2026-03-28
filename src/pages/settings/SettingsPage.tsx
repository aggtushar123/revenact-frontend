import { useState } from 'react';
import { 
  Search, Plus, Download, Filter
} from 'lucide-react';
import { AttributesTable } from './AttributesTable';
import { GlobalConfigSidebar } from './GlobalConfigSidebar';

export function SettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState('Organization');

  const subTabs = ['Organization', 'Account', 'Contact', 'Pipeline', 'Custom Objects (2/3)'];

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden -m-4 md:-m-6 lg:-m-8 pt-1">
      {/* Sub-Navigation & Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Sub Tabs & Table */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 py-2.5 flex items-center justify-between">
             {/* Sub Tabs */}
             <div className="flex bg-gray-50/50 p-0.5 rounded-lg border border-gray-100">
               {subTabs.map((sub) => (
                 <button
                   key={sub}
                   onClick={() => setActiveSubTab(sub)}
                   className={`px-3 py-1 rounded-md text-[12px] font-semibold transition-all ${
                     activeSubTab === sub 
                     ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' 
                     : 'text-gray-500 hover:text-gray-700'
                   }`}
                 >
                   {sub}
                 </button>
               ))}
             </div>
          </div>

          {/* Table Search & Action Bar */}
          <div className="px-8 pb-3 flex items-center justify-between gap-4">
            <div className="relative flex-1 group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Search from 112 organization attributes" 
                 className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
               />
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[12px] font-bold hover:bg-indigo-700 transition-all shadow-sm">
                <Plus className="w-3.5 h-3.5" />
                Add Attribute
              </button>
              <button className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm">
                <Filter className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm">
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Attributes Table Content */}
          <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-thin scrollbar-thumb-gray-200">
             <AttributesTable />
          </div>
        </div>

        {/* Right Side: Global Configuration Sidebar */}
        <GlobalConfigSidebar />
      </div>
    </div>
  );
}
