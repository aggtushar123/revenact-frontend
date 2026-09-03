import { Search, Download, Filter, Settings, UserPlus, Building2 } from 'lucide-react';

interface ActionBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  /** A Customer id as a string, or '' for "All Companies" — matches
   * GET /api/v1/contacts/?company=<customer_id> exactly, so List.tsx
   * can pass this straight through with no name→id lookup. */
  companyFilter: string;
  setCompanyFilter: (val: string) => void;
  /** Every company the tenant has — fetched for real (List.tsx dispatches
   * fetchCustomers for this), not the old hardcoded 3-company mock list. */
  companies: { id: number; name: string }[];
}

export function ActionBar({ searchQuery, setSearchQuery, companyFilter, setCompanyFilter, companies }: ActionBarProps) {
  return (
    <div className="flex items-center justify-between w-full mb-4">
      <div className="flex items-center gap-3 w-full max-w-[600px]">
        <div className="relative w-[400px]">
          <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts by name, email or role"
            className="w-full pl-9 pr-4 py-[8px] bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent placeholder:text-ink-faint"
          />
        </div>

        <div className="relative">
          <Building2 className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="appearance-none w-[180px] pl-9 pr-8 py-[8px] bg-surface border border-line rounded-lg text-[13px] text-ink-muted focus:outline-none focus:border-accent cursor-pointer shadow-sm disabled:bg-subtle"
          >
            <option value="">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="w-4 h-4 text-ink-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-4 py-[8px] bg-accent hover:bg-accent-hover text-[#0D0F0E] text-[13px] font-semibold rounded-lg shadow-sm transition-colors tracking-wide">
          <UserPlus className="w-4 h-4" /> Add Contact
        </button>
        <button className="flex items-center gap-1.5 px-3 py-[8px] bg-accent-dim border border-accent/30 text-accent hover:bg-accent-dim text-[13px] font-semibold rounded-lg shadow-sm transition-colors">
          <Filter className="w-3.5 h-3.5 stroke-[2.5px]" /> Filters
        </button>
        <button className="p-[8px] bg-surface border border-line hover:bg-subtle text-accent rounded-lg shadow-sm transition-colors">
          <Download className="w-4 h-4 stroke-[2px]" />
        </button>
        <button className="p-[8px] bg-surface border border-line hover:bg-subtle text-ink-muted rounded-lg shadow-sm transition-colors">
          <Settings className="w-4 h-4 stroke-[2px]" />
        </button>
      </div>
    </div>
  );
}
