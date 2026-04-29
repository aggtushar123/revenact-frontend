import { useState } from 'react';
import { RefreshCw, Settings, Unlink, PlusCircle, CheckCircle, Plug } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { syncConnector, disconnectConnector } from '../../features/brain/brainSlice';
import { StatusBadge } from '../../components/brain/atoms/StatusBadge';
import type { Connector } from '../../features/brain/types';

const AVAILABLE_CONNECTORS = ['Confluence', 'Slack', 'Notion', 'GitHub', 'Google Drive', 'HubSpot', 'Salesforce', 'Zendesk', 'Intercom', 'Jira'];

const formatSync = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
};

function ConnectorCard({ connector, onSync, onDisconnect }: { connector: Connector; onSync: () => void; onDisconnect: () => void }) {
  const monoStyle = { fontFamily: "'DM Mono', monospace" };

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', transition: 'border-color 200ms' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
            <img src={connector.logo} alt={connector.name} style={{ width: '20px', height: '20px', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <span style={{ ...monoStyle, fontSize: '14px', color: 'var(--text-primary)' }}>{connector.name}</span>
        </div>
        <StatusBadge status={connector.status} type="connector" />
      </div>

      {connector.errorMessage && (
        <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '5px' }}>
          <p style={{ ...monoStyle, fontSize: '11px', color: 'var(--danger)', margin: 0 }}>{connector.errorMessage}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <p style={{ ...monoStyle, fontSize: '10px', color: 'var(--text-tertiary)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last Sync</p>
          <p style={{ ...monoStyle, fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{formatSync(connector.lastSync)}</p>
        </div>
        <div>
          <p style={{ ...monoStyle, fontSize: '10px', color: 'var(--text-tertiary)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Records</p>
          <p style={{ ...monoStyle, fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{connector.recordCount.toLocaleString()}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
        <button onClick={onSync} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '5px', color: 'var(--text-secondary)', ...monoStyle, fontSize: '11px', cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
          <RefreshCw size={12} /> Sync
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '5px', color: 'var(--text-secondary)', ...monoStyle, fontSize: '11px', cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
          <Settings size={12} /> Configure
        </button>
        <button onClick={onDisconnect} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '5px', color: 'var(--danger)', ...monoStyle, fontSize: '11px', cursor: 'pointer' }}>
          <Unlink size={12} />
        </button>
      </div>
    </div>
  );
}

function AddConnectorModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'search' | 'auth' | 'scope' | 'done'>('search');
  const [selected, setSelected] = useState('');
  const monoStyle = { fontFamily: "'DM Mono', monospace" };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: '12px', padding: '32px', width: '480px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['search', 'auth', 'scope', 'done'].map((s, i) => (
            <div key={s} style={{ flex: 1, height: '3px', background: ['search', 'auth', 'scope', 'done'].indexOf(step) >= i ? 'var(--accent)' : 'var(--border-default)', borderRadius: '2px', transition: 'background 200ms' }} />
          ))}
        </div>

        {step === 'search' && (
          <>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: 'var(--text-primary)', margin: '0 0 20px' }}>Add a connector</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {AVAILABLE_CONNECTORS.map(name => (
                <button key={name} onClick={() => { setSelected(name); setStep('auth'); }}
                  style={{ padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '7px', color: 'var(--text-primary)', ...monoStyle, fontSize: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 120ms' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                >
                  {name}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'auth' && (
          <>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: 'var(--text-primary)', margin: '0 0 8px' }}>Connect {selected}</h2>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px' }}>Authorize access to extract knowledge from {selected}.</p>
            <button onClick={() => setStep('scope')} style={{ width: '100%', padding: '12px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#ffffff', ...monoStyle, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Authorize with OAuth
            </button>
          </>
        )}

        {step === 'scope' && (
          <>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: 'var(--text-primary)', margin: '0 0 8px' }}>Select scope</h2>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px' }}>Choose what data to ingest from {selected}.</p>
            {['All spaces', 'Engineering docs', 'Support runbooks', 'HR policies', 'Finance procedures'].map(opt => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)' }} />
                <span style={{ ...monoStyle, fontSize: '12px', color: 'var(--text-primary)' }}>{opt}</span>
              </label>
            ))}
            <button onClick={() => setStep('done')} style={{ marginTop: '20px', width: '100%', padding: '12px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#ffffff', ...monoStyle, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Start Sync
            </button>
          </>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={40} color="var(--success)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: 'var(--text-primary)', margin: '0 0 8px' }}>{selected} connected</h2>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px' }}>First sync has started. Check back in a few minutes.</p>
            <button onClick={onClose} style={{ padding: '10px 24px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '6px', color: 'var(--text-primary)', ...monoStyle, fontSize: '12px', cursor: 'pointer' }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ConnectorsPage() {
  const dispatch = useAppDispatch();
  const { connectors } = useAppSelector(s => s.brain);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="brain-surface" style={{ minHeight: '100%', padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Company Brain</span>
          <h1 className="font-display" style={{ fontSize: '28px', color: 'var(--text-primary)', margin: '4px 0 0', fontWeight: 400 }}>Connectors</h1>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#ffffff', fontFamily: "'DM Mono', monospace", fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
          <PlusCircle size={14} /> Add Connector
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {connectors.map(conn => (
          <ConnectorCard key={conn.id} connector={conn} onSync={() => dispatch(syncConnector(conn.id))} onDisconnect={() => dispatch(disconnectConnector(conn.id))} />
        ))}

        {/* Add new card */}
        <button onClick={() => setShowModal(true)} style={{ background: 'none', border: '1px dashed var(--border-default)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', minHeight: '180px', transition: 'border-color 200ms' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        >
          <Plug size={20} color="var(--text-tertiary)" />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: 'var(--text-tertiary)' }}>Add connector</span>
        </button>
      </div>

      {showModal && <AddConnectorModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
