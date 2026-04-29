import { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, MessageSquare } from 'lucide-react';
import { useAppSelector } from '../../hooks';
import type { FeedbackOutcome } from '../../features/brain/types';

const outcomeConfig = {
  success:    { icon: CheckCircle,   color: 'var(--success)', label: 'Success',   bg: 'rgba(16,185,129,0.10)' },
  escalation: { icon: AlertTriangle, color: 'var(--warning)', label: 'Escalated', bg: 'rgba(245,158,11,0.10)' },
  correction: { icon: XCircle,       color: 'var(--danger)', label: 'Corrected', bg: 'rgba(239,68,68,0.10)' },
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return `${Math.round(diff)}s ago`;
  if (diff < 3600)  return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

export function FeedbackLog() {
  const { feedbackLog } = useAppSelector(s => s.brain);
  const [filter, setFilter] = useState<FeedbackOutcome | 'all'>('all');

  const filtered = filter === 'all' ? feedbackLog : feedbackLog.filter(f => f.outcome === filter);
  const monoStyle = { fontFamily: "'DM Mono', monospace" };

  if (feedbackLog.length === 0) {
    return (
      <div className="brain-surface" style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '60px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-default)' }}>
          <MessageSquare size={20} color="var(--text-tertiary)" />
        </div>
        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: 'var(--text-primary)', margin: 0 }}>No feedback yet</p>
        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Agent feedback will appear here once skills are in active use.</p>
      </div>
    );
  }

  return (
    <div className="brain-surface" style={{ minHeight: '100%', padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <span style={{ ...monoStyle, fontSize: '11px', color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Company Brain</span>
        <h1 className="font-display" style={{ fontSize: '28px', color: 'var(--text-primary)', margin: '4px 0 0', fontWeight: 400 }}>Feedback Log</h1>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {(['all', 'success', 'escalation', 'correction'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 14px', background: filter === f ? 'var(--accent)' : 'var(--bg-surface)', border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border-default)'}`, borderRadius: '4px', color: filter === f ? '#ffffff' : 'var(--text-secondary)', ...monoStyle, fontSize: '11px', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 120ms' }}>
            {f === 'all' ? 'All' : outcomeConfig[f].label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', ...monoStyle, fontSize: '11px', color: 'var(--text-tertiary)', alignSelf: 'center' }}>{filtered.length} entries</span>
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map((entry, i) => {
          const cfg = outcomeConfig[entry.outcome];
          const Icon = cfg.icon;
          return (
            <div key={entry.id} style={{ display: 'flex', alignItems: 'stretch', gap: '16px', animation: `fade-up ${150 + i * 30}ms both` }}>
              {/* Timeline line + dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '20px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: cfg.bg, border: `1px solid ${cfg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={10} color={cfg.color} />
                </div>
                {i < filtered.length - 1 && <div style={{ width: '1px', flex: 1, background: 'var(--border-subtle)', marginTop: '4px' }} />}
              </div>

              {/* Card */}
              <div style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '7px', padding: '14px 18px', marginBottom: '8px', transition: 'border-color 120ms' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ ...monoStyle, fontSize: '11px', color: cfg.color }}>{cfg.label}</span>
                    <span style={{ ...monoStyle, fontSize: '12px', color: 'var(--text-primary)' }}>{entry.skillName}</span>
                  </div>
                  <span style={{ ...monoStyle, fontSize: '11px', color: 'var(--text-tertiary)' }}>{timeAgo(entry.timestamp)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ ...monoStyle, fontSize: '11px', color: 'var(--text-tertiary)' }}>{entry.agentId}</span>
                  {entry.nodeTitle && (
                    <>
                      <span style={{ color: 'var(--text-tertiary)' }}>·</span>
                      <span style={{ ...monoStyle, fontSize: '11px', color: 'var(--accent)' }}>{entry.nodeTitle}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
