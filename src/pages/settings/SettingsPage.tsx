import { useEffect, useMemo, useState } from 'react';
import { AttributesTabContent } from './AttributesTabContent';
import { GlobalConfigSidebar } from './GlobalConfigSidebar';
import { SettingPlaceholder } from './SettingPlaceholder';
import { ORGANIZATION_ATTRIBUTES } from './organizationAttributes';
import { ACCOUNT_ATTRIBUTES } from './accountAttributes';
import { apiFetch, ApiError } from '../../lib/apiClient';
import type { AttributeDef } from './attributeConfig';
import type { Customer, Account } from '../../features/customers/customersSlice';

interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Walks every page of the given endpoint — Usage% needs the real,
// whole-tenant fill rate, not just whatever the first page happens to
// contain. There's no dedicated backend aggregate for "per-field fill
// rate" the way CustomerStatsView/AccountStatsView have for health/
// NPS/lifecycle, so this walks pages client-side as the pragmatic
// alternative rather than building one just for this settings page.
// Fine at dev-tenant scale; a tenant with thousands of records would
// make this an expensive one-time fetch per visit to the tab.
async function fetchAll<T>(endpoint: string): Promise<T[]> {
  const all: T[] = [];
  let url: string | undefined = endpoint;
  while (url) {
    const page: Page<T> = await apiFetch<Page<T>>(url);
    all.push(...page.results);
    url = page.next ?? undefined;
  }
  return all;
}

function filterAttributes<T>(attributes: AttributeDef<T>[], query: string): AttributeDef<T>[] {
  const q = query.trim().toLowerCase();
  if (!q) return attributes;
  return attributes.filter(
    (a) => a.displayName.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
  );
}

export function SettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState('Organization');
  const [searchQuery, setSearchQuery] = useState('');

  const subTabs = ['Organization', 'Account', 'Contact', 'Pipeline', 'Custom Objects (2/3)'];

  const [organizations, setOrganizations] = useState<Customer[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  useEffect(() => {
    if (activeSubTab !== 'Organization') return;
    let cancelled = false;

    async function loadAllOrganizations() {
      setOrgLoading(true);
      setOrgError(null);
      try {
        const all = await fetchAll<Customer>('/customers/');
        if (!cancelled) setOrganizations(all);
      } catch (err) {
        if (!cancelled) setOrgError(err instanceof ApiError ? err.message : 'Could not load organizations.');
      } finally {
        if (!cancelled) setOrgLoading(false);
      }
    }

    loadAllOrganizations();
    return () => {
      cancelled = true;
    };
  }, [activeSubTab]);

  useEffect(() => {
    if (activeSubTab !== 'Account') return;
    let cancelled = false;

    async function loadAllAccounts() {
      setAccountLoading(true);
      setAccountError(null);
      try {
        const all = await fetchAll<Account>('/accounts/');
        if (!cancelled) setAccounts(all);
      } catch (err) {
        if (!cancelled) setAccountError(err instanceof ApiError ? err.message : 'Could not load accounts.');
      } finally {
        if (!cancelled) setAccountLoading(false);
      }
    }

    loadAllAccounts();
    return () => {
      cancelled = true;
    };
  }, [activeSubTab]);

  const filteredOrgAttributes = useMemo(
    () => filterAttributes(ORGANIZATION_ATTRIBUTES, searchQuery),
    [searchQuery]
  );
  const filteredAccountAttributes = useMemo(
    () => filterAttributes(ACCOUNT_ATTRIBUTES, searchQuery),
    [searchQuery]
  );

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
            <AttributesTabContent
              entityLabel="organization"
              modelName="Customer"
              attributes={filteredOrgAttributes}
              allAttributes={ORGANIZATION_ATTRIBUTES}
              entities={organizations}
              isLoading={orgLoading}
              error={orgError}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          ) : activeSubTab === 'Account' ? (
            <AttributesTabContent
              entityLabel="account"
              modelName="Account"
              attributes={filteredAccountAttributes}
              allAttributes={ACCOUNT_ATTRIBUTES}
              entities={accounts}
              isLoading={accountLoading}
              error={accountError}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
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
