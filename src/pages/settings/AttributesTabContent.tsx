import { Search, Plus, Download, Filter } from 'lucide-react';
import { AttributesTable } from './AttributesTable';
import type { AttributeDef } from './attributeConfig';

export interface AttributesTabContentProps<T> {
  /** Lowercase noun used in the search placeholder — "organization"/
   * "account"/"opportunity". */
  entityLabel: string;
  /** Lowercase plural, for the loading text — defaults to
   * `${entityLabel}s`, which is wrong for "opportunity" (not
   * "opportunitys"), so that one passes "opportunities" explicitly. */
  pluralLabel?: string;
  /** The real backend model name this mirrors, shown in the disabled
   * Add Attribute button's own tooltip — "Customer"/"Account". */
  modelName: string;
  /** Already filtered by `searchQuery` — see SettingsPage's own
   * per-entity useMemo. */
  attributes: AttributeDef<T>[];
  /** Unfiltered, just for the search placeholder's total count. */
  allAttributes: AttributeDef<T>[];
  entities: T[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}

// Shared search bar + action bar + AttributesTable chrome for every
// entity's own Data sub-tab (Organization first, Account next — see
// organizationAttributes.ts/accountAttributes.ts) — split out so
// SettingsPage.tsx doesn't carry two copies of the same JSX, one per
// entity.
export function AttributesTabContent<T>({
  entityLabel,
  pluralLabel = `${entityLabel}s`,
  modelName,
  attributes,
  allAttributes,
  entities,
  isLoading,
  error,
  searchQuery,
  setSearchQuery,
}: AttributesTabContentProps<T>) {
  return (
    <>
      {/* Table Search & Action Bar */}
      <div className="px-8 pb-3 flex items-center justify-between gap-4">
        <div className="relative flex-1 group">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint group-focus-within:text-accent transition-colors" />
           <input
             type="text"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder={`Search from ${allAttributes.length} ${entityLabel} attributes`}
             className="w-full pl-9 pr-4 py-1.5 bg-subtle border border-line rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all font-medium"
           />
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled
            title={`Custom fields aren't supported yet — every row here mirrors a real field already on the ${modelName} model.`}
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
         {isLoading && entities.length === 0 ? (
           <div className="flex items-center justify-center h-full text-[13px] font-medium text-ink-faint">
             Loading {pluralLabel}…
           </div>
         ) : error ? (
           <div className="flex items-center justify-center h-full text-[13px] font-medium text-danger">{error}</div>
         ) : (
           <AttributesTable entities={entities} attributes={attributes} />
         )}
      </div>
    </>
  );
}
