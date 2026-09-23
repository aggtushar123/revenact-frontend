// Settings > Brief delivery: where the management brief goes, and when.
//
// The Slack webhook is a credential — anyone holding it can post to that
// channel — so it is written once and never shown again; the page shows
// the last few characters, enough to recognise which hook is set (see
// revenact-backend services/metrics/delivery.py).

import { useEffect, useState } from 'react';
import { Hash, Send, ShieldAlert } from 'lucide-react';
import { useCapability } from '../../hooks';
import { ApiError } from '../../lib/apiClient';
import {
  WEEKDAYS,
  createBriefSchedule,
  fetchBriefSchedule,
  removeBriefSchedule,
  sendBriefNow,
  updateBriefSchedule,
} from '../../features/briefs/briefScheduleApi';
import type { BriefSchedule, Cadence } from '../../features/briefs/briefScheduleApi';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const FIELD = 'w-full px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent';
const LABEL = 'text-[12px] font-bold text-ink-muted uppercase tracking-wide';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shortDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function ordinal(day: number): string {
  if (day % 100 >= 11 && day % 100 <= 13) return `${day}th`;
  return `${day}${['th', 'st', 'nd', 'rd'][day % 10] ?? 'th'}`;
}

function describe(schedule: BriefSchedule): string {
  const hour = `${String(schedule.hour ?? 8).padStart(2, '0')}:00`;
  if (schedule.cadence === 'weekly') return `Every ${WEEKDAYS[schedule.weekday ?? 0]} from ${hour}`;
  return `The ${ordinal(schedule.day ?? 1)} of each month, from ${hour}`;
}

function errorText(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function BriefDeliveryPage() {
  const isAdmin = useCapability('manage_org_settings');
  const [schedule, setSchedule] = useState<BriefSchedule | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const [destination, setDestination] = useState('');
  const [cadence, setCadence] = useState<Cadence>('weekly');
  const [weekday, setWeekday] = useState('0');
  const [day, setDay] = useState('1');
  const [hour, setHour] = useState('8');

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    fetchBriefSchedule()
      .then((next) => {
        if (cancelled) return;
        setSchedule(next);
        if (next.cadence) {
          setCadence(next.cadence);
          setWeekday(String(next.weekday ?? 0));
          setDay(String(next.day ?? 1));
          setHour(String(next.hour ?? 8));
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(errorText(err, 'Could not load the schedule.'));
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const live = schedule?.cadence != null;

  async function save() {
    setBusy(true);
    setActionError(null);
    setNote(null);
    const body = {
      cadence,
      weekday: Number(weekday),
      day: Number(day),
      hour: Number(hour),
      ...(destination.trim() ? { destination: destination.trim() } : {}),
    };
    try {
      const next = live && !destination.trim()
        ? await updateBriefSchedule(body)
        : await createBriefSchedule(body);
      setSchedule(next);
      setDestination('');
      setEditing(false);
    } catch (err) {
      setActionError(errorText(err, 'Could not save the schedule.'));
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    setBusy(true);
    setActionError(null);
    setNote(null);
    try {
      await removeBriefSchedule();
      setSchedule(await fetchBriefSchedule());
      setEditing(false);
    } catch (err) {
      setActionError(errorText(err, 'Could not stop the delivery.'));
    } finally {
      setBusy(false);
    }
  }

  async function sendNow() {
    setBusy(true);
    setActionError(null);
    setNote(null);
    try {
      const result = await sendBriefNow();
      setNote(result.detail);
    } catch (err) {
      setActionError(errorText(err, 'Could not send it.'));
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col h-full w-full p-6 max-w-2xl">
        <h1 className="text-[20px] font-bold text-ink tracking-tight mb-4">Brief delivery</h1>
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-warning-dim border border-warning/30 text-[12.5px] text-warning">
          <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
          You don't have permission to change this. Ask an admin where the management brief should go.
        </div>
      </div>
    );
  }

  const needsDestination = !live || editing;

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-5 max-w-2xl">
      <div>
        <h1 className="text-[20px] font-bold text-ink tracking-tight">Brief delivery</h1>
        <p className="text-[13px] text-ink-faint font-medium mt-0.5">
          Post the management brief to a Slack channel on a schedule. It posts the brief that exists; it never writes one
          on its own.
        </p>
      </div>

      {loadError && <p className="text-[12.5px] text-danger" role="alert">{loadError}</p>}
      {actionError && <p className="text-[12.5px] text-danger" role="alert">{actionError}</p>}
      {note && <p className="text-[12.5px] text-ink-muted" role="status">{note}</p>}

      <div className="bg-surface rounded-xl border border-line-subtle shadow-sm p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-ink-faint" aria-hidden="true" />
            <div>
              <p className="text-[13.5px] font-bold text-ink">
                {live ? describe(schedule!) : 'Nothing is scheduled yet.'}
              </p>
              {live ? (
                <p className="text-[12px] text-ink-faint mt-0.5">
                  Posting to the hook ending {schedule!.destination_hint}
                  {schedule!.last_sent_at ? ` · last sent ${shortDate(schedule!.last_sent_at)}` : ' · not sent yet'}
                </p>
              ) : (
                <p className="text-[12px] text-ink-faint mt-0.5">
                  Paste a Slack incoming webhook and choose when it should go.
                </p>
              )}
            </div>
          </div>
          {live && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={sendNow}
                disabled={busy}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12.5px] font-semibold text-ink-muted hover:text-ink hover:bg-subtle disabled:opacity-50 ${FOCUS}`}
              >
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                Send one now
              </button>
              <button
                type="button"
                onClick={stop}
                disabled={busy}
                className={`px-2.5 py-1.5 rounded-lg text-[12.5px] font-semibold text-ink-muted hover:text-danger hover:bg-danger-dim disabled:opacity-50 ${FOCUS}`}
              >
                Stop sending
              </button>
            </div>
          )}
        </div>

        <form
          className="flex flex-col gap-4 pt-3 border-t border-line-subtle"
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy) save();
          }}
        >
          {needsDestination ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="brief-hook" className={LABEL}>Slack webhook URL</label>
              <input
                id="brief-hook"
                type="url"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="https://hooks.slack.com/services/…"
                className={FIELD}
              />
              <p className="text-[12px] text-ink-faint">
                Written once and never shown again. Anyone holding it can post to that channel.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={`text-[12.5px] font-semibold text-accent hover:underline w-fit rounded-sm ${FOCUS}`}
            >
              Change the channel
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="brief-cadence" className={LABEL}>How often</label>
              <select id="brief-cadence" value={cadence} onChange={(e) => setCadence(e.target.value as Cadence)} className={FIELD}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="brief-day" className={LABEL}>Day</label>
              {cadence === 'weekly' ? (
                <select id="brief-day" value={weekday} onChange={(e) => setWeekday(e.target.value)} className={FIELD}>
                  {WEEKDAYS.map((name, index) => (
                    <option key={name} value={index}>{name}</option>
                  ))}
                </select>
              ) : (
                <input id="brief-day" type="number" min="1" max="31" value={day} onChange={(e) => setDay(e.target.value)} className={FIELD} />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="brief-hour" className={LABEL}>Not before</label>
              <input id="brief-hour" type="number" min="0" max="23" value={hour} onChange={(e) => setHour(e.target.value)} className={FIELD} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={busy || (needsDestination && !destination.trim())}
              className={`px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent rounded-lg text-[13px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS}`}
            >
              {busy ? 'Saving…' : live ? 'Save' : 'Schedule it'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDestination('');
                }}
                className={`text-[13px] font-semibold text-ink-muted hover:text-ink rounded-sm ${FOCUS}`}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <p className="text-[12px] text-ink-faint">
        A month with no such day sends on its last day instead. The hour is the earliest it will go: the job runs
        overnight and posts once that hour has passed.
      </p>
    </div>
  );
}
