import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Wand2 } from 'lucide-react';
import { useAppDispatch, useAppSelector, useCapability } from '../../hooks';
import { fetchSkills } from '../../features/skills/skillsSlice';
import type { Skill } from '../../features/skills/skillsSlice';
import { formatDate } from '../../features/customers/formatters';

const compact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K` : String(n);

const OUTCOME: Record<NonNullable<Skill['last_run']>['outcome'], { label: string; tone: string }> = {
  ok: { label: 'ok', tone: 'text-success' },
  failed: { label: 'failed', tone: 'text-danger' },
  unconfigured: { label: 'not configured', tone: 'text-warning' },
  over_budget: { label: 'over budget', tone: 'text-danger' },
};

function List({ title, items, tone }: { title: string; items: string[]; tone?: string }) {
  return (
    <div className="min-w-0">
      <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${tone ?? 'text-ink-faint'}`}>{title}</h4>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => (
          <li key={item} className="text-[12px] text-ink-muted leading-snug">
            · {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SkillCard({ skill }: { skill: Skill }) {
  const share = skill.usage.budget > 0 ? Math.min(100, (skill.usage.spent / skill.usage.budget) * 100) : 0;
  return (
    <article className="bg-surface border border-line-subtle rounded-lg px-4 py-3 flex flex-col gap-3" aria-label={skill.name}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold text-ink">{skill.name}</h3>
          <p className="text-[12.5px] text-ink-muted mt-0.5">{skill.summary}</p>
        </div>
        <div className="text-[11px] text-ink-faint text-right shrink-0">
          <div>
            <span className="text-ink-faint">Runs when </span>
            <span className="text-ink font-medium">{skill.trigger.charAt(0).toLowerCase() + skill.trigger.slice(1)}</span>
          </div>
          <div>
            <span className="text-ink-faint">Shows on </span>
            <Link to={skill.surface.split(' ')[0]} className="text-accent hover:underline font-medium">
              {skill.surface}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <List title="Reads" items={skill.reads} />
        <List title="May" items={skill.may} tone="text-success" />
        <List title="Never" items={skill.never} tone="text-danger" />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap border-t border-line-subtle pt-2 text-[11.5px] text-ink-faint">
        <span>
          <span className="text-ink-faint">Who may ask: </span>
          <span className="text-ink-muted">{skill.gate}</span>
        </span>
        <span className="flex items-center gap-3 tabular-nums">
          <span title={`${skill.usage.calls} calls this month, ${skill.usage.failed} failed`}>
            <span className="text-ink font-semibold">{compact(skill.usage.spent)}</span> of {compact(skill.usage.budget)} tokens ({share.toFixed(0)}%)
            {skill.usage.failed > 0 && <span className="text-danger"> · {skill.usage.failed} failed</span>}
          </span>
          {skill.produced && (
            <span>
              <span className="text-ink font-semibold">{skill.produced.count}</span> {skill.produced.label}
              {skill.produced.approved !== undefined ? ` · ${skill.produced.approved} approved` : ''}
            </span>
          )}
          {skill.last_run ? (
            <span>
              last run {formatDate(skill.last_run.at.slice(0, 10))}
              {skill.last_run.user ? ` by ${skill.last_run.user}` : ''} ·{' '}
              <span className={`font-semibold ${OUTCOME[skill.last_run.outcome].tone}`}>{OUTCOME[skill.last_run.outcome].label}</span>
            </span>
          ) : (
            <span>never run</span>
          )}
        </span>
      </div>
    </article>
  );
}

/**
 * Skills: what the brain's agents may do.
 *
 * The mock page of this name listed invented capabilities. This one is
 * the real catalogue — every purpose a model call can run under, what
 * that agent is given, what it may do with it, what it may never do, who
 * may ask, and where it shows — beside how each has actually been used
 * this month and what it has produced. The catalogue lives in code next
 * to the prompts (services/copilot/skills.py); a new purpose without a
 * description fails a backend test.
 */
export function SkillsPage() {
  const dispatch = useAppDispatch();
  const canSeeAll = useCapability('view_all_accounts');
  const { data, isLoading, error } = useAppSelector((s) => s.skills);

  useEffect(() => {
    if (canSeeAll) dispatch(fetchSkills());
  }, [dispatch, canSeeAll]);

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wand2 className="w-4 h-4 text-accent" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">Company Brain</span>
          </div>
          <h1 className="text-[20px] font-bold text-ink tracking-tight">Skills</h1>
          <p className="text-[13px] text-ink-faint font-medium mt-0.5">
            What each agent is given, what it may do, what it may never do — and how it has been used.
          </p>
        </div>
        {data && (
          <Link to="/brain/agents" className="text-[12px] font-semibold text-accent hover:underline">
            Budgets and the call log →
          </Link>
        )}
      </div>

      {!canSeeAll && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-warning-dim border border-warning/30 text-[12.5px] text-warning">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          The skills catalogue reports organisation-wide usage, which needs the view-all-accounts capability.
        </div>
      )}
      {error && (
        <p className="text-[12.5px] font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
      {isLoading && !data && <p className="text-[12px] text-ink-faint">Loading…</p>}

      {data && (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">
            {data.skills.length} skills · usage since {formatDate(data.month_start)}
          </h2>
          {data.skills.map((skill) => (
            <SkillCard key={skill.purpose} skill={skill} />
          ))}
        </section>
      )}
    </div>
  );
}
