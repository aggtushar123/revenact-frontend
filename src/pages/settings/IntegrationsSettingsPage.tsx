import { useState, type FormEvent } from 'react';
import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { useAppDispatch, useAppSelector, useCapability } from '../../hooks';
import {
  addAutoBcc,
  removeAutoBcc,
  saveSignature,
} from '../../features/settings/settingsSlice';

const GMAIL_SVG = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
    <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="#EA4335" />
  </svg>
);

const OUTLOOK_SVG = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
    <path d="M22 5.5v13a1.5 1.5 0 0 1-1.5 1.5H9.5a1.5 1.5 0 0 1-1.5-1.5V17H2.5A1.5 1.5 0 0 1 1 15.5v-7A1.5 1.5 0 0 1 2.5 7H8V5.5A1.5 1.5 0 0 1 9.5 4h11A1.5 1.5 0 0 1 22 5.5z" fill="#0078D4"/>
    <path d="M8 8.5v7l-5.5-1v-5l5.5-1z" fill="#0078D4"/>
  </svg>
);

const SLACK_SVG = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.528 2.528 0 0 1 2.521-2.523 2.528 2.528 0 0 1 2.521 2.523v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
    <path d="M8.835 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.835 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.835zM8.835 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.313z" fill="#36C5F0"/>
    <path d="M18.958 8.835a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.835a2.528 2.528 0 0 1-2.52 2.521h-2.522V8.835zM17.687 8.835a2.528 2.528 0 0 1-2.521 2.521 2.528 2.528 0 0 1-2.522-2.521V2.522A2.528 2.528 0 0 1 15.166 0a2.528 2.528 0 0 1 2.521 2.522v6.313z" fill="#2EB67D"/>
    <path d="M15.165 18.958a2.528 2.528 0 0 1 2.522 2.522A2.528 2.528 0 0 1 15.165 24a2.528 2.528 0 0 1-2.522-2.52hv-2.522h2.522zM15.165 17.687a2.528 2.528 0 0 1-2.522-2.522 2.528 2.528 0 0 1 2.522-2.522h6.313A2.528 2.528 0 0 1 24 15.166a2.528 2.528 0 0 1-2.52 2.521h-6.315z" fill="#ECB22E"/>
  </svg>
);

const SALESFORCE_SVG = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
    <path d="M16.963 8.16C16.897 8.157 16.837 8.163 16.772 8.17C16.591 6.305 14.896 4.869 12.872 4.869C11.332 4.869 9.972 5.753 9.324 7.026C9.079 6.892 8.802 6.819 8.51 6.819C7.456 6.819 6.578 7.568 6.354 8.536C4.846 8.784 3.737 10.046 3.737 11.597C3.737 13.268 5.167 14.629 6.914 14.629H16.845C18.667 14.629 20.145 13.197 20.145 11.439C20.145 9.721 18.73 8.32 16.963 8.16Z" fill="#00A1E0"/>
  </svg>
);

export function IntegrationsSettingsPage() {
  const dispatch = useAppDispatch();
  const canManage = useCapability('manage_integrations');
  const currentUser = useAppSelector((state) => state.auth.user);
  const autoBccList = useAppSelector((state) => state.settings.autoBccList);
  const signatures = useAppSelector((state) => state.settings.signatures);

  const [connectedEmails, setConnectedEmails] = useState<string[]>([
  ]);
  const [showAddBcc, setShowAddBcc] = useState(false);
  const [newBccEmail, setNewBccEmail] = useState('');
  const [showAddSignature, setShowAddSignature] = useState(false);
  const [signatureText, setSignatureText] = useState(signatures[0]?.body || '');
  const [expandedOutlook, setExpandedOutlook] = useState(false);
  const [expandedSlack, setExpandedSlack] = useState(false);
  const [expandedSalesforce, setExpandedSalesforce] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const notify = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  const handleDisconnectEmail = (email: string) => {
    setConnectedEmails((prev) => prev.filter((e) => e !== email));
    notify(`Disconnected ${email}`);
  };

  const handleConnectNewEmail = () => {
    if (!canManage) {
      notify('You do not have permission to manage integrations.');
      return;
    }
    const input = window.prompt('Enter Google workspace or personal email:');
    if (input && input.includes('@')) {
      if (!connectedEmails.includes(input)) {
        setConnectedEmails((prev) => [...prev, input]);
        notify(`Connected ${input}`);
      }
    }
  };

  const handleAddBcc = (e: FormEvent) => {
    e.preventDefault();
    if (newBccEmail.trim() && newBccEmail.includes('@')) {
      dispatch(addAutoBcc(newBccEmail.trim()));
      setNewBccEmail('');
      setShowAddBcc(false);
      notify('Auto-BCC address registered');
    }
  };

  const handleFindSignature = () => {
    notify('Scanning sent messages for signature...');
    setTimeout(() => {
      setSignatureText(`Best,\n${currentUser?.name ?? '[Your name]'}\nRevenact`);
      setShowAddSignature(true);
      notify('Found signature from recent sent mail!');
    }, 1000);
  };

  const handleSaveSignature = () => {
    dispatch(
      saveSignature({
        id: 'sig-primary',
        accountEmail: connectedEmails[0] ?? currentUser?.email ?? '',
        title: 'Primary Signature',
        body: signatureText,
        isDefault: true,
      })
    );
    setShowAddSignature(false);
    notify('Email signature saved.');
  };

  return (
    <div className="flex flex-col gap-4" aria-label="Integrations Settings">
      <div>
        <h1 className="text-[14px] font-semibold text-[var(--rv-text)] tracking-tight">Integrations</h1>
      </div>

      {statusNotice && (
        <div className="bg-[var(--rv-input-bg)] text-[var(--rv-text)] border border-[var(--rv-card-border)] px-3.5 py-2 rounded-xl text-[12px] font-medium flex items-center justify-between shadow-md">
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Primary Integration: Gmail */}
      <section className="rv-card p-5 md:p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">{GMAIL_SVG}</div>
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--rv-text)] leading-tight">Gmail</h2>
              <p className="text-[11.5px] text-[var(--rv-text-muted)] mt-0.5">
                Bring the most relevant email threads to the top, with faster sync and richer search.
              </p>
            </div>
          </div>
        </div>

        {/* Connected Email accounts */}
        <div className="flex items-center gap-2 flex-wrap">
          {connectedEmails.map((email) => (
            <div
              key={email}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--rv-input-bg)] border border-[var(--rv-card-border)] text-[12px] text-[var(--rv-text)] font-medium"
            >
              <span>{email}</span>
              <button
                type="button"
                onClick={() => handleDisconnectEmail(email)}
                className="text-[var(--rv-text-muted)] hover:text-[var(--rv-text)] p-0.5 transition-colors cursor-pointer"
                title={`Disconnect ${email}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleConnectNewEmail}
            className="rv-pill-primary text-[11.5px] py-1 px-3 cursor-pointer"
          >
            Add new <Plus className="w-3 h-3 ml-0.5" />
          </button>
        </div>

        {/* Sub-Card 1: Saved Recipients */}
        <div className="bg-[var(--rv-input-bg)] border border-[var(--rv-card-border)] rounded-xl p-4 flex flex-col gap-3">
          <div>
            <h3 className="text-[13px] font-semibold text-[var(--rv-text)]">Saved Recipients</h3>
            <p className="text-[11.5px] text-[var(--rv-text-muted)] mt-0.5 leading-relaxed">
              Automatically BCC an address on every email you send. Add recipients below to log outgoing emails to HubSpot, Salesforce, Pipedrive, or any CRM with a BCC ingestion address.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {autoBccList.map((addr) => (
              <div
                key={addr}
                className="flex items-center justify-between px-3 py-1.5 bg-[var(--rv-card-bg)] border border-[var(--rv-card-border)] rounded-lg text-[12px]"
              >
                <span className="font-medium text-[var(--rv-text)]">{addr}</span>
                <button
                  type="button"
                  onClick={() => dispatch(removeAutoBcc(addr))}
                  className="text-[var(--rv-text-muted)] hover:text-red-400 transition-colors cursor-pointer"
                  title="Remove recipient"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {showAddBcc ? (
            <form onSubmit={handleAddBcc} className="flex items-center gap-2">
              <input
                type="email"
                placeholder="e.g. bcc@salesforce.com"
                value={newBccEmail}
                onChange={(e) => setNewBccEmail(e.target.value)}
                className="rv-input flex-1 text-[12px] py-1"
                autoFocus
              />
              <button type="submit" className="rv-pill-primary text-[11.5px] py-1 px-3 cursor-pointer">
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowAddBcc(false)}
                className="text-[11.5px] text-[var(--rv-text-muted)] hover:text-[var(--rv-text)] px-2 cursor-pointer"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setShowAddBcc(true)}
                className="rv-pill-secondary text-[11.5px] flex items-center gap-1.5 py-1 px-3 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Auto-BCC</span>
              </button>
            </div>
          )}
        </div>

        {/* Sub-Card 2: Email Signature */}
        <div className="bg-[var(--rv-input-bg)] border border-[var(--rv-card-border)] rounded-xl p-4 flex flex-col gap-3">
          <div>
            <h3 className="text-[13px] font-semibold text-[var(--rv-text)]">Email Signature</h3>
            <p className="text-[11.5px] text-[var(--rv-text-muted)] mt-0.5 leading-relaxed">
              Create and manage signatures for your email accounts.
            </p>
          </div>

          {connectedEmails[0] && (
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--rv-card-bg)] border border-[var(--rv-card-border)] text-[11.5px] w-fit font-medium text-[var(--rv-text)]">
              <div className="w-3.5 h-3.5 rounded-full bg-accent text-[var(--rv-text)] flex items-center justify-center text-[8.5px] font-bold">
                T
              </div>
              <span>{connectedEmails[0]}</span>
            </div>
          )}

          {showAddSignature ? (
            <div className="flex flex-col gap-2.5 bg-[var(--rv-card-bg)] border border-[var(--rv-card-border)] rounded-xl p-3.5">
              <label htmlFor="sig-editor" className="text-[11px] font-medium text-[var(--rv-text-muted)]">
                Signature Content:
              </label>
              <textarea
                id="sig-editor"
                rows={4}
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                className="rv-input font-sans text-[12px]"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSignature(false)}
                  className="text-[11.5px] text-[var(--rv-text-muted)] hover:text-[var(--rv-text)] px-2.5 py-1 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSignature}
                  className="rv-pill-primary text-[11.5px] py-1 px-3.5 cursor-pointer"
                >
                  Save Signature
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--rv-card-bg)] border border-[var(--rv-card-border)] rounded-xl p-3.5 flex flex-col gap-2">
              <p className="text-[12.5px] font-medium text-[var(--rv-text)]">Already have a signature?</p>
              <p className="text-[11.5px] text-[var(--rv-text-muted)]">
                We can look through your recent sent mail and show you what we find. Nothing is saved until you say so.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleFindSignature}
                  className="rv-pill-primary text-[11.5px] py-1 px-3 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Find my signature</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSignature(true)}
                  className="rv-pill-secondary text-[11.5px] py-1 px-3 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Signature</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Accordion 1: Outlook */}
      <section className="rv-card p-4 flex flex-col transition-all">
        <div
          onClick={() => setExpandedOutlook(!expandedOutlook)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="shrink-0">{OUTLOOK_SVG}</div>
            <div>
              <h3 className="text-[13.5px] font-semibold text-[var(--rv-text)]">Outlook</h3>
              <p className="text-[11.5px] text-[var(--rv-text-muted)]">
                Bring the most relevant email threads to the top.
              </p>
            </div>
          </div>

          <button type="button" className="p-1 text-[var(--rv-text-muted)] hover:text-[var(--rv-text)] cursor-pointer">
            {expandedOutlook ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {expandedOutlook && (
          <div className="pt-3 mt-3 border-t border-[var(--rv-card-border)] flex flex-col gap-2.5">
            <p className="text-[11.5px] text-[var(--rv-text-muted)]">
              Connect your Microsoft 365 or Exchange account to sync emails, calendar, and contacts.
            </p>
            <div>
              <button
                type="button"
                onClick={() => notify('Connecting to Microsoft OAuth...')}
                className="rv-pill-primary text-[11.5px] cursor-pointer"
              >
                Connect Microsoft Outlook
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Accordion 2: Slack */}
      <section className="rv-card p-4 flex flex-col transition-all">
        <div
          onClick={() => setExpandedSlack(!expandedSlack)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="shrink-0">{SLACK_SVG}</div>
            <div>
              <h3 className="text-[13.5px] font-semibold text-[var(--rv-text)]">Slack</h3>
              <p className="text-[11.5px] text-[var(--rv-text-muted)]">
                Sync channels, customer support alerts, and AI digests.
              </p>
            </div>
          </div>

          <button type="button" className="p-1 text-[var(--rv-text-muted)] hover:text-[var(--rv-text)] cursor-pointer">
            {expandedSlack ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {expandedSlack && (
          <div className="pt-3 mt-3 border-t border-[var(--rv-card-border)] flex flex-col gap-2.5">
            <p className="text-[11.5px] text-[var(--rv-text-muted)]">
              Every customer message in a support channel becomes actionable; reactions resolve threads automatically.
            </p>
            <div>
              <button
                type="button"
                onClick={() => notify('Opening Slack app installation...')}
                className="rv-pill-primary text-[11.5px] cursor-pointer"
              >
                Connect Slack Workspace
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Accordion 3: Salesforce */}
      <section className="rv-card p-4 flex flex-col transition-all">
        <div
          onClick={() => setExpandedSalesforce(!expandedSalesforce)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="shrink-0">{SALESFORCE_SVG}</div>
            <div>
              <h3 className="text-[13.5px] font-semibold text-[var(--rv-text)]">Salesforce</h3>
              <p className="text-[11.5px] text-[var(--rv-text-muted)]">
                Bi-directional sync of opportunities, accounts, and contacts.
              </p>
            </div>
          </div>

          <button type="button" className="p-1 text-[var(--rv-text-muted)] hover:text-[var(--rv-text)] cursor-pointer">
            {expandedSalesforce ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {expandedSalesforce && (
          <div className="pt-3 mt-3 border-t border-[var(--rv-card-border)] flex flex-col gap-2.5">
            <p className="text-[11.5px] text-[var(--rv-text-muted)]">
              Link your CRM environment to enable real-time ARR and opportunity pipeline tracking.
            </p>
            <div>
              <button
                type="button"
                onClick={() => notify('Connecting to Salesforce sandbox/production...')}
                className="rv-pill-primary text-[11.5px] cursor-pointer"
              >
                Connect Salesforce
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
