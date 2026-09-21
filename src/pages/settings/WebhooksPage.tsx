import { Fragment, useEffect, useState } from 'react';
import { ShieldAlert, Plus, Trash2, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import { useCapability } from '../../hooks';
import { formatRelativeTime } from '../../features/customers/formatters';
import { ApiError } from '../../lib/apiClient';
import { ConfirmDialog } from '../../components/organizations/ConfirmDialog';
import { createWebhook, deleteWebhook, fetchWebhooks, updateWebhook } from './webhooksApi';
import type { Webhook } from './webhooksApi';

// Backs Settings > Webhooks (Navbar.tsx's own /settings/webhooks tab,
// unrouted until now). Unlike Currency/Global Presets/AI Agent, both
// viewing and changing this is admin-only server-side (IsOrgAdmin on
// GET too — see revenact-backend's own WebhookListCreateView docstring
// on why) — this page doesn't render a read-only view for a CSM the
// way those three do, since it can't even fetch the list to show one.
export function WebhooksPage() {
  const isAdmin = useCapability('manage_integrations');

  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(isAdmin);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Webhook | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    async function load() {
      try {
        setWebhooks(await fetchWebhooks());
      } catch (err) {
        setLoadError(err instanceof ApiError ? err.message : 'Could not load webhooks.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [isAdmin]);

  async function handleAdd() {
    setAddError(null);
    setIsSubmitting(true);
    try {
      const created = await createWebhook({ url: newUrl, event: 'customer.created' });
      setWebhooks((current) => [created, ...current]);
      setNewUrl('');
      setShowAddForm(false);
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : 'Could not create webhook.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActive(webhook: Webhook) {
    const updated = await updateWebhook(webhook.id, { is_active: !webhook.is_active });
    setWebhooks((current) => current.map((w) => (w.id === webhook.id ? updated : w)));
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col h-full w-full p-6 gap-6 max-w-3xl">
        <div>
          <h1 className="text-[20px] font-bold text-ink tracking-tight">Webhooks</h1>
          <p className="text-[13px] text-ink-faint font-medium mt-0.5">Outbound integrations for this organization.</p>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-warning-dim border border-warning/30 text-[12.5px] text-warning">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          You don't have permission to view or manage webhooks.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-ink tracking-tight">Webhooks</h1>
          <p className="text-[13px] text-ink-faint font-medium mt-0.5">
            Get notified at a URL of your choosing when something happens in Revenact.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent rounded-lg text-[13px] font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Webhook
        </button>
      </div>

      {showAddForm && (
        <div className="bg-surface rounded-xl border border-line-subtle shadow-sm p-5 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="webhook-url" className="text-[12px] font-bold text-ink-muted uppercase tracking-wide">
              URL
            </label>
            <input
              id="webhook-url"
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com/hooks/revenact"
              className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
            />
          </div>
          <p className="text-[12px] text-ink-faint">Event: Organization Created — the only event available right now.</p>
          {addError && <p className="text-[12.5px] text-danger">{addError}</p>}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAdd}
              disabled={!newUrl.trim() || isSubmitting}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent rounded-lg text-[13px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding…' : 'Add'}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setAddError(null); }}
              className="text-[13px] font-semibold text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 bg-surface rounded-xl border border-line-subtle shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-[13px] text-ink-faint">Loading…</div>
        ) : loadError ? (
          <div className="flex items-center justify-center py-16 text-[13px] text-danger">{loadError}</div>
        ) : webhooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-1 text-center">
            <p className="text-[14px] font-semibold text-ink-muted">No webhooks yet.</p>
            <p className="text-[12.5px] text-ink-faint">Add one to get notified when an organization is created.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-subtle/40 border-b border-line-subtle">
                <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">URL</th>
                <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Event</th>
                <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Status</th>
                <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Created</th>
                <th className="px-5 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {webhooks.map((webhook) => (
                <Fragment key={webhook.id}>
                  <tr className="hover:bg-subtle/40 transition-colors">
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setExpandedId((id) => (id === webhook.id ? null : webhook.id))}
                        className="flex items-center gap-1.5 text-[13px] font-bold text-ink hover:text-accent transition-colors"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${expandedId === webhook.id ? 'rotate-180' : ''}`} />
                        <span className="truncate max-w-[280px]">{webhook.url}</span>
                      </button>
                    </td>
                    <td className="px-5 py-3 text-[13px] font-medium text-ink-muted">{webhook.event_display}</td>
                    <td className="px-5 py-3">
                      <button
                        role="switch"
                        aria-checked={webhook.is_active}
                        aria-label={`${webhook.is_active ? 'Disable' : 'Enable'} webhook for ${webhook.url}`}
                        onClick={() => toggleActive(webhook)}
                        className={`w-8 h-[18px] rounded-full relative transition-colors ${webhook.is_active ? 'bg-success' : 'bg-line-strong'}`}
                      >
                        <span
                          className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-surface shadow-sm transition-transform ${
                            webhook.is_active ? 'translate-x-[16px]' : 'translate-x-[2px]'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-3 text-[13px] font-medium text-ink-muted">{formatRelativeTime(webhook.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setDeleteTarget(webhook)}
                        aria-label={`Delete webhook for ${webhook.url}`}
                        className="p-1.5 hover:bg-subtle rounded-md text-ink-faint hover:text-danger transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  {expandedId === webhook.id && (
                    <tr>
                      <td colSpan={5} className="px-5 py-4 bg-subtle/20">
                        <p className="text-[11px] font-bold text-ink-faint uppercase tracking-wide mb-2">Recent deliveries</p>
                        {webhook.recent_deliveries.length === 0 ? (
                          <p className="text-[12.5px] text-ink-faint">No deliveries yet.</p>
                        ) : (
                          <ul className="flex flex-col gap-1.5">
                            {webhook.recent_deliveries.map((delivery) => (
                              <li key={delivery.id} className="flex items-center gap-2 text-[12.5px] text-ink-muted">
                                {delivery.success ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-danger shrink-0" />
                                )}
                                <span>{formatRelativeTime(delivery.sent_at)}</span>
                                {delivery.status_code && <span>· HTTP {delivery.status_code}</span>}
                                {delivery.error && <span className="text-danger">· {delivery.error}</span>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this webhook?"
          message="This can't be undone — Revenact will stop notifying this URL."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await deleteWebhook(deleteTarget.id);
            setWebhooks((current) => current.filter((w) => w.id !== deleteTarget.id));
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
