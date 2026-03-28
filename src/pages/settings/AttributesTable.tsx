import { useState } from 'react';
import { 
  ChevronDown, MoreHorizontal, 
  GripVertical, Edit3, 
  Mail, Calendar, DollarSign
} from 'lucide-react';

interface Attribute {
  displayName: string;
  name: string;
  description: string;
  type: 'Text' | 'Date' | 'Currency';
  properties: string[];
  usage: number;
  created: string;
}

const customAttributes: Attribute[] = [
  { 
    displayName: 'Name', 
    name: 'name', 
    description: 'Default', 
    type: 'Text', 
    properties: ['Required', 'UI Editable', 'Visible'], 
    usage: 100, 
    created: '14 Nov 10:30 AM' 
  },
  { 
    displayName: 'Address', 
    name: 'address', 
    description: 'Default', 
    type: 'Text', 
    properties: ['UI Editable', 'Visible'], 
    usage: 0, 
    created: '14 Nov 10:30 AM' 
  },
  { 
    displayName: 'Joined Date', 
    name: 'date_joined', 
    description: 'Default', 
    type: 'Date', 
    properties: ['UI Editable', 'Visible'], 
    usage: 24, 
    created: '14 Nov 10:30 AM' 
  },
  { 
    displayName: 'Renewal Date', 
    name: 'renewal_date', 
    description: 'Default', 
    type: 'Date', 
    properties: ['UI Editable', 'Visible'], 
    usage: 53, 
    created: '14 Nov 10:30 AM' 
  },
  { 
    displayName: 'Starting SaaS MRR', 
    name: 'starting_saas_mrr', 
    description: 'Default', 
    type: 'Currency', 
    properties: ['UI Editable', 'Visible'], 
    usage: 14, 
    created: '14 Nov 10:30 AM' 
  },
  { 
    displayName: 'Expansion SaaS MRR', 
    name: 'expansion_saas_mrr', 
    description: 'Default', 
    type: 'Currency', 
    properties: ['Visible'], 
    usage: 100, 
    created: '14 Nov 10:30 AM' 
  },
];

const systemAttributes: Attribute[] = [
  { 
    displayName: 'ID', 
    name: 'id', 
    description: 'System Generated', 
    type: 'Text', 
    properties: ['Required', 'Visible'], 
    usage: 100, 
    created: '14 Nov 10:30 AM' 
  },
  { 
    displayName: 'Created At', 
    name: 'created_at', 
    description: 'System Generated', 
    type: 'Date', 
    properties: ['Visible'], 
    usage: 100, 
    created: '14 Nov 10:30 AM' 
  },
];

export function AttributesTable() {
  return (
    <div className="flex flex-col gap-4">
      <AttributeSection title="Custom Attributes" attributes={customAttributes} defaultOpen={true} />
      <AttributeSection title="System Attributes" attributes={systemAttributes} defaultOpen={false} />
    </div>
  );
}

function AttributeSection({ title, attributes, defaultOpen = true }: { title: string, attributes: Attribute[], defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col border border-gray-100 rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-300">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gray-50/40 border-b border-gray-100 flex items-center gap-2 cursor-pointer hover:bg-gray-100/50 transition-colors group"
      >
        <div className={`transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}>
           <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
        </div>
        <h3 className="text-[12px] font-bold text-gray-700 select-none">{title}</h3>
        <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-bold ml-auto">{attributes.length}</span>
      </div>
      
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/10">
                  <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Display Name</th>
                  <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Attribute Properties</th>
                  <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Created</th>
                  <th className="px-6 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/50">
                {attributes.map((attr, idx) => (
                  <tr key={idx} className="group hover:bg-indigo-50/10 transition-all cursor-default h-11">
                    <td className="px-6 py-1.5">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-3.5 h-3.5 text-gray-200 group-hover:text-gray-300 transition-colors" />
                        <div className="flex flex-col">
                          <span className="text-[12px] font-semibold text-gray-700 flex items-center gap-1.5">
                            {attr.displayName}
                            <Edit3 className="w-2.5 h-2.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-indigo-600" />
                          </span>
                          <span className="text-[10px] font-medium text-gray-400">{attr.description}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-1.5">
                      <span className="text-[11px] font-medium text-gray-500 font-mono">
                        {attr.name}
                      </span>
                    </td>
                    <td className="px-6 py-1.5 text-[11px] font-medium text-gray-400">Default</td>
                    <td className="px-6 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <AttributeTypeIcon type={attr.type} />
                        <span className="text-[11px] font-semibold text-gray-600">{attr.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {attr.properties.map(p => (
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
                        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              attr.usage === 100 ? 'bg-emerald-400' : 'bg-gray-300'
                            }`} 
                            style={{ width: `${attr.usage}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 w-7">{attr.usage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-1.5 text-right whitespace-nowrap">
                      <span className="text-[10px] font-bold text-gray-500 inline-block">{attr.created.split(' ').slice(0, 2).join(' ')}</span>
                      <span className="text-[9px] font-medium text-gray-400 ml-1.5 uppercase">{attr.created.split(' ').slice(2).join(' ')}</span>
                    </td>
                    <td className="px-6 py-1.5">
                      <button className="p-0.5 hover:bg-gray-100 rounded text-gray-400 transition-colors opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttributeTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'Text': return <div className="p-0.5 bg-blue-50/50 text-blue-500 rounded"><Mail className="w-2.5 h-2.5" /></div>;
    case 'Date': return <div className="p-0.5 bg-amber-50/50 text-amber-500 rounded"><Calendar className="w-2.5 h-2.5" /></div>;
    case 'Currency': return <div className="p-0.5 bg-emerald-50/50 text-emerald-500 rounded"><DollarSign className="w-2.5 h-2.5" /></div>;
    default: return null;
  }
}

function getPropertyColor(prop: string) {
  switch (prop) {
    case 'Required': return 'bg-rose-50 text-rose-500 border-rose-100/50';
    case 'UI Editable': return 'bg-blue-50 text-blue-500 border-blue-100/50';
    case 'Visible': return 'bg-orange-50 text-orange-500 border-orange-100/50';
    default: return 'bg-gray-50 text-gray-500 border-gray-100/50';
  }
}
