// Settings > Agent Access: keys for an agent that reads Revenact as you.
//
// The key is you. An agent holding it reads your book, your mail and your
// department's tickets — never more (see revenact-backend services/mcp).
// The secret is shown once, when it is made, because after that it exists
// only as a hash and nobody can recover it.

import { useEffect, useState } from 'react';
import { Bot, Check, Copy, KeyRound } from 'lucide-react';
import { ApiError } from '../../lib/apiClient';
import { ConfirmDialog } from '../../components/organizations/ConfirmDialog';
import { fetchAgentTokens, issueAgentToken, revokeAgentToken } from '../../features/agents/agentAccessApi';
import type { AgentToken, IssuedToken } from '../../features/agents/agentAccessApi';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shortDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function errorText(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function AgentAccessPage() {
  const [attempt, setAttempt] = useState(0);
  const [tokens, setTokens] = useState<AgentToken[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<IssuedToken | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<AgentToken | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAgentTokens()
      .then((rows) => {
        if (cancelled) return;
        if (!Array.isArray(rows)) throw new Error('unexpected response');
        setTokens(rows);
        setLoadError(null);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(errorText(err, 'Could not load your keys.'));
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  async function create() {
    if (!label.trim()) return;
    setBusy(true);
    setActionError(null);
    try {
      setIssued(await issueAgentToken(label.trim()));
      setLabel('');
      setAttempt((n) => n + 1);
    } catch (err) {
      setActionError(errorText(err, 'Could not create a key.'));
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (!revoking) return;
    const target = revoking;
    setRevoking(null);
    setActionError(null);
    try {
      await revokeAgentToken(target.id);
      setAttempt((n) => n + 1);
    } catch (err) {
      setActionError(errorText(err, 'Could not revoke that key.'));
    }
  }

  async function copy() {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.token);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-5 max-w-2xl">
      <div>
        <h1 className="text-[20px] font-bold text-ink tracking-tight">Agent access</h1>
        <p className="text-[13px] text-ink-faint font-medium mt-0.5">
          Let an agent read Revenact as you, over MCP. It sees exactly what you see in the app: your book, your mail,
          your department's tickets. It cannot change anything.
        </p>
      </div>

      <div className="bg-subtle border border-line-subtle rounded-lg px-4 py-3 text-[12.5px] text-ink-muted">
        Point the agent at <code className="font-mono-brand text-ink">/api/v1/mcp/</code> and give it the key as a bearer
        token.
      </div>

      {loadError && (
        <p className="text-[12.5px] text-danger" role="alert">
          {loadError}{' '}
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className={`underline rounded-sm ${FOCUS}`}>
            Retry
          </button>
        </p>
      )}
      {actionError && <p className="text-[12.5px] text-danger" role="alert">{actionError}</p>}

      {issued && (
        <div className="bg-surface border border-accent/40 rounded-xl p-5 flex flex-col gap-2.5">
          <p className="text-[13px] font-bold text-ink">Here is the key for {issued.label}.</p>
          <p className="text-[12.5px] text-ink-muted">
            This is the only time it can be shown. Nobody can recover it afterwards, not even an admin; if it is lost,
            make another and revoke this one.
          </p>
          <div className="flex items-center gap-2">
            <code className="grow font-mono-brand text-[12.5px] text-ink bg-subtle rounded-md px-3 py-2 break-all">
              {issued.token}
            </code>
            <button
              type="button"
              onClick={copy}
              className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-md bg-subtle text-[12px] font-semibold text-ink-muted hover:text-ink shrink-0 ${FOCUS}`}
            >
              {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setIssued(null);
              setCopied(false);
            }}
            className={`text-[12.5px] font-semibold text-accent hover:underline w-fit rounded-sm ${FOCUS}`}
          >
            Done
          </button>
        </div>
      )}

      <form
        className="bg-surface rounded-xl border border-line-subtle shadow-sm p-5 flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!busy) create();
        }}
      >
        <label htmlFor="agent-label" className="text-[12px] font-bold text-ink-muted uppercase tracking-wide">
          What is it for
        </label>
        <input
          id="agent-label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Claude Desktop"
          className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={!label.trim() || busy}
          className={`px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent rounded-lg text-[13px] font-bold w-fit transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS}`}
        >
          {busy ? 'Creating…' : 'Create a key'}
        </button>
      </form>

      {tokens === null ? (
        !loadError && (
          <div className="flex flex-col gap-2" role="status" aria-label="Loading your keys">
            <div className="h-12 rounded-lg bg-subtle animate-pulse" />
          </div>
        )
      ) : tokens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-1.5 text-center bg-surface border border-line-subtle rounded-xl">
          <Bot className="w-5 h-5 text-ink-faint" aria-hidden="true" />
          <p className="text-[13.5px] font-semibold text-ink-muted">No agent has access yet.</p>
        </div>
      ) : (
        <ul className="bg-surface rounded-xl border border-line-subtle shadow-sm divide-y divide-line-subtle">
          {tokens.map((token) => (
            <li key={token.id} className="px-5 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <KeyRound className="w-4 h-4 text-ink-faint shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-ink truncate">{token.label}</p>
                  <p className="text-[11.5px] text-ink-faint">
                    Ends {token.hint} · made {shortDate(token.created_at)} ·{' '}
                    {token.last_used_at ? `Last used ${shortDate(token.last_used_at)}` : 'never used'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRevoking(token)}
                aria-label={`Revoke ${token.label}`}
                className={`px-2.5 py-1.5 rounded-lg text-[12.5px] font-semibold text-ink-muted hover:text-danger hover:bg-danger-dim shrink-0 ${FOCUS}`}
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}

      {revoking && (
        <ConfirmDialog
          title={`Revoke ${revoking.label}?`}
          message="Anything using this key stops working immediately. This cannot be undone."
          confirmLabel="Revoke"
          danger
          onConfirm={revoke}
          onClose={() => setRevoking(null)}
        />
      )}
    </div>
  );
}
