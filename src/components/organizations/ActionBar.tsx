import { Search, Plus } from 'lucide-react';

export function ActionBar({
  search,
  onSearchChange,
  onAddClick,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between w-full mb-4">
      <div className="relative w-[400px]">
        <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name"
          className="w-full pl-9 pr-4 py-[8px] bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent placeholder:text-ink-faint"
        />
      </div>

      <button
        onClick={onAddClick}
        className="flex items-center gap-1.5 px-4 py-[8px] bg-accent hover:bg-accent-hover text-[#0D0F0E] text-[13px] font-semibold rounded-lg shadow-sm transition-colors tracking-wide"
      >
        <Plus className="w-4 h-4" />
        Add Organization
      </button>
    </div>
  );
}
