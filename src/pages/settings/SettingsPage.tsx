import { useEffect, useMemo, useState } from 'react';
import { AttributesTabContent } from './AttributesTabContent';
import { GlobalConfigSidebar } from './GlobalConfigSidebar';
import { SettingPlaceholder } from './SettingPlaceholder';
import { ORGANIZATION_ATTRIBUTES } from './organizationAttributes';
import { ACCOUNT_ATTRIBUTES } from './accountAttributes';
import { CONTACT_ATTRIBUTES } from './contactAttributes';
import { OPPORTUNITY_ATTRIBUTES, RISK_ATTRIBUTES } from './pipelineAttributes';
import { apiFetch, ApiError } from '../../lib/apiClient';
import type { AttributeDef } from './attributeConfig';
import type { Customer, Account, Contact, Opportunity, Risk } from '../../features/customers/customersSlice';

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
async function fetchAllPages<T>(endpoint: string): Promise<T[]> {
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
// active" state — `fetcher` is either fetchAllPages (Customer/Account/
// Contact, all genuinely paginated) or a bare apiFetch<T[]> (Opportunity/
// Risk — see OpportunityListView/RiskListView's own docstrings on why
// those two endpoints return a plain array, not a paginated envelope).
function useAllEntities<T>(fetcher: () => Promise<T[]>, entityLabel: string, enabled: boolean) {
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
        const all = await fetcher();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetcher/entityLabel are constant per call site
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
  const [pipelineEntity, setPipelineEntity] = useState<'Opportunities' | 'Risks'>('Opportunities');
  const [searchQuery, setSearchQuery] = useState('');

  const subTabs = ['Organization', 'Account', 'Contact', 'Pipeline', 'Custom Objects (2/3)'];

  const { entities: organizations, isLoading: orgLoading, error: orgError } =
    useAllEntities<Customer>(() => fetchAllPages('/customers/'), 'organization', activeSubTab === 'Organization');
  const { entities: accounts, isLoading: accountLoading, error: accountError } =
    useAllEntities<Account>(() => fetchAllPages('/accounts/'), 'account', activeSubTab === 'Account');
  const { entities: contacts, isLoading: contactLoading, error: contactError } =
    useAllEntities<Contact>(() => fetchAllPages('/contacts/'), 'contact', activeSubTab === 'Contact');
  const { entities: opportunities, isLoading: opportunityLoading, error: opportunityError } =
    useAllEntities<Opportunity>(
      () => apiFetch<Opportunity[]>('/opportunities/'),
      'opportunity',
      activeSubTab === 'Pipeline' && pipelineEntity === 'Opportunities'
    );
  const { entities: risks, isLoading: riskLoading, error: riskError } =
    useAllEntities<Risk>(
      () => apiFetch<Risk[]>('/risks/'),
      'risk',
      activeSubTab === 'Pipeline' && pipelineEntity === 'Risks'
    );

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
  const filteredOpportunityAttributes = useMemo(
    () => filterAttributes(OPPORTUNITY_ATTRIBUTES, searchQuery),
    [searchQuery]
  );
  const filteredRiskAttributes = useMemo(
    () => filterAttributes(RISK_ATTRIBUTES, searchQuery),
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
          ) : activeSubTab === 'Pipeline' ? (
            <>
              {/* Opportunities/Risks — the Pipelines board's own two
                  entities, same sub-tab convention as that board itself
                  (pages/pipelines/PipelinesPage.tsx) rather than one
                  combined list, which would collide on field names
                  (stage/priority/mrr exist, distinctly, on both). */}
              <div className="px-8 pb-3 flex items-center gap-4 border-b border-line-subtle shrink-0">
                <button
                  onClick={() => setPipelineEntity('Opportunities')}
                  className={`pb-2.5 text-[13px] font-bold border-b-2 transition-colors ${pipelineEntity === 'Opportunities' ? 'text-accent border-accent' : 'text-ink-faint border-transparent hover:text-ink-muted'}`}
                >
                  Opportunities
                </button>
                <button
                  onClick={() => setPipelineEntity('Risks')}
                  className={`pb-2.5 text-[13px] font-bold border-b-2 transition-colors ${pipelineEntity === 'Risks' ? 'text-accent border-accent' : 'text-ink-faint border-transparent hover:text-ink-muted'}`}
                >
                  Risks
                </button>
              </div>
              {pipelineEntity === 'Opportunities' ? (
                <AttributesTabContent
                  entityLabel="opportunity"
                  pluralLabel="opportunities"
                  modelName="Opportunity"
                  attributes={filteredOpportunityAttributes}
                  allAttributes={OPPORTUNITY_ATTRIBUTES}
                  entities={opportunities}
                  isLoading={opportunityLoading}
                  error={opportunityError}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              ) : (
                <AttributesTabContent
                  entityLabel="risk"
                  modelName="Risk"
                  attributes={filteredRiskAttributes}
                  allAttributes={RISK_ATTRIBUTES}
                  entities={risks}
                  isLoading={riskLoading}
                  error={riskError}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              )}
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
