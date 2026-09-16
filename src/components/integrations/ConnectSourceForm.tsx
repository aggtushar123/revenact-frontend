import { useState, type FormEvent } from 'react';
import { Copy } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { connectConnector, startConnectorOAuth, type Connector, type ConnectResult } from '../../features/connectors/connectorsSlice';

/**
 * Hand a ticket source its credentials. The form is whatever the backend
 * says the provider needs (`connector.setup.fields`); secrets go straight
 * to the backend and never into the store. The webhook provider has no
 * form: connecting mints a secret, shown here once.
 */
export function ConnectSourceForm({ connector, onDone }: { connector: Connector; onDone: () => void }) {
  const dispatch = useAppDispatch();
  const saving = useAppSelector((s) => s.connectors.saving);
  const setup = connector.setup;
  const [form, setForm] = useState<Record<string, string>>({});
  const [minted, setMinted] = useState<ConnectResult | null>(null);
  const [copied, setCopied] = useState(false);

  if (!setup) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const result = await dispatch(connectConnector({ id: connector.id, form }));
    if (!connectConnector.fulfilled.match(result)) return;
    if (result.payload.token) setMinted(result.payload);
    else onDone();
  }

  async function signIn() {
    const result = await dispatch(startConnectorOAuth({ id: connector.id, form }));
    if (startConnectorOAuth.fulfilled.match(result)) window.location.assign(result.payload.authorize_url);
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (minted) {
    return (
      <div className="mt-2 flex flex-col gap-2 text-[12px]" role="status">
        <div className="font-semibold text-ink">Your system posts tickets to:</div>
        <code className="px-2 py-1 bg-subtle border border-line rounded-lg break-all select-all">{minted.inbound_url}</code>
        <div className="font-semibold text-ink">
          with the header <code>X-Revenact-Token</code> set to this secret. It is shown once:
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-2 py-1 bg-subtle border border-line rounded-lg break-all select-all" aria-label="Webhook secret">
            {minted.token}
          </code>
          <button type="button" onClick={() => copy(minted.token ?? '')} className="p-1.5 border border-line rounded-lg text-ink-muted hover:text-accent" aria-label="Copy secret">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
        {copied && <span className="text-success font-semibold">Copied.</span>}
        <div className="text-ink-faint">
          Send one ticket object or {'{'}"tickets": [...]{'}'} with external_id, title and optionally description, status, priority,
          requester_email, requester_name, assignee_name, url, opened_at, resolved_at.
        </div>
        <button type="button" onClick={onDone} className="self-start px-3 py-1.5 bg-accent text-[#0D0F0E] rounded-lg text-[12px] font-bold">
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2" aria-label={`Connect ${connector.name}`}>
      {setup.fields.map((field) => (
        <label key={field.name} className="flex flex-col gap-0.5 text-[11px] font-semibold text-ink-muted">
          {field.label}
          {!field.required && <span className="font-medium text-ink-faint"> (optional)</span>}
          <input
            type={field.secret ? 'password' : 'text'}
            autoComplete={field.secret ? 'new-password' : 'off'}
            required={field.required && !(setup.uses_oauth && field.secret)}
            value={form[field.name] ?? ''}
            onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
            placeholder={field.placeholder}
            className="px-2.5 py-1.5 bg-surface border border-line rounded-lg text-[12.5px] text-ink font-medium focus:outline-none focus:border-accent"
          />
        </label>
      ))}
      {setup.help && <p className="text-[11px] text-ink-faint">{setup.help}</p>}
      <div className="flex items-center gap-2 flex-wrap">
        <button type="submit" disabled={saving} className="px-3 py-1.5 bg-accent text-[#0D0F0E] rounded-lg text-[12px] font-bold disabled:opacity-50">
          {saving ? 'Checking…' : setup.fields.length ? 'Connect' : 'Generate secret'}
        </button>
        {setup.uses_oauth && (
          <button type="button" onClick={signIn} disabled={saving} className="px-3 py-1.5 bg-surface border border-line rounded-lg text-[12px] font-bold text-ink-muted hover:text-ink disabled:opacity-50">
            Sign in with {setup.label}
          </button>
        )}
        <button type="button" onClick={onDone} className="text-[12px] font-semibold text-ink-muted">
          Cancel
        </button>
      </div>
    </form>
  );
}
