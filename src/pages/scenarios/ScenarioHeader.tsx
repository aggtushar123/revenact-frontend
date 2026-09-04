import { ChevronLeft, ChevronDown } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { formatRelativeTime } from '../../features/customers/formatters';
import type { ApplyToTarget } from './types';

interface ScenarioHeaderProps {
  name: string;
  onNameChange: (name: string) => void;
  applyTo: ApplyToTarget;
  onApplyToChange: (target: ApplyToTarget) => void;
  /** Saves in place — stays on the builder. */
  onSave: () => void;
  /** Saves, then returns to the scenarios list. */
  onSaveAndClose: () => void;
  /** Null until the first save this visit (a brand new, never-saved
   * scenario) or on load for an existing one. */
  lastSavedAt: string | null;
}

export function ScenarioHeader({
  name,
  onNameChange,
  applyTo,
  onApplyToChange,
  onSave,
  onSaveAndClose,
  lastSavedAt,
}: ScenarioHeaderProps) {
  return (
    <header className="h-[64px] border-b border-gray-100 bg-white flex items-center justify-between px-6 z-20 shrink-0">
      <div className="flex items-center gap-6">
        <NavLink to="/scenarios" className="flex items-center text-gray-400 hover:text-gray-900 transition-colors">
          <ChevronLeft className="w-5 h-5 stroke-[2.5px]" />
        </NavLink>

        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Untitled Scenario"
          aria-label="Scenario name"
          className="text-[17px] font-bold text-gray-800 tracking-tight bg-transparent border border-transparent hover:border-gray-200 focus:border-rose-500 rounded-md px-2 py-1 -ml-2 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-colors min-w-[180px]"
        />

        <div className="h-4 w-px bg-gray-200 mt-0.5" />

        <div className="flex items-center gap-6">
          <span className="text-[13px] text-gray-400 font-medium">Apply scenario to:</span>

          <div className="flex items-center gap-4">
            {(['Organizations', 'Accounts', 'Contacts'] as const).map((option) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="applyTo"
                  className="hidden"
                  checked={applyTo === option}
                  onChange={() => onApplyToChange(option)}
                />
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                  applyTo === option ? 'border-blue-500' : 'border-gray-200 group-hover:border-gray-300'
                }`}>
                  {applyTo === option && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <span className={`text-[13px] font-semibold transition-colors ${
                  applyTo === option ? 'text-gray-800' : 'text-gray-400 group-hover:text-gray-500'
                }`}>
                  {option}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {lastSavedAt && (
          <span className="text-[12px] text-gray-400 font-medium">
            Saved {formatRelativeTime(lastSavedAt)}
          </span>
        )}

        {/* Save button with dropdown */}
        <div className="flex items-center group relative">
          <button
            onClick={onSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-4 py-1.5 rounded-l-[6px] text-[13px] font-bold transition-all shadow-sm"
          >
            Save
          </button>
          <details className="relative">
            <summary className="list-none bg-indigo-600 hover:bg-indigo-700 text-white px-1.5 py-1.5 rounded-r-[6px] border-l border-white/20 transition-all shadow-sm cursor-pointer h-full flex items-center">
              <ChevronDown className="w-4 h-4 stroke-[2.5px]" />
            </summary>
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg py-1 min-w-[160px] z-30">
              <button
                onClick={onSaveAndClose}
                className="w-full text-left px-3 py-2 text-[13px] font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Save & Close
              </button>
            </div>
          </details>
        </div>

        <NavLink
          to="/scenarios"
          className="bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-4 py-1.5 rounded-[6px] text-[13px] font-bold transition-all shadow-sm"
        >
          Back to List
        </NavLink>
      </div>
    </header>
  );
}
