import { ChevronLeft, ChevronDown, Play } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { formatRelativeTime } from '../../features/customers/formatters';
import { APPLY_TO_LABELS } from './types';
import type { ApplyToTarget } from './types';

interface ScenarioHeaderProps {
  name: string;
  onNameChange: (name: string) => void;
  applyTo: ApplyToTarget;
  onApplyToChange: (target: ApplyToTarget) => void;
  /** Gates On Event auto-execution only — see revenact-backend's
   * Scenario.is_active docstring. Run Now ignores this. */
  isActive: boolean;
  onIsActiveChange: (active: boolean) => void;
  /** Only true once the scenario has been saved at least once (has a
   * real id) and apply_to === 'organizations' — see engine.py's own
   * docstring on why only that target type is runnable in v1. */
  canRun: boolean;
  onRunNowClick: () => void;
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
  isActive,
  onIsActiveChange,
  canRun,
  onRunNowClick,
  onSave,
  onSaveAndClose,
  lastSavedAt,
}: ScenarioHeaderProps) {
  return (
    <header className="h-[64px] border-b border-line-subtle bg-surface flex items-center justify-between px-6 z-20 shrink-0">
      <div className="flex items-center gap-6">
        <NavLink to="/scenarios" className="flex items-center text-ink-faint hover:text-ink transition-colors">
          <ChevronLeft className="w-5 h-5 stroke-[2.5px]" />
        </NavLink>

        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Untitled Scenario"
          aria-label="Scenario name"
          className="text-[17px] font-bold text-ink tracking-tight bg-transparent border border-transparent hover:border-line focus:border-accent rounded-md px-2 py-1 -ml-2 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors min-w-[180px]"
        />

        <div className="h-4 w-px bg-line mt-0.5" />

        <div className="flex items-center gap-6">
          <span className="text-[13px] text-ink-faint font-medium">Apply scenario to:</span>

          <div className="flex items-center gap-4">
            {(Object.keys(APPLY_TO_LABELS) as ApplyToTarget[]).map((option) => (
              <label key={option} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="applyTo"
                  className="hidden"
                  checked={applyTo === option}
                  onChange={() => onApplyToChange(option)}
                />
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                  applyTo === option ? 'border-accent' : 'border-line group-hover:border-line-strong'
                }`}>
                  {applyTo === option && <div className="w-2 h-2 rounded-full bg-accent" />}
                </div>
                <span className={`text-[13px] font-semibold transition-colors ${
                  applyTo === option ? 'text-ink' : 'text-ink-faint group-hover:text-ink-muted'
                }`}>
                  {APPLY_TO_LABELS[option]}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="h-4 w-px bg-line mt-0.5" />

        <label className="flex items-center gap-2.5 cursor-pointer" title="Gates On Event auto-execution — Run Now works either way.">
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            aria-label="Scenario active"
            onClick={() => onIsActiveChange(!isActive)}
            className={`w-8 h-[18px] rounded-full relative transition-colors ${isActive ? 'bg-success' : 'bg-line-strong'}`}
          >
            <span
              className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-surface shadow-sm transition-transform ${
                isActive ? 'translate-x-[16px]' : 'translate-x-[2px]'
              }`}
            />
          </button>
          <span className={`text-[13px] font-semibold ${isActive ? 'text-success' : 'text-ink-faint'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        {lastSavedAt && (
          <span className="text-[12px] text-ink-faint font-medium">
            Saved {formatRelativeTime(lastSavedAt)}
          </span>
        )}

        <button
          onClick={onRunNowClick}
          disabled={!canRun}
          title={canRun ? undefined : 'Save an Organizations scenario first to run it.'}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] text-[13px] font-bold border border-line-strong text-ink-muted hover:bg-subtle transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play className="w-3.5 h-3.5" />
          Run Now
        </button>

        {/* Save button with dropdown */}
        <div className="flex items-center group relative">
          <button
            onClick={onSave}
            className="bg-accent hover:bg-accent-hover text-on-accent flex items-center gap-2 px-4 py-1.5 rounded-l-[6px] text-[13px] font-bold transition-all shadow-sm"
          >
            Save
          </button>
          <details className="relative">
            <summary className="list-none bg-accent hover:bg-accent-hover text-on-accent px-1.5 py-1.5 rounded-r-[6px] border-l border-white/20 transition-all shadow-sm cursor-pointer h-full flex items-center">
              <ChevronDown className="w-4 h-4 stroke-[2.5px]" />
            </summary>
            <div className="absolute right-0 top-full mt-1 bg-surface border border-line-subtle rounded-lg shadow-lg py-1 min-w-[160px] z-30">
              <button
                onClick={onSaveAndClose}
                className="w-full text-left px-3 py-2 text-[13px] font-semibold text-ink-muted hover:bg-subtle transition-colors"
              >
                Save & Close
              </button>
            </div>
          </details>
        </div>

        <NavLink
          to="/scenarios"
          className="bg-surface border border-accent text-accent hover:bg-accent-dim px-4 py-1.5 rounded-[6px] text-[13px] font-bold transition-all shadow-sm"
        >
          Back to List
        </NavLink>
      </div>
    </header>
  );
}
