import { useEffect, useState } from 'react';
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, MinusCircle } from 'lucide-react';
import { ConfirmDialog } from '../../components/organizations/ConfirmDialog';
import { formatRelativeTime } from '../../features/customers/formatters';
import { ApiError } from '../../lib/apiClient';
import { createCampaign, fetchCampaign, sendCampaign, updateCampaign } from './campaignApi';
import { RecipientPicker } from './RecipientPicker';
import type { CampaignRecipient, CampaignSendLogEntry } from './types';

const STATUS_ICON = {
  sent: <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />,
  skipped: <MinusCircle className="w-3.5 h-3.5 text-ink-faint shrink-0" />,
};

// Mirrors CreateScenario.tsx's own load-by-route-param / POST-then-
// swap-URL-to-PATCH persistence shape closely — no React Flow canvas
// here, just a form (Name/Subject/Body + a RecipientPicker). Once
// `status === 'sent'` the whole form renders read-only and shows the
// send report instead — a sent Campaign is locked (see
// CampaignDetailView.perform_update's own docstring): you can't unsend
// a real email, so it shouldn't look editable.
export function CampaignEditor() {
  const { id: routeId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [campaignId, setCampaignId] = useState<number | undefined>(
    routeId ? Number(routeId) : undefined
  );
  const [name, setName] = useState('Untitled Campaign');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [status, setStatus] = useState<'draft' | 'sent'>('draft');
  const [sendLog, setSendLog] = useState<CampaignSendLogEntry[]>([]);
  const [sentCount, setSentCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [sentAt, setSentAt] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(!!routeId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);

  // Loads the existing campaign, if any — a fresh /campaigns/create
  // visit has no routeId, so this is a no-op and the state above's own
  // defaults stand. Runs once, same "route changes remount this page
  // entirely" reasoning as CreateScenario.tsx's own.
  useEffect(() => {
    if (!routeId) return;

    async function load() {
      try {
        const existing = await fetchCampaign(routeId!);
        setName(existing.name);
        setSubject(existing.subject);
        setBody(existing.body);
        setRecipients(existing.recipients);
        setStatus(existing.status);
        setSendLog(existing.send_log);
        setSentCount(existing.sent_count);
        setSkippedCount(existing.skipped_count);
        setSentAt(existing.sent_at);
        setLastSavedAt(existing.updated_at);
      } catch (err) {
        setLoadError(err instanceof ApiError ? err.message : 'Could not load this campaign.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function persist() {
    setSaveError(null);
    const payload = {
      name: name.trim() || 'Untitled Campaign',
      subject,
      body,
      recipient_ids: recipients.map((r) => r.id),
    };
    try {
      const saved = campaignId
        ? await updateCampaign(campaignId, payload)
        : await createCampaign(payload);
      if (!campaignId) {
        setCampaignId(saved.id);
        // Swaps /campaigns/create for /campaigns/<id> without a
        // remount (`replace` — no "back" stop on the create URL) so a
        // further Save PATCHes this same row instead of creating a
        // duplicate.
        navigate(`/campaigns/${saved.id}`, { replace: true });
      }
      setLastSavedAt(saved.updated_at);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save this campaign.');
    }
  }

  async function handleSaveAndClose() {
    await persist();
    navigate('/campaigns');
  }

  // Throws a plain string on failure — ConfirmDialog's own catch only
  // surfaces `typeof err === 'string'` errors (see its own onConfirm
  // usage elsewhere for Delete flows, always via Redux's
  // rejectWithValue), so an ApiError's `.message` is unwrapped here
  // rather than left as an Error instance ConfirmDialog can't read.
  async function handleSend() {
    if (!campaignId) throw 'This campaign has not been saved yet.';
    try {
      const sent = await sendCampaign(campaignId);
      setStatus(sent.status);
      setSendLog(sent.send_log);
      setSentCount(sent.sent_count);
      setSkippedCount(sent.skipped_count);
      setSentAt(sent.sent_at);
    } catch (err) {
      throw err instanceof ApiError ? err.message : 'Could not send this campaign.';
    }
  }

  const isSent = status === 'sent';

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-base text-[13px] text-ink-faint">
        Loading…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-base text-[13px] text-danger">
        {loadError}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-base overflow-hidden">
      <header className="h-[64px] border-b border-line-subtle bg-surface flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <NavLink to="/campaigns" className="flex items-center text-ink-faint hover:text-ink transition-colors">
            <ChevronLeft className="w-5 h-5 stroke-[2.5px]" />
          </NavLink>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Untitled Campaign"
            aria-label="Campaign name"
            disabled={isSent}
            className="text-[17px] font-bold text-ink tracking-tight bg-transparent border border-transparent hover:border-line focus:border-accent rounded-md px-2 py-1 -ml-2 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors min-w-[200px] disabled:opacity-70"
          />
        </div>

        <div className="flex items-center gap-3">
          {lastSavedAt && (
            <span className="text-[12px] text-ink-faint font-medium">Saved {formatRelativeTime(lastSavedAt)}</span>
          )}
          {!isSent && (
            <>
              <button
                onClick={persist}
                className="bg-accent hover:bg-accent-hover text-[#0D0F0E] px-4 py-1.5 rounded-[6px] text-[13px] font-bold transition-all shadow-sm"
              >
                Save
              </button>
              <button
                onClick={handleSaveAndClose}
                className="bg-surface border border-accent text-accent hover:bg-accent-dim px-4 py-1.5 rounded-[6px] text-[13px] font-bold transition-all shadow-sm"
              >
                Save & Close
              </button>
              <button
                onClick={() => setIsSendConfirmOpen(true)}
                disabled={!campaignId}
                title={campaignId ? undefined : 'Save this campaign first.'}
                className="bg-danger text-white hover:opacity-90 px-4 py-1.5 rounded-[6px] text-[13px] font-bold transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Send Campaign
              </button>
            </>
          )}
        </div>
      </header>

      {saveError && (
        <div className="px-6 py-2 bg-danger-dim border-b border-danger/30 text-[12.5px] text-danger shrink-0">
          {saveError}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl w-full mx-auto space-y-5">
        {isSent && (
          <div className="p-4 bg-success-dim border border-success/30 rounded-xl">
            <p className="text-[13px] font-bold text-success mb-1">
              Sent {sentAt && formatRelativeTime(sentAt)} — {sentCount} sent, {skippedCount} skipped
            </p>
            <ul className="flex flex-col gap-1.5 mt-3 max-h-56 overflow-y-auto">
              {sendLog.map((entry, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px] text-ink-muted">
                  {STATUS_ICON[entry.status]}
                  <span>
                    <span className="font-semibold text-ink">{entry.contact_name}:</span> {entry.detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label className="block text-[12px] font-semibold text-ink-muted mb-1" htmlFor="campaign-subject">
            Subject
          </label>
          <input
            id="campaign-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isSent}
            className="w-full px-3 py-2 bg-subtle border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all disabled:opacity-70"
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-ink-muted mb-1" htmlFor="campaign-body">
            Body
          </label>
          <textarea
            id="campaign-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={isSent}
            rows={8}
            className="w-full px-3 py-2 bg-subtle border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all disabled:opacity-70"
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-ink-muted mb-1">Recipients</label>
          <RecipientPicker selected={recipients} onChange={setRecipients} disabled={isSent} />
        </div>
      </div>

      {isSendConfirmOpen && (
        <ConfirmDialog
          title={`Send "${name}" to ${recipients.length} ${recipients.length === 1 ? 'recipient' : 'recipients'}?`}
          message="This sends a real email right now. It can't be undone or unsent."
          confirmLabel="Send"
          danger
          onConfirm={handleSend}
          onClose={() => setIsSendConfirmOpen(false)}
        />
      )}
    </div>
  );
}
