// Settings > Users > Access: who is asking to join, who has been asked, and
// which domains route people here automatically.
//
// Three sections, one rule each:
//   Requests    — people who signed in with a corporate address and hold
//                 nothing until someone here says yes, with a role.
//   Invitations — the company asking first. No link to forward: the invited
//                 address signs in and is let straight in.
//   Domains     — a claim proves nothing; the TXT record does. Verified
//                 domains route sign-ins here; unverified ones only let the
//                 next person ask.
//
// Requests and invitations need `manage_users`; domains need
// `manage_org_settings`, so that section is shown only to people who hold it.

import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, Check, Clock, Copy, Globe, Loader2, Mail, ShieldCheck, X } from 'lucide-react';
import { useAppDispatch, useAppSelector, useCapability } from '../../hooks';
import type { Role } from '../../features/userManagement/userManagementSlice';
import {
  addDomain,
  cancelInvitation,
  clearAccessError,
  decideAccessRequest,
  fetchAccessRequests,
  fetchDomains,
  fetchInvitations,
  sendInvitation,
  verifyDomain,
  type AccessRequest,
  type Invitation,
  type OrganisationDomain,
} from '../../features/access/accessSlice';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function AccessTab({ roles }: { roles: Role[] }) {
  const dispatch = useAppDispatch();
  const { requests, invitations, domains, error } = useAppSelector((state) => state.access);
  const canManageDomains = useCapability('manage_org_settings');

  useEffect(() => {
    dispatch(fetchAccessRequests());
    dispatch(fetchInvitations());
    if (canManageDomains) dispatch(fetchDomains());
    return () => {
      dispatch(clearAccessError());
    };
  }, [dispatch, canManageDomains]);

  return (
    <div className="space-y-8">
      {error && (
        <div role="alert" className="flex items-center gap-2 text-[12px] text-danger p-3 bg-danger-dim rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      <RequestsSection requests={requests} roles={roles} />
      <InvitationsSection invitations={invitations} roles={roles} />
      {canManageDomains && <DomainsSection domains={domains} />}
    </div>
  );
}

// ── Requests ──────────────────────────────────────────────────────────

function RequestsSection({ requests, roles }: { requests: AccessRequest[]; roles: Role[] }) {
  const dispatch = useAppDispatch();
  const defaultRole = roles.find((r) => r.slug === 'csm') ?? roles[0];
  const [chosenRole, setChosenRole] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState<number | null>(null);

  async function decide(request: AccessRequest, decision: 'approve' | 'reject') {
    setBusy(request.id);
    try {
      await dispatch(
        decideAccessRequest({
          id: request.id,
          decision,
          roleId: chosenRole[request.id] ?? defaultRole?.id,
        })
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="requests-heading" className="space-y-3">
      <div>
        <h2 id="requests-heading" className="text-[14px] font-bold text-ink flex items-center gap-2">
          <Clock className="w-4 h-4 text-ink-faint" aria-hidden="true" />
          Waiting to join
        </h2>
        <p className="text-[12.5px] text-ink-muted mt-0.5">
          They signed in with a company address and hold nothing until you choose a role and approve.
        </p>
      </div>

      {requests.length === 0 ? (
        <p className="text-[12.5px] text-ink-faint bg-surface border border-line rounded-xl p-4">
          Nobody is waiting.
        </p>
      ) : (
        <ul className="bg-surface border border-line rounded-xl divide-y divide-line-subtle">
          {requests.map((request) => (
            <li key={request.id} className="flex flex-wrap items-center gap-3 p-3.5">
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-ink truncate">{request.user_name}</div>
                <div className="text-[11.5px] text-ink-muted truncate">
                  {request.email} · asked {formatDate(request.requested_at)}
                </div>
              </div>
              <label className="sr-only" htmlFor={`request-role-${request.id}`}>
                Role for {request.user_name}
              </label>
              <select
                id={`request-role-${request.id}`}
                value={chosenRole[request.id] ?? defaultRole?.id ?? ''}
                onChange={(e) => setChosenRole((c) => ({ ...c, [request.id]: Number(e.target.value) }))}
                className="px-2.5 py-1.5 bg-subtle border border-line rounded-lg text-[12px] text-ink"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => decide(request, 'approve')}
                disabled={busy === request.id || !defaultRole}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-on-accent rounded-full text-[12px] font-semibold hover:bg-accent-hover disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                Approve
              </button>
              <button
                type="button"
                onClick={() => decide(request, 'reject')}
                disabled={busy === request.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-subtle border border-line rounded-full text-[12px] font-medium text-ink-muted hover:text-danger hover:border-danger/40 disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                Reject
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Invitations ───────────────────────────────────────────────────────

function InvitationsSection({ invitations, roles }: { invitations: Invitation[]; roles: Role[] }) {
  const dispatch = useAppDispatch();
  const defaultRole = roles.find((r) => r.slug === 'csm') ?? roles[0];
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState<number | ''>('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const effectiveRole = roleId === '' ? defaultRole?.id : roleId;

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSent(null);
    if (!email.includes('@') || !effectiveRole) {
      setFormError('An email address and a role are needed.');
      return;
    }
    setSending(true);
    try {
      const invitation = await dispatch(sendInvitation({ email: email.trim(), roleId: effectiveRole })).unwrap();
      setSent(invitation.email);
      setEmail('');
    } catch (err) {
      setFormError(typeof err === 'string' ? err : 'Could not send that invitation.');
    } finally {
      setSending(false);
    }
  }

  return (
    <section aria-labelledby="invitations-heading" className="space-y-3">
      <div>
        <h2 id="invitations-heading" className="text-[14px] font-bold text-ink flex items-center gap-2">
          <Mail className="w-4 h-4 text-ink-faint" aria-hidden="true" />
          Invitations
        </h2>
        <p className="text-[12.5px] text-ink-muted mt-0.5">
          They sign in with the invited address and are let straight in with this role. Nothing to forward; open for seven days.
        </p>
      </div>

      <form onSubmit={handleInvite} noValidate className="flex flex-wrap items-end gap-2 bg-surface border border-line rounded-xl p-3.5">
        <div className="flex-1 min-w-[220px]">
          <label htmlFor="invite-email" className="block text-[11.5px] font-medium text-ink-muted mb-1">
            Work email
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full px-3 py-1.5 bg-subtle border border-line rounded-lg text-[12.5px] text-ink focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="invite-role" className="block text-[11.5px] font-medium text-ink-muted mb-1">
            Role
          </label>
          <select
            id="invite-role"
            value={effectiveRole ?? ''}
            onChange={(e) => setRoleId(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-subtle border border-line rounded-lg text-[12px] text-ink"
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent text-on-accent rounded-full text-[12px] font-semibold hover:bg-accent-hover disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Mail className="w-3.5 h-3.5" aria-hidden="true" />}
          Send invitation
        </button>
        {sent && (
          <span role="status" className="text-[11.5px] text-success font-medium w-full">
            Invitation sent to {sent}.
          </span>
        )}
        {formError && (
          <span role="alert" className="text-[11.5px] text-danger font-medium w-full">
            {formError}
          </span>
        )}
      </form>

      {invitations.length > 0 && (
        <ul className="bg-surface border border-line rounded-xl divide-y divide-line-subtle">
          {invitations.map((invitation) => (
            <li key={invitation.id} className="flex flex-wrap items-center gap-3 p-3.5">
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-ink truncate">{invitation.email}</div>
                <div className="text-[11.5px] text-ink-muted truncate">
                  {invitation.role_name}
                  {invitation.invited_by_name ? ` · invited by ${invitation.invited_by_name}` : ''} · expires{' '}
                  {formatDate(invitation.expires_at)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => dispatch(cancelInvitation(invitation.id))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-subtle border border-line rounded-full text-[12px] font-medium text-ink-muted hover:text-danger hover:border-danger/40"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                Cancel
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Domains ───────────────────────────────────────────────────────────

function DomainsSection({ domains }: { domains: OrganisationDomain[] }) {
  const dispatch = useAppDispatch();
  const [domain, setDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<number | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<Record<number, string>>({});
  const [copied, setCopied] = useState<number | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setAdding(true);
    try {
      await dispatch(addDomain(domain.trim())).unwrap();
      setDomain('');
    } catch (err) {
      setFormError(typeof err === 'string' ? err : 'Could not add that domain.');
    } finally {
      setAdding(false);
    }
  }

  async function handleVerify(record: OrganisationDomain) {
    setVerifying(record.id);
    setVerifyMessage((m) => ({ ...m, [record.id]: '' }));
    try {
      await dispatch(verifyDomain(record.id)).unwrap();
      setVerifyMessage((m) => ({ ...m, [record.id]: 'Verified. Sign-ins from this domain now come to you.' }));
    } catch (err) {
      setVerifyMessage((m) => ({ ...m, [record.id]: typeof err === 'string' ? err : 'Could not verify yet.' }));
    } finally {
      setVerifying(null);
    }
  }

  async function copyRecord(record: OrganisationDomain) {
    if (!record.dns_record) return;
    try {
      await navigator.clipboard.writeText(record.dns_record.value);
      setCopied(record.id);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard access can be denied; the value is on screen regardless.
    }
  }

  return (
    <section aria-labelledby="domains-heading" className="space-y-3">
      <div>
        <h2 id="domains-heading" className="text-[14px] font-bold text-ink flex items-center gap-2">
          <Globe className="w-4 h-4 text-ink-faint" aria-hidden="true" />
          Email domains
        </h2>
        <p className="text-[12.5px] text-ink-muted mt-0.5">
          Prove a domain with a DNS record and anyone signing in with it is routed here to ask to join. Adding one proves nothing on its own.
        </p>
      </div>

      <form onSubmit={handleAdd} noValidate className="flex flex-wrap items-end gap-2 bg-surface border border-line rounded-xl p-3.5">
        <div className="flex-1 min-w-[220px]">
          <label htmlFor="domain-name" className="block text-[11.5px] font-medium text-ink-muted mb-1">
            Domain
          </label>
          <input
            id="domain-name"
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="company.com"
            className="w-full px-3 py-1.5 bg-subtle border border-line rounded-lg text-[12.5px] text-ink focus:outline-none focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={adding || !domain.trim()}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent text-on-accent rounded-full text-[12px] font-semibold hover:bg-accent-hover disabled:opacity-50"
        >
          Add domain
        </button>
        {formError && (
          <span role="alert" className="text-[11.5px] text-danger font-medium w-full">
            {formError}
          </span>
        )}
      </form>

      {domains.length > 0 && (
        <ul className="bg-surface border border-line rounded-xl divide-y divide-line-subtle">
          {domains.map((record) => (
            <li key={record.id} className="p-3.5 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-ink truncate">{record.domain}</div>
                  <div className="text-[11.5px] text-ink-muted">
                    {record.verification_status === 'verified'
                      ? `Verified ${formatDate(record.verified_at)}`
                      : record.verification_status === 'revoked'
                        ? 'Another organisation proved this domain'
                        : 'Not verified yet'}
                  </div>
                </div>
                {record.verification_status === 'verified' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-dim text-success text-[11.5px] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    Verified
                  </span>
                ) : record.verification_status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => handleVerify(record)}
                    disabled={verifying === record.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-subtle border border-line rounded-full text-[12px] font-medium text-ink hover:border-accent disabled:opacity-50"
                  >
                    {verifying === record.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : null}
                    Check DNS
                  </button>
                ) : null}
              </div>

              {record.dns_record && (
                <div className="bg-subtle border border-line-subtle rounded-lg p-2.5 text-[11.5px] text-ink-muted">
                  Publish this <span className="font-mono-brand text-ink">TXT</span> record on{' '}
                  <span className="font-mono-brand text-ink">{record.dns_record.name}</span>:
                  <div className="mt-1.5 flex items-center gap-2">
                    <code className="font-mono-brand text-[11px] text-ink bg-surface border border-line rounded px-2 py-1 break-all flex-1">
                      {record.dns_record.value}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyRecord(record)}
                      className="inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink"
                      aria-label="Copy record value"
                    >
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      {copied === record.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {verifyMessage[record.id] && (
                <p role="status" className="text-[11.5px] text-ink-muted">
                  {verifyMessage[record.id]}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default AccessTab;
