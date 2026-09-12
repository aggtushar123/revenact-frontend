import { useEffect, useState } from 'react';
import { PenLine } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

interface FunctionRow {
  function: string;
  label: string;
  members: number;
  contributors: number;
  contributions: number;
  questions_asked: number;
  questions_answered: number;
  questions_waiting: number;
  avg_days_to_answer: number | null;
}

interface Payload {
  days: number;
  since: string;
  functions: FunctionRow[];
}

/**
 * Is the company writing things down? The brain only knows what people
 * tell it, so this is the honest measure: per function, who contributed,
 * how much, what they were asked, what they answered, what still waits on
 * them, and how long they take. Functions with nobody in them are left
 * out — an empty row for "Other" says nothing.
 */
export function KnowledgeByFunctionPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Payload>('/knowledge/activity/?days=30')
      .then(setData)
      .catch(() => setError('Could not load knowledge activity.'));
  }, []);

  const rows = (data?.functions ?? []).filter((r) => r.members > 0 || r.contributions > 0 || r.questions_asked > 0);

  return (
    <section className="flex flex-col gap-2" aria-label="Knowledge by function">
      <div>
        <h2 className="text-[15px] font-bold text-ink flex items-center gap-2">
          <PenLine className="w-4 h-4 text-accent" />
          Knowledge by function
          {data && <span className="text-[12px] font-semibold text-ink-faint">· last {data.days} days</span>}
        </h2>
        <p className="text-[11.5px] text-ink-faint">
          What each part of the company wrote down about customers, what it was asked, and how fast it answered.
        </p>
      </div>
      {error && (
        <p className="text-[12.5px] font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
      {data && (
        <div className="bg-surface border border-line-subtle rounded-lg overflow-x-auto">
          <table className="w-full text-[12px] border-collapse min-w-[640px]">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                <th className="text-left px-3 py-2">Function</th>
                <th className="text-right px-3 py-2">People</th>
                <th className="text-right px-3 py-2">Contributed</th>
                <th className="text-right px-3 py-2">Notes</th>
                <th className="text-right px-3 py-2">Asked</th>
                <th className="text-right px-3 py-2">Answered</th>
                <th className="text-right px-3 py-2">Waiting</th>
                <th className="text-right px-3 py-2">Days to answer</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const silent = r.members > 0 && r.contributions === 0;
                return (
                  <tr key={r.function} className="border-t border-line-subtle" aria-label={r.label}>
                    <td className="px-3 py-1.5 font-semibold text-ink">{r.label}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-ink-muted">{r.members}</td>
                    <td className={`px-3 py-1.5 text-right tabular-nums ${silent ? 'text-warning font-semibold' : 'text-ink-muted'}`}>
                      {r.contributors}
                      {silent ? ' · nothing yet' : ''}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-ink">{r.contributions}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-ink-muted">{r.questions_asked}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-ink-muted">{r.questions_answered}</td>
                    <td className={`px-3 py-1.5 text-right tabular-nums ${r.questions_waiting > 0 ? 'text-warning font-semibold' : 'text-ink-muted'}`}>{r.questions_waiting}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-ink-muted">{r.avg_days_to_answer === null ? '—' : r.avg_days_to_answer}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
