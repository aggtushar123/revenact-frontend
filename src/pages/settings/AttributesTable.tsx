import { useState } from 'react';
import {
  ChevronDown, MoreHorizontal,
  GripVertical, Edit3,
  Type, Hash, Calendar, DollarSign, ToggleLeft, List as ListIcon, User,
} from 'lucide-react';
import { usagePercent, attributeProperties } from './attributeConfig';
import type { AttributeDef, AttributeType } from './attributeConfig';

export interface AttributesTableProps<T> {
  /** Every record of this entity currently loaded (see SettingsPage's
   * own page-walking fetch) — Usage% below is computed from this, not
   * a fabricated per-row number. */
  entities: T[];
  /** Attributes already filtered by the search box above — this
   * component just renders whatever it's given, split into its own
   * Custom/System sections. Generic over the entity type so this one
   * table serves Organization (Customer) and Account alike — see
   * organizationAttributes.ts/accountAttributes.ts. */
  attributes: AttributeDef<T>[];
}

export function AttributesTable<T>({ entities, attributes }: AttributesTableProps<T>) {
  const customAttributes = attributes.filter((a) => a.isCustom);
  const systemAttributes = attributes.filter((a) => !a.isCustom);

  return (
    <div className="flex flex-col gap-4">
      <AttributeSection title="Custom Attributes" attributes={customAttributes} entities={entities} defaultOpen={true} />
      <AttributeSection title="System Attributes" attributes={systemAttributes} entities={entities} defaultOpen={false} />
    </div>
  );
}

function AttributeSection<T>({
  title,
  attributes,
  entities,
  defaultOpen = true,
}: {
  title: string;
  attributes: AttributeDef<T>[];
  entities: T[];
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col border border-line-subtle rounded-lg overflow-hidden bg-surface shadow-sm transition-all duration-300">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-subtle/40 border-b border-line-subtle flex items-center gap-2 cursor-pointer hover:bg-subtle/50 transition-colors group"
      >
        <div className={`transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}>
           <ChevronDown className="w-4 h-4 text-ink-faint group-hover:text-accent transition-colors" />
        </div>
        <h3 className="text-[12px] font-bold text-ink-muted select-none">{title}</h3>
        <span className="text-[10px] bg-subtle text-ink-faint px-1.5 py-0.5 rounded font-bold ml-auto">{attributes.length}</span>
      </div>

      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-line-subtle bg-subtle/10">
                  <th className="px-6 py-2 text-[10px] font-bold text-ink-faint uppercase tracking-wider">Display Name</th>
                  <th className="px-6 py-2 text-[10px] font-bold text-ink-faint uppercase tracking-wider">Name</th>
                  <th className="px-6 py-2 text-[10px] font-bold text-ink-faint uppercase tracking-wider">Description</th>
                  <th className="px-6 py-2 text-[10px] font-bold text-ink-faint uppercase tracking-wider">Type</th>
                  <th className="px-6 py-2 text-[10px] font-bold text-ink-faint uppercase tracking-wider">Attribute Properties</th>
                  <th className="px-6 py-2 text-[10px] font-bold text-ink-faint uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {attributes.map((attr) => {
                  const usage = usagePercent(attr, entities);
                  const properties = attributeProperties(attr);
                  return (
                    <tr key={attr.name} className="group hover:bg-accent-dim/10 transition-all cursor-default h-11">
                      <td className="px-6 py-1.5">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-3.5 h-3.5 text-ink-faint/50 group-hover:text-ink-faint transition-colors" />
                          <span className="text-[12px] font-semibold text-ink-muted flex items-center gap-1.5">
                            {attr.displayName}
                            <Edit3 className="w-2.5 h-2.5 text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-accent" />
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-1.5">
                        <span className="text-[11px] font-medium text-ink-muted font-mono">
                          {attr.name}
                        </span>
                      </td>
                      <td className="px-6 py-1.5 text-[11px] font-medium text-ink-faint">
                        {attr.isCustom ? 'Default' : 'System Generated'}
                      </td>
                      <td className="px-6 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <AttributeTypeIcon type={attr.type} />
                          <span className="text-[11px] font-semibold text-ink-muted capitalize">{attr.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {properties.map((p) => (
                            <span
                              key={p}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getPropertyColor(p)}`}
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-1.5">
                        <div className="flex items-center gap-2.5 min-w-[100px]">
                          <div className="flex-1 h-1 bg-subtle rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                usage === 100 ? 'bg-success' : 'bg-line-strong'
                              }`}
                              style={{ width: `${usage}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-ink-muted w-7">{usage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-1.5">
                        <button className="p-0.5 hover:bg-subtle rounded text-ink-faint transition-colors opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {attributes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-6 text-center text-[11px] font-medium text-ink-faint">
                      No attributes match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttributeTypeIcon({ type }: { type: AttributeType }) {
  switch (type) {
    case 'text': return <div className="p-0.5 bg-info-dim/50 text-info rounded"><Type className="w-2.5 h-2.5" /></div>;
    case 'number': return <div className="p-0.5 bg-info-dim/50 text-info rounded"><Hash className="w-2.5 h-2.5" /></div>;
    case 'date': return <div className="p-0.5 bg-warning-dim/50 text-warning rounded"><Calendar className="w-2.5 h-2.5" /></div>;
    case 'currency': return <div className="p-0.5 bg-success-dim/50 text-success rounded"><DollarSign className="w-2.5 h-2.5" /></div>;
    case 'boolean': return <div className="p-0.5 bg-accent-dim/50 text-accent rounded"><ToggleLeft className="w-2.5 h-2.5" /></div>;
    case 'select': return <div className="p-0.5 bg-accent-dim/50 text-accent rounded"><ListIcon className="w-2.5 h-2.5" /></div>;
    case 'relation': return <div className="p-0.5 bg-ink-faint/20 text-ink-muted rounded"><User className="w-2.5 h-2.5" /></div>;
    default: return null;
  }
}

function getPropertyColor(prop: string) {
  switch (prop) {
    case 'Required': return 'bg-danger-dim text-danger border-danger/30';
    case 'UI Editable': return 'bg-info-dim text-info border-info/30';
    case 'Visible': return 'bg-warning-dim text-warning border-warning/30';
    default: return 'bg-subtle text-ink-muted border-line-subtle/50';
  }
}
