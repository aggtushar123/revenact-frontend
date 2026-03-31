import { useState } from 'react';
import { Maximize2, ChevronLeft, Search, Pencil, Mail } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

export type AttributeType = 'text' | 'dot' | 'pulse' | 'owner' | 'truncated';

export interface AttributeDef {
  label: string;
  value: string;
  type?: AttributeType;
  /** Tailwind class like 'bg-teal-400' — used when type='dot' */
  dotColor?: string;
  /** Initials / letter for the avatar circle — used when type='owner' */
  ownerAvatar?: string;
}

export interface PinnedAttributesProps {
  /** Shown in the "expand" modal title: "All Attributes — {entityName}" */
  entityName: string;
  /** Ordered list of attribute fields to render */
  attributes: AttributeDef[];
  /** Called when the user clicks the collapse (←) icon */
  onCollapse?: () => void;
  /** Called when the user clicks the expand (⤢) icon */
  onExpand?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function PinnedAttributes({ entityName, attributes, onCollapse, onExpand }: PinnedAttributesProps) {
  const [activeSubTab, setActiveSubTab] = useState('Pinned Attributes');
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? attributes.filter(a => a.label.toLowerCase().includes(search.toLowerCase()) || a.value.toLowerCase().includes(search.toLowerCase()))
    : attributes;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Sub-tab header */}
      <div className="px-4 pt-2 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex gap-4">
          {['Pinned Attributes', 'Summary'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`pb-2.5 text-[13px] font-semibold transition-all relative ${activeSubTab === tab ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {tab}
              {activeSubTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pb-2">
          <Maximize2
            className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
            onClick={onExpand}
          />
          <ChevronLeft
            className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
            onClick={onCollapse}
          />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
        {activeSubTab === 'Pinned Attributes' ? (
          <>
            <div className="flex items-center justify-between text-[12px]">
              <button className="text-indigo-600 font-semibold hover:underline">View All</button>
              <Pencil className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search Attributes"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="flex flex-col gap-4 py-2">
              {filtered.map((attr, idx) => (
                <AttributeField key={`${attr.label}-${idx}`} attr={attr} />
              ))}
              {filtered.length === 0 && (
                <p className="text-[12px] text-gray-400 text-center py-4">No attributes match your search.</p>
              )}
            </div>
          </>
        ) : (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No summary for {entityName}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Field renderer — handles all attribute types ────────────────────────────

function AttributeField({ attr }: { attr: AttributeDef }) {
  const type = attr.type ?? 'text';

  if (type === 'pulse') {
    return (
      <div className="flex flex-col gap-1.5 pt-1">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{attr.label}</span>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#00a699] shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'owner') {
    return (
      <div className="flex flex-col gap-2 pt-1">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{attr.label}</span>
        <div className="flex items-center gap-3 group/owner cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-500 uppercase overflow-hidden">
            {attr.ownerAvatar || attr.value.charAt(0)}
          </div>
          <span className="text-[13px] font-semibold text-gray-700 group-hover/owner:text-indigo-600 transition-colors uppercase">
            {attr.value}
          </span>
          <div className="ml-auto w-5 h-5 flex items-center justify-center rounded-md text-red-400">
            <Mail className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{attr.label}</span>
      <div className="flex items-center gap-2">
        {type === 'dot' && attr.dotColor && (
          <div className={`w-2 h-2 rounded-full ${attr.dotColor}`} />
        )}
        <span className={`text-[13.5px] font-semibold text-gray-900 ${type === 'truncated' ? 'line-clamp-2 leading-relaxed' : ''}`}>
          {attr.value}
        </span>
      </div>
    </div>
  );
}
