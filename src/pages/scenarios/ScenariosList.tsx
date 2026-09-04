import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../components/organizations/ConfirmDialog';
import { formatRelativeTime } from '../../features/customers/formatters';
import { deleteScenario, listScenarios } from './scenarioStorage';
import type { Scenario } from './types';

// Scenarios live only in this browser's own localStorage (see
// scenarioStorage.ts's own docstring — there's no backend for this at
// all), so unlike every other list page in this app, there's no fetch:
// reading localStorage is synchronous, and `refresh` below just re-
// reads it after a create/delete rather than awaiting anything.
export function ScenariosList() {
  const navigate = useNavigate();
  // Reading localStorage is synchronous — a lazy initializer, not an
  // effect, is enough (no fetch to await the way every other list page
  // in this app has).
  const [scenarios, setScenarios] = useState<Scenario[]>(() => listScenarios());
  const [deleteTarget, setDeleteTarget] = useState<Scenario | null>(null);

  const refresh = () => setScenarios(listScenarios());

  return (
    <div className="flex flex-col h-full w-full bg-surface text-ink p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[20px] font-bold text-ink tracking-tight">Scenarios</h1>
          <p className="text-[13px] text-ink-faint font-medium mt-0.5">
            Saved in this browser only — see each scenario's own builder for why.
          </p>
        </div>
        <button
          onClick={() => navigate('/scenarios/create')}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-[13px] font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Scenario
        </button>
      </div>

      <div className="flex-1 overflow-hidden bg-surface rounded-xl border border-line-subtle shadow-sm">
        {scenarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-24 text-center gap-2">
            <GitBranch className="w-10 h-10 text-ink-faint opacity-40 mb-2" />
            <p className="text-[14px] font-semibold text-ink-muted">No scenarios yet.</p>
            <p className="text-[12.5px] text-ink-faint max-w-xs">
              Build a flow with triggers, conditions, and actions, then save it here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-subtle/40 border-b border-line-subtle">
                <th className="px-6 py-3 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Applies To</th>
                <th className="px-6 py-3 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Nodes</th>
                <th className="px-6 py-3 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {scenarios.map((scenario) => (
                <tr
                  key={scenario.id}
                  onClick={() => navigate(`/scenarios/${scenario.id}`)}
                  className="group hover:bg-accent-dim/10 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-accent-dim text-accent rounded-lg">
                        <GitBranch className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[13.5px] font-bold text-ink group-hover:text-accent transition-colors">
                        {scenario.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-[13px] font-medium text-ink-muted">{scenario.applyTo}</td>
                  <td className="px-6 py-3.5 text-[13px] font-medium text-ink-muted">{scenario.nodes.length}</td>
                  <td className="px-6 py-3.5 text-[13px] font-medium text-ink-muted">
                    {formatRelativeTime(scenario.updatedAt)}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(scenario);
                      }}
                      aria-label={`Delete ${scenario.name}`}
                      className="p-1.5 hover:bg-subtle rounded-md text-ink-faint opacity-0 group-hover:opacity-100 hover:text-danger transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete ${deleteTarget.name}?`}
          message="This can't be undone — it's removed from this browser's own saved scenarios."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            deleteScenario(deleteTarget.id);
            refresh();
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
