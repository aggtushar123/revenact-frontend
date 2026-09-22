// The AI-filled attributes of one company, under its pinned attributes.
//
// Each row is the model's latest answer to an admin's question (see
// revenact-backend services/attributes): the value, why it thinks so with
// the records it cited, the history of answers and corrections, an inline
// override, and a refresh that asks the model again for this company.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, History, Info, Pencil, RefreshCw, Settings2, Sparkles, X } from 'lucide-react';
import { fetchHistory, fetchValues, fillAttribute, overrideValue } from '../../features/attributes/attributesApi';
import { displayValue } from '../../features/attributes/types';
import type { AIAttributeValue, AttributeBrief, AttributeValue, AttributeWithLatest, CompanyRef } from '../../features/attributes/types';
import { hrefOf } from '../../pages/copilot/sourceHref';
import { ApiError } from '../../lib/apiClient';

export interface AIAttributesPanelProps {
  customerId?: number;
  accountId?: number;
}

type Open = 'why' | 'history' | 'edit' | null;

function errorText(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function AIAttributesPanel({ customerId, accountId }: AIAttributesPanelProps) {
  const company: CompanyRef | null = customerId ? { customerId } : accountId ? { accountId } : null;
  const [rows, setRows] = useState<AttributeWithLatest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!customerId && !accountId) return;
    const target: CompanyRef = customerId ? { customerId } : { accountId: accountId as number };
    let cancelled = false;
    fetchValues(target)
      .then((next) => {
        if (cancelled) return;
        // A wrong shape must not take the company page down with it.
        if (!Array.isArray(next)) throw new Error('unexpected response');
        setRows(next);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, 'Could not load AI attributes.'));
      });
    return () => {
      cancelled = true;
    };
  }, [customerId, accountId, attempt]);

  if (!company) return null;

  function replace(attributeId: number, latest: AIAttributeValue) {
    setRows((current) => current?.map((row) => (row.attribute.id === attributeId ? { ...row, latest } : row)) ?? current);
  }

  return (
    <section aria-label="AI attributes" className="flex flex-col gap-3 pt-2 border-t border-line-subtle">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          AI attributes
        </span>
        <Link to="/settings/ai-attributes" className="p-1 rounded-md text-ink-faint hover:text-ink hover:bg-subtle" aria-label="Manage AI attributes">
          <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      {error ? (
        <p className="text-[12px] text-danger">
          {error}{' '}
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className="underline">Retry</button>
        </p>
      ) : rows === null ? (
        <div className="flex flex-col gap-2" role="status" aria-label="Loading AI attributes">
          <div className="h-3 w-24 rounded bg-subtle animate-pulse" />
          <div className="h-4 w-40 rounded bg-subtle animate-pulse" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-[12px] text-ink-faint">
          No AI attributes yet.{' '}
          <Link to="/settings/ai-attributes" className="text-accent hover:underline">Define one in Settings</Link>
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <AttributeRow key={row.attribute.id} row={row} company={company} onChange={(latest) => replace(row.attribute.id, latest)} />
          ))}
        </div>
      )}
    </section>
  );
}

function AttributeRow({ row, company, onChange }: { row: AttributeWithLatest; company: CompanyRef; onChange: (latest: AIAttributeValue) => void }) {
  const { attribute, latest } = row;
  const [open, setOpen] = useState<Open>(null);
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [history, setHistory] = useState<AIAttributeValue[] | null>(null);

  const shown = latest ? displayValue(attribute.value_type, latest.value) : '';
  const empty = !latest ? 'Not filled yet' : latest.status === 'insufficient' ? 'Not enough evidence' : latest.status === 'failed' ? 'Could not answer' : '';

  function toggle(which: Open) {
    setRowError(null);
    setOpen((current) => (current === which ? null : which));
  }

  async function showHistory() {
    if (open === 'history') return setOpen(null);
    setOpen('history');
    setHistory(null);
    try {
      setHistory(await fetchHistory(attribute.id, company));
    } catch (err) {
      setRowError(errorText(err, 'Could not load the history.'));
    }
  }

  async function refresh() {
    setBusy(true);
    setRowError(null);
    try {
      onChange(await fillAttribute(attribute.id, company));
      setOpen(null);
    } catch (err) {
      setRowError(errorText(err, 'Could not ask the Copilot.'));
    } finally {
      setBusy(false);
    }
  }

  async function save(value: AttributeValue) {
    setBusy(true);
    setRowError(null);
    try {
      onChange(await overrideValue(attribute.id, company, value));
      setOpen(null);
    } catch (err) {
      setRowError(errorText(err, 'Could not save.'));
    } finally {
      setBusy(false);
    }
  }

  const iconButton = 'p-1 rounded-md text-ink-faint hover:text-ink hover:bg-subtle disabled:opacity-50 transition-colors duration-[var(--dur-fast)]';

  return (
    <article className="flex flex-col gap-1">
      <span className="text-[11px] font-bold text-ink-faint uppercase tracking-wider">{attribute.name}</span>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {shown ? (
            <span className={`text-[13.5px] font-semibold text-ink ${attribute.value_type === 'number' ? 'font-mono-brand tabular-nums' : ''}`}>{shown}</span>
          ) : (
            <span className="text-[13px] text-ink-faint">{empty}</span>
          )}
          {latest ? (
            <p className="text-[11px] text-ink-faint mt-0.5">
              <span>{latest.origin === 'human' ? `Set by ${latest.set_by?.name ?? 'a colleague'}` : 'AI'}</span>
              <span> · {shortDate(latest.computed_at)}</span>
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {latest && (latest.reasoning || latest.hidden_sources > 0) ? (
            <button type="button" onClick={() => toggle('why')} aria-expanded={open === 'why'} aria-label={`Why ${shown || 'this'}?`} className={iconButton}>
              <Info className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          ) : null}
          <button type="button" onClick={showHistory} aria-expanded={open === 'history'} aria-label={`History of ${attribute.name}`} className={iconButton}>
            <History className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => toggle('edit')} aria-expanded={open === 'edit'} aria-label={`Edit ${attribute.name}`} className={iconButton}>
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button type="button" onClick={refresh} disabled={busy} aria-label={`Refresh ${attribute.name}`} className={iconButton}>
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {rowError ? <p className="text-[12px] text-danger" role="alert">{rowError}</p> : null}

      {open === 'why' && latest ? (
        <div className="mt-1 rounded-lg bg-subtle px-3 py-2 text-[12px] text-ink leading-relaxed">
          {latest.reasoning ? <p>{latest.reasoning}</p> : null}
          {latest.hidden_sources > 0 ? (
            <p className="text-ink-faint">
              {latest.hidden_sources === 1 ? 'Based on 1 record you cannot see.' : `Based on ${latest.hidden_sources} records you cannot see.`}
              {latest.reasoning ? '' : ' The reasoning quotes it, so it is withheld.'}
            </p>
          ) : null}
          {latest.sources.length ? (
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Sources">
              {latest.sources.map((source) => (
                <li key={`${source.type}:${source.id}`}>
                  <Link to={hrefOf(source)} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface border border-line-subtle text-[11.5px] text-ink hover:bg-line-subtle">
                    <span className="uppercase text-[9.5px] font-bold text-ink-faint">{source.type}</span>
                    <span className="truncate max-w-[160px]">{source.label}</span>
                    <span className="text-ink-faint">{source.date}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {open === 'history' ? (
        history === null && !rowError ? (
          <p className="text-[12px] text-ink-faint" role="status">Loading history…</p>
        ) : history ? (
          <ul aria-label={`History of ${attribute.name}`} className="mt-1 flex flex-col divide-y divide-line-subtle rounded-lg bg-subtle px-3">
            {history.length === 0 ? <li className="py-2 text-[12px] text-ink-faint">Nothing yet.</li> : null}
            {history.map((entry) => (
              <li key={entry.id} className="py-2 flex items-center justify-between gap-2 text-[12px]">
                <span className={entry.value === null ? 'text-ink-faint' : 'text-ink font-semibold'}>
                  {displayValue(attribute.value_type, entry.value) || (entry.status === 'insufficient' ? 'Not enough evidence' : 'Could not answer')}
                </span>
                <span className="text-ink-faint whitespace-nowrap">
                  {entry.origin === 'human' ? entry.set_by?.name ?? 'Person' : 'AI'} · {shortDate(entry.computed_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : null
      ) : null}

      {open === 'edit' ? (
        <OverrideForm attribute={attribute} current={latest?.value ?? null} busy={busy} onSave={save} onCancel={() => setOpen(null)} />
      ) : null}
    </article>
  );
}

function OverrideForm({ attribute, current, busy, onSave, onCancel }: { attribute: AttributeBrief; current: AttributeValue; busy: boolean; onSave: (value: AttributeValue) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<string>(current === null ? '' : String(current));
  const id = `attr-${attribute.id}`;
  const input = 'w-full px-2.5 py-1.5 bg-surface border border-line rounded-md text-[13px] text-ink focus:outline-none focus:border-line-strong';

  function value(): AttributeValue {
    if (attribute.value_type === 'boolean') return draft === 'true';
    if (attribute.value_type === 'number') return draft.trim() === '' ? null : Number(draft);
    return draft.trim();
  }

  const canSave = attribute.value_type === 'boolean' ? draft !== '' : draft.trim() !== '';

  return (
    <form
      className="mt-1 flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSave) onSave(value());
      }}
    >
      <label htmlFor={id} className="sr-only">{attribute.name}</label>
      {attribute.value_type === 'picklist' ? (
        <select id={id} value={draft} onChange={(e) => setDraft(e.target.value)} className={input}>
          <option value="">Choose…</option>
          {attribute.picklist_options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : attribute.value_type === 'boolean' ? (
        <select id={id} value={draft} onChange={(e) => setDraft(e.target.value)} className={input}>
          <option value="">Choose…</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      ) : (
        <input id={id} type={attribute.value_type === 'number' ? 'number' : 'text'} value={draft} onChange={(e) => setDraft(e.target.value)} className={input} />
      )}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={!canSave || busy} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent text-on-accent text-[12px] font-bold disabled:opacity-50">
          <Check className="w-3 h-3" aria-hidden="true" />
          Save
        </button>
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[12px] font-semibold text-ink-muted hover:text-ink">
          <X className="w-3 h-3" aria-hidden="true" />
          Cancel
        </button>
      </div>
    </form>
  );
}
