import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../components/organizations/ConfirmDialog';
import { formatRelativeTime } from '../../features/customers/formatters';
import { ApiError } from '../../lib/apiClient';
import { deleteCampaign, fetchCampaigns } from './campaignApi';
import type { Campaign } from './types';

export function CampaignsList() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      setCampaigns(await fetchCampaigns());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load campaigns.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-surface text-ink p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[20px] font-bold text-ink tracking-tight">Campaigns</h1>
          <p className="text-[13px] text-ink-faint font-medium mt-0.5">
            Send a real email to a chosen list of your real Contacts.
          </p>
        </div>
        <button
          onClick={() => navigate('/campaigns/create')}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent rounded-lg text-[13px] font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      <div className="flex-1 overflow-hidden bg-surface rounded-xl border border-line-subtle shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center h-full py-24 text-[13px] text-ink-faint">Loading…</div>
        ) : error ? (
          <div className="flex items-center justify-center h-full py-24 text-[13px] text-danger">{error}</div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-24 text-center gap-2">
            <Megaphone className="w-10 h-10 text-ink-faint opacity-40 mb-2" />
            <p className="text-[14px] font-semibold text-ink-muted">No campaigns yet.</p>
            <p className="text-[12.5px] text-ink-faint max-w-xs">
              Pick an audience from your real Contacts, write a message, and send it.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-subtle/40 border-b border-line-subtle">
                <th className="px-6 py-3 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Recipients</th>
                <th className="px-6 py-3 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Sent</th>
                <th className="px-6 py-3 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {campaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  className="group hover:bg-accent-dim/10 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-accent-dim text-accent rounded-lg">
                        <Megaphone className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[13.5px] font-bold text-ink group-hover:text-accent transition-colors">
                        {campaign.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-[13px] font-medium">
                    <span className={campaign.status === 'sent' ? 'text-success' : 'text-ink-faint'}>
                      {campaign.status_display}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-[13px] font-medium text-ink-muted">
                    {campaign.recipients.length}
                  </td>
                  <td className="px-6 py-3.5 text-[13px] font-medium text-ink-muted">
                    {campaign.status === 'sent' ? `${campaign.sent_count} sent` : '—'}
                  </td>
                  <td className="px-6 py-3.5 text-[13px] font-medium text-ink-muted">
                    {formatRelativeTime(campaign.updated_at)}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(campaign);
                      }}
                      aria-label={`Delete ${campaign.name}`}
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
          message="This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await deleteCampaign(deleteTarget.id);
            await refresh();
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
