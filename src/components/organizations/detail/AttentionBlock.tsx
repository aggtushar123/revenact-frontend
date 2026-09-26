import { useId } from 'react';
import { CircleAlert } from 'lucide-react';
import { formatDate } from '../../../features/customers/formatters';
import type { DetailTab } from '../../../features/organizations/detailParams';
import type { PanelKey } from '../../../features/organizations/portfolioFields';
import type { StoryAttention, StoryGroup } from '../../../features/organizations/storyTypes';
import { FOCUS } from '../portfolio/styles';

interface Row {
  key: string;
  tone: string;
  text: string;
  detail?: string;
  action?: () => void;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Needs attention (spec §1.6), shown only when something does. Each row
 *  says what it is in words and, where there is one, goes to it. */
export function AttentionBlock({
  attention,
  onFilter,
  onOpenTab,
  onJump,
}: {
  attention: StoryAttention;
  onFilter: (group: StoryGroup) => void;
  onOpenTab: (tab: DetailTab) => void;
  onJump: (panel: PanelKey) => void;
}) {
  const headingId = useId();
  const { renewal, tickets, overdue_tasks, questions, anomaly } = attention;
  const rows: Row[] = [];
  if (renewal) {
    rows.push({
      key: 'renewal',
      tone: renewal.overdue ? 'text-danger' : 'text-warning',
      text: renewal.overdue ? `Renewal ${-renewal.days}d overdue` : renewal.days === 0 ? 'Renews today' : `Renews in ${renewal.days}d`,
      detail: formatDate(renewal.date),
      action: () => onJump('contract'),
    });
  }
  if (tickets) {
    rows.push({
      key: 'tickets',
      tone: 'text-danger',
      text: plural(tickets.count, 'open High or Critical ticket', 'open High or Critical tickets'),
      detail: `oldest ${tickets.oldest_days}d`,
      action: () => onFilter('tickets'),
    });
  }
  if (overdue_tasks) {
    rows.push({
      key: 'tasks',
      tone: 'text-warning',
      text: plural(overdue_tasks.count, 'overdue task', 'overdue tasks'),
      detail: `oldest ${overdue_tasks.oldest_days}d`,
      action: () => onFilter('tasks'),
    });
  }
  if (questions) {
    rows.push({
      key: 'questions',
      tone: 'text-warning',
      text: plural(questions.count, 'unanswered question', 'unanswered questions'),
      action: () => onOpenTab('knowledge'),
    });
  }
  if (anomaly) {
    // The server already withholds the title from a viewer who does not see
    // everything; the page shows what it sends.
    rows.push({
      key: 'anomaly',
      tone: 'text-warning',
      text: anomaly.title,
      detail: formatDate(anomaly.last_seen_at.slice(0, 10)),
    });
  }
  if (rows.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="rounded-xl bg-surface p-3">
      <h2 id={headingId} className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        Needs attention
      </h2>
      <ul className="flex flex-col">
        {rows.map((row) => {
          const content = (
            <>
              <CircleAlert className={`h-4 w-4 shrink-0 ${row.tone}`} aria-hidden="true" />
              <span className="min-w-0 truncate text-ink">{row.text}</span>
              {row.detail ? (
                <>
                  {' · '}
                  <span className="shrink-0 font-mono-brand text-[11px] tabular-nums text-ink-muted">{row.detail}</span>
                </>
              ) : null}
            </>
          );
          return (
            <li key={row.key}>
              {row.action ? (
                <button
                  type="button"
                  onClick={row.action}
                  className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-1 text-left text-[13px] text-ink-muted hover:bg-subtle active:bg-line-subtle sm:min-h-9 ${FOCUS}`}
                >
                  {content}
                </button>
              ) : (
                <div className="flex min-h-11 items-center gap-2 px-1 text-[13px] text-ink-muted sm:min-h-9">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
