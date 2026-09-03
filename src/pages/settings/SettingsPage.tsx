import { useEffect, useMemo, useState } from 'react';
import { AttributesTabContent } from './AttributesTabContent';
import { GlobalConfigSidebar } from './GlobalConfigSidebar';
import { SettingPlaceholder } from './SettingPlaceholder';
import { ORGANIZATION_ATTRIBUTES } from './organizationAttributes';
import { ACCOUNT_ATTRIBUTES } from './accountAttributes';
import { CONTACT_ATTRIBUTES } from './contactAttributes';
import { apiFetch, ApiError } from '../../lib/apiClient';
import type { AttributeDef } from './attributeConfig';
import type { Customer, Account, Contact } from '../../features/customers/customersSlice';

interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Walks every page of the given endpoint — Usage% needs the real,
// whole-tenant fill rate, not just whatever the first page happens to
// contain. There's no dedicated backend aggregate for "per-field fill
// rate" the way CustomerStatsView/AccountStatsView/ContactStatsView
// have for health/NPS/lifecycle/sentiment, so this walks pages client-
// side as the pragmatic alternative rather than building one just for
// this settings page. Fine at dev-tenant scale; a tenant with
// thousands of records would make this an expensive one-time fetch
// per visit to the tab.
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

// One entity's own "every record, loaded once while its sub-tab is
// active" state — factored out once a third sub-tab (Contact) needed
// the exact same load/loading/error dance as Organization/Account.
function useAllEntities<T>(endpoint: string, entityLabel: string, enabled: boolean) {
  const [entities, setEntities] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const all = await fetchAll<T>(endpoint);
        if (!cancelled) setEntities(all);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : `Could not load ${entityLabel}s.`);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- endpoint/entityLabel are constant per call site
  }, [enabled]);

  return { entities, isLoading, error };
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

  const { entities: organizations, isLoading: orgLoading, error: orgError } =
    useAllEntities<Customer>('/customers/', 'organization', activeSubTab === 'Organization');
  const { entities: accounts, isLoading: accountLoading, error: accountError } =
    useAllEntities<Account>('/accounts/', 'account', activeSubTab === 'Account');
  const { entities: contacts, isLoading: contactLoading, error: contactError } =
    useAllEntities<Contact>('/contacts/', 'contact', activeSubTab === 'Contact');

  const filteredOrgAttributes = useMemo(
    () => filterAttributes(ORGANIZATION_ATTRIBUTES, searchQuery),
    [searchQuery]
  );
  const filteredAccountAttributes = useMemo(
    () => filterAttributes(ACCOUNT_ATTRIBUTES, searchQuery),
    [searchQuery]
  );
  const filteredContactAttributes = useMemo(
    () => filterAttributes(CONTACT_ATTRIBUTES, searchQuery),
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
          ) : activeSubTab === 'Contact' ? (
            <AttributesTabContent
              entityLabel="contact"
              modelName="Contact"
              attributes={filteredContactAttributes}
              allAttributes={CONTACT_ATTRIBUTES}
              entities={contacts}
              isLoading={contactLoading}
              error={contactError}
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
