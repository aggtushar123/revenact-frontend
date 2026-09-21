import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Search } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchOrganisations } from '../../features/platform/platformSlice';

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-success-dim text-success',
  suspended: 'bg-danger-dim text-danger',
  pending: 'bg-warning-dim text-warning',
  archived: 'bg-subtle text-ink-muted',
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${STATUS_STYLE[status] ?? 'bg-subtle text-ink-muted'}`}>
      {status}
    </span>
  );
}

export function PlatformOrganisations() {
  const dispatch = useAppDispatch();
  const { organisations, isLoading, error } = useAppSelector((state) => state.platform);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const handle = window.setTimeout(() => {
      dispatch(fetchOrganisations({ q: q.trim() || undefined, status: status || undefined }));
    }, 200);
    return () => window.clearTimeout(handle);
  }, [dispatch, q, status]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight text-ink">Organisations</h1>
        <p className="text-[13px] text-ink-muted mt-1">Every tenant: who owns it, who is in it, what it has claimed.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative flex-1 min-w-[240px]">
          <span className="sr-only">Search organisations</span>
          <Search className="w-3.5 h-3.5 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or domain"
            className="rv-input pl-8 text-[12.5px]"
          />
        </label>
        <label className="sr-only" htmlFor="platform-status">
          Status
        </label>
        <select
          id="platform-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rv-input w-auto text-[12.5px]"
        >
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 text-[12px] text-danger p-3 bg-danger-dim rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="rv-card overflow-hidden">
        <table className="w-full text-[12.5px]">
          <thead className="text-[11px] uppercase tracking-[0.08em] text-ink-faint text-left">
            <tr className="border-b border-line-subtle">
              <th className="px-4 py-2.5 font-semibold">Organisation</th>
              <th className="px-4 py-2.5 font-semibold">Owner</th>
              <th className="px-4 py-2.5 font-semibold">Domains</th>
              <th className="px-4 py-2.5 font-semibold text-right">Members</th>
              <th className="px-4 py-2.5 font-semibold text-right">Waiting</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-subtle">
            {organisations.map((org) => (
              <tr key={org.id} className="hover:bg-subtle/60">
                <td className="px-4 py-2.5">
                  <Link to={`/platform/organisations/${org.id}`} className="font-semibold text-ink hover:underline">
                    {org.name}
                  </Link>
                  <div className="text-[11px] text-ink-faint">{org.slug}</div>
                </td>
                <td className="px-4 py-2.5 text-ink-muted">
                  {org.owner ? (
                    <>
                      <div className="text-ink">{org.owner.name}</div>
                      <div className="text-[11px]">{org.owner.email}</div>
                    </>
                  ) : (
                    <span className="text-warning">No owner</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-ink-muted">
                  {org.domains.length === 0
                    ? '—'
                    : org.domains.map((d) => (
                        <span key={d.domain} className="inline-flex items-center gap-1 mr-2">
                          {d.domain}
                          <span className={`w-1.5 h-1.5 rounded-full ${d.verification_status === 'verified' ? 'bg-success' : 'bg-warning'}`} aria-label={d.verification_status} />
                        </span>
                      ))}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-ink">{org.members_active}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-ink">{org.pending_requests}</td>
                <td className="px-4 py-2.5">
                  <StatusPill status={org.status} />
                </td>
              </tr>
            ))}
            {!isLoading && organisations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-faint">
                  Nothing matches.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PlatformOrganisations;
