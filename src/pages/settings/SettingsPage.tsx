import { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, Download, Filter
} from 'lucide-react';
import { AttributesTable } from './AttributesTable';
import { GlobalConfigSidebar } from './GlobalConfigSidebar';
import { SettingPlaceholder } from './SettingPlaceholder';
import { ORGANIZATION_ATTRIBUTES } from './organizationAttributes';
import { apiFetch, ApiError } from '../../lib/apiClient';
import type { Customer } from '../../features/customers/customersSlice';

interface CustomersPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: Customer[];
}

export function SettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState('Organization');
  const [searchQuery, setSearchQuery] = useState('');

  const subTabs = ['Organization', 'Account', 'Contact', 'Pipeline', 'Custom Objects (2/3)'];

  // Every organization in the tenant (not just one page) — Usage% below
  // needs the real, whole-tenant fill rate, not just whatever the first
  // page happens to contain. Fetched once per visit to this tab; a real
  // tenant with thousands of organizations would make this expensive,
  // but there's no dedicated backend aggregate for "per-field fill
  // rate" the way CustomerStatsView has for health/NPS/lifecycle (see
  // that view's own docstring) — walking pages client-side is the
  // pragmatic alternative rather than building one just for this.
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeSubTab !== 'Organization') return;
    let cancelled = false;

    async function loadAllCustomers() {
      setIsLoading(true);
      setError(null);
      try {
        const all: Customer[] = [];
        let url: string | undefined = '/customers/';
        while (url) {
          const page: CustomersPage = await apiFetch<CustomersPage>(url);
          all.push(...page.results);
          url = page.next ?? undefined;
        }
        if (!cancelled) setCustomers(all);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Could not load organizations.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadAllCustomers();
    return () => {
      cancelled = true;
    };
  }, [activeSubTab]);

  const filteredAttributes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ORGANIZATION_ATTRIBUTES;
    return ORGANIZATION_ATTRIBUTES.filter(
      (a) => a.displayName.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full bg-surface overflow-hidden -m-4 md:-m-6 lg:-m-8 pt-1">
      {/* Sub-Navigation & Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Sub Tabs & Table */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 py-2.5 flex items-center justify-between">
             {/* Sub Tabs */}
             <div className="flex bg-subtle/50 p-0.5 rounded-lg border border-line-subtle">
               {subTabs.map((sub) => (
                 <button
                   key={sub}
                   onClick={() => setActiveSubTab(sub)}
                   className={`px-3 py-1 rounded-md text-[12px] font-semibold transition-all ${
                     activeSubTab === sub
                     ? 'bg-surface text-accent shadow-sm border border-line-subtle'
                     : 'text-ink-muted hover:text-ink-muted'
                   }`}
                 >
                   {sub}
                 </button>
               ))}
             </div>
          </div>

          {activeSubTab === 'Organization' ? (
            <>
              {/* Table Search & Action Bar */}
              <div className="px-8 pb-3 flex items-center justify-between gap-4">
                <div className="relative flex-1 group">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint group-focus-within:text-accent transition-colors" />
                   <input
                     type="text"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder={`Search from ${ORGANIZATION_ATTRIBUTES.length} organization attributes`}
                     className="w-full pl-9 pr-4 py-1.5 bg-subtle border border-line rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all font-medium"
                   />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled
                    title="Custom fields aren't supported yet — every row here mirrors a real field already on the Customer model."
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-[12px] font-bold shadow-sm opacity-50 cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Attribute
                  </button>
                  <button className="p-1.5 bg-surface border border-line rounded-lg text-ink-muted hover:bg-subtle hover:text-ink transition-all shadow-sm">
                    <Filter className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 bg-surface border border-line rounded-lg text-ink-muted hover:bg-subtle hover:text-ink transition-all shadow-sm">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Attributes Table Content */}
              <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-thin scrollbar-thumb-line">
                 {isLoading && customers.length === 0 ? (
                   <div className="flex items-center justify-center h-full text-[13px] font-medium text-ink-faint">
                     Loading organizations…
                   </div>
                 ) : error ? (
                   <div className="flex items-center justify-center h-full text-[13px] font-medium text-danger">{error}</div>
                 ) : (
                   <AttributesTable customers={customers} attributes={filteredAttributes} />
                 )}
              </div>
            </>
          ) : (
            <SettingPlaceholder title={activeSubTab} />
          )}
        </div>

        {/* Right Side: Global Configuration Sidebar */}
        <GlobalConfigSidebar />
      </div>
    </div>
  );
}
