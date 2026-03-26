import React, { useState } from 'react';
import { Search, GripVertical, Trash2, Settings } from 'lucide-react';
import type { ColumnDef, ColumnId } from './tableData';

interface Props {
  allColumns: ColumnDef[];
  visibleColumns: ColumnId[];
  setVisibleColumns: React.Dispatch<React.SetStateAction<ColumnId[]>>;
  onClose: () => void;
  style?: React.CSSProperties;
}

export function EditColumnsPopover({ allColumns, visibleColumns, setVisibleColumns, onClose, style }: Props) {
  const [search, setSearch] = useState('');

  // The organization column is compulsory and assumed to always be the 0th item visible,
  // we filter it out of the editable list to perfectly match standard behavior.
  const editableColumns = allColumns.filter(c => !c.isCompulsory);
  
  const filteredColumns = editableColumns.filter(c => 
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleColumn = (id: ColumnId, isVisible: boolean) => {
    if (isVisible) {
      setVisibleColumns(prev => prev.filter(colId => colId !== id));
    } else {
      // Add back at the end
      setVisibleColumns(prev => [...prev, id]);
    }
  };

  const removeAll = () => {
    // Keep only compuslory
    const compulsory = allColumns.filter(c => c.isCompulsory).map(c => c.id);
    setVisibleColumns(compulsory);
  };

  return (
    <>
      {/* Click outside overlay */}
      <div className="fixed inset-0 z-[100]" onClick={onClose} />
      
      <div 
        className="absolute z-[110] bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200 w-[280px] flex flex-col pointer-events-auto"
        style={style}
      >
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-gray-600 font-semibold text-[13px]">
            Edit Columns ({visibleColumns.length}/{allColumns.length})
          </h3>
        </div>

        <div className="p-3">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search Columns"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-[13px] outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-0.5 max-h-[320px] overflow-y-auto custom-scrollbar -mx-1 px-1">
            {filteredColumns.map(col => {
              const isVisible = visibleColumns.includes(col.id);
              
              // In the mockup, some hidden fields like "CES Percentage" show a ⚙ settings icon instead of trash
              // when we hover or when they are in the list. To match visually, if it is hidden,
              // maybe we show a plus to add it? The mockup shows `Trash2` for active ones.
              // Let's stick to Trash2 for visible, Plus for hidden. Or Settings for specific ones.
              const isSystem = col.id === 'cesPercentage' || col.id.startsWith('churn');
              
              return (
                <div 
                  key={col.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${isVisible ? 'hover:bg-gray-50' : 'opacity-60 hover:opacity-100 hover:bg-indigo-50/50'}`}
                >
                  <GripVertical className="w-3.5 h-3.5 text-gray-300 cursor-grab shrink-0" />
                  <span className={`text-[13px] flex-1 truncate ${isVisible ? 'text-gray-700' : 'text-gray-500'}`}>
                    {col.label}
                  </span>
                  
                  {isVisible ? (
                    <button onClick={() => toggleColumn(col.id, true)} className="p-1 hover:bg-red-50 text-red-300 hover:text-red-500 rounded transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button onClick={() => toggleColumn(col.id, false)} className="p-1 hover:bg-indigo-100 text-gray-400 hover:text-indigo-600 rounded transition-colors shrink-0">
                      {isSystem ? <Settings className="w-3.5 h-3.5" /> : <div className="text-lg leading-none font-medium mb-[2px]">+</div>}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 rounded-b-lg flex justify-end">
          <button 
            onClick={removeAll}
            className="text-[12px] font-semibold text-red-500 hover:text-red-600 hover:underline transition-all"
          >
            Remove All
          </button>
        </div>
      </div>
    </>
  );
}
