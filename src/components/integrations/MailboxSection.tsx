import { useEffect, useState, type FormEvent } from 'react';
import { Mail, RefreshCw, Unplug } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  connectImap,
  disconnectMailbox,
  fetchMailbox,
  startOAuth,
  syncMailbox,
  type MailProviderKey,
} from '../../features/mail/mailSlice';
import { formatDate } from '../../features/customers/formatters';

/**
 * "Your mailbox": the one connection that is personal rather than the
 * organisation's. Google and Microsoft go through OAuth (the backend
 * bounces back here with ?mailbox=connected|error); anything else takes
 * an IMAP/SMTP login. What is synced through it is visible to its owner
 * and their management chain only.
 */
export function MailboxSection() {
  const dispatch = useAppDispatch();
  const { connection, providers, loaded, saving, error } = useAppSelector((s) => s.mail);
  const [showImap, setShowImap] = useState(false);
  const [form, setForm] = useState({ address: '', password: '', imap_host: '', imap_port: '993', smtp_host: '', smtp_port: '587' });

  useEffect(() => {
    dispatch(fetchMailbox());
  }, [dispatch]);

  // The OAuth callback lands on /integrations?mailbox=connected|error&detail=…
  const query = new URLSearchParams(window.location.search);
  const outcome = query.get('mailbox');
  const outcomeDetail = query.get('detail');

  async function connect(provider: MailProviderKey) {
    const result = await dispatch(startOAuth(provider));
    if (startOAuth.fulfilled.match(result)) window.location.assign(result.payload.authorize_url);
  }

  async function submitImap(e: FormEvent) {
    e.preventDefault();
    const result = await dispatch(
      connectImap({
        address: form.address.trim(),
        password: form.password,
        imap_host: form.imap_host.trim(),
        imap_port: Number(form.imap_port) || 993,
        smtp_host: form.smtp_host.trim(),
        smtp_port: Number(form.smtp_port) || 587,
      }),
    );
    if (connectImap.fulfilled.match(result)) {
      setShowImap(false);
      setForm((f) => ({ ...f, password: '' }));
    }
  }

  const oauthProviders = providers.filter((p) => p.uses_oauth);
  const imapAvailable = providers.some((p) => p.key === 'imap');

  return (
    <section aria-label="Your mailbox" className="px-8 pt-8 w-full max-w-7xl mx-auto shrink-0">
      <div className="bg-surface border border-line rounded-xl shadow-sm px-5 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-accent" />
            <h2 className="text-[14px] font-bold text-ink">Your mailbox</h2>
            <span className="text-[12px] text-ink-muted">
              Emails you send and receive with customers appear on their records. Only you and your management chain can read them.
            </span>
          </div>
        </div>
        {outcome === 'connected' && <div className="text-[12.5px] text-success font-semibold">Mailbox connected.</div>}
        {outcome === 'error' && (
          <div className="text-[12.5px] text-danger font-semibold" role="alert">
            Could not connect: {outcomeDetail || 'the provider refused.'}
          </div>
        )}
        {error && <div className="text-[12.5px] text-danger" role="alert">{error}</div>}
        {!loaded ? (
          <div className="text-[12.5px] text-ink-faint">Loading…</div>
        ) : connection ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[13px] font-semibold text-ink">
                {connection.address} <span className="text-ink-faint font-medium">· {connection.provider_display}</span>
              </div>
              <div className={`text-[12px] ${connection.status === 'error' ? 'text-danger' : 'text-ink-muted'}`}>
                {connection.status === 'error'
                  ? `Needs attention: ${connection.error}`
                  : connection.last_synced_at
                    ? `Last synced ${formatDate(connection.last_synced_at)}`
                    : 'Not synced yet'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => dispatch(syncMailbox())} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-subtle border border-line rounded-lg text-[12px] font-semibold text-ink-muted hover:text-accent disabled:opacity-50">
                <RefreshCw className="w-3.5 h-3.5" /> Sync now
              </button>
              <button type="button" onClick={() => dispatch(disconnectMailbox())} className="flex items-center gap-1.5 px-3 py-1.5 border border-line rounded-lg text-[12px] font-semibold text-danger hover:bg-danger/10">
                <Unplug className="w-3.5 h-3.5" /> Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {oauthProviders.map((p) => (
                <button key={p.key} type="button" onClick={() => connect(p.key)} className="px-3 py-1.5 bg-accent text-[#0D0F0E] rounded-lg text-[12.5px] font-bold">
                  Connect {p.label}
                </button>
              ))}
              {imapAvailable && (
                <button type="button" onClick={() => setShowImap((v) => !v)} className="px-3 py-1.5 bg-subtle border border-line rounded-lg text-[12.5px] font-semibold text-ink-muted hover:text-ink">
                  {showImap ? 'Cancel' : 'Connect another mailbox (IMAP/SMTP)'}
                </button>
              )}
              {oauthProviders.length === 0 && (
                <span className="text-[12px] text-ink-faint">Google and Microsoft sign-in are not set up on this deployment yet; IMAP/SMTP works with an app password.</span>
              )}
            </div>
            {showImap && (
              <form onSubmit={submitImap} className="grid grid-cols-1 md:grid-cols-3 gap-2 max-w-3xl">
                <input aria-label="Email address" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="you@company.com" className="px-3 py-1.5 bg-surface border border-line rounded-lg text-[12.5px]" />
                <input aria-label="Password or app password" required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="App password" className="px-3 py-1.5 bg-surface border border-line rounded-lg text-[12.5px]" />
                <div />
                <input aria-label="IMAP host" required value={form.imap_host} onChange={(e) => setForm({ ...form, imap_host: e.target.value })} placeholder="imap.company.com" className="px-3 py-1.5 bg-surface border border-line rounded-lg text-[12.5px]" />
                <input aria-label="IMAP port" value={form.imap_port} onChange={(e) => setForm({ ...form, imap_port: e.target.value })} className="px-3 py-1.5 bg-surface border border-line rounded-lg text-[12.5px]" />
                <div />
                <input aria-label="SMTP host" required value={form.smtp_host} onChange={(e) => setForm({ ...form, smtp_host: e.target.value })} placeholder="smtp.company.com" className="px-3 py-1.5 bg-surface border border-line rounded-lg text-[12.5px]" />
                <input aria-label="SMTP port" value={form.smtp_port} onChange={(e) => setForm({ ...form, smtp_port: e.target.value })} className="px-3 py-1.5 bg-surface border border-line rounded-lg text-[12.5px]" />
                <button type="submit" disabled={saving} className="px-3 py-1.5 bg-accent text-[#0D0F0E] rounded-lg text-[12.5px] font-bold disabled:opacity-50">
                  {saving ? 'Checking login…' : 'Connect'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
