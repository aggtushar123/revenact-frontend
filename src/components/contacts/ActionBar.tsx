import { Search, Download, Filter, Settings, UserPlus, Building2 } from 'lucide-react';

interface ActionBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  companyFilter: string;
  setCompanyFilter: (val: string) => void;
}

export function ActionBar({ searchQuery, setSearchQuery, companyFilter, setCompanyFilter }: ActionBarProps) {
  const companies = ['All Companies', 'Apple', 'Pizza Hut', 'Kraft Heinz'];

  return (
    <div className="flex items-center justify-between w-full mb-4">
      <div className="flex items-center gap-3 w-full max-w-[600px]">
        <div className="relative w-[400px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts by name, email or role" 
            className="w-full pl-9 pr-4 py-[8px] bg-white border border-gray-200 rounded-lg text-[13px] text-gray-800 focus:outline-none focus:border-indigo-500 placeholder:text-gray-400"
          />
        </div>

        <div className="relative">
          <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={companyFilter || 'All Companies'}
            onChange={(e) => setCompanyFilter(e.target.value === 'All Companies' ? '' : e.target.value)}
            className="appearance-none w-[180px] pl-9 pr-8 py-[8px] bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm disabled:bg-gray-50"
          >
            {companies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-4 py-[8px] bg-[#5850ec] hover:bg-indigo-700 text-white text-[13px] font-semibold rounded-lg shadow-sm transition-colors tracking-wide">
          <UserPlus className="w-4 h-4" /> Add Contact
        </button>
        <button className="flex items-center gap-1.5 px-3 py-[8px] bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 text-[13px] font-semibold rounded-lg shadow-sm transition-colors">
          <Filter className="w-3.5 h-3.5 stroke-[2.5px]" /> Filters
        </button>
        <button className="p-[8px] bg-white border border-gray-200 hover:bg-gray-50 text-indigo-500 rounded-lg shadow-sm transition-colors">
          <Download className="w-4 h-4 stroke-[2px]" />
        </button>
        <button className="p-[8px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg shadow-sm transition-colors">
          <Settings className="w-4 h-4 stroke-[2px]" />
        </button>
      </div>
    </div>
  );
}
